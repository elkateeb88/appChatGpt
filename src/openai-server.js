#!/usr/bin/env node

/**
 * Numeroesim - OpenAI Apps API Server
 * HTTP server compatible with OpenAI ChatGPT Apps
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock plan data (same as MCP version)
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'numeroesim-api' });
});

// OpenAI App Manifest
app.get('/.well-known/ai-plugin.json', (req, res) => {
  const manifest = {
    schema_version: 'v1',
    name_for_human: 'Numeroesim Plans',
    name_for_model: 'numeroesim',
    description_for_human: 'Browse and activate communication plans (eSIM and virtual numbers) from Numeroesim.',
    description_for_model: 'Plugin to display, browse, and activate Numeroesim communication service plans including eSIM packages and virtual phone numbers. Users can view plan details, compare options, and simulate activation.',
    auth: {
      type: 'none'
    },
    api: {
      type: 'openapi',
      url: `${req.protocol}://${req.get('host')}/openapi.json`
    },
    logo_url: `${req.protocol}://${req.get('host')}/logo.png`,
    contact_email: 'support@numeroesim.com',
    legal_info_url: `${req.protocol}://${req.get('host')}/legal`
  };

  res.json(manifest);
});

// OpenAPI specification
app.get('/openapi.json', (req, res) => {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'Numeroesim Communication Plans API',
      description: 'API for browsing and activating communication service plans',
      version: '1.0.0'
    },
    servers: [
      {
        url: `${req.protocol}://${req.get('host')}`
      }
    ],
    paths: {
      '/api/plans': {
        get: {
          operationId: 'getPlans',
          summary: 'Get available communication plans',
          description: 'Returns a list of available plans, optionally filtered by service type',
          parameters: [
            {
              name: 'service_type',
              in: 'query',
              description: 'Filter by service type',
              required: false,
              schema: {
                type: 'string',
                enum: ['all', 'eSIM', 'virtual_numbers'],
                default: 'all'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      plans: {
                        type: 'array',
                        items: {
                          type: 'object'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/plans/{planId}': {
        get: {
          operationId: 'getPlanDetails',
          summary: 'Get detailed information about a specific plan',
          description: 'Returns detailed information including features, pricing, and terms',
          parameters: [
            {
              name: 'planId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                enum: ['virtual-number', 'esim-data', 'combo-plan']
              }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response'
            }
          }
        }
      },
      '/api/plans/{planId}/activate': {
        post: {
          operationId: 'activatePlan',
          summary: 'Activate a communication plan',
          description: 'Simulates the activation of a selected plan',
          parameters: [
            {
              name: 'planId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                enum: ['virtual-number', 'esim-data', 'combo-plan']
              }
            }
          ],
          responses: {
            '200': {
              description: 'Plan activated successfully'
            }
          }
        }
      }
    }
  };

  res.json(spec);
});

// API Endpoints

// Get all plans (with optional filtering)
app.get('/api/plans', (req, res) => {
  const serviceType = req.query.service_type || 'all';

  let filteredPlans = Object.values(MOCK_PLANS);

  if (serviceType !== 'all') {
    filteredPlans = filteredPlans.filter(plan =>
      plan.type === serviceType || plan.type === 'All'
    );
  }

  res.json({
    success: true,
    count: filteredPlans.length,
    service_type: serviceType,
    plans: filteredPlans
  });
});

// Get specific plan details
app.get('/api/plans/:planId', (req, res) => {
  const { planId } = req.params;
  const plan = MOCK_PLANS[planId];

  if (!plan) {
    return res.status(404).json({
      success: false,
      error: 'Plan not found',
      available_plans: Object.keys(MOCK_PLANS)
    });
  }

  res.json({
    success: true,
    plan: {
      ...plan,
      additional_info: {
        activation: 'Instant online',
        cancellation: 'Anytime',
        support: '24/7 via chat',
        payment_methods: ['Visa', 'MasterCard', 'PayPal', 'Apple Pay']
      }
    }
  });
});

// Activate a plan
app.post('/api/plans/:planId/activate', (req, res) => {
  const { planId } = req.params;
  const plan = MOCK_PLANS[planId];

  if (!plan) {
    return res.status(404).json({
      success: false,
      error: 'Plan not found'
    });
  }

  res.json({
    success: true,
    message: `Plan "${plan.name}" has been activated successfully!`,
    activation: {
      plan_id: planId,
      plan_name: plan.name,
      price: `$${plan.price} / ${plan.period}`,
      features: plan.features,
      status: 'active',
      activation_time: new Date().toISOString(),
      note: 'This is a simulation. Activation details will be sent to your email.'
    }
  });
});

// Logo endpoint (placeholder)
app.get('/logo.png', (req, res) => {
  res.status(404).send('Logo not configured yet');
});

// Legal info
app.get('/legal', (req, res) => {
  res.send(`
    <html>
      <head><title>Numeroesim - Legal Information</title></head>
      <body>
        <h1>Numeroesim Legal Information</h1>
        <p>This is a prototype application for demonstration purposes.</p>
        <p>All data is mock data and no actual services are provided.</p>
      </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    available_endpoints: [
      '/.well-known/ai-plugin.json',
      '/openapi.json',
      '/api/plans',
      '/api/plans/:planId',
      '/api/plans/:planId/activate'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Numeroesim OpenAI Apps Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📋 Manifest: http://localhost:${PORT}/.well-known/ai-plugin.json`);
  console.log(`📖 OpenAPI: http://localhost:${PORT}/openapi.json`);
  console.log(`\n🌐 To expose to internet, use ngrok:`);
  console.log(`   ngrok http ${PORT}`);
});

export default app;
