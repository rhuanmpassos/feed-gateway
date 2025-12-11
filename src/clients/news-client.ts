import EventSource from 'eventsource';
import { EventEmitter } from 'events';
import { NewsEvent, BackendStatus, FeedItem } from '../types';
import config from '../config';

/**
 * Cliente SSE para o backend de Notícias
 */
export class NewsClient extends EventEmitter {
  private es: EventSource | null = null;
  private reconnectDelay: number;
  private status: BackendStatus;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.reconnectDelay = config.sseReconnectDelay;
    this.status = {
      source: 'news',
      status: 'disconnected',
      url: config.newsBackendUrl,
    };
  }

  /**
   * Conecta ao SSE do News backend
   */
  connect(): void {
    if (this.es) {
      this.es.close();
    }

    const url = `${config.newsBackendUrl}/api/events`;
    console.log(`📰 News: Conectando a ${url}...`);
    
    this.status.status = 'connecting';
    this.emit('status', this.status);

    this.es = new EventSource(url);

    this.es.onopen = () => {
      console.log(`✅ News: Conectado!`);
      this.status.status = 'connected';
      this.status.error = undefined;
      this.reconnectDelay = config.sseReconnectDelay; // Reset delay
      this.emit('status', this.status);
    };

    this.es.onerror = (error: any) => {
      console.error(`❌ News: Erro na conexão SSE`, error?.message || '');
      this.status.status = 'disconnected';
      this.status.error = error?.message || 'Connection error';
      this.emit('status', this.status);
      
      this.es?.close();
      this.scheduleReconnect();
    };

    // Eventos do News Backend
    this.es.addEventListener('connected', (event: MessageEvent) => {
      console.log(`📰 News: Evento 'connected' recebido`);
    });

    this.es.addEventListener('new_article', (event: MessageEvent) => {
      this.handleEvent('new_article', event);
    });

    this.es.addEventListener('heartbeat', () => {
      // Keep-alive, ignora
    });
  }

  /**
   * Processa evento recebido
   */
  private handleEvent(eventType: string, event: MessageEvent): void {
    try {
      const data: NewsEvent = JSON.parse(event.data);
      this.status.lastEvent = new Date().toISOString();
      
      // Normaliza para FeedItem
      const feedItem = this.normalizeToFeedItem(data);
      
      console.log(`📰 News [${eventType}]: ${data.title.substring(0, 50)}...`);
      
      this.emit('new_item', feedItem);
    } catch (error) {
      console.error(`❌ News: Erro ao processar evento ${eventType}:`, error);
    }
  }

  /**
   * Normaliza evento do News para FeedItem
   */
  private normalizeToFeedItem(data: NewsEvent): FeedItem {
    return {
      id: `news_${data.id}`,
      source: 'news',
      type: 'article',
      
      title: data.title,
      summary: data.summary,
      imageUrl: data.image_url || '',
      url: data.url,
      
      siteId: data.site_id,
      siteName: data.site_name,
      category_id: data.category_id,    // ID da categoria
      category: data.category,           // Objeto { id, name, slug }
      
      publishedAt: data.published_at || data.created_at,
      receivedAt: new Date().toISOString(),
    };
  }

  /**
   * Agenda reconexão
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    console.log(`📰 News: Reconectando em ${this.reconnectDelay / 1000}s...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Aumenta delay até máximo de 60s
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 60000);
  }

  /**
   * Desconecta
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.es) {
      this.es.close();
      this.es = null;
    }
    
    this.status.status = 'disconnected';
    this.emit('status', this.status);
    console.log(`📰 News: Desconectado`);
  }

  /**
   * Retorna status atual
   */
  getStatus(): BackendStatus {
    return { ...this.status };
  }
}

export const newsClient = new NewsClient();

