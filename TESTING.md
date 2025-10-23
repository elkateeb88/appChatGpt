# Testing Numeroesim MCP Server

## Quick Start

### Method 1: Run with MCP Inspector (Recommended for Testing)

The MCP Inspector provides a visual interface to test your server:

```bash
npx @modelcontextprotocol/inspector node src/index.js
```

Or using the shell script:

```bash
npx @modelcontextprotocol/inspector ./run-mcp-server.sh
```

This will:
- Start the MCP server
- Launch a web interface at `http://localhost:6274`
- Provide a proxy server at `http://localhost:6277`
- Display an authentication token in the terminal

### Method 2: Run Standalone

For production or integration with ChatGPT:

```bash
node src/index.js
```

Or:

```bash
./run-mcp-server.sh
```

## Using the Inspector

Once the inspector is running:

1. Open the URL displayed in your terminal (format: `http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=...`)
2. You'll see three available tools:
   - `display_communication_plans` - Display available plans
   - `activate_plan` - Simulate plan activation
   - `review_plan_details` - Get detailed plan information

3. Click on any tool to test it
4. View the results including the interactive HTML interface

## Testing Individual Tools

### Display Communication Plans

**Input:**
```json
{
  "service_type": "all"
}
```

Options: `"all"`, `"eSIM"`, `"virtual_numbers"`

### Activate Plan

**Input:**
```json
{
  "plan_id": "combo-plan"
}
```

Options: `"virtual-number"`, `"esim-data"`, `"combo-plan"`

### Review Plan Details

**Input:**
```json
{
  "plan_id": "combo-plan"
}
```

Options: `"virtual-number"`, `"esim-data"`, `"combo-plan"`

## Troubleshooting

### Port Already in Use

If you see "PORT IS IN USE" error:

```bash
# Kill processes on ports 6274 and 6277
lsof -ti:6274 | xargs kill -9
lsof -ti:6277 | xargs kill -9
```

Then restart the inspector.

### Server Not Responding

1. Check if the server is running: `ps aux | grep "node src/index.js"`
2. Check for errors in the terminal output
3. Verify Node.js version: `node --version` (should be v18+)

### Authentication Issues

If you see authentication errors in the browser:
1. Make sure you're using the full URL with the token parameter
2. Copy the URL exactly as shown in the terminal
3. Don't modify or remove the `MCP_PROXY_AUTH_TOKEN` parameter

## Development

### Making Changes

1. Edit files in `src/`
2. Restart the server to see changes
3. Use the inspector to test your modifications

### Adding New Tools

1. Add tool definition in `ListToolsRequestSchema` handler
2. Implement tool logic in `CallToolRequestSchema` handler
3. Test with the inspector

## Integration with ChatGPT

To use this server with ChatGPT:

1. Configure the MCP server in your ChatGPT settings
2. Use the command: `node src/index.js` or `./run-mcp-server.sh`
3. The server communicates via stdio (standard input/output)

## Notes

- The inspector is for development/testing only
- In production, the server runs standalone and communicates via stdio
- All plan data is currently mock data for prototyping
- The HTML interface simulates user interactions with ChatGPT
