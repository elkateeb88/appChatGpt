import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Backend API Configuration
  backendUrl: process.env.BACKEND_URL || 'http://backend:8001',

  // WhatsApp Business Cloud API Configuration
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || '',

  // Server Configuration
  port: parseInt(process.env.PORT || '3002', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Environment
  environment: process.env.ENVIRONMENT || 'development',
};

export default config;
