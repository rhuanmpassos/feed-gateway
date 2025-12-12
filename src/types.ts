/**
 * Usuário autenticado
 */
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

/**
 * Resposta de autenticação
 */
export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
  code?: string;
}

/**
 * Payload do token JWT decodificado
 */
export interface JWTPayload {
  id: number;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

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
 * ATUALIZADO: Campos extras para sistema de aprendizado
 */
export interface Interaction {
  article_id: string;           // "news_123"
  interaction_type: 'click' | 'view' | 'scroll_stop' | 'impression';
  duration?: number;            // tempo em ms (para 'view')
  position?: number;            // posição no feed
  timestamp?: number;           // quando ocorreu
  
  // Novos campos para aprendizado
  scroll_velocity?: number;     // velocidade do scroll (px/s)
  screen_position?: 'top' | 'middle' | 'bottom';  // posição na tela
  viewport_time?: number;       // tempo no viewport (ms)
}

/**
 * Batch de interações do usuário
 * ATUALIZADO: Suporte a sessões
 */
export interface InteractionBatch {
  user_id: number;
  session_id?: string;          // ID da sessão atual
  device_type?: string;         // 'ios' | 'android' | 'web'
  interactions: Interaction[];
}

/**
 * Sessão do usuário
 */
export interface UserSession {
  id: string;
  user_id: number;
  started_at: string;
  ended_at?: string;
  duration?: number;
  articles_viewed: number;
  articles_clicked: number;
  device_type?: string;
  entry_source?: string;
}

/**
 * Perfil do usuário (simplificado)
 */
export interface UserProfile {
  isNew: boolean;
  hasPreferences: boolean;
  hasEmbedding: boolean;
  features: {
    triggersEnabled: boolean;
    patternsEnabled: boolean;
    predictionEnabled: boolean;
    pushEnabled: boolean;
  };
  stats?: {
    totalClicks: number;
    totalSessions: number;
    daysActive: number;
  };
}

/**
 * Metadados de exibição do artigo
 */
export interface DisplayMetadata {
  show_breaking_badge: boolean;
  show_live_badge: boolean;
  show_new_badge: boolean;
  show_discovery_badge: boolean;
  urgency_badge?: string;
  urgency_color?: string;
  time_ago?: string;
}

/**
 * Artigo do feed viciante (com metadados extras)
 */
export interface AddictiveFeedItem extends FeedItem {
  position: number;
  is_breaking?: boolean;
  is_wildcard?: boolean;
  feed_type?: 'breaking' | 'personalized' | 'wildcard' | 'popular';
  display?: DisplayMetadata;
  prediction?: {
    score: number;
    canPredict: boolean;
  };
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
