import axios, { AxiosInstance } from 'axios';
import config from './config';
import { logger } from './logger';

/**
 * API Client to communicate with FastAPI backend
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.backendUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error({ err: error }, 'API Request Error');
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error({ err: error.response?.data || error.message }, 'API Response Error');
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send message to the booking agent backend
   */
  async sendMessage(phone: string, message: string, language?: string) {
    try {
      const response = await this.client.post('/webhook/message', {
        phone,
        message,
        language,
      });

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to send message to backend: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error: any) {
      logger.error(`Backend health check failed: ${error.message}`);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
