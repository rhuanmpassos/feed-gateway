import EventSource from 'eventsource';
import { EventEmitter } from 'events';
import { YouTubeEvent, BackendStatus, FeedItem } from '../types';
import config from '../config';

/**
 * Cliente SSE para o backend do YouTube
 */
export class YouTubeClient extends EventEmitter {
  private es: EventSource | null = null;
  private reconnectDelay: number;
  private status: BackendStatus;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.reconnectDelay = config.sseReconnectDelay;
    this.status = {
      source: 'youtube',
      status: 'disconnected',
      url: config.youtubeBackendUrl,
    };
  }

  /**
   * Conecta ao SSE do YouTube backend
   */
  connect(): void {
    if (this.es) {
      this.es.close();
    }

    const url = `${config.youtubeBackendUrl}/events`;
    console.log(`📺 YouTube: Conectando a ${url}...`);
    
    this.status.status = 'connecting';
    this.emit('status', this.status);

    this.es = new EventSource(url);

    this.es.onopen = () => {
      console.log(`✅ YouTube: Conectado!`);
      this.status.status = 'connected';
      this.status.error = undefined;
      this.reconnectDelay = config.sseReconnectDelay; // Reset delay
      this.emit('status', this.status);
    };

    this.es.onerror = (error: any) => {
      console.error(`❌ YouTube: Erro na conexão SSE`, error?.message || '');
      this.status.status = 'disconnected';
      this.status.error = error?.message || 'Connection error';
      this.emit('status', this.status);
      
      this.es?.close();
      this.scheduleReconnect();
    };

    // Eventos do YouTube Monitor
    this.es.addEventListener('connected', () => {
      console.log(`📺 YouTube: Evento 'connected' recebido`);
    });

    this.es.addEventListener('new_video', (event: MessageEvent) => {
      this.handleEvent('new_video', event);
    });

    this.es.addEventListener('live_started', (event: MessageEvent) => {
      this.handleEvent('live_started', event);
    });

    this.es.addEventListener('live_ended', (event: MessageEvent) => {
      this.handleEvent('live_ended', event);
    });

    this.es.addEventListener('video_updated', (event: MessageEvent) => {
      this.handleEvent('video_updated', event);
    });

    this.es.addEventListener('cycle_complete', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log(`📺 YouTube: Ciclo completo - ${data.channels} canais, ${data.videos} vídeos`);
    });
  }

  /**
   * Processa evento recebido
   */
  private handleEvent(eventType: string, event: MessageEvent): void {
    try {
      const data: YouTubeEvent = JSON.parse(event.data);
      this.status.lastEvent = new Date().toISOString();
      
      // Ignora shorts, vods e scheduled (app não quer)
      if (data.video.type === 'short' || data.video.type === 'vod' || data.video.type === 'scheduled') {
        return;
      }

      // Normaliza para FeedItem
      const feedItem = this.normalizeToFeedItem(data, eventType);
      
      console.log(`📺 YouTube [${eventType}]: ${data.video.title.substring(0, 50)}...`);
      
      // Emite evento apropriado
      if (eventType === 'live_started') {
        this.emit('live_started', feedItem);
      } else if (eventType === 'live_ended') {
        this.emit('live_ended', feedItem);
      } else {
        this.emit('new_item', feedItem);
      }
    } catch (error) {
      console.error(`❌ YouTube: Erro ao processar evento ${eventType}:`, error);
    }
  }

  /**
   * Normaliza evento do YouTube para FeedItem
   */
  private normalizeToFeedItem(data: YouTubeEvent, eventType: string): FeedItem {
    const isLive = eventType === 'live_started' || data.video.isLive;
    
    return {
      id: `yt_${data.video.videoId}`,
      source: 'youtube',
      type: isLive ? 'live' : 'video',
      
      title: data.video.title,
      imageUrl: data.video.thumbnailUrl,
      url: `https://www.youtube.com/watch?v=${data.video.videoId}`,
      
      channelId: data.channel.channelId,
      channelName: data.channel.title,
      channelThumbnail: data.channel.thumbnailUrl,
      isLive,
      
      publishedAt: data.video.publishedAt,
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

    console.log(`📺 YouTube: Reconectando em ${this.reconnectDelay / 1000}s...`);
    
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
    console.log(`📺 YouTube: Desconectado`);
  }

  /**
   * Retorna status atual
   */
  getStatus(): BackendStatus {
    return { ...this.status };
  }
}

export const youtubeClient = new YouTubeClient();

