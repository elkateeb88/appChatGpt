import { WhatsAppClient } from './whatsapp-client';
import { logger } from './logger';
import config from './config';

/**
 * Main entry point for WhatsApp Gateway
 */
async function main() {
  logger.info('🚀 Starting WhatsApp Gateway for Dental Booking Agent...');
  logger.info(`Environment: ${config.environment}`);
  logger.info(`Backend URL: ${config.backendUrl}`);

  const client = new WhatsAppClient();

  try {
    await client.connect();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await client.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await client.disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error({ err: error }, 'Failed to start WhatsApp Gateway');
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  logger.error({ err: error }, 'Unhandled error');
  process.exit(1);
});
