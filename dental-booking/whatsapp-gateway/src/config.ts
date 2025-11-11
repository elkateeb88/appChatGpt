import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Backend API Configuration
  backendUrl: process.env.BACKEND_URL || 'http://backend:8001',

  // WhatsApp Configuration
  sessionPath: process.env.SESSION_PATH || './sessions',
  phoneNumberId: process.env.PHONE_NUMBER_ID || 'default',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Environment
  environment: process.env.ENVIRONMENT || 'development',
};

export default config;
