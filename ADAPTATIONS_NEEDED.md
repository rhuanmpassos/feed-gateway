# 🔄 Adaptações Necessárias no Feed Gateway

## 📋 Visão Geral

O **feed-gateway** atua como intermediário entre os backends (News e YouTube) e os clientes frontend. Ele recebe eventos via SSE do backend de notícias e faz broadcast via WebSocket.

O backend de notícias (**feed-extractor**) já foi atualizado para usar **categorias dinâmicas** com `category_id` e enviar objeto `category` completo. Este documento descreve as adaptações necessárias no gateway.

---

## ✅ BACKEND (feed-extractor) - IMPLEMENTADO

### O que o Backend JÁ envia via SSE

**Arquivo:** `backend/src/services/geminiClassifierService.js`

```javascript
// IMPLEMENTADO - Backend envia todos os campos necessários
sseManager.broadcastFiltered('new_article', {
  id: updatedArticle.id,
  title: updatedArticle.title,
  url: updatedArticle.url,
  summary: updatedArticle.summary,
  image_url: updatedArticle.image_url,
  category_id: category.id,           // ✅ ID da categoria
  category: {                          // ✅ OBJETO COMPLETO
    id: category.id,
    name: category.name,
    slug: category.slug
  },
  category_confidence: updatedArticle.category_confidence,
  published_at: updatedArticle.published_at,
  created_at: updatedArticle.created_at,   // ✅ Incluído
  site_id: updatedArticle.site_id,
  site_name: updatedArticle.site_name      // ✅ Incluído
});
```

### Endpoints Disponíveis no Backend

| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/events` | SSE | Stream de novos artigos | ✅ Implementado |
| `/api/categories` | GET | Lista todas as categorias | ✅ Implementado |
| `/api/categories/:slug` | GET | Busca categoria por slug | ✅ Implementado |
| `/api/interactions` | POST | Batch de interações | ✅ Implementado |
| `/api/interactions/single` | POST | Uma interação | ✅ Implementado |
| `/api/interactions/user/:userId` | GET | Interações do usuário | ✅ Implementado |
| `/api/interactions/user/:userId/stats` | GET | Estatísticas | ✅ Implementado |
| `/api/articles` | GET | Lista artigos | ✅ Implementado |
| `/api/articles/:id` | GET | Artigo por ID | ✅ Implementado |

---

## ✅ GATEWAY (feed-gateway) - CONCLUÍDO

### 1. Atualizar Types (`src/types.ts`)

```typescript
// ADICIONAR - Interface Category
export interface Category {
  id: number;
  name: string;
  slug: string;
}

// ATUALIZAR - NewsEvent
export interface NewsEvent {
  id: number;
  title: string;
  url: string;
  summary?: string;
  image_url?: string;
  category_id?: number;        // ← NOVO
  category?: Category;         // ← MUDAR de string para objeto
  category_confidence?: number;
  published_at?: string;
  created_at?: string;
  site_id: number;
  site_name?: string;
}

// ATUALIZAR - FeedItem
export interface FeedItem {
  id: string;
  source: 'youtube' | 'news';
  type: 'video' | 'live' | 'article';
  title: string;
  summary?: string;
  imageUrl?: string;
  url: string;
  // YouTube fields...
  channelId?: string;
  channelName?: string;
  channelThumbnail?: string;
  isLive?: boolean;
  // News fields...
  siteId?: number;
  siteName?: string;
  category_id?: number;        // ← NOVO
  category?: Category;         // ← MUDAR de string para objeto
  publishedAt: string;
  receivedAt: string;
}

// ADICIONAR - Tipos de interação
export interface Interaction {
  article_id: string;           // "news_123" ou "yt_abc123"
  interaction_type: 'click' | 'view' | 'scroll_stop' | 'impression';
  duration?: number;            // tempo em ms (para 'view')
  position?: number;            // posição no feed
  timestamp?: number;           // quando ocorreu
}

export interface InteractionBatch {
  user_id: number;
  interactions: Interaction[];
}
```

---

### 2. Atualizar News Client (`src/clients/news-client.ts`)

```typescript
// ATUALIZAR - normalizeToFeedItem
private normalizeToFeedItem(data: NewsEvent): FeedItem {
  return {
    id: `news_${data.id}`,
    source: 'news',
    type: 'article',
    title: data.title,
    summary: data.summary,
    imageUrl: data.image_url,
    url: data.url,
    siteId: data.site_id,
    siteName: data.site_name,
    category_id: data.category_id,    // ← NOVO
    category: data.category,           // ← Agora é objeto { id, name, slug }
    publishedAt: data.published_at || data.created_at || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  };
}
```

---

### 3. Atualizar Feed Store (`src/services/feed-store.ts`)

```typescript
// ATUALIZAR - Filtro por categoria usando slug
if (categories && categories.length > 0 && item.source === 'news') {
  if (!item.category) continue;
  
  // Filtra por slug (normalizado)
  const itemSlug = item.category.slug.toLowerCase();
  const filterSlugs = categories.map(c => c.toLowerCase().trim());
  
  if (!filterSlugs.includes(itemSlug)) {
    continue;
  }
}
```

---

### 4. Atualizar WebSocket Broadcaster (`src/services/ws-broadcaster.ts`)

```typescript
// ATUALIZAR - Filtro por categoria usando slug
private shouldSendToClient(item: FeedItem, filters: ClientFilters): boolean {
  // ... outros filtros ...
  
  if (filters.categories && filters.categories.length > 0 && item.source === 'news') {
    if (!item.category) return false;
    
    // Filtra por slug
    const itemSlug = item.category.slug.toLowerCase();
    const filterSlugs = filters.categories.map(c => c.toLowerCase().trim());
    
    if (!filterSlugs.includes(itemSlug)) {
      return false;
    }
  }
  
  return true;
}
```

---

### 5. Adicionar Proxy de Interações (`src/routes/api.ts`)

```typescript
/**
 * POST /api/interactions
 * Recebe batch de interações do app e encaminha para o backend
 */
router.post('/interactions', async (req: Request, res: Response) => {
  const { user_id, interactions } = req.body;

  if (!user_id || !interactions || !Array.isArray(interactions)) {
    return res.status(400).json({ error: 'user_id e interactions são obrigatórios' });
  }

  try {
    // Normaliza IDs: "news_123" → 123
    const newsInteractions = interactions
      .filter((i: Interaction) => i.article_id?.startsWith('news_'))
      .map((i: Interaction) => ({
        ...i,
        article_id: parseInt(i.article_id.replace('news_', ''), 10)
      }));

    // Envia para backend de notícias
    if (newsInteractions.length > 0) {
      const response = await fetch(`${config.newsBackendUrl}/api/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          interactions: newsInteractions
        })
      });

      if (!response.ok) {
        console.error('Erro ao enviar interações para backend:', await response.text());
      }
    }

    return res.json({ success: true, processed: interactions.length });
  } catch (error) {
    console.error('Erro ao processar interações:', error);
    return res.status(500).json({ error: 'Erro ao processar interações' });
  }
});

/**
 * GET /api/categories
 * Proxy para listar categorias do backend
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${config.newsBackendUrl}/api/categories`);
    if (response.ok) {
      const categories = await response.json();
      return res.json(categories);
    }
    return res.status(500).json({ error: 'Erro ao buscar categorias' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});
```

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ Backend News (feed-extractor)                    ✅ PRONTO │
│    ↓                                                          │
│ SSE: /api/events                                            │
│    ↓                                                          │
│ Evento: "new_article"                                        │
│ {                                                             │
│   id: 123,                                                    │
│   category_id: 5,                      ✅                    │
│   category: {                          ✅                    │
│     id: 5,                                                    │
│     name: "Futebol",                                          │
│     slug: "futebol"                                           │
│   },                                                           │
│   site_name: "Coluna do Fla",          ✅                    │
│   created_at: "2025-12-10T...",        ✅                    │
│   ...                                                         │
│ }                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ feed-gateway/src/clients/news-client.ts       🔄 PENDENTE  │
│    ↓                                                          │
│ Recebe evento SSE                                            │
│    ↓                                                          │
│ Normaliza para FeedItem:                                     │
│ {                                                             │
│   id: "news_123",                                             │
│   category_id: 5,                      🔄 Adicionar         │
│   category: {                          🔄 Mudar tipo        │
│     id: 5,                                                    │
│     name: "Futebol",                                          │
│     slug: "futebol"                                           │
│   },                                                           │
│   ...                                                         │
│ }                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ feed-gateway/src/services/feed-store.ts       🔄 PENDENTE  │
│    ↓                                                          │
│ Armazena FeedItem                                           │
│    ↓                                                          │
│ Filtra por slug:                       🔄 Atualizar         │
│   filterSlugs.includes(item.category.slug.toLowerCase())    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ feed-gateway/src/services/ws-broadcaster.ts   🔄 PENDENTE  │
│    ↓                                                          │
│ Filtra clientes por slug:              🔄 Atualizar         │
│   filterSlugs.includes(item.category.slug.toLowerCase())    │
│    ↓                                                          │
│ Broadcast para clientes interessados                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist de Implementação

### ✅ Backend News (feed-extractor) - CONCLUÍDO

- [x] Enviar objeto `category` completo `{ id, name, slug }`
- [x] Enviar `category_id`
- [x] Enviar `site_name` via subquery
- [x] Enviar `created_at`
- [x] Criar endpoint `POST /api/interactions`
- [x] Criar endpoint `POST /api/interactions/single`
- [x] Criar endpoint `GET /api/interactions/user/:userId`
- [x] Criar endpoint `GET /api/categories`
- [x] Criar model `UserInteraction.js`
- [x] Criar model `UserCategoryPreference.js`

### ✅ feed-gateway - CONCLUÍDO

- [x] Atualizar `types.ts` (adicionar interface `Category`, `Interaction`)
- [x] Atualizar `NewsEvent` para receber `category` como objeto
- [x] Atualizar `FeedItem` para ter `category` como objeto
- [x] Atualizar `news-client.ts` (normalizar `category` como objeto)
- [x] Atualizar `feed-store.ts` (filtro por `category.slug`)
- [x] Atualizar `ws-broadcaster.ts` (filtro por `category.slug`)
- [x] Adicionar endpoint `POST /api/interactions` (proxy)
- [x] Adicionar endpoint `GET /api/categories` (proxy)
- [ ] Testar recebimento de eventos SSE com novo formato
- [ ] Testar filtros de categorias via WebSocket
- [ ] Testar envio de interações para backend

---

## 📊 Tabela de Campos: Backend → Gateway (SSE Event)

### Campos que Backend Envia

| Campo | Tipo | Exemplo | Status |
|-------|------|---------|--------|
| `id` | `number` | `123` | ✅ OK |
| `title` | `string` | `"Hamilton vence GP"` | ✅ OK |
| `url` | `string` | `"https://..."` | ✅ OK |
| `summary` | `string?` | `"Resumo do artigo"` | ✅ OK |
| `image_url` | `string?` | `"https://..."` | ✅ OK |
| `category_id` | `number` | `5` | ✅ OK |
| `category` | `object` | `{ id: 5, name: "Futebol", slug: "futebol" }` | ✅ OK |
| `category_confidence` | `number` | `0.95` | ✅ OK |
| `published_at` | `string?` | `"2025-12-10T..."` | ✅ OK |
| `created_at` | `string` | `"2025-12-10T..."` | ✅ OK |
| `site_id` | `number` | `22` | ✅ OK |
| `site_name` | `string` | `"Coluna do Fla"` | ✅ OK |

### Campos que Gateway Gera

| Campo | Origem | Exemplo |
|-------|--------|---------|
| `id` | `news_${data.id}` | `"news_123"` |
| `source` | Fixo | `"news"` |
| `type` | Fixo | `"article"` |
| `receivedAt` | `new Date()` | `"2025-12-10T..."` |

---

## 📊 Tabela de Campos: Gateway → Backend (Interações)

### POST /api/interactions

| Campo Frontend | Gateway Normaliza | Backend Espera |
|----------------|-------------------|----------------|
| `user_id: 123` | Passa direto | `user_id` (INTEGER) |
| `article_id: "news_456"` | → `456` | `article_id` (INTEGER) |
| `interaction_type: "click"` | Passa direto | `interaction_type` (VARCHAR) |
| `duration: 3500` | Passa direto | `duration` (INTEGER, opcional) |
| `position: 5` | Passa direto | `position` (INTEGER, opcional) |

---

## 🔍 Exemplo de Filtro por Categoria

### Cliente WebSocket se conecta:

```javascript
{
  "action": "subscribe",
  "filters": {
    "sources": ["news"],
    "categories": ["futebol", "formula-1"]  // ← Slugs
  }
}
```

### Artigo chega do backend:

```json
{
  "id": 123,
  "title": "Hamilton vence GP",
  "category_id": 3,
  "category": {
    "id": 3,
    "name": "Fórmula 1",
    "slug": "formula-1"
  }
}
```

### Gateway processa:

1. Normaliza para `FeedItem` com `category.slug = "formula-1"`
2. Verifica filtro: `["futebol", "formula-1"].includes("formula-1")` → ✅
3. Envia para cliente via WebSocket

---

## 📝 Notas Importantes

1. **Backend já está pronto** - Todas as mudanças no feed-extractor foram implementadas
2. **Slugs são case-insensitive** - `"Futebol"` e `"futebol"` são tratados igual
3. **Filtros usam slugs** - Gateway deve comparar por `category.slug`
4. **Gateway não precisa acessar banco** - Dados vêm prontos do backend
5. **Sem compatibilidade retroativa** - Gateway sempre esperará objeto `category`

---

## 🚀 Próximos Passos

1. ~~Backend: Implementar categorias dinâmicas~~ ✅ **CONCLUÍDO**
2. ~~Backend: Implementar endpoints de interações~~ ✅ **CONCLUÍDO**
3. ~~Gateway: Atualizar types e interfaces~~ ✅ **CONCLUÍDO**
4. ~~Gateway: Atualizar filtros para usar slug~~ ✅ **CONCLUÍDO**
5. ~~Gateway: Implementar proxy de interações~~ ✅ **CONCLUÍDO**
6. **Testar integração completa** ← PRÓXIMO
7. **Implementar tracking no app** (quando desenvolver)

---

**Status**: ✅ Backend Pronto | ✅ Gateway Pronto | 🔄 Testes Pendentes
