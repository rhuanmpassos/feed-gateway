# 📱 Guia de Integração - App Mobile

> Documentação completa para o app mobile consumir as APIs do Feed Gateway.

---

## 🌐 Conexão com o Gateway

### URLs de Ambiente

```
PRODUÇÃO:    https://gateway.seudominio.com
STAGING:     https://gateway-staging.seudominio.com
LOCAL:       http://localhost:3002
```

### Headers Padrão

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  // Opcional: identificação do app
  'X-App-Version': '1.0.0',
  'X-Platform': 'ios' | 'android'
};
```

---

## 🔐 Fluxo de Autenticação e Onboarding

### 1. Criar ou Buscar Usuário

**Primeiro acesso:** Cria usuário com email

```http
POST /api/users
Content-Type: application/json

{
  "email": "usuario@email.com",
  "name": "Nome do Usuário"  // opcional
}
```

**Resposta:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "usuario@email.com",
    "name": "Nome do Usuário",
    "created_at": "2025-12-11T10:00:00Z"
  },
  "isNew": true
}
```

> ⚠️ **IMPORTANTE:** Salve o `user.id` localmente! Todas as outras chamadas precisam dele.

### 2. Buscar Usuário Existente

**Por ID:**
```http
GET /api/users/:id
```

**Por Email:**
```http
GET /api/users/email/:email
```

### 3. Buscar Categorias (para Onboarding)

```http
GET /api/categories
```

**Resposta:**
```json
[
  { "id": 1, "name": "Política", "slug": "politica" },
  { "id": 2, "name": "Economia", "slug": "economia" },
  { "id": 3, "name": "Esportes", "slug": "esportes" },
  { "id": 4, "name": "Tecnologia", "slug": "tecnologia" },
  { "id": 5, "name": "Entretenimento", "slug": "entretenimento" }
]
```

### 4. Salvar Preferências do Onboarding

```http
PUT /api/users/:id/preferences
Content-Type: application/json

{
  "categories": [1, 3, 4]  // IDs das categorias selecionadas
}
```

**Resposta:**
```json
{
  "success": true,
  "preferences": [
    { "category_id": 1, "weight": 1.0 },
    { "category_id": 3, "weight": 1.0 },
    { "category_id": 4, "weight": 1.0 }
  ]
}
```

### 5. Buscar Preferências Existentes

```http
GET /api/users/:id/preferences
```

---

## 📰 Feeds de Notícias

### Feed "For You" (Personalizado)

> Feed básico baseado nas preferências do usuário.

```http
GET /api/feeds/for-you?user_id=1&limit=50
```

**Parâmetros:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| user_id | number | obrigatório | ID do usuário |
| limit | number | 50 | Máximo de itens |

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "Título da Notícia",
      "summary": "Resumo da notícia...",
      "image_url": "https://...",
      "url": "https://...",
      "site_name": "Folha de SP",
      "category": { "id": 1, "name": "Política", "slug": "politica" },
      "published_at": "2025-12-11T10:00:00Z"
    }
  ]
}
```

### 🔥 Feed Viciante (Recomendado)

> **USE ESTE!** Feed otimizado para máximo engajamento com personalização avançada.

```http
GET /api/feeds/addictive?user_id=1&limit=50&offset=0
```

**Parâmetros:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| user_id | number | obrigatório | ID do usuário |
| limit | number | 50 | Itens por página |
| offset | number | 0 | Para paginação |

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "🔴 URGENTE: Título da Notícia",
      "summary": "Resumo...",
      "image_url": "https://...",
      "url": "https://...",
      "site_name": "G1",
      "category": { "id": 1, "name": "Política", "slug": "politica" },
      "published_at": "2025-12-11T10:00:00Z",
      
      // Campos extras do feed viciante
      "position": 1,
      "is_breaking": true,
      "is_wildcard": false,
      "feed_type": "breaking",  // "breaking" | "personalized" | "wildcard" | "popular"
      "display": {
        "show_breaking_badge": true,
        "show_live_badge": false,
        "show_new_badge": false,
        "show_discovery_badge": false,
        "urgency_badge": "🔴 AO VIVO",
        "urgency_color": "#FF0000",
        "time_ago": "2 min atrás"
      },
      "prediction": {
        "score": 0.87,        // 0.0 a 1.0 - probabilidade de clique
        "canPredict": true
      }
    }
  ],
  "count": 50,
  "feed_type": "addictive"
}
```

### Scroll Infinito - Carregar Mais

```http
GET /api/feeds/addictive/more?user_id=1&offset=50&limit=30
```

**Uso no App:**
```typescript
// Estado
let offset = 0;
const limit = 50;

// Primeira carga
async function loadFeed() {
  const response = await fetch(`/api/feeds/addictive?user_id=${userId}&limit=${limit}&offset=0`);
  const { data } = await response.json();
  setArticles(data);
  offset = data.length;
}

// Carregar mais (quando chegar no fim da lista)
async function loadMore() {
  const response = await fetch(`/api/feeds/addictive/more?user_id=${userId}&offset=${offset}&limit=30`);
  const { data } = await response.json();
  setArticles(prev => [...prev, ...data]);
  offset += data.length;
}
```

### Breaking News (Urgentes)

> Notícias das últimas 2 horas - use para banner/seção especial.

```http
GET /api/feeds/breaking?limit=10
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "title": "URGENTE: ...",
      "published_at": "2025-12-11T19:30:00Z",
      "is_breaking": true
    }
  ],
  "feed_type": "breaking"
}
```

### Feed Genérico (Sem Personalização)

```http
GET /api/feed?category=politica,economia&limit=50
```

---

## 📊 Sistema de Interações (OBRIGATÓRIO)

> **CRUCIAL para o algoritmo funcionar!** Envie todas as interações do usuário.

### Tipos de Interação

| Tipo | Quando Enviar | Dados |
|------|---------------|-------|
| `impression` | Artigo aparece na tela | position |
| `scroll_stop` | Usuário para no artigo (2+ segundos) | viewport_time, scroll_velocity |
| `view` | Artigo fica 50%+ visível por 3+ segundos | viewport_time, screen_position |
| `click` | Usuário clica para ler | duration (tempo de leitura) |

### Iniciar Sessão

> Chame quando o app abrir ou voltar do background.

```http
POST /api/sessions
Content-Type: application/json

{
  "user_id": 1,
  "device_type": "ios"  // "ios" | "android"
}
```

**Resposta:**
```json
{
  "success": true,
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 1,
    "started_at": "2025-12-11T10:00:00Z",
    "device_type": "ios"
  }
}
```

> ⚠️ Salve o `session.id` para usar nas interações!

### Enviar Interações em Batch

> Envie a cada 5-10 segundos ou quando houver 10+ interações.

```http
POST /api/interactions
Content-Type: application/json

{
  "user_id": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_type": "ios",
  "interactions": [
    {
      "article_id": "news_123",
      "interaction_type": "impression",
      "position": 1,
      "timestamp": 1702303200000
    },
    {
      "article_id": "news_123",
      "interaction_type": "scroll_stop",
      "viewport_time": 2500,
      "scroll_velocity": 150.5,
      "screen_position": "middle",
      "timestamp": 1702303202500
    },
    {
      "article_id": "news_123",
      "interaction_type": "click",
      "position": 1,
      "timestamp": 1702303205000
    },
    {
      "article_id": "news_123",
      "interaction_type": "view",
      "duration": 45000,
      "timestamp": 1702303250000
    }
  ]
}
```

**Resposta:**
```json
{
  "success": true,
  "processed": 4
}
```

### Finalizar Sessão

> Chame quando o app for para background ou fechar.

```http
PUT /api/sessions/:sessionId/end
```

### Código de Implementação (React Native)

```typescript
import { v4 as uuidv4 } from 'uuid';

// Estado global
let sessionId: string | null = null;
let interactionBuffer: Interaction[] = [];
const BATCH_INTERVAL = 5000; // 5 segundos
const MAX_BUFFER_SIZE = 10;

// Iniciar sessão
async function startSession(userId: number, deviceType: string) {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, device_type: deviceType })
  });
  const { session } = await response.json();
  sessionId = session.id;
  
  // Inicia flush periódico
  setInterval(flushInteractions, BATCH_INTERVAL);
}

// Registrar interação
function trackInteraction(
  articleId: number,
  type: 'impression' | 'scroll_stop' | 'view' | 'click',
  extra: Partial<Interaction> = {}
) {
  interactionBuffer.push({
    article_id: `news_${articleId}`,
    interaction_type: type,
    timestamp: Date.now(),
    ...extra
  });
  
  // Flush se buffer cheio
  if (interactionBuffer.length >= MAX_BUFFER_SIZE) {
    flushInteractions();
  }
}

// Enviar batch
async function flushInteractions() {
  if (interactionBuffer.length === 0) return;
  
  const toSend = [...interactionBuffer];
  interactionBuffer = [];
  
  try {
    await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        device_type: Platform.OS,
        interactions: toSend
      })
    });
  } catch (error) {
    // Requeue on failure
    interactionBuffer = [...toSend, ...interactionBuffer];
  }
}

// Finalizar sessão
async function endSession() {
  await flushInteractions();
  if (sessionId) {
    await fetch(`/api/sessions/${sessionId}/end`, { method: 'PUT' });
    sessionId = null;
  }
}
```

### Implementação de Tracking Visual

```typescript
// Hook para tracking de artigo na lista
function useArticleTracking(articleId: number, position: number) {
  const viewStartTime = useRef<number | null>(null);
  const lastScrollVelocity = useRef(0);
  
  // Callback quando artigo entra no viewport
  const onViewableChange = useCallback((isViewable: boolean) => {
    if (isViewable) {
      // Registra impression na primeira vez
      trackInteraction(articleId, 'impression', { position });
      viewStartTime.current = Date.now();
    } else if (viewStartTime.current) {
      // Calcula tempo no viewport
      const viewportTime = Date.now() - viewStartTime.current;
      
      if (viewportTime >= 2000) {
        trackInteraction(articleId, 'scroll_stop', { 
          viewport_time: viewportTime,
          scroll_velocity: lastScrollVelocity.current
        });
      }
      
      viewStartTime.current = null;
    }
  }, [articleId, position]);
  
  return { onViewableChange };
}
```

---

## 👤 Perfil e Padrões do Usuário

### Buscar Perfil

> Use para saber se funcionalidades avançadas estão habilitadas.

```http
GET /api/users/:userId/profile
```

**Resposta:**
```json
{
  "success": true,
  "profile": {
    "isNew": false,
    "hasPreferences": true,
    "hasEmbedding": true,
    "features": {
      "triggersEnabled": true,      // Gatilhos emocionais detectados
      "patternsEnabled": true,       // Padrões temporais detectados
      "predictionEnabled": true,     // Predição de clique ativa
      "pushEnabled": true            // Push inteligente habilitado
    },
    "stats": {
      "totalClicks": 127,
      "totalSessions": 34,
      "daysActive": 15
    }
  }
}
```

### Buscar Padrões de Comportamento

```http
GET /api/users/:userId/patterns
```

**Resposta:**
```json
{
  "success": true,
  "patterns": {
    "temporal": {
      "preferred_hours": [8, 12, 19, 22],
      "preferred_days": ["monday", "tuesday", "wednesday"],
      "average_session_duration": 420
    },
    "content": {
      "favorite_categories": ["tecnologia", "politica"],
      "reading_style": "scanner",  // "scanner" | "deep_reader"
      "title_preferences": ["urgente", "exclusivo"]
    },
    "engagement": {
      "click_rate": 0.12,
      "average_read_time": 45,
      "scroll_pattern": "fast"
    }
  }
}
```

### Predição de Clique

> Use para ordenar/destacar artigos com maior probabilidade de clique.

```http
GET /api/feeds/predict?user_id=1&article_id=news_123
```

**Resposta:**
```json
{
  "success": true,
  "prediction": {
    "article_id": 123,
    "click_probability": 0.87,
    "confidence": "high",
    "factors": {
      "category_match": 0.9,
      "temporal_match": 0.8,
      "keyword_match": 0.7
    }
  }
}
```

### Estatísticas de Interações

```http
GET /api/interactions/user/:userId/stats
```

---

## 🔖 Bookmarks

### Salvar Bookmark

```http
POST /api/bookmark
Content-Type: application/json

{
  "id": "news_123"
}
```

### Remover Bookmark

```http
DELETE /api/bookmark/news_123
```

### Listar Bookmarks

```http
GET /api/bookmarks
```

**Resposta:**
```json
[
  {
    "id": "news_123",
    "source": "news",
    "type": "article",
    "title": "Título do Artigo",
    "summary": "Resumo...",
    "imageUrl": "https://...",
    "url": "https://...",
    "siteName": "G1",
    "category": { "id": 1, "name": "Política", "slug": "politica" },
    "publishedAt": "2025-12-11T10:00:00Z",
    "bookmarkedAt": "2025-12-11T11:00:00Z"
  }
]
```

---

## 🔌 WebSocket (Tempo Real)

### Conectar

```typescript
const ws = new WebSocket('wss://gateway.seudominio.com/ws');

ws.onopen = () => {
  console.log('Conectado!');
  
  // Subscrever para categorias específicas
  ws.send(JSON.stringify({
    action: 'subscribe',
    filters: {
      categories: ['politica', 'tecnologia'],
      types: ['article']
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.event) {
    case 'connected':
      console.log('Client ID:', message.data.clientId);
      break;
      
    case 'new_item':
      // Nova notícia em tempo real!
      const article = message.data;
      showNotification(article);
      addToFeed(article);
      break;
      
    case 'pong':
      // Heartbeat - conexão ativa
      break;
      
    case 'backend_status':
      // Status do backend mudou
      break;
  }
};
```

### Mensagens do Servidor

| Evento | Descrição |
|--------|-----------|
| `connected` | Conexão estabelecida |
| `new_item` | Nova notícia disponível |
| `history` | Histórico solicitado |
| `pong` | Resposta ao ping/heartbeat |
| `backend_status` | Status do backend mudou |
| `error` | Erro ocorreu |

### Mensagens do Cliente

```typescript
// Atualizar filtros
ws.send(JSON.stringify({
  action: 'subscribe',
  filters: { categories: ['esportes'] }
}));

// Pedir histórico
ws.send(JSON.stringify({
  action: 'get_history',
  limit: 100
}));

// Ping manual
ws.send(JSON.stringify({
  action: 'ping'
}));
```

---

## 🎯 Checklist de Implementação

### Essencial (MVP)

- [ ] Criar/buscar usuário no primeiro acesso
- [ ] Salvar `user_id` localmente (AsyncStorage/SecureStore)
- [ ] Implementar onboarding com seleção de categorias
- [ ] Usar `/api/feeds/addictive` como feed principal
- [ ] Implementar scroll infinito com `/api/feeds/addictive/more`
- [ ] Tracking básico: impressions + clicks
- [ ] Bookmarks

### Engajamento (Alta Prioridade)

- [ ] Implementar sistema de sessões
- [ ] Tracking completo (scroll_stop, view, viewport_time)
- [ ] Exibir badges de urgência (`display.urgency_badge`)
- [ ] Seção de Breaking News com `/api/feeds/breaking`
- [ ] Pull-to-refresh com animação satisfatória
- [ ] WebSocket para notícias em tempo real

### Avançado

- [ ] Usar predição de clique para ordenar artigos
- [ ] Mostrar padrões do usuário (horários preferidos)
- [ ] Push notifications baseadas em comportamento
- [ ] A/B testing de layouts

---

## 🐛 Troubleshooting

### Erro 400: user_id é obrigatório
Certifique-se de enviar `user_id` em todas as chamadas de feed.

### Erro 500: Erro ao comunicar com backend
O gateway não conseguiu conectar ao backend. Verifique se está rodando.

### WebSocket desconecta constantemente
O servidor envia heartbeats a cada 30s. Implemente reconexão automática.

### Feed vazio ou genérico
O usuário pode não ter preferências. Redirecione para onboarding.

### Interações não estão sendo processadas
Verifique se `article_id` está no formato `"news_123"` (com prefixo).

---

## 📋 Changelog

| Versão | Data | Mudanças |
|--------|------|----------|
| 2.0.0 | 2025-12-11 | Feed viciante, sistema de aprendizado, sessões |
| 1.0.0 | 2025-12-10 | Versão inicial |

