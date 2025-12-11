import dotenv from 'dotenv';
import { GatewayConfig } from '../types';

// Carrega variáveis de ambiente
dotenv.config();

export const config: GatewayConfig = {
  port: parseInt(process.env.PORT || '3002'),
  host: process.env.HOST || '0.0.0.0',
  
  // URL do backend de notícias
  newsBackendUrl: process.env.NEWS_BACKEND_URL || 'http://localhost:3000',
  
  // Configurações
  maxHistoryItems: parseInt(process.env.MAX_HISTORY_ITEMS || '500'),
  sseReconnectDelay: parseInt(process.env.SSE_RECONNECT_DELAY || '5000'),
  wsHeartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'),
};

export default config;
