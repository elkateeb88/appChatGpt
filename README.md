# Numeroesim Communication Plans - MCP LangGraph Bridge v2

MCP (Model Context Protocol) bridge that connects to LangGraph AI for handling customer requests with interactive UI widgets.

## Features

- **LangGraph Integration**: Connects to NumeroAssistant-AI LangGraph API
- **Interactive Widgets**: HTML-based country selector and package display
- **Session Management**: Maintains conversation sessions with users
- **Fallback Mode**: Simulates responses when API is unavailable
- **Structured Content**: Returns formatted responses with widget metadata

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Create or update `.env.langgraph`:

```env
PORT=8000
LANGGRAPH_API_URL=http://localhost:8002/api/v1/chat
MCP_USER_ID=mcp_chatgpt_user
```

### Running

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

The server will start at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and session count.

### MCP Endpoint
```
POST /mcp
```

Standard MCP (Model Context Protocol) endpoint handling:
- `initialize` - Server initialization
- `tools/list` - List available tools
- `tools/call` - Execute user requests
- `resources/list` - List available widgets
- `resources/read` - Return widget HTML

## Available Tool: `handle_user_request`

Processes user requests through NumeroAssistant-AI LangGraph.

**Input:**
```json
{
  "user_input": "I want to buy an eSIM plan"
}
```

**Output:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Which country do you need the plan for?"
    }
  ],
  "structuredContent": {
    "workflow_status": "needs_clarification",
    "confidence": 0.85,
    "agent_type": "api_agent",
    "session_id": "..."
  }
}
```

## Interactive Widgets

### Countries Selector
Displays available countries with flags for selection.

### Packages Display
Shows available eSIM packages with pricing and details.

## Architecture

```
Request Flow:
1. Client sends request to /mcp endpoint
2. MCP handler processes the request
3. LangGraph API is called (or fallback simulation)
4. Response includes text + widget metadata
5. UI generates interactive HTML widgets
```

## Environment Variables

- `PORT`: Server port (default: 8000)
- `LANGGRAPH_API_URL`: URL to LangGraph API (default: http://localhost:8002/api/v1/chat)
- `MCP_USER_ID`: User identifier for sessions (default: mcp_chatgpt_user)

## Dependencies

- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing
- **@modelcontextprotocol/sdk**: MCP protocol support

## Development

This is a clean, minimal implementation focusing on:
- MCP protocol compliance
- LangGraph integration
- Interactive UI generation
- Session management

All code is in a single file (`src/mcp-langgraph-bridge-v2.js`) for easy deployment and modification.

## License

MIT
