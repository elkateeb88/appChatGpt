#!/usr/bin/env node

/**
 * numero esim - numero esim Communication Plans Prototype
 * A prototype to display communication plans (eSIM and virtual numbers)
 * using the OpenAI Apps SDK (MCP).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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

// Create an MCP server
const server = new Server(
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

// Register the tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'display_communication_plans',
        description: 'Used to display available Numeroesim plans, such as virtual numbers and eSIM packages, in an interactive interface within ChatGPT.',
        inputSchema: {
          type: 'object',
          properties: {
            service_type: {
              type: 'string',
              description: "The type of service to display plans for. Can be 'eSIM', 'virtual_numbers', or 'all' (default).",
              enum: ['eSIM', 'virtual_numbers', 'all'],
              default: 'all'
            }
          },
          required: []
        }
      },
      {
        name: 'activate_plan',
        description: 'Activates a specific Numeroesim plan (simulation).',
        inputSchema: {
          type: 'object',
          properties: {
            plan_id: {
              type: 'string',
              description: 'The ID of the plan to activate.',
              enum: ['virtual-number', 'esim-data', 'combo-plan']
            }
          },
          required: ['plan_id']
        }
      },
      {
        name: 'review_plan_details',
        description: 'Gets extended details for a specific plan.',
        inputSchema: {
          type: 'object',
          properties: {
            plan_id: {
              type: 'string',
              description: 'The ID of the plan to review details for.',
              enum: ['virtual-number', 'esim-data', 'combo-plan']
            }
          },
          required: ['plan_id']
        }
      }
    ],
  };
});

// Register the tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'display_communication_plans') {
      const serviceType = args?.service_type || 'all';

      // Filter plans by service type
      let filteredPlans = Object.values(MOCK_PLANS);
      if (serviceType !== 'all') {
        filteredPlans = filteredPlans.filter(plan =>
          plan.type === serviceType || plan.type === 'All'
        );
      }

      // Return a complete HTML interface
      return {
        content: [
          {
            type: 'text',
            text: `Loaded ${filteredPlans.length} plans from Numeroesim (${serviceType})`
          },
          {
            type: 'resource',
            resource: {
              uri: 'ui://plans-display',
              mimeType: 'text/html',
              text: generatePlansHTML(filteredPlans)
            }
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
            text: `✅ "${plan.name}" has been activated successfully!\n\n` +
                  `💰 Price: $${plan.price} / ${plan.period}\n` +
                  `📦 Features:\n${plan.features.map(f => `  • ${f}`).join('\n')}\n\n` +
                  `📧 Activation details will be sent to your email.\n` +
                  `⏰ Actual Activation: Instant (simulation)`
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
                  (plan.popular ? `🏆 **Most Popular** - The preferred choice for customers\n` : '') + 
                  `\n📞 **Additional Information:**\n` +
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

// Function to generate HTML for the plans
function generatePlansHTML(plans) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Numeroesim Plans</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            margin: 0;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 32px;
        }
        .header h1 {
            font-size: 2em;
            margin: 0 0 8px 0;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .plans-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .plan-card {
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 16px;
            padding: 28px;
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            position: relative;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .plan-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 48px rgba(0,0,0,0.2);
        }
        .plan-card.popular {
            border-color: #007aff;
            border-width: 3px;
            transform: scale(1.05);
        }
        .plan-card.popular:hover {
            transform: scale(1.05) translateY(-8px);
        }
        .popular-badge {
            position: absolute;
            top: -12px;
            right: 20px;
            background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
            letter-spacing: 0.5px;
        }
        .title {
            font-size: 1.4em;
            font-weight: 700;
            color: #1c1c1e;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        .price {
            font-size: 2.2em;
            font-weight: 800;
            background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 16px;
        }
        .price-period {
            font-size: 0.4em;
            opacity: 0.7;
            font-weight: 500;
        }
        .features {
            list-style: none;
            padding: 0;
            margin: 20px 0;
            text-align: left;
        }
        .features li {
            margin-bottom: 10px;
            font-size: 0.95em;
            color: #3a3a3c;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            line-height: 1.5;
        }
        .features li:last-child {
            border-bottom: none;
        }
        .cta-group {
            margin-top: 24px;
        }
        .cta-group button {
            display: block;
            width: 100%;
            padding: 14px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            font-size: 1em;
            margin-top: 10px;
            transition: all 0.2s ease;
            border: none;
        }
        .cta-primary {
            background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
        }
        .cta-primary:hover {
            box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
            transform: translateY(-2px);
        }
        .cta-secondary {
            background: transparent;
            color: #007aff;
            border: 2px solid #007aff;
        }
        .cta-secondary:hover {
            background: rgba(0, 122, 255, 0.1);
        }
        .type-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 0.85em;
            font-weight: 600;
            margin-bottom: 12px;
            background: #f2f2f7;
            color: #636366;
        }
    </style>
</head>
<body>

<div class="header">
    <h1>🌟 Numeroesim Plans</h1>
    <p>Choose the perfect plan for your needs</p>
</div>

<div class="plans-container">
${plans.map(plan => `
    <div class="plan-card${plan.popular ? ' popular' : ''}">
        ${plan.popular ? '<div class="popular-badge">⭐ Most Popular</div>' : ''}
        <div class="type-badge">${plan.type}</div>
        <div class="title">${plan.name}</div>
        <div class="price">$${plan.price} <span class="price-period">/ ${plan.period}</span></div>
        <ul class="features">
            ${plan.features.map(feature => `<li>✅ ${feature}</li>`).join('')}
        </ul>
        <div class="cta-group">
            <button class="cta-primary" onclick="selectPlan('${plan.id}')">🚀 Activate Plan</button>
            <button class="cta-secondary" onclick="showDetails('${plan.id}')">📖 Review Features</button>
        </div>
    </div>
`).join('')}
</div>

<script>
    // Interaction with ChatGPT via Apps SDK/MCP
    function selectPlan(planId) {
        const message = 'Please activate the plan: ' + planId;

        // Try to use window.openai if available
        if (window.openai && window.openai.postMessage) {
            window.openai.postMessage('action:purchase_plan', {
                plan_id: planId,
                user_intent: message
            });
        } else if (window.parent && window.parent.postMessage) {
            // Use standard postMessage as a fallback
            window.parent.postMessage({
                type: 'numeroesim:activate_plan',
                planId: planId,
                message: message
            }, '*');
        } else {
            alert('✅ Simulation: Plan activation requested for ' + planId);
        }
    }

    function showDetails(planId) {
        const message = 'I want more details about the plan: ' + planId;

        if (window.openai && window.openai.postMessage) {
            window.openai.postMessage('text:request_details', {
                plan_id: planId,
                user_intent: message
            });
        } else if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'numeroesim:show_details',
                planId: planId,
                message: message
            }, '*');
        } else {
            alert('📖 Simulation: Plan details requested for ' + planId);
        }
    }

    // Listen for messages from the parent window
    window.addEventListener('message', function(event) {
        console.log('Received message:', event.data);
    });
</script>

</body>
</html>`;
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Numeroesim Communication MCP Server running on stdio');
}

main().catch((error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});