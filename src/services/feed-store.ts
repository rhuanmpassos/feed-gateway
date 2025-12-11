import { FeedItem } from '../types';
import config from '../config';

/**
 * Store em memória para histórico de itens do feed
 */
class FeedStore {
  private items: Map<string, FeedItem> = new Map();
  private order: string[] = []; // IDs em ordem de chegada (mais recente primeiro)

  /**
   * Adiciona um item ao store
   */
  add(item: FeedItem): void {
    // Se já existe, atualiza
    if (this.items.has(item.id)) {
      this.items.set(item.id, item);
      return;
    }

    // Adiciona novo
    this.items.set(item.id, item);
    this.order.unshift(item.id); // Mais recente no início

    // Remove itens antigos se exceder limite
    while (this.order.length > config.maxHistoryItems) {
      const oldId = this.order.pop();
      if (oldId) {
        this.items.delete(oldId);
      }
    }
  }

  /**
   * Atualiza um item existente
   */
  update(id: string, updates: Partial<FeedItem>): FeedItem | null {
    const item = this.items.get(id);
    if (!item) return null;

    const updated = { ...item, ...updates };
    this.items.set(id, updated);
    return updated;
  }

  /**
   * Obtém um item por ID
   */
  get(id: string): FeedItem | undefined {
    return this.items.get(id);
  }

  /**
   * Lista itens com filtros
   */
  list(options: {
    limit?: number;
    sources?: ('youtube' | 'news')[];
    types?: ('video' | 'live' | 'article')[];
    categories?: string[];
  } = {}): FeedItem[] {
    const { limit = 50, sources, types, categories } = options;
    
    let result: FeedItem[] = [];
    
    for (const id of this.order) {
      const item = this.items.get(id);
      if (!item) continue;

      // Filtro por source
      if (sources && sources.length > 0 && !sources.includes(item.source)) {
        continue;
      }

      // Filtro por type
      if (types && types.length > 0 && !types.includes(item.type)) {
        continue;
      }

      // Filtro por category (só para news) - usando slug
      if (categories && categories.length > 0 && item.source === 'news') {
        if (!item.category) continue;
        
        // Filtra por slug (normalizado para lowercase)
        const itemSlug = item.category.slug.toLowerCase();
        const filterSlugs = categories.map(c => c.toLowerCase().trim());
        
        if (!filterSlugs.includes(itemSlug)) {
          continue;
        }
      }

      result.push(item);

      if (result.length >= limit) {
        break;
      }
    }

    return result;
  }

  /**
   * Lista lives ao vivo agora
   */
  getLives(): FeedItem[] {
    return this.list({ types: ['live'] }).filter(item => item.isLive === true);
  }

  /**
   * Conta itens por source
   */
  countBySource(): { youtube: number; news: number; total: number } {
    let youtube = 0;
    let news = 0;

    for (const item of this.items.values()) {
      if (item.source === 'youtube') youtube++;
      else if (item.source === 'news') news++;
    }

    return { youtube, news, total: this.items.size };
  }

  /**
   * Limpa o store
   */
  clear(): void {
    this.items.clear();
    this.order = [];
  }
}

export const feedStore = new FeedStore();

