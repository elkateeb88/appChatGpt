#!/usr/bin/env node

/**
 * Simple Test - One Tool Only
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root
app.get('/', (req, res) => {
  res.json({ name: 'Numeroesim Test', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MCP
app.post('/mcp', (req, res) => {
  console.log('Request:', JSON.stringify(req.body, null, 2));

  const { method } = req.body;

  // Initialize
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}  // Add resources capability
        },
        serverInfo: { name: 'Numeroesim Test', version: '1.0.0' }
      }
    });
  }

  // Notifications
  if (method === 'notifications/initialized') {
    return res.json({ jsonrpc: '2.0' });
  }

  // List Resources (Widgets)
  if (method === 'resources/list') {
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        resources: [
          {
            uri: 'ui://widget/TurkeyESIMPlans.html',
            name: 'Turkey eSIM Plans Widget',
            mimeType: 'text/html'
          }
        ]
      }
    });
  }

  // Read Resource (Return Widget HTML)
  if (method === 'resources/read') {
    const uri = req.body.params?.uri;

    if (uri === 'ui://widget/TurkeyESIMPlans.html') {
      const widgetHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .plan-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      position: relative;
    }
    .discount-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #ff4444;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    .flag { font-size: 32px; margin-bottom: 12px; }
    .plan-title { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
    .plan-details { margin: 12px 0; color: #666; }
    .price {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
      margin: 12px 0;
    }
    .buy-button {
      width: 100%;
      background: #4ade80;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="plans-grid">
    <div class="plan-card">
      <div class="flag">🇹🇷</div>
      <div class="plan-title">1GB / 7 days</div>
      <div class="plan-details">Perfect for short trips</div>
      <div class="price">€3.5</div>
      <button class="buy-button">Buy Now</button>
    </div>
    <div class="plan-card">
      <div class="flag">🇹🇷</div>
      <div class="plan-title">3GB / 30 days</div>
      <div class="plan-details">Light usage</div>
      <div class="price">€6</div>
      <button class="buy-button">Buy Now</button>
    </div>
    <div class="plan-card">
      <div class="flag">🇹🇷</div>
      <div class="plan-title">5GB / 30 days</div>
      <div class="plan-details">Regular usage</div>
      <div class="price">€7.5</div>
      <button class="buy-button">Buy Now</button>
    </div>
    <div class="plan-card">
      <div class="discount-badge">30% OFF</div>
      <div class="flag">🇹🇷</div>
      <div class="plan-title">10GB / 30 days</div>
      <div class="plan-details">Heavy usage - BEST VALUE!</div>
      <div class="price">€12</div>
      <button class="buy-button">Buy Now</button>
    </div>
  </div>
</body>
</html>`;

      return res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          contents: [
            {
              uri: uri,
              mimeType: 'text/html',
              text: widgetHTML
            }
          ]
        }
      });
    }
  }

  // List Tools
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        tools: [
          {
            name: 'get_turkey_esim',
            description: 'Get Turkey eSIM data plans',
            inputSchema: {
              type: 'object',
              properties: {}
            },
            _meta: {
              'openai/outputTemplate': 'ui://widget/TurkeyESIMPlans.html'
            }
          }
        ]
      }
    });
  }

  // Call Tool
  if (method === 'tools/call') {
    const toolName = req.body.params?.name;

    if (toolName === 'get_turkey_esim') {
      // Structured data for widget
      const plansData = [
        { id: 1, data: '1GB', validity: '7 days', price: 3.5, description: 'Short trips' },
        { id: 2, data: '3GB', validity: '30 days', price: 6, description: 'Light usage' },
        { id: 3, data: '5GB', validity: '30 days', price: 7.5, description: 'Regular usage' },
        { id: 4, data: '10GB', validity: '30 days', price: 12, description: 'Heavy usage', discount: 30 }
      ];

      return res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          content: [],
          structuredContent: {
            plans: plansData,
            country: 'Turkey'
          }
        }
      });
    }

    // BACKUP: Old text version - disabled
    /*
    if (toolName === 'get_turkey_esim_text') {
      return res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          content: [
            {
              type: 'text',
              text: `# 🇹🇷 Turkey eSIM Plans

## Available Data Plans:

### Plan 1: 1GB / 7 days
- **Data**: 1GB
- **Validity**: 7 days
- **Price**: €3.5
- **Perfect for**: Short trips

---

### Plan 2: 3GB / 30 days
- **Data**: 3GB
- **Validity**: 30 days
- **Price**: €6
- **Perfect for**: Light usage

---

### Plan 3: 5GB / 30 days
- **Data**: 5GB
- **Validity**: 30 days
- **Price**: €7.5
- **Perfect for**: Regular usage

---

### Plan 4: 10GB / 30 days 🔥
- **Data**: 10GB
- **Validity**: 30 days
- **Price**: €12
- **Discount**: 30% OFF (was €15.5)
- **Perfect for**: Heavy usage
- **BEST VALUE!**

---

💡 **All plans include:**
- ✅ Instant activation
- ✅ No contracts
- ✅ Works in Turkey
- ✅ Easy installation

Would you like to select a plan?`
            }
          ]
        }
      });
    }
    */
  }

  // Unknown
  res.json({
    jsonrpc: '2.0',
    id: req.body.id,
    error: { code: -32601, message: `Unknown method: ${method}` }
  });
});

// Start
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Numeroesim Test Server`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🎯 MCP: http://localhost:${PORT}/mcp`);
  console.log('='.repeat(60));
});
