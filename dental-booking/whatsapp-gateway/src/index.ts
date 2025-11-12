import express, { Request, Response } from 'express';
import { logger } from './logger';
import config from './config';
import { apiClient } from './api-client';
import axios from 'axios';

/**
 * WhatsApp Business Cloud API Gateway
 */
const app = express();

// Middleware
app.use(express.json());

/**
 * Webhook verification (GET) - Required by Meta
 */
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('Webhook verification request received');

  if (mode === 'subscribe' && token === config.webhookVerifyToken) {
    logger.info('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

/**
 * Webhook for incoming messages (POST)
 */
app.post('/webhook', async (req: Request, res: Response) => {
  try {
    logger.info({ body: req.body }, '📨 Received webhook event');

    // Acknowledge immediately
    res.sendStatus(200);

    // Process webhook in background
    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      logger.warn('Invalid webhook payload - no entry array');
      return;
    }

    for (const item of entry) {
      const changes = item.changes;
      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const messages = value.messages;

        if (!messages || !Array.isArray(messages)) continue;

        for (const message of messages) {
          await handleIncomingMessage(message);
        }
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Error processing webhook');
  }
});

/**
 * Handle incoming WhatsApp message
 */
async function handleIncomingMessage(message: any) {
  try {
    // Extract message details
    const from = message.from; // Phone number
    const messageId = message.id;
    const timestamp = message.timestamp;

    // Extract text content
    let text = '';
    if (message.type === 'text') {
      text = message.text?.body || '';
    } else {
      logger.info(`Ignoring message type: ${message.type}`);
      return;
    }

    if (!text) return;

    logger.info(`📨 Message from ${from}: ${text}`);

    // Send to backend API
    const response = await apiClient.sendMessage(
      from,
      text,
      undefined // Auto-detect language
    );

    logger.info(`🤖 Bot reply: ${response.reply}`);

    // Send reply via WhatsApp Business API
    await sendWhatsAppMessage(from, response.reply);

  } catch (error) {
    logger.error({ err: error }, 'Error handling incoming message');
  }
}

/**
 * Send message via WhatsApp Business Cloud API
 */
async function sendWhatsAppMessage(to: string, text: string) {
  try {
    const url = `https://graph.facebook.com/v18.0/${config.whatsappPhoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${config.whatsappAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info({ messageId: response.data.messages?.[0]?.id }, '✅ Message sent successfully');
    return response.data;

  } catch (error: any) {
    logger.error({
      err: error,
      response: error.response?.data
    }, '❌ Failed to send WhatsApp message');
    throw error;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'whatsapp-gateway' });
});

/**
 * Status endpoint
 */
app.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'running',
    apiType: 'WhatsApp Business Cloud API',
    phoneNumberId: config.whatsappPhoneNumberId,
    configured: !!config.whatsappAccessToken && !!config.whatsappPhoneNumberId
  });
});

/**
 * Start server
 */
async function main() {
  logger.info('🚀 Starting WhatsApp Business Cloud API Gateway...');
  logger.info(`Environment: ${config.environment}`);
  logger.info(`Backend URL: ${config.backendUrl}`);
  logger.info(`Port: ${config.port}`);

  // Validate configuration
  if (!config.whatsappPhoneNumberId || !config.whatsappAccessToken) {
    logger.error('❌ Missing WhatsApp configuration. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN');
    process.exit(1);
  }

  // Check backend health
  try {
    const health = await apiClient.healthCheck();
    logger.info({ health }, '✅ Backend API is healthy');
  } catch (error) {
    logger.warn('⚠️ Backend API health check failed - will retry on incoming messages');
  }

  app.listen(config.port, () => {
    logger.info(`✅ WhatsApp Gateway listening on port ${config.port}`);
    logger.info(`📡 Webhook endpoint: http://localhost:${config.port}/webhook`);
  });
}

// Start the application
main().catch((error) => {
  logger.error({ err: error }, 'Failed to start WhatsApp Gateway');
  process.exit(1);
});
