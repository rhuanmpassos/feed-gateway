import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { WSClient, SubscriptionFilters, FeedItem, ClientMessage, GatewayMessage, BackendStatus } from '../types';
import { feedStore } from './feed-store';
import { newsClient } from '../clients/news-client';
import config from '../config';

/**
 * Gerenciador de WebSocket para broadcast de eventos
 */
class WSBroadcaster {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private clientIdCounter = 0;

  /**
   * Inicializa o WebSocket Server
   */
  initialize(server: any): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    // Inicia heartbeat
    this.startHeartbeat();

    console.log(`🔌 WebSocket Server inicializado em /ws`);
  }

  /**
   * Trata nova conexão
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = `client_${++this.clientIdCounter}`;
    
    // Parse query params para filtros iniciais
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const typesParam = url.searchParams.get('types');
    
    const filters: SubscriptionFilters = {};
    if (typesParam) {
      filters.types = typesParam.split(',') as ('article')[];
    }

    const client: WSClient = {
      id: clientId,
      ws,
      filters,
      subscribedAt: new Date(),
    };

    this.clients.set(clientId, client);
    console.log(`🔌 Cliente conectado: ${clientId} (total: ${this.clients.size})`);

    // Envia evento de conexão
    this.sendToClient(client, {
      event: 'connected',
      data: {
        clientId,
        backends: {
          news: newsClient.getStatus(),
        },
        filters,
      },
    });

    // Handlers
    ws.on('message', (data: Buffer) => {
      this.handleMessage(client, data.toString());
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      console.log(`🔌 Cliente desconectado: ${clientId} (total: ${this.clients.size})`);
    });

    ws.on('error', (error) => {
      console.error(`❌ Erro no cliente ${clientId}:`, error.message);
      this.clients.delete(clientId);
    });
  }

  /**
   * Processa mensagem do cliente
   */
  private handleMessage(client: WSClient, raw: string): void {
    try {
      const message: ClientMessage = JSON.parse(raw);

      switch (message.action) {
        case 'subscribe':
          if (message.filters) {
            client.filters = message.filters;
            console.log(`🔌 ${client.id} atualizou filtros:`, message.filters);
          }
          break;

        case 'get_history':
          const history = feedStore.list({
            limit: message.limit || 50,
            categories: client.filters.categories,
          });
          this.sendToClient(client, { event: 'history', data: history });
          break;

        case 'ping':
          this.sendToClient(client, { event: 'pong', data: { timestamp: new Date().toISOString() } });
          break;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem de ${client.id}:`, error);
      this.sendToClient(client, { event: 'error', data: { message: 'Invalid message format' } });
    }
  }

  /**
   * Envia mensagem para um cliente
   */
  private sendToClient(client: WSClient, message: GatewayMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast de novo item para clientes interessados
   */
  broadcastNewItem(item: FeedItem): void {
    for (const client of this.clients.values()) {
      if (this.shouldReceive(client, item)) {
        this.sendToClient(client, { event: 'new_item', data: item });
      }
    }
  }

  /**
   * Broadcast de status de backend
   */
  broadcastBackendStatus(status: BackendStatus): void {
    const message: GatewayMessage = { event: 'backend_status', data: status };
    for (const client of this.clients.values()) {
      this.sendToClient(client, message);
    }
  }

  /**
   * Verifica se cliente deve receber o item baseado nos filtros
   */
  private shouldReceive(client: WSClient, item: FeedItem): boolean {
    const { filters } = client;

    // Filtro por type
    if (filters.types && filters.types.length > 0) {
      if (!filters.types.includes(item.type)) {
        return false;
      }
    }

    // Filtro por category - usando slug
    if (filters.categories && filters.categories.length > 0) {
      if (!item.category) return false;
      
      // Filtra por slug (normalizado para lowercase)
      const itemSlug = item.category.slug.toLowerCase();
      const filterSlugs = filters.categories.map(c => c.toLowerCase().trim());
      
      if (!filterSlugs.includes(itemSlug)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Inicia heartbeat para manter conexões vivas
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const message: GatewayMessage = {
        event: 'pong',
        data: { timestamp: new Date().toISOString(), type: 'heartbeat' },
      };

      for (const client of this.clients.values()) {
        if (client.ws.readyState === WebSocket.OPEN) {
          this.sendToClient(client, message);
        }
      }
    }, config.wsHeartbeatInterval);
  }

  /**
   * Retorna estatísticas
   */
  getStats(): { totalClients: number; clientsByFilter: any } {
    const stats = {
      totalClients: this.clients.size,
      clientsByFilter: {
        all: 0,
        withCategories: 0,
      },
    };

    for (const client of this.clients.values()) {
      const { filters } = client;
      
      if (!filters.categories || filters.categories.length === 0) {
        stats.clientsByFilter.all++;
      }
      
      if (filters.categories && filters.categories.length > 0) {
        stats.clientsByFilter.withCategories++;
      }
    }

    return stats;
  }

  /**
   * Fecha todas as conexões
   */
  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const client of this.clients.values()) {
      client.ws.close();
    }
    
    this.clients.clear();
    this.wss?.close();
  }
}

export const wsBroadcaster = new WSBroadcaster();
