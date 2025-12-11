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
    categories?: string[];
  } = {}): FeedItem[] {
    const { limit = 50, categories } = options;
    
    let result: FeedItem[] = [];
    
    for (const id of this.order) {
      const item = this.items.get(id);
      if (!item) continue;

      // Filtro por category - usando slug
      if (categories && categories.length > 0) {
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
   * Retorna estatísticas do store
   */
  getStats(): { news: number; total: number } {
    return { 
      news: this.items.size,
      total: this.items.size 
    };
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
