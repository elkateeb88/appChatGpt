#!/usr/bin/env node

/**
 * Simple MCP Server for ChatGPT Apps - Hello World Example
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root - Server info
app.get('/', (req, res) => {
  res.json({
    name: 'Simple MCP Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MCP endpoint - This is what ChatGPT calls
app.post('/mcp', (req, res) => {
  console.log('MCP Request:', JSON.stringify(req.body, null, 2));

  const { method, params } = req.body;

  // Handle initialize
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'Simple MCP Server',
          version: '1.0.0'
        }
      }
    });
  }

  // Handle notifications/initialized
  if (method === 'notifications/initialized') {
    return res.json({
      jsonrpc: '2.0'
    });
  }

  // Handle tools/list
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        tools: [
          {
            name: 'say_hello',
            description: 'Says hello to the user',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the person to greet'
                }
              },
              required: []
            }
          },
          {
            name: 'get_plans',
            description: 'Get available Numeroesim communication plans (eSIM and virtual numbers)',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  description: 'Filter by plan type: all, esim, or virtual_numbers',
                  enum: ['all', 'esim', 'virtual_numbers']
                }
              },
              required: []
            }
          }
        ]
      }
    });
  }

  // Handle tools/call
  if (method === 'tools/call') {
    const toolName = params?.name;
    const args = params?.arguments || {};

    if (toolName === 'say_hello') {
      const name = args.name || 'World';
      return res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Hello, ${name}! 👋\n\nThis is a simple MCP server working with ChatGPT Apps!`
            }
          ]
        }
      });
    }

    if (toolName === 'get_plans') {
      const filterType = args.type || 'all';
      return res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          content: [
            {
              type: 'text',
              text: `# Numeroesim Communication Plans\n\n` +
                    `**Virtual Number Plan** - $3.99/month\n` +
                    `• US/International Phone Number\n` +
                    `• 100 Local Minutes\n` +
                    `• Unlimited SMS Reception\n\n` +
                    `**Global Data Plan (eSIM)** - $19.99/7 days\n` +
                    `• 5GB Travel Data\n` +
                    `• 100+ Countries Coverage\n` +
                    `• Instant Activation\n\n` +
                    `**Complete Bundle ⭐** - $49.99/month\n` +
                    `• Virtual Number + Data\n` +
                    `• 10GB Global Data\n` +
                    `• 300 International Minutes\n` +
                    `• Most Popular!`
            }
          ]
        }
      });
    }
  }

  // Default response for unknown methods
  res.json({
    jsonrpc: '2.0',
    id: req.body.id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`
    }
  });
});

// Handle GET requests to /mcp (for testing)
app.get('/mcp', (req, res) => {
  res.json({
    message: 'MCP endpoint is working. Use POST to interact.',
    supportedMethods: ['initialize', 'tools/list', 'tools/call']
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Simple MCP Server running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🎯 MCP Endpoint: http://localhost:${PORT}/mcp`);
  console.log('='.repeat(60));
  console.log('\n🌐 Next steps:');
  console.log('1. Run: ngrok http 8000');
  console.log('2. Copy the ngrok URL');
  console.log('3. In ChatGPT, use: https://YOUR-NGROK-URL/mcp');
  console.log('='.repeat(60));
});
