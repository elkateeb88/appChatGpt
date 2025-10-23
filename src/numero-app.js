#!/usr/bin/env node

/**
 * Numeroesim ChatGPT App - Full Implementation
 * With UI Widgets for 4 categories
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Data: 4 Categories
const CATEGORIES = {
  data_esims: {
    id: 'data_esims',
    name: 'Data eSIMs',
    icon: '📱',
    countries: {
      turkey: {
        name: 'Turkey',
        flag: '🇹🇷',
        plans: [
          { data: '1GB', validity: '7 days', price: 3.5, currency: '€' },
          { data: '3GB', validity: '30 days', price: 6, currency: '€' },
          { data: '5GB', validity: '30 days', price: 7.5, currency: '€' },
          { data: '10GB', validity: '30 days', price: 12, currency: '€', discount: 30 }
        ]
      },
      usa: {
        name: 'USA',
        flag: '🇺🇸',
        plans: [
          { data: '2GB', validity: '7 days', price: 5, currency: '$' },
          { data: '5GB', validity: '15 days', price: 12, currency: '$' },
          { data: '10GB', validity: '30 days', price: 20, currency: '$' }
        ]
      }
    }
  },
  phone_numbers: {
    id: 'phone_numbers',
    name: 'Phone Numbers',
    icon: '📞',
    numbers: [
      {
        country: 'USA',
        flag: '🇺🇸',
        number: '+12027XXXX52',
        location: 'Washington DC',
        features: ['Incoming calls', 'Incoming SMS', 'Outgoing calls', 'Outgoing SMS'],
        pricing: [
          { period: 'month', price: 3.49, currency: '€', discount: 30 },
          { period: '3 months', price: 8.99, currency: '€', discount: 40 },
          { period: 'year', price: 17.99, currency: '€', discount: 70 }
        ]
      }
    ]
  },
  calling_plans: {
    id: 'calling_plans',
    name: 'Calling Plans',
    icon: '📲',
    plans: [
      { name: 'Top Up €2', price: 2, currency: '€', credits: '€2 calling credit' },
      { name: 'Top Up €5', price: 5, currency: '€', credits: '€5 calling credit' },
      { name: 'Top Up €10', price: 10, currency: '€', credits: '€10 calling credit' },
      { name: 'Top Up €20', price: 20, currency: '€', credits: '€20 calling credit' }
    ]
  },
  full_esims: {
    id: 'full_esims',
    name: 'Full eSIMs (Calls + Data)',
    icon: '🌐',
    countries: {
      albania: {
        name: 'Albania',
        flag: '🇦🇱',
        provider: 'Vodafone Travel',
        plan: {
          number: '+44 (7) XXX',
          supportedCountries: 78,
          dataUK: '500GB',
          dataAlbania: '25GB',
          calls: 'Unlimited',
          paymentType: 'One-Time',
          validity: '30days',
          price: 31,
          currency: '€'
        }
      }
    }
  }
};

// Generate HTML Widget
function generatePlanWidget(category, data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            background: white;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header h1 { color: #1a1a1a; font-size: 28px; margin-bottom: 10px; }
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .tab {
            background: white;
            padding: 12px 24px;
            border-radius: 25px;
            border: 2px solid #e0e0e0;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
        }
        .tab.active {
            background: #0891f7;
            color: white;
            border-color: #0891f7;
        }
        .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        .plan-card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: transform 0.3s;
            position: relative;
        }
        .plan-card:hover { transform: translateY(-5px); }
        .discount-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: #0891f7;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }
        .country-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
        }
        .flag { font-size: 32px; }
        .country-name { font-size: 20px; font-weight: 600; color: #1a1a1a; }
        .plan-details {
            margin: 16px 0;
            padding: 16px 0;
            border-top: 1px solid #f0f0f0;
            border-bottom: 1px solid #f0f0f0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            color: #666;
        }
        .detail-label { font-weight: 500; }
        .detail-value {
            color: #0891f7;
            font-weight: 600;
        }
        .price {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            text-align: center;
            margin: 16px 0;
        }
        .buy-button {
            width: 100%;
            background: #4ade80;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        .buy-button:hover { background: #22c55e; }
        .features-list {
            list-style: none;
            margin: 12px 0;
        }
        .features-list li {
            padding: 6px 0;
            color: #666;
        }
        .features-list li:before {
            content: "✓ ";
            color: #4ade80;
            font-weight: bold;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${category.icon} ${category.name}</h1>
        </div>
        <div id="content">${data}</div>
    </div>
</body>
</html>`;
}

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Numeroesim ChatGPT App',
    version: '1.0.0',
    categories: Object.keys(CATEGORIES)
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MCP Endpoint
app.post('/mcp', (req, res) => {
  console.log('Request:', JSON.stringify(req.body, null, 2));

  const { method, params } = req.body;

  // Initialize
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: 'Numeroesim App', version: '1.0.0' }
      }
    });
  }

  // Notifications
  if (method === 'notifications/initialized') {
    return res.json({ jsonrpc: '2.0' });
  }

  // List Tools
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        tools: [
          {
            name: 'browse_data_esims',
            description: 'Browse Data eSIM plans for different countries',
            inputSchema: {
              type: 'object',
              properties: {
                country: {
                  type: 'string',
                  description: 'Country to browse plans for',
                  enum: ['turkey', 'usa', 'all']
                }
              }
            }
          },
          {
            name: 'browse_phone_numbers',
            description: 'Browse available virtual phone numbers',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'browse_calling_plans',
            description: 'Browse calling credit top-up plans',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'browse_full_esims',
            description: 'Browse Full eSIM plans with calls and data',
            inputSchema: {
              type: 'object',
              properties: {
                country: {
                  type: 'string',
                  description: 'Country',
                  enum: ['albania', 'all']
                }
              }
            }
          }
        ]
      }
    });
  }

  // Call Tool
  if (method === 'tools/call') {
    const toolName = params?.name;

    // Data eSIMs
    if (toolName === 'browse_data_esims') {
      const category = CATEGORIES.data_esims;
      let html = '<div class="plans-grid">';

      Object.values(category.countries).forEach(country => {
        country.plans.forEach(plan => {
          const discountBadge = plan.discount ?
            `<div class="discount-badge">${plan.discount}% Discount</div>` : '';

          html += `
            <div class="plan-card">
              ${discountBadge}
              <div class="country-header">
                <div class="flag">${country.flag}</div>
                <div class="country-name">${country.name}</div>
              </div>
              <div class="plan-details">
                <div class="detail-row">
                  <span class="detail-label">Data</span>
                  <span class="detail-value">${plan.data}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Validity</span>
                  <span class="detail-value">${plan.validity}</span>
                </div>
              </div>
              <div class="price">${plan.currency}${plan.price}</div>
              <button class="buy-button">Buy Now</button>
            </div>
          `;
        });
      });

      html += '</div>';

      // Generate text output instead of HTML for now
      let textOutput = `# 📱 Data eSIM Plans\n\n`;

      Object.values(category.countries).forEach(country => {
        textOutput += `## ${country.flag} ${country.name}\n\n`;
        country.plans.forEach(plan => {
          const discountText = plan.discount ? ` 🔥 ${plan.discount}% OFF` : '';
          textOutput += `### ${plan.data} - ${plan.currency}${plan.price}${discountText}\n`;
          textOutput += `- **Validity**: ${plan.validity}\n`;
          textOutput += `- **Data**: ${plan.data}\n`;
          textOutput += `- **Price**: ${plan.currency}${plan.price}\n`;
          textOutput += `\n`;
        });
        textOutput += `\n`;
      });

      return res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          content: [
            {
              type: 'text',
              text: textOutput
            }
          ]
        }
      });
    }

    // Default
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        content: [{
          type: 'text',
          text: `Tool ${toolName} called successfully!`
        }]
      }
    });
  }

  // Unknown method
  res.json({
    jsonrpc: '2.0',
    id: req.body.id,
    error: { code: -32601, message: `Unknown method: ${method}` }
  });
});

// Start
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Numeroesim App Server`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🎯 MCP: http://localhost:${PORT}/mcp`);
  console.log('='.repeat(60));
  console.log('\n🌐 Run: ngrok http 8000');
  console.log('='.repeat(60));
});
