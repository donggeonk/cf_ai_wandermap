# AI Prompts Used in Development

This document contains all the prompts with GitHub Copilot (Claude Sonnet 4.5) used during the development of Wandermap AI.

## Initial Setup & Architecture

### Prompt 1: Project Initialization
```
when I click on find routes on the navigation panel, it goes to white blank page without showing any routes, identify the bug and fix it
```
**Context**: Initial bug where clicking "Find Route" button caused navigation to blank page.

---

### Prompt 2: State Management Issue
```
when I set start and destinations and click on "Find Routes," it still goes to a white blank page with the following error:
[wrangler:info] Ready on http://localhost:8787
[wrangler:info] GET / 200 OK (29ms)
[wrangler:info] GET /api/chat 101 Switching Protocols (11ms)
Classify intent response: { isMapRequest: false }
✘ [ERROR] Classify intent error: SyntaxError: "[object Object]" is not valid JSON

I do not want to move to any page. I just want it to show the route in the map itself, just like what Google Map does.
```
**Context**: WebSocket closing due to JSON parsing errors, route working but page navigating away.

---

### Prompt 3: React DOM Conflict
```
error again, it just shows the white blank page when I clicked on "Find Route"

This is what is show in terminal:
[wrangler:info] Ready on http://localhost:8787
[wrangler:info] GET / 200 OK (22ms)
[wrangler:info] GET /api/chat 101 Switching Protocols (10ms)
[wrangler:info] GET /favicon.ico 404 Not Found (3ms)
Route request received: Los Angeles International Airport -> University of California, Los Angeles
WebSocket closed: 1005 - 
Fetching route from: https://router.project-osrm.org/route/v1/driving/...
OSRM response code: Ok

This is what is shown in console when I looked at inspect:
react-dom.production.min.js:121 NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
```
**Context**: Lucide icons causing React DOM manipulation conflicts.

---

## Feature Implementation

### Prompt 4: Navigation Panel State Sync
```
now the navigation works, thanks. However, when I first write on the navigation panel (start and destination stops) and clicked on the find route, then typed onto the chat to find another route, the navigation panel still shows the previous start and destination stops that I wrote down. I want these to be updated when I request a new route on the chat
```
**Context**: Need to synchronize navigation panel inputs with chat-based route requests.

### Prompt 5: Collapsible Navigation Panel
```
make the top left map start and destination widget closable. on the left right of the widget, left to the Wandermap text, make a button that user can click to close and open it because it is currently blocking the zoom in and out buttons
```
**Fix**: Added `isOpen` state to NavPanel with close/open button and collapsed view showing only route icon

---

### Prompt 6: Thinking Indicator
```
when user types in and the chatbot takes time to respond, add a "thinking" chat until the chabot responds
```
**Fix**: Created `ThinkingIndicator` component with animated dots and `isThinking` state management


---

## Debugging Process

### Issue 1: White Blank Page
1. **Symptom**: Page navigates to blank screen on button click
2. **Investigation**: Checked button type, form submission
3. **Fix**: Added `type="button"` attribute
4. **Verification**: Tested route requests without navigation

### Issue 2: WebSocket Closing
1. **Symptom**: Route works but WebSocket closes unexpectedly
2. **Investigation**: Found JSON parsing error in console
3. **Fix**: Implemented safe JSON parsing helpers
4. **Verification**: Monitored WebSocket connection stability

### Issue 3: React DOM Error
1. **Symptom**: `removeChild` error after icon rendering
2. **Investigation**: Identified Lucide's DOM manipulation
3. **Fix**: Replaced with React SVG components
4. **Verification**: Removed all `lucide.createIcons()` calls

### Issue 4: State Desync
1. **Symptom**: Panel inputs don't update from chat
2. **Investigation**: State isolated in NavPanel component
3. **Fix**: Lifted state to App, passed as props
4. **Verification**: Chat updates reflect in panel inputs

---

## Lessons Learned

### 1. **React Best Practices**
- Avoid external DOM manipulation
- Use inline SVG for icons in React
- Lift state for cross-component sync

### 2. **WebSocket Handling**
- Always wrap message handlers in try-catch
- Implement graceful error recovery
- Send structured JSON responses

### 3. **AI Integration**
- Parse AI responses defensively
- Provide clear, structured prompts
- Handle both string and object responses

### 4. **Cloudflare Workers**
- Durable Objects for stateful WebSockets
- Workers AI for LLM inference
- Assets binding for static files

---