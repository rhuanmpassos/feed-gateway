/**
 * Categoria de notícia
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
}

/**
 * Item unificado do feed (normalizado de News)
 */
export interface FeedItem {
  id: string;                    // "news_456"
  source: 'news';
  type: 'article';
  
  // Conteúdo
  title: string;
  summary?: string;
  imageUrl: string;
  url: string;
  
  // News específico
  siteId?: number;
  siteName?: string;
  category_id?: number;          // ID da categoria
  category?: Category;           // Objeto completo { id, name, slug }
  
  // Timestamps
  publishedAt: string;
  receivedAt: string;
}

/**
 * Status de conexão do backend
 */
export interface BackendStatus {
  source: 'news';
  status: 'connected' | 'disconnected' | 'connecting';
  url: string;
  lastEvent?: string;
  error?: string;
}

/**
 * Filtros de subscription do cliente WebSocket
 */
export interface SubscriptionFilters {
  sources?: ('news')[];
  types?: ('article')[];
  categories?: string[];
}

/**
 * Cliente WebSocket conectado
 */
export interface WSClient {
  id: string;
  ws: import('ws').WebSocket;
  filters: SubscriptionFilters;
  subscribedAt: Date;
}

/**
 * Mensagem do cliente para o gateway
 */
export interface ClientMessage {
  action: 'subscribe' | 'get_history' | 'ping';
  filters?: SubscriptionFilters;
  limit?: number;
  sources?: ('news')[];
}

/**
 * Mensagem do gateway para o cliente
 */
export interface GatewayMessage {
  event: 'connected' | 'new_item' | 'history' | 'pong' | 'backend_status' | 'error';
  data: any;
}

/**
 * Evento do News backend
 */
export interface NewsEvent {
  id: number;
  title: string;
  url: string;
  summary?: string;
  image_url?: string;
  category_id?: number;           // ID da categoria
  category?: Category;            // Objeto completo { id, name, slug }
  category_confidence?: number;
  site_id: number;
  site_name?: string;
  published_at?: string;
  created_at: string;
}

/**
 * Interação do usuário com um artigo
 */
export interface Interaction {
  article_id: string;           // "news_123"
  interaction_type: 'click' | 'view' | 'scroll_stop' | 'impression';
  duration?: number;            // tempo em ms (para 'view')
  position?: number;            // posição no feed
  timestamp?: number;           // quando ocorreu
}

/**
 * Batch de interações do usuário
 */
export interface InteractionBatch {
  user_id: number;
  interactions: Interaction[];
}

/**
 * Configuração do Gateway
 */
export interface GatewayConfig {
  port: number;
  host: string;
  newsBackendUrl: string;
  maxHistoryItems: number;
  sseReconnectDelay: number;
  wsHeartbeatInterval: number;
}
