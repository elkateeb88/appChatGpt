#!/usr/bin/env node

/**
 * Numeroesim - MCP HTTP Server
 * HTTP wrapper for MCP protocol compatible with ChatGPT
 */

import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json());

// Add headers for better compatibility
app.use((req, res, next) => {
  res.setHeader('X-MCP-Server', 'numeroesim-v1.0.0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Mock plan data
const MOCK_PLANS = {
  'virtual-number': {
    id: 'virtual-number',
    name: 'Virtual Number Plan',
    nameEn: 'Virtual Number Plan',
    price: 3.99,
    currency: 'USD',
    period: 'month',
    periodEn: 'month',
    features: [
      'US/International Phone Number',
      '100 Local Minutes',
      'Unlimited SMS Reception'
    ],
    featuresEn: [
      'US/International Phone Number',
      '100 Local Minutes',
      'Unlimited SMS Reception'
    ],
    type: 'Virtual Numbers'
  },
  'esim-data': {
    id: 'esim-data',
    name: 'Global Data Plan',
    nameEn: 'Global Data Plan',
    price: 19.99,
    currency: 'USD',
    period: '7 days',
    periodEn: '7 days',
    features: [
      '5GB Travel Data',
      '100+ Countries Coverage',
      'Instant Activation (eSIM)'
    ],
    featuresEn: [
      '5GB Travel Data',
      '100+ Countries Coverage',
      'Instant Activation (eSIM)'
    ],
    type: 'eSIM'
  },
  'combo-plan': {
    id: 'combo-plan',
    name: 'Complete Bundle Plan',
    nameEn: 'Complete Bundle Plan',
    price: 49.99,
    currency: 'USD',
    period: 'month',
    periodEn: 'month',
    features: [
      'Virtual Number + Data',
      '10GB Global Data',
      '300 International Minutes'
    ],
    featuresEn: [
      'Virtual Number + Data',
      '10GB Global Data',
      '300 International Minutes'
    ],
    type: 'All',
    popular: true
  }
};

// Create MCP server instance
const mcpServer = new Server(
  {
    name: 'numeroesim-communication-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register MCP tool list handler
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'display_communication_plans',
        description: 'Display available Numeroesim plans (eSIM and virtual numbers)',
        inputSchema: {
          type: 'object',
          properties: {
            service_type: {
              type: 'string',
              description: "Service type: 'eSIM', 'virtual_numbers', or 'all'",
              enum: ['eSIM', 'virtual_numbers', 'all'],
              default: 'all'
            }
          },
          required: []
        }
      },
      {
        name: 'activate_plan',
        description: 'Activate a Numeroesim plan',
        inputSchema: {
          type: 'object',
          properties: {
            plan_id: {
              type: 'string',
              description: 'Plan ID to activate',
              enum: ['virtual-number', 'esim-data', 'combo-plan']
            }
          },
          required: ['plan_id']
        }
      },
      {
        name: 'review_plan_details',
        description: 'Get detailed information about a plan',
        inputSchema: {
          type: 'object',
          properties: {
            plan_id: {
              type: 'string',
              description: 'Plan ID to review',
              enum: ['virtual-number', 'esim-data', 'combo-plan']
            }
          },
          required: ['plan_id']
        }
      }
    ],
  };
});

// Register MCP tool call handler
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'display_communication_plans') {
      const serviceType = args?.service_type || 'all';
      let filteredPlans = Object.values(MOCK_PLANS);

      if (serviceType !== 'all') {
        filteredPlans = filteredPlans.filter(plan =>
          plan.type === serviceType || plan.type === 'All'
        );
      }

      const plansList = filteredPlans.map(plan =>
        `\n**${plan.name}** (${plan.type})\n` +
        `Price: $${plan.price} / ${plan.period}\n` +
        `Features:\n${plan.features.map(f => `  • ${f}`).join('\n')}\n` +
        (plan.popular ? '⭐ Most Popular\n' : '')
      ).join('\n---\n');

      return {
        content: [
          {
            type: 'text',
            text: `# Numeroesim Communication Plans\n\n` +
                  `Found ${filteredPlans.length} plans (${serviceType}):\n` +
                  plansList +
                  `\n\nTo activate a plan, use the activate_plan tool with the plan ID.`
          }
        ],
      };
    }

    if (name === 'activate_plan') {
      const planId = args.plan_id;
      const plan = MOCK_PLANS[planId];

      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ **"${plan.name}" has been activated successfully!**\n\n` +
                  `💰 **Price:** $${plan.price} / ${plan.period}\n` +
                  `📦 **Features:**\n${plan.features.map(f => `  • ${f}`).join('\n')}\n\n` +
                  `📧 Activation details will be sent to your email.\n` +
                  `⏰ Activation: Instant (simulation)`
          }
        ],
      };
    }

    if (name === 'review_plan_details') {
      const planId = args.plan_id;
      const plan = MOCK_PLANS[planId];

      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `📋 **${plan.name}** (${plan.nameEn})\n\n` +
                  `💵 **Price:** $${plan.price} / ${plan.period}\n\n` +
                  `✨ **Full Features:**\n${plan.features.map((f, i) =>
                    `  ${i + 1}. ${f}`
                  ).join('\n')}\n\n` +
                  `🌍 **Service Type:** ${plan.type}\n` +
                  (plan.popular ? `🏆 **Most Popular** - Preferred by customers\n\n` : '\n') +
                  `📞 **Additional Information:**\n` +
                  `  • Activation: Instant online\n` +
                  `  • Cancellation: Anytime\n` +
                  `  • Support: 24/7 via chat\n` +
                  `  • Payment Methods: Visa, MasterCard, PayPal, Apple Pay`
          }
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// HTTP Endpoints for MCP

// Root endpoint - MCP Server info
app.get('/', (req, res) => {
  res.json({
    name: 'Numeroesim Communication Plans',
    description: 'MCP server for browsing and activating communication plans (eSIM and virtual numbers)',
    version: '1.0.0',
    protocol_version: '2024-11-05',
    capabilities: {
      tools: true
    },
    endpoints: {
      mcp: `${req.protocol}://${req.get('host')}/mcp`,
      info: `${req.protocol}://${req.get('host')}/.well-known/mcp.json`,
      tools_list: `${req.protocol}://${req.get('host')}/mcp/tools/list`,
      tools_call: `${req.protocol}://${req.get('host')}/mcp/tools/call`,
      health: `${req.protocol}://${req.get('host')}/health`
    },
    authentication: {
      type: 'none'
    }
  });
});

// Main MCP endpoint (what ChatGPT expects)
app.all('/mcp', (req, res) => {
  res.json({
    jsonrpc: '2.0',
    id: req.body?.id || 1,
    result: {
      name: 'Numeroesim Communication Plans',
      version: '1.0.0',
      capabilities: {
        tools: true
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'numeroesim-mcp-http', version: '1.0.0' });
});

// MCP endpoint - List tools
app.post('/mcp/tools/list', async (req, res) => {
  try {
    const result = await mcpServer.request(
      { method: 'tools/list', params: {} },
      ListToolsRequestSchema
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP endpoint - Call tool
app.post('/mcp/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    const result = await mcpServer.request(
      {
        method: 'tools/call',
        params: { name, arguments: args || {} }
      },
      CallToolRequestSchema
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP Server info endpoint (for ChatGPT)
app.get('/.well-known/mcp.json', (req, res) => {
  res.json({
    name: 'Numeroesim Communication Plans',
    description: 'Browse and activate communication plans (eSIM and virtual numbers)',
    version: '1.0.0',
    protocol_version: '2024-11-05',
    capabilities: {
      tools: true
    },
    endpoints: {
      tools_list: `${req.protocol}://${req.get('host')}/mcp/tools/list`,
      tools_call: `${req.protocol}://${req.get('host')}/mcp/tools/call`
    },
    authentication: {
      type: 'none'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Numeroesim MCP HTTP Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📋 MCP Info: http://localhost:${PORT}/.well-known/mcp.json`);
  console.log(`🔧 Tools List: http://localhost:${PORT}/mcp/tools/list`);
  console.log(`⚡ Tools Call: http://localhost:${PORT}/mcp/tools/call`);
  console.log(`\n🌐 To expose to internet, use ngrok:`);
  console.log(`   ngrok http ${PORT}`);
});

export default app;
