#!/usr/bin/env node

/**
 * MCP-LangGraph Bridge v2
 *
 * Combines LangGraph AI with interactive UI widgets (like test-simple.js)
 * - Connects to NumeroAssistant-AI LangGraph
 * - Returns structured content for widgets
 * - Provides interactive HTML UI components
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8000;

// Configuration
const LANGGRAPH_API_URL = process.env.LANGGRAPH_API_URL || 'http://localhost:8002/api/v1/chat';
const MCP_USER_ID = process.env.MCP_USER_ID || 'mcp_chatgpt_user';

// Session storage
const sessions = new Map();

app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Call LangGraph API
 */
async function callLangGraphAPI(userInput, sessionId = null) {
  try {
    const requestBody = {
      message: userInput,
      user_id: MCP_USER_ID,
    };

    if (sessionId) {
      requestBody.session_id = sessionId;
    }

    console.log('📤 Calling LangGraph:', LANGGRAPH_API_URL);
    console.log('📝 Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(LANGGRAPH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

/**
 * Simulate LangGraph (fallback)
 */
function simulateLangGraph(userInput) {
  const input = userInput.toLowerCase();

  if (input.includes('buy') && input.includes('plan')) {
    return {
      message: 'Which country do you need the plan for?',
      session_id: `sim_${Date.now()}`,
      workflow_status: 'needs_clarification',
      confidence: 0.85,
      agent_type: 'api_agent',
      processing_time: 0.5,
      packages_metadata: {
        action: 'select_destination',
        countries: [
          { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
          { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
          { code: 'AE', name: 'UAE', flag: '🇦🇪' },
          { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
          { code: 'TR', name: 'Turkey', flag: '🇹🇷' }
        ]
      }
    };
  } else if (input.includes('jordan') || input.includes('🇯🇴')) {
    return {
      message: 'Here are the available eSIM plans for Jordan:',
      session_id: `sim_${Date.now()}`,
      workflow_status: 'completed',
      confidence: 0.9,
      agent_type: 'api_agent',
      processing_time: 0.7,
      packages_metadata: {
        action: 'show_packages',
        country: 'Jordan',
        packages: [
          { id: 'jo_1gb', name: '1GB / 7 Days', data: '1GB', validity: '7 days', price: 5.99, currency: 'USD' },
          { id: 'jo_3gb', name: '3GB / 30 Days', data: '3GB', validity: '30 days', price: 12.99, currency: 'USD' },
          { id: 'jo_10gb', name: '10GB / 30 Days', data: '10GB', validity: '30 days', price: 24.99, currency: 'USD', popular: true }
        ]
      }
    };
  } else {
    return {
      message: 'Hello! How can I help you with eSIM services?',
      session_id: `sim_${Date.now()}`,
      workflow_status: 'completed',
      confidence: 0.8,
      agent_type: 'general_qa',
      processing_time: 0.3
    };
  }
}

/**
 * Generate widget HTML for countries selection
 */
function generateCountriesWidget(countries) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: transparent;
      padding: 20px;
    }
    .countries-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      max-width: 800px;
      margin: 0 auto;
    }
    .country-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .country-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }
    .flag { font-size: 48px; margin-bottom: 8px; }
    .country-name { font-size: 16px; font-weight: 600; color: #1f2937; }
    .country-code { font-size: 12px; color: #6b7280; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="countries-grid">
    ${countries.map(c => `
      <div class="country-card" onclick="selectCountry('${c.name}', '${c.code}')">
        <div class="flag">${c.flag}</div>
        <div class="country-name">${c.name}</div>
        <div class="country-code">${c.code}</div>
      </div>
    `).join('')}
  </div>
  <script>
    function selectCountry(name, code) {
      if (window.openai) {
        window.openai.postMessage({ action: 'select_country', country: name, code: code });
      } else if (window.parent) {
        window.parent.postMessage({ action: 'select_country', country: name, code: code }, '*');
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Generate widget HTML for packages
 */
function generatePackagesWidget(packages, country) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: transparent;
      padding: 20px;
    }
    .packages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .package-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      position: relative;
      border: 2px solid transparent;
      transition: all 0.2s;
    }
    .package-card:hover {
      border-color: #3b82f6;
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
    }
    .popular-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
    }
    .package-header {
      text-align: center;
      margin-bottom: 16px;
    }
    .package-name {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .package-details {
      margin: 12px 0;
      color: #6b7280;
      font-size: 14px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .detail-label { font-weight: 500; }
    .detail-value { color: #3b82f6; font-weight: 600; }
    .price {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      text-align: center;
      margin: 16px 0;
    }
    .buy-button {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .buy-button:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="packages-grid">
    ${packages.map(pkg => `
      <div class="package-card">
        ${pkg.popular ? '<div class="popular-badge">⭐ POPULAR</div>' : ''}
        <div class="package-header">
          <div class="package-name">${pkg.name}</div>
        </div>
        <div class="package-details">
          <div class="detail-row">
            <span class="detail-label">📊 Data</span>
            <span class="detail-value">${pkg.data}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏱️ Validity</span>
            <span class="detail-value">${pkg.validity}</span>
          </div>
        </div>
        <div class="price">$${pkg.price}</div>
        <button class="buy-button" onclick="buyPackage('${pkg.id}', '${pkg.name}', ${pkg.price})">
          Buy Now
        </button>
      </div>
    `).join('')}
  </div>
  <script>
    function buyPackage(id, name, price) {
      if (window.openai) {
        window.openai.postMessage({
          action: 'buy_package',
          package_id: id,
          package_name: name,
          price: price
        });
      } else if (window.parent) {
        window.parent.postMessage({
          action: 'buy_package',
          package_id: id,
          package_name: name,
          price: price
        }, '*');
      }
    }
  </script>
</body>
</html>`;
}

// Root & Health
app.get('/', (req, res) => {
  res.json({ name: 'MCP-LangGraph Bridge v2', version: '2.0.0' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    langgraph_api: LANGGRAPH_API_URL,
    sessions_count: sessions.size
  });
});

// MCP Endpoint
app.post('/mcp', async (req, res) => {
  try {
    console.log('📨 MCP Request:', JSON.stringify(req.body, null, 2));

    const { method, id, params } = req.body;

    // Initialize
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {}  // Enable resources for widgets
          },
          serverInfo: {
            name: 'MCP-LangGraph Bridge v2',
            version: '2.0.0'
          }
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
        id,
        result: {
          resources: [
            {
              uri: 'ui://widget/countries-selector.html',
              name: 'Countries Selector',
              mimeType: 'text/html'
            },
            {
              uri: 'ui://widget/packages-display.html',
              name: 'Packages Display',
              mimeType: 'text/html'
            }
          ]
        }
      });
    }

    // Read Resource (Return Widget HTML)
    if (method === 'resources/read') {
      const uri = params?.uri;

      // Placeholder widgets (will be generated dynamically based on data)
      if (uri === 'ui://widget/countries-selector.html') {
        const sampleCountries = [
          { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
          { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
          { code: 'AE', name: 'UAE', flag: '🇦🇪' }
        ];

        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [{
              uri,
              mimeType: 'text/html',
              text: generateCountriesWidget(sampleCountries)
            }]
          }
        });
      }

      if (uri === 'ui://widget/packages-display.html') {
        const samplePackages = [
          { id: '1', name: '1GB / 7 Days', data: '1GB', validity: '7 days', price: 5.99 }
        ];

        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [{
              uri,
              mimeType: 'text/html',
              text: generatePackagesWidget(samplePackages, 'Sample')
            }]
          }
        });
      }

      // Fallback for unknown URIs
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          contents: [{
            uri: uri || 'unknown',
            mimeType: 'text/html',
            text: '<html><body><h1>Widget not found</h1><p>URI: ' + (uri || 'unknown') + '</p></body></html>'
          }]
        }
      });
    }

    // List Tools
    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [{
            name: 'handle_user_request',
            description: 'Process user requests through NumeroAssistant-AI LangGraph. Handles eSIM plans, account operations, troubleshooting, and general questions. Returns interactive UI components.',
            inputSchema: {
              type: 'object',
              properties: {
                user_input: {
                  type: 'string',
                  description: 'User message or question'
                }
              },
              required: ['user_input']
            },
            _meta: {
              'openai/outputTemplate': 'ui://widget/dynamic-response.html'
            }
          }]
        }
      });
    }

    // Call Tool
    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === 'handle_user_request') {
        const userInput = args.user_input;

        if (!userInput) {
          return res.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'user_input is required' }
          });
        }

        // Get session
        let sessionId = sessions.get(MCP_USER_ID);

        // Call LangGraph (with fallback to simulation)
        let langGraphResponse;
        try {
          langGraphResponse = await callLangGraphAPI(userInput, sessionId);
        } catch (error) {
          console.warn('⚠️  Using simulation mode');
          langGraphResponse = simulateLangGraph(userInput);
        }

        // Store session
        if (langGraphResponse.session_id) {
          sessions.set(MCP_USER_ID, langGraphResponse.session_id);
        }

        // Format response with structured content
        const result = {
          content: [{
            type: 'text',
            text: langGraphResponse.message
          }],
          structuredContent: {
            workflow_status: langGraphResponse.workflow_status,
            confidence: langGraphResponse.confidence,
            agent_type: langGraphResponse.agent_type,
            processing_time: langGraphResponse.processing_time,
            session_id: langGraphResponse.session_id
          }
        };

        // Add widget data if available
        if (langGraphResponse.packages_metadata) {
          const metadata = langGraphResponse.packages_metadata;

          if (metadata.action === 'select_destination' && metadata.countries) {
            result.structuredContent.widget = 'countries-selector';
            result.structuredContent.countries = metadata.countries;
          }

          if (metadata.action === 'show_packages' && metadata.packages) {
            result.structuredContent.widget = 'packages-display';
            result.structuredContent.packages = metadata.packages;
            result.structuredContent.country = metadata.country;
          }
        }

        return res.json({
          jsonrpc: '2.0',
          id,
          result
        });
      }

      return res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Unknown tool: ${toolName}` }
      });
    }

    // Unknown method
    res.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Unknown method: ${method}` }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: { code: -32603, message: `Internal error: ${error.message}` }
    });
  }
});

// Start
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 MCP-LangGraph Bridge v2 Started');
  console.log('='.repeat(70));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🎯 MCP: http://localhost:${PORT}/mcp`);
  console.log(`🤖 LangGraph: ${LANGGRAPH_API_URL}`);
  console.log(`✨ Features: Interactive Widgets + LangGraph AI`);
  console.log('='.repeat(70));
});
