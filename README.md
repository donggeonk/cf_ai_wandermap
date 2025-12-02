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

## Quick Start (3 Steps)

### Prerequisites

You only need **Node.js** installed on your computer.
- [Download Node.js](https://nodejs.org/) (v18 or higher)
- npm comes with Node.js automatically


### Step 1: Get the Code

```bash
git clone https://github.com/yourusername/cf_ai_wandermap.git
cd cf_ai_wandermap
```

---

### Step 2: Install

```bash
npm install
```

This installs all dependencies including Wrangler (Cloudflare's local dev server).

---

### Step 3: Run

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

## Common Issues

### "Port 8787 already in use"

Another app is using that port. Kill it:

```bash
# Find and kill the process
lsof -ti:8787 | xargs kill -9

# Then run again
npm run dev
```

### "Cannot find module 'wrangler'"

Install dependencies again:

```bash
rm -rf node_modules
npm install
```

### Page is blank

1. Make sure `npm run dev` is running
2. Go to `http://localhost:8787` (not https)
3. Check browser console (F12) for errors

### Route not showing

- Use full location names: "Los Angeles, CA" not "LA"
- Wait a moment for geocoding
- Check your internet connection (uses OpenStreetMap API)

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

## Deploy Online (Optional)

### 1. Create Cloudflare Account
Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)

### 2. Login
```bash
npx wrangler login
```

### 3. Enable Workers AI
Go to **Workers & Pages** → **AI** → Click **Enable**

### 4. Deploy
```bash
npm run deploy
```

You'll get a URL like: `https://wandermap.your-name.workers.dev`

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
User: "Take me from San Francisco to Los Angeles"
AI: "I found a route! The journey is 383 mi and takes about 6h 15m."
→ Map updates with the route
```

---

## Development

### Watch Logs
```bash
npx wrangler tail
```

### Hot Reload
Just save your files—Wrangler auto-reloads:
- `src/worker.ts` - Backend changes
- `public/index.html` - Frontend changes

### Debug WebSocket
1. Open DevTools (F12)
2. **Network** tab → **WS** filter
3. See real-time messages

---

## Future Improvements (Not Implemented)

Based on development process, these could be added:

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
