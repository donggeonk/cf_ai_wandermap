# Wandermap AI

**Find Routes by Vibe, Not Just Efficiency**

Wandermap AI is an intelligent route planning application that helps you discover scenic journeys along the coast, through forests, and past blooming landscapes—not just the most efficient route. Users interact with a traditional map on the left and request nuanced, desired routes from an AI assistant on the right. Sometimes the best trips are about the experience, not just the destination.

![Wandermap AI Demo](https://img.shields.io/badge/Built%20with-Cloudflare%20Workers%20AI-orange)

## Demo Video

Watch Wandermap AI in action:

[![Wandermap AI Demo Video](https://img.youtube.com/vi/C76aJ7HIGP0/maxresdefault.jpg)](https://youtu.be/C76aJ7HIGP0)

**[Watch Demo on YouTube](https://youtu.be/C76aJ7HIGP0)**

---

## Features

- **AI-Powered Route Planning** - Natural language understanding for route preferences
- **Conversational Interface** - Describe routes in natural sentences
- **Multiple Travel Modes** - Driving, Walking, or Biking
- **Real-Time Route Visualization** - Interactive maps with live routing
- **Smart Autocomplete** - Location suggestions as you type
- **Dual Input Methods** - Navigation panel or chat interface

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Leaflet.js
- **Backend**: Cloudflare Workers, Durable Objects
- **AI**: Cloudflare Workers AI (Llama 3.3 70B)
- **Mapping**: OpenStreetMap (Nominatim), OSRM
- **Real-time**: WebSockets

---

## Quick Start

### Prerequisites

- **Node.js** v18 or higher ([Download here](https://nodejs.org/))
- **Cloudflare account** (free) - Required for AI chat features

---

### Step 1: Get the Code

```bash
git clone https://github.com/yourusername/cf_ai_wandermap.git
cd cf_ai_wandermap/wandermap
```

---

### Step 2: Install

```bash
npm install
```

This installs all dependencies including Wrangler (Cloudflare's local dev server).

---

### Step 3: Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens your browser to authorize Wrangler. **Required for AI chat features.**

---

### Step 4: Enable Workers AI

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **AI**
3. Click **Enable Workers AI** (free tier: 10,000 requests/day)

---

### Step 5: Run

```bash
npm run dev
```

**That's it!** Open your browser to:

```
http://localhost:8787
```

You should see:
- Map on the left side
- Chat assistant on the right side

---

## How to Use

### Method 1: Navigation Panel (Left Side)

1. Type a **start location** (e.g., "Los Angeles")
2. Type a **destination** (e.g., "San Francisco")
3. Choose **Driving**, **Walking**, or **Biking**
4. Click **Find Route**

The route appears on the map with distance and duration.

### Method 2: Chat Interface (Right Side)

Just type naturally:
- `"Take me from Seattle to Portland"`
- `"Show me a route from New York to Boston"`
- `"I want to drive from LAX to San Francisco along the bay"`

The AI understands and shows the route.

---

## Project Structure

```
wandermap/
├── src/
│   └── worker.ts           # Backend logic (Durable Objects + AI)
├── public/
│   └── index.html          # Frontend React app
├── wrangler.jsonc          # Cloudflare config
├── package.json            # Dependencies
├── README.md               # This file
└── PROMPTS.md              # AI development prompts
```

---

## Example Usage

**Quick Route:**
```
Start: New York, NY
Destination: Boston, MA
Mode: Driving
→ Shows 215 mi, ~4h 15m route
```

**Natural Language:**
```
User: "Show me a route from San Francisco to Los Angeles"
AI: "I found a route! The journey is 383 mi and takes about 6h 15m."
→ Map updates with the route
```

---

## Future Improvements (Not Implemented)

Based on current implementation, I am planning to add:

1. **Scenic Route Preferences** - User can specify "coastal", "mountain", "urban"
2. **Multi-Stop Routes** - Add waypoints between start and end
3. **Route History** - Save and revisit previous routes
4. **Route Sharing** - Generate shareable links
5. **Offline Support** - Cache routes for offline use

---

**Built using Cloudflare Workers AI**

*Sometimes the fastest route isn't the best route.*

---

**Author**: [Donggeon Kim]  
**Date**: November 2025
