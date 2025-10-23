# Nimro App Deployment Guide for OpenAI ChatGPT

## Overview

This guide explains how to deploy the Nimro Communication Plans application on the OpenAI ChatGPT platform using the Model Context Protocol (MCP).

## Prerequisites

1.  **OpenAI Developer Account**: You need a developer account on OpenAI.
2.  **Node.js**: Version 18 or later.
3.  **npm**: Node Package Manager.

## Local Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Test the Application Locally

```bash
npm start
```

Or for development with automatic monitoring:

```bash
npm run dev
```

## Integration with ChatGPT

### Method 1: Using MCP Inspector (for testing)

1.  Install MCP Inspector:

    ```bash
    npx @modelcontextprotocol/inspector src/index.js
    ```

2.  Open your browser to the address that appears (usually http://localhost:5173).

3.  Test the available tools:

    *   `display_communication_plans`
    *   `activate_plan`
    *   `review_plan_details`

### Method 2: Integration with ChatGPT Desktop (for developers)

1.  Open the ChatGPT Desktop configuration file:

    *   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
    *   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2.  Add the MCP server configuration:

    ```json
    {
      "mcpServers": {
        "nimro": {
          "command": "node",
          "args": ["/path/to/appChatGpt/src/index.js"]
        }
      }
    }
    ```

3.  Restart ChatGPT Desktop.

### Method 3: Production Deployment (OpenAI Apps)

> **Note**: You need access to the OpenAI Apps Platform (may be limited).

1.  Log in to the [OpenAI Developer Platform](https://platform.openai.com/).

2.  Go to the "Apps" or "GPTs" section.

3.  Create a new application and upload the following files:

    *   `src/index.js` (main server)
    *   `package.json` (dependencies)
    *   `public/ui/plans-display.html` (interface)

4.  Configure permissions and environment variables.

## Project Structure

```
appChatGpt/
├── src/
│   └── index.js              # Main MCP server
├── public/
│   └── ui/
│       └── plans-display.html # User interface
├── package.json              # Package and dependencies file
├── nimro-mcp-config.json     # MCP configuration
├── README.md                 # Main documentation
└── DEPLOYMENT.md             # This file
```

## Available Tools

### 1. `display_communication_plans`

**Description**: Displays all available plans in an interactive interface.

**Inputs**:

*   `service_type` (optional): "eSIM" | "virtual_numbers" | "all"

**Example Usage**:

```
User: "What are the available plans?"
ChatGPT: [Calls the tool and displays the interface]
```

### 2. `activate_plan`

**Description**: Activates a specific plan (simulation).

**Inputs**:

*   `plan_id` (required): "virtual-number" | "esim-data" | "combo-plan"

**Example Usage**:

```
User: "I want to activate the Complete Bundle."
ChatGPT: [Calls `activate_plan` with plan_id="combo-plan"]
```

### 3. `review_plan_details`

**Description**: Gets extended details for a specific plan.

**Inputs**:

*   `plan_id` (required): "virtual-number" | "esim-data" | "combo-plan"

## Customization

### Changing Mock Data

You can modify the mock data in `src/index.js`:

```javascript
const MOCK_PLANS = {
  'your-plan-id': {
    id: 'your-plan-id',
    name: 'Plan Name',
    price: 9.99,
    // ... more properties
  }
};
```

### Customizing the Interface

You can modify the design in `public/ui/plans-display.html`:

*   Colors in the `<style>` section.
*   Content in the `<body>` section.
*   Interactions in the `<script>` section.

## Troubleshooting

### Error: "Cannot find module '@modelcontextprotocol/sdk'"

**Solution**:

```bash
npm install
```

### Error: "Permission denied"

**Solution** (Linux/Mac):

```bash
chmod +x src/index.js
```

### Interface does not appear

**Solution**:

1.  Check that `generatePlansHTML()` is working correctly.
2.  Check the browser's console.log.
3.  Make sure ChatGPT supports displaying HTML/iframe.

## Support and Assistance

*   **Official Documentation**: [Model Context Protocol Docs](https://modelcontextprotocol.io/)
*   **OpenAI Developer Forum**: [https://community.openai.com/](https://community.openai.com/)

## License

MIT License - Open Source