/**
 * Categoria de notícia
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
}

/**
 * Item unificado do feed (normalizado de YouTube ou News)
 */
export interface FeedItem {
  id: string;                    // "yt_abc123" | "news_456"
  source: 'youtube' | 'news';
  type: 'video' | 'live' | 'article';
  
  // Conteúdo
  title: string;
  summary?: string;
  imageUrl: string;
  url: string;
  
  // YouTube específico
  channelId?: string;
  channelName?: string;
  channelThumbnail?: string;
  isLive?: boolean;
  
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
 * Status de conexão de um backend
 */
export interface BackendStatus {
  source: 'youtube' | 'news';
  status: 'connected' | 'disconnected' | 'connecting';
  url: string;
  lastEvent?: string;
  error?: string;
}

/**
 * Filtros de subscription do cliente WebSocket
 */
export interface SubscriptionFilters {
  sources?: ('youtube' | 'news')[];
  types?: ('video' | 'live' | 'article')[];
  categories?: string[];
  channels?: string[];
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
  sources?: ('youtube' | 'news')[];
}

/**
 * Mensagem do gateway para o cliente
 */
export interface GatewayMessage {
  event: 'connected' | 'new_item' | 'live_started' | 'live_ended' | 'history' | 'pong' | 'backend_status' | 'error';
  data: any;
}

/**
 * Evento do YouTube backend
 */
export interface YouTubeEvent {
  video: {
    videoId: string;
    title: string;
    publishedAt: string;
    thumbnailUrl: string;
    type: 'video' | 'short' | 'live' | 'scheduled' | 'vod';
    isLive: boolean;
    isLiveContent: boolean;
    isUpcoming: boolean;
  };
  channel: {
    channelId: string;
    title: string;
    thumbnailUrl?: string;
  };
  timestamp: string;
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
  article_id: string;           // "news_123" ou "yt_abc123"
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
  youtubeBackendUrl: string;
  newsBackendUrl: string;
  maxHistoryItems: number;
  sseReconnectDelay: number;
  wsHeartbeatInterval: number;
}

