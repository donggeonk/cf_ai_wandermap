import { DurableObject } from "cloudflare:workers";

export interface Env {
  WANDER_AGENT: DurableObjectNamespace;
  AI: any;
  ASSETS: any;
}

/**
 * The WanderAgent Durable Object.
 * Manages state, WebSocket connections, and AI routing logic.
 */
export class WanderAgent extends DurableObject<Env> {
  history: { role: string; content: string }[] = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.history = [];
      await this.ctx.storage.put("history", this.history);
      this.ctx.acceptWebSocket(server);

      server.send(JSON.stringify({ type: "history", messages: [] }));

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Expected Upgrade: websocket", { status: 426 });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    try {
      const data = JSON.parse(message as string);

      // Handle clear history
      if (data.type === "clear_history") {
        this.history = [];
        await this.ctx.storage.put("history", this.history);
        ws.send(JSON.stringify({ type: "history", messages: [] }));
        return;
      }

      // Handle autocomplete/geocoding request
      if (data.type === "autocomplete") {
        try {
          const suggestions = await this.geocodeAutocomplete(data.query);
          ws.send(JSON.stringify({
            type: "autocomplete_results",
            field: data.field,
            suggestions
          }));
        } catch (error) {
          console.error("Autocomplete error:", error);
          ws.send(JSON.stringify({
            type: "autocomplete_results",
            field: data.field,
            suggestions: []
          }));
        }
        return;
      }

      // --- DIRECT MAP REQUEST (from NavPanel form) ---
      if (data.type === "route_request") {
        try {
          console.log("Route request received:", data.start, "->", data.end);
          ws.send(JSON.stringify({ type: "route_loading", loading: true }));
          
          // Geocode start and end locations
          const startCoords = await this.geocodeLocation(data.start);
          const endCoords = await this.geocodeLocation(data.end);

          if (!startCoords || !endCoords) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Could not find one or both locations. Please try different addresses."
            }));
            ws.send(JSON.stringify({ type: "route_loading", loading: false }));
            return;
          }

          // Get route
          const routeData = await this.getRoute(startCoords, endCoords, data.mode);

          ws.send(JSON.stringify({
            type: "map_update",
            mapData: {
              center: [(startCoords.lat + endCoords.lat) / 2, (startCoords.lng + endCoords.lng) / 2],
              zoom: 12,
              route: routeData.coordinates,
              markers: [
                { lat: startCoords.lat, lng: startCoords.lng, label: `Start: ${data.start}` },
                { lat: endCoords.lat, lng: endCoords.lng, label: `End: ${data.end}` }
              ],
              distance: routeData.distance,
              duration: routeData.duration
            }
          }));
          ws.send(JSON.stringify({ type: "route_loading", loading: false }));
        } catch (error) {
          console.error("Route generation error:", error);
          ws.send(JSON.stringify({
            type: "error",
            message: "Failed to generate route. Please try again."
          }));
          ws.send(JSON.stringify({ type: "route_loading", loading: false }));
        }
        return;
      }

      // --- CHAT MESSAGE ---
      if (data.type === "chat") {
        const userMessage = data.text;

        this.history.push({ role: "user", content: userMessage });
        await this.ctx.storage.put("history", this.history);

        try {
          const isMapRequest = await this.classifyIntent(userMessage);

          if (isMapRequest) {
            const locations = await this.extractLocationsFromChat(userMessage);
            
            if (locations.start && locations.end) {
              const startCoords = await this.geocodeLocation(locations.start);
              const endCoords = await this.geocodeLocation(locations.end);

              if (startCoords && endCoords) {
                const routeData = await this.getRoute(startCoords, endCoords, "Driving");
                
                const responseMessage = `I found a route from ${locations.start} to ${locations.end}! The journey is approximately ${routeData.distance} and will take about ${routeData.duration}.`;
                
                this.history.push({ role: "assistant", content: responseMessage });
                await this.ctx.storage.put("history", this.history);

                ws.send(JSON.stringify({
                  type: "agent_response",
                  text: responseMessage,
                  locations: {
                    start: locations.start,
                    end: locations.end
                  },
                  mapData: {
                    center: [(startCoords.lat + endCoords.lat) / 2, (startCoords.lng + endCoords.lng) / 2],
                    zoom: 10,
                    route: routeData.coordinates,
                    markers: [
                      { lat: startCoords.lat, lng: startCoords.lng, label: `Start: ${locations.start}` },
                      { lat: endCoords.lat, lng: endCoords.lng, label: `End: ${locations.end}` }
                    ],
                    distance: routeData.distance,
                    duration: routeData.duration
                  }
                }));
              } else {
                const errorMsg = "I couldn't find those locations. Could you be more specific about the places you want to visit?";
                this.history.push({ role: "assistant", content: errorMsg });
                await this.ctx.storage.put("history", this.history);
                ws.send(JSON.stringify({ type: "agent_response", text: errorMsg, mapData: null }));
              }
            } else {
              const clarifyMsg = await this.generateChatResponse(userMessage + "\n\n[System: The user seems to want directions but didn't specify clear start and end points. Ask them to clarify both the starting point and destination.]");
              this.history.push({ role: "assistant", content: clarifyMsg });
              await this.ctx.storage.put("history", this.history);
              ws.send(JSON.stringify({ type: "agent_response", text: clarifyMsg, mapData: null }));
            }
          } else {
            const chatResponse = await this.generateChatResponse(userMessage);
            this.history.push({ role: "assistant", content: chatResponse });
            await this.ctx.storage.put("history", this.history);
            ws.send(JSON.stringify({ type: "agent_response", text: chatResponse, mapData: null }));
          }
        } catch (error) {
          console.error("Error processing message:", error);
          ws.send(JSON.stringify({
            type: "agent_response",
            text: "Sorry, I encountered an error. Please try again.",
            mapData: null
          }));
        }
        return;
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
      try {
        ws.send(JSON.stringify({
          type: "error",
          message: "An unexpected error occurred."
        }));
      } catch (e) {
        // WebSocket might be closed
      }
    }
  }

  // Geocode autocomplete using Nominatim (free, no API key needed)
  async geocodeAutocomplete(query: string): Promise<any[]> {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Wandermap/1.0'
          }
        }
      );
      
      const data: any = await response.json();
      return data.map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    } catch (error) {
      console.error("Autocomplete fetch error:", error);
      return [];
    }
  }

  // Geocode a location string to coordinates
  async geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Wandermap/1.0'
          }
        }
      );
      
      const data: any = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  // Get route using OSRM (free, no API key needed)
  async getRoute(
    start: { lat: number; lng: number }, 
    end: { lat: number; lng: number }, 
    mode: string
  ): Promise<{ coordinates: number[][]; distance: string; duration: string }> {
    
    try {
      // OSRM public server only supports 'driving' profile
      const profile = 'driving';
      
      const url = `https://router.project-osrm.org/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      
      console.log("Fetching route from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OSRM error: ${response.status}`);
      }
      
      const data: any = await response.json();
      
      console.log("OSRM response code:", data.code);
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Convert [lng, lat] to [lat, lng] for Leaflet
        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        
        // Adjust duration based on mode
        let durationSeconds = route.duration;
        if (mode === 'Walking') {
          durationSeconds = durationSeconds * 4;
        } else if (mode === 'Biking') {
          durationSeconds = durationSeconds * 2;
        }
        
        // Format distance and duration
        const distanceKm = (route.distance / 1000).toFixed(1);
        const distanceMiles = (route.distance / 1609.34).toFixed(1);
        const durationMinutes = Math.round(durationSeconds / 60);
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        
        const distanceStr = `${distanceMiles} mi (${distanceKm} km)`;
        const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;

        return { coordinates, distance: distanceStr, duration: durationStr };
      }
      
      // Fallback: return straight line if routing fails
      return this.getStraightLineRoute(start, end);
      
    } catch (error) {
      console.error("Routing error:", error);
      return this.getStraightLineRoute(start, end);
    }
  }

  // Fallback straight line route
  getStraightLineRoute(
    start: { lat: number; lng: number }, 
    end: { lat: number; lng: number }
  ): { coordinates: number[][]; distance: string; duration: string } {
    const R = 6371;
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLng = (end.lng - start.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    const distanceMiles = distanceKm / 1.609;
    
    const hours = distanceKm / 50;
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
      distance: `~${distanceMiles.toFixed(1)} mi (${distanceKm.toFixed(1)} km)`,
      duration: h > 0 ? `~${h}h ${m}m` : `~${m} min`
    };
  }

  // Helper to safely parse AI response
  parseAIResponse(response: any): string {
    if (typeof response === 'string') {
      return response;
    }
    if (response && typeof response === 'object') {
      if (response.response) {
        return typeof response.response === 'string' ? response.response : JSON.stringify(response.response);
      }
      if (response.text) {
        return typeof response.text === 'string' ? response.text : JSON.stringify(response.text);
      }
      return JSON.stringify(response);
    }
    return String(response);
  }

  // Helper to safely parse JSON from AI response
  parseJSONFromAI(response: any): any {
    const text = this.parseAIResponse(response);
    
    // Try to extract JSON from the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse JSON from matched text:", jsonMatch[0]);
      }
    }
    
    // Try parsing the whole text
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON from text:", text);
      return null;
    }
  }

  // Extract start and end locations from natural language
  async extractLocationsFromChat(userMessage: string): Promise<{ start: string | null; end: string | null }> {
    const model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

    try {
      const response: any = await this.env.AI.run(model, {
        messages: [
          {
            role: "system",
            content: `Extract the start and end locations from the user's message.

Return ONLY valid JSON, no other text:
{"start": "starting location or null", "end": "destination or null"}

Examples:
"Take me from San Francisco to Los Angeles" -> {"start": "San Francisco, CA", "end": "Los Angeles, CA"}
"I want to go to New York" -> {"start": null, "end": "New York, NY"}`
          },
          { role: "user", content: userMessage }
        ]
      });

      const parsed = this.parseJSONFromAI(response);
      if (parsed && (parsed.start !== undefined || parsed.end !== undefined)) {
        return { start: parsed.start || null, end: parsed.end || null };
      }
      return { start: null, end: null };
    } catch (error) {
      console.error("Extract locations error:", error);
      return { start: null, end: null };
    }
  }

  // Classify if the user's message is map-related
  async classifyIntent(userMessage: string): Promise<boolean> {
    const model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

    try {
      const response: any = await this.env.AI.run(model, {
        messages: [
          {
            role: "system",
            content: `Determine if the user wants directions, a route, or map-related help.

Return ONLY valid JSON, no other text:
{"isMapRequest": true} or {"isMapRequest": false}

Return true for: directions, routes, navigation, "take me to", "how do I get to"
Return false for: greetings, general questions, non-travel topics`
          },
          { role: "user", content: userMessage }
        ]
      });

      console.log("Classify intent raw response:", response);
      
      const parsed = this.parseJSONFromAI(response);
      console.log("Classify intent parsed:", parsed);
      
      if (parsed && typeof parsed.isMapRequest === 'boolean') {
        return parsed.isMapRequest;
      }
      return false;
    } catch (error) {
      console.error("Classify intent error:", error);
      return false;
    }
  }

  // Generate a normal chat response
  async generateChatResponse(userMessage: string): Promise<string> {
    const model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

    try {
      const response: any = await this.env.AI.run(model, {
        messages: [
          {
            role: "system",
            content: `You are Wander Assistant, a friendly AI for the Wandermap app. 
Keep responses concise. Help users with directions using the navigation panel or chat.`
          },
          ...this.history.slice(-10)
        ]
      });

      return this.parseAIResponse(response) || "I'm here to help! Ask me anything or describe a trip you'd like to take.";
    } catch (error) {
      console.error("Generate chat response error:", error);
      return "I'm here to help! Ask me anything or describe a trip you'd like to take.";
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(`WebSocket closed: ${code} - ${reason}`);
  }
}

/**
 * Main Worker Entrypoint
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      const id = env.WANDER_AGENT.idFromName("global-demo-session");
      const stub = env.WANDER_AGENT.get(id);
      return stub.fetch(request);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};