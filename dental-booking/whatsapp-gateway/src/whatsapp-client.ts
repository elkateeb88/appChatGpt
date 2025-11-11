import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  WAMessage,
  isJidUser,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import path from 'path';
import { logger } from './logger';
import { apiClient } from './api-client';
import config from './config';

/**
 * WhatsApp Client using Baileys
 */
export class WhatsAppClient {
  private sock?: WASocket;
  private sessionPath: string;
  private isConnected: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 5;

  constructor() {
    this.sessionPath = path.resolve(config.sessionPath);
    logger.info(`Session path: ${this.sessionPath}`);
  }

  /**
   * Initialize and connect to WhatsApp
   */
  async connect() {
    try {
      logger.info('Starting WhatsApp connection...');

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: logger.child({ module: 'baileys' }) as any,
        // Add mobile device info for better compatibility
        browser: ['Dental Booking Agent', 'Chrome', '120.0.0'],
      });

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Show QR code for scanning
        if (qr) {
          logger.info('Scan the QR code below with your WhatsApp:');
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          logger.warn({ shouldReconnect }, 'Connection closed. Reconnecting');

          if (shouldReconnect && this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(() => this.connect(), 3000);
          } else if (this.retryCount >= this.maxRetries) {
            logger.error('Max retry attempts reached. Please restart the service.');
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.retryCount = 0;
          logger.info('✅ WhatsApp connected successfully!');

          // Check backend health
          try {
            const health = await apiClient.healthCheck();
            logger.info({ health }, '✅ Backend API is healthy');
          } catch (error) {
            logger.error('❌ Backend API health check failed');
          }
        }
      });

      // Save credentials whenever they update
      this.sock.ev.on('creds.update', saveCreds);

      // Handle incoming messages
      this.sock.ev.on('messages.upsert', async (m) => {
        await this.handleMessages(m.messages);
      });

      logger.info('WhatsApp client initialized');
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize WhatsApp client');
      throw error;
    }
  }

  /**
   * Handle incoming WhatsApp messages
   */
  private async handleMessages(messages: WAMessage[]) {
    for (const msg of messages) {
      try {
        // Ignore messages from groups, broadcast, and status updates
        if (!msg.key.remoteJid || !isJidUser(msg.key.remoteJid)) {
          continue;
        }

        // Ignore messages from me
        if (msg.key.fromMe) {
          continue;
        }

        // Extract message content
        const messageContent = this.extractMessageContent(msg);
        if (!messageContent) {
          continue;
        }

        const phoneNumber = msg.key.remoteJid.replace('@s.whatsapp.net', '');

        logger.info(`📨 Received message from ${phoneNumber}: ${messageContent}`);

        // Send to backend API
        const response = await apiClient.sendMessage(
          phoneNumber,
          messageContent,
          undefined // Let backend auto-detect language
        );

        logger.info(`🤖 Bot reply: ${response.reply}`);

        // Send reply back to WhatsApp
        await this.sendMessage(msg.key.remoteJid, response.reply);

      } catch (error: any) {
        logger.error({ err: error }, 'Error handling message');

        // Send error message to user
        if (msg.key.remoteJid) {
          await this.sendMessage(
            msg.key.remoteJid,
            'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.\nSorry, an error occurred. Please try again.'
          );
        }
      }
    }
  }

  /**
   * Extract text content from WhatsApp message
   */
  private extractMessageContent(msg: WAMessage): string | null {
    const messageType = Object.keys(msg.message || {})[0];

    if (!messageType) return null;

    // Handle text messages
    if (messageType === 'conversation') {
      return msg.message?.conversation || null;
    }

    // Handle extended text messages (with mentions, links, etc.)
    if (messageType === 'extendedTextMessage') {
      return msg.message?.extendedTextMessage?.text || null;
    }

    // Handle image messages with captions
    if (messageType === 'imageMessage') {
      return msg.message?.imageMessage?.caption || null;
    }

    // Ignore other message types for now
    logger.debug(`Ignoring message type: ${messageType}`);
    return null;
  }

  /**
   * Send message to a WhatsApp number
   */
  async sendMessage(jid: string, text: string) {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp is not connected');
    }

    try {
      await this.sock.sendMessage(jid, { text });
      logger.info(`✅ Message sent to ${jid}`);
    } catch (error) {
      logger.error({ err: error, jid }, `Failed to send message to ${jid}`);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      retryCount: this.retryCount,
    };
  }

  /**
   * Disconnect from WhatsApp
   */
  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.isConnected = false;
      logger.info('WhatsApp disconnected');
    }
  }
}

export default WhatsAppClient;
