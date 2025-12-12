# 📱 Guia de Integração - App Mobile

> Documentação completa para o app mobile consumir as APIs do Feed Gateway.

---

## 📋 Índice

1. [Estrutura do App](#-estrutura-do-app)
2. [Design Visual](#-design-visual)
3. [Conexão com o Gateway](#-conexão-com-o-gateway)
4. [Autenticação e Onboarding](#-fluxo-de-autenticação-e-onboarding)
5. [Feeds de Notícias](#-feeds-de-notícias)
6. [Ações do Card (Like, Bookmark, Share)](#-ações-do-card)
7. [Sistema de Interações](#-sistema-de-interações-obrigatório)
8. [Perfil e Padrões](#-perfil-e-padrões-do-usuário)
9. [WebSocket](#-websocket-tempo-real)

---

## 📱 Estrutura do App

### Navegação Principal (Bottom Tabs)

```
┌─────────────────────────────────────────┐
│                                         │
│              [CONTEÚDO]                 │
│                                         │
├──────────┬──────────┬─────────┬─────────┤
│  Para    │  Agora   │ Salvos  │ Perfil  │
│  Você    │          │         │         │
│   🏠     │    ⚡    │   🔖    │   👤    │
└──────────┴──────────┴─────────┴─────────┘
```

| Tab | Nome | Endpoint | Descrição |
|-----|------|----------|-----------|
| 🏠 | **Para Você** | `/api/feeds/addictive` | Feed personalizado com algoritmo |
| ⚡ | **Agora** | `/api/feed` | Feed cronológico + Breaking News no topo |
| 🔖 | **Salvos** | `/api/bookmarks` | Artigos salvos pelo usuário |
| 👤 | **Perfil** | `/api/users/:id` | Preferências e configurações |

### Fluxo de Telas

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  SPLASH → ONBOARDING → HOME (Para Você)                 │
│             ↓                                           │
│      ┌─────────────────┐                                │
│      │ 1. Proposta     │                                │
│      │ 2. Categorias   │ (mínimo 3)                     │
│      │ 3. Notificações │ (opcional)                     │
│      └─────────────────┘                                │
│                                                         │
│  HOME ──┬── Toca card ──→ WebView/Browser               │
│         │                                               │
│         ├── Pull down ──→ Refresh                       │
│         │                                               │
│         ├── Scroll ─────→ Infinite loading              │
│         │                                               │
│         └── Tabs ───────→ Agora / Salvos / Perfil       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Design Visual

### Paleta de Cores (Dark Mode - Padrão)

```
BACKGROUNDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#0A0A0B  ████  Fundo principal
#141416  ████  Cards/Superfícies
#1C1C1E  ████  Elevated (modais)

TEXTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#FFFFFF  ████  Títulos (100%)
#A1A1A6  ████  Subtexto (60%)
#636366  ████  Metadata (40%)

ACCENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#FF3B30  ████  URGENTE (vermelho)
#FF9500  ████  AGORA (laranja)
#34C759  ████  NOVO (verde)
#AF52DE  ████  Descoberta (roxo)
#007AFF  ████  Links/Bookmark (azul)
#FFD60A  ████  Like/Estrela (amarelo)
```

### Tipografia

```
TÍTULOS:    "Playfair Display" ou "Lora" (Serif)
CORPO:      "Inter" ou "SF Pro Text" (Sans-serif)
METADATA:   "SF Mono" ou sistema (Monospace)

Hierarquia:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Título Card:    17px, weight 600, line 22px
Resumo:         15px, weight 400, line 22px
Metadata:       13px, weight 500, line 18px, #A1A1A6
Badge:          11px, weight 700, UPPERCASE
```

### Anatomia do Card

```
┌─ 16px padding ─────────────────────────────────┐
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │              IMAGEM                      │ │
│  │              aspect-ratio: 16:9          │ │
│  │              border-radius: 12px         │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ← 12px gap →                                  │
│                                                │
│  ┌────────────┐                                │
│  │  URGENTE   │  ← badge vermelho (se aplicável)
│  └────────────┘                                │
│                                                │
│  ← 4px gap →                                   │
│                                                │
│  Título da notícia que pode                    │
│  ocupar até duas linhas...                     │
│                                                │
│  ← 8px gap →                                   │
│                                                │
│  G1  •  2 min                                  │
│                                                │
│  ← 12px gap →                                  │
│                                                │
│  ⭐         🔖         ↗️                       │
│  Like     Salvar    Compartilhar              │
│                                                │
└────────────────────────────────────────────────┘
```

### Badges de Urgência

```
URGENTE (< 30 min + breaking)
┌─────────────┐
│   URGENTE   │  bg: rgba(255,59,48,0.15)
└─────────────┘  text: #FF3B30, border: #FF3B30

AGORA (< 2 horas)
┌─────────────┐
│    AGORA    │  bg: rgba(255,149,0,0.15)
└─────────────┘  text: #FF9500

NOVO (< 6 horas)
┌─────────────┐
│  ● NOVO     │  bg: transparent
└─────────────┘  text: #34C759

DESCOBERTA (wildcard)
┌─────────────┐
│ 💡 Pra você │  bg: rgba(175,82,222,0.15)
└─────────────┘  text: #AF52DE
```

### Estados Visuais

```
ARTIGO NÃO LIDO
┌──────────────────────────────────────────┐
│ [IMG]  Título em branco 100%             │
│        Fonte • 2 min                     │
└──────────────────────────────────────────┘

ARTIGO JÁ LIDO
┌──────────────────────────────────────────┐
│ [IMG]  Título em cinza 50%   ← opacity   │
│ 50%    Fonte • 2 min            0.5      │
└──────────────────────────────────────────┘

ARTIGO LIKED
┌──────────────────────────────────────────┐
│ [IMG]  Título normal                     │
│        Fonte • 2 min      ⭐ ← amarelo   │
└──────────────────────────────────────────┘

ARTIGO SALVO
┌──────────────────────────────────────────┐
│ [IMG]  Título normal                     │
│        Fonte • 2 min      🔖 ← azul      │
└──────────────────────────────────────────┘
```

### Loading States

**Skeleton com Shimmer:**
```
┌────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░ SHIMMER →→→ ░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└────────────────────────────────────────────────┘
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░           │
│ ░░░░░░░░░░░░░░░░░░░░░░                         │
│ ░░░░░░░░░░                                     │
└────────────────────────────────────────────────┘

Animation: linear-gradient moving left to right
Duration: 1.5s, infinite
```

**Pull to Refresh:**
```
↓ Puxe para atualizar
     ○ (spinner)
✓ Atualizado! (fade out após 1s)
```

---

## 🌐 Conexão com o Gateway

### URLs de Ambiente

```
PRODUÇÃO:    https://feed-gateway.onrender.com
LOCAL:       http://localhost:3002
```

### Headers Padrão

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-App-Version': '1.0.0',
  'X-Platform': 'ios' | 'android'
};
```

---

## 🔐 Fluxo de Autenticação e Onboarding

### Telas do Onboarding

**Tela 1: Splash (2-3 segundos)**
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│              [LOGO]                 │
│                                     │
│           Nome do App               │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Tela 2: Proposta de Valor**
```
┌─────────────────────────────────────┐
│                                     │
│         📰                          │
│                                     │
│   Notícias que importam             │
│                                     │
│   Curadas por IA para você.         │
│   Sem ruído, sem clickbait.         │
│                                     │
│        [ Começar → ]                │
│                                     │
│         Já tenho conta              │
│                                     │
└─────────────────────────────────────┘
```

**Tela 3: Seleção de Interesses (CRUCIAL)**
```
┌─────────────────────────────────────┐
│                                     │
│   O que te interessa?               │
│   Selecione pelo menos 3            │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │🏛️Política│ │💰Economia│ │⚽Esporte││
│  └─────────┘ └─────────┘ └────────┘│
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │💻Tecnolog│ │🎬Entreten│ │🌍 Mundo ││
│  └─────────┘ └─────────┘ └────────┘│
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │🔬Ciência │ │💼Negócios│ │🏥 Saúde ││
│  └─────────┘ └─────────┘ └────────┘│
│                                     │
│    [ Continuar ] (3 selecionados)   │
│                                     │
└─────────────────────────────────────┘

Regras:
- Mínimo 3 categorias obrigatório
- Chips com animação de seleção (scale + cor)
- Botão só ativa quando tem 3+
- Contador visual "3/3 selecionados"
```

**Tela 4: Notificações (Opcional)**
```
┌─────────────────────────────────────┐
│                                     │
│              🔔                     │
│                                     │
│   Quer saber primeiro?              │
│                                     │
│   Receba alertas de notícias        │
│   importantes na hora.              │
│                                     │
│     [ Ativar Notificações ]         │
│                                     │
│           Agora não                 │
│                                     │
└─────────────────────────────────────┘
```

**→ Vai direto para o Feed "Para Você"**

---

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

### 🔥 Feed "Para Você" (Principal)

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
      "title": "Título da Notícia",
      "summary": "Resumo...",
      "image_url": "https://...",
      "url": "https://...",
      "site_name": "G1",
      "category": { "id": 1, "name": "Política", "slug": "politica" },
      "published_at": "2025-12-11T10:00:00Z",
      
      // Campos extras do feed
      "position": 1,
      "is_breaking": true,
      "is_wildcard": false,
      "is_liked": false,
      "is_bookmarked": false,
      "feed_type": "breaking",  // "breaking" | "personalized" | "wildcard" | "discovery"
      "display": {
        "show_breaking_badge": true,   // Notícia < 2h
        "show_new_badge": false,       // Notícia < 30min
        "show_discovery_badge": false, // Wildcard/fora do padrão
        "urgency_level": "high",       // "high" | "medium" | "low" | null
        "urgency_badge": "URGENTE",    // "URGENTE" | "AGORA" | null
        "urgency_color": "#FF3B30",    // Cor do badge
        "time_ago": "2 min"            // Tempo relativo
      },
      "prediction": {
        "score": 0.87,
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

> Notícias das últimas 2 horas - use para seção especial no topo do feed "Agora".

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
      "title": "Congresso aprova reforma tributária",
      "published_at": "2025-12-11T19:30:00Z",
      "is_breaking": true,
      "display": {
        "urgency_badge": "URGENTE",
        "urgency_color": "#FF3B30",
        "time_ago": "5 min"
      }
    }
  ],
  "feed_type": "breaking"
}
```

### Estratégia de Urgência

Em vez de "AO VIVO", usamos badges baseados em **tempo** e **relevância**:

| Badge | Condição | Cor | Quando usar |
|-------|----------|-----|-------------|
| `URGENTE` | Notícia < 30 min + categoria importante | `#FF3B30` (vermelho) | Breaking news políticas, econômicas |
| `AGORA` | Notícia < 2 horas | `#FF9500` (laranja) | Notícias recentes |
| `NOVO` | Notícia < 6 horas | `#34C759` (verde) | Conteúdo fresco |
| `💡 Descoberta` | Wildcard/fora do padrão | `#AF52DE` (roxo) | Expandir interesses |

**Lógica de exibição:**
```typescript
function getUrgencyBadge(article: Article): Badge | null {
  const minutesAgo = getMinutesAgo(article.published_at);
  
  if (article.is_breaking && minutesAgo < 30) {
    return { text: 'URGENTE', color: '#FF3B30' };
  }
  
  if (minutesAgo < 120) { // 2 horas
    return { text: 'AGORA', color: '#FF9500' };
  }
  
  if (minutesAgo < 360) { // 6 horas
    return { text: 'NOVO', color: '#34C759' };
  }
  
  if (article.is_wildcard) {
    return { text: '💡 Descoberta', color: '#AF52DE' };
  }
  
  return null;
}
```

### Feed Cronológico ("Agora")

> Feed em ordem cronológica, sem personalização. Use como segunda tab.

```http
GET /api/feed?limit=50
```

**Com filtro de categoria:**
```http
GET /api/feed?category=politica,economia&limit=50
```

---

## ⭐ Ações do Card

Cada card de artigo deve ter 3 ações visíveis:

```
┌────────────────────────────────────────────────┐
│                                                │
│  [IMAGEM DO ARTIGO]                            │
│                                                │
│  Título da notícia que pode                    │
│  ocupar até duas linhas...                     │
│                                                │
│  G1 • 2 min                                    │
│                                                │
│  ⭐        🔖        ↗️                         │
│  Like    Salvar   Compartilhar                │
│                                                │
└────────────────────────────────────────────────┘
```

### Like (Estrela) ⭐

> Indica interesse forte no artigo. Pesa mais no algoritmo que um clique.

**Adicionar Like:**
```http
POST /api/articles/:id/like
Content-Type: application/json

{
  "user_id": 1
}
```

**Remover Like:**
```http
DELETE /api/articles/:id/like?user_id=1
```

**Resposta:**
```json
{
  "success": true,
  "liked": true,
  "article_id": 123
}
```

### Bookmark (Salvar) 🔖

> Salva o artigo para ler depois.

**Adicionar Bookmark:**
```http
POST /api/bookmark
Content-Type: application/json

{
  "id": "news_123",
  "user_id": 1
}
```

**Remover Bookmark:**
```http
DELETE /api/bookmark/news_123?user_id=1
```

**Listar Bookmarks:**
```http
GET /api/bookmarks?user_id=1
```

### Compartilhar ↗️

> O compartilhamento é feito localmente no app usando a URL do artigo.

```typescript
import { Share } from 'react-native';

async function shareArticle(article: Article) {
  // Registra interação de compartilhamento
  trackInteraction(article.id, 'share');
  
  // Abre sheet nativo de compartilhamento
  await Share.share({
    title: article.title,
    message: article.title,
    url: article.url
  });
}
```

### Estados Visuais dos Botões

```typescript
interface CardActions {
  isLiked: boolean;      // ⭐ preenchida (amarelo) vs outline (cinza)
  isBookmarked: boolean; // 🔖 preenchido (azul) vs outline (cinza)
  // Share não tem estado, sempre outline
}
```

**Cores:**
| Estado | Cor | Hex |
|--------|-----|-----|
| Like ativo | Amarelo/Dourado | `#FFD60A` |
| Bookmark ativo | Azul | `#007AFF` |
| Inativo | Cinza | `#636366` |

**Animação ao tocar:**
```
1. Scale: 1 → 0.8 → 1.2 → 1
2. Haptic feedback (light)
3. Cor muda instantaneamente
4. Duração total: 300ms
```

---

## 📊 Sistema de Interações (OBRIGATÓRIO)

> **CRUCIAL para o algoritmo funcionar!** Envie todas as interações do usuário.

### Tipos de Interação

| Tipo | Quando Enviar | Peso no Algoritmo | Dados |
|------|---------------|-------------------|-------|
| `impression` | Artigo aparece na tela | ⭐ | position |
| `scroll_stop` | Usuário para no artigo (2+ seg) | ⭐⭐ | viewport_time, scroll_velocity |
| `view` | Artigo 50%+ visível por 3+ seg | ⭐⭐ | viewport_time, screen_position |
| `click` | Usuário clica para ler | ⭐⭐⭐⭐ | duration (tempo de leitura) |
| `like` | Usuário dá like (estrela) | ⭐⭐⭐⭐⭐ | - |
| `share` | Usuário compartilha | ⭐⭐⭐⭐⭐ | - |
| `bookmark` | Usuário salva | ⭐⭐⭐ | - |

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

## 🛠️ Implementação React Native

### Estrutura de Arquivos Recomendada

```
src/
├── components/
│   ├── Feed/
│   │   ├── ArticleFeed.tsx       # Lista principal
│   │   ├── ArticleCard.tsx       # Card do artigo
│   │   ├── SkeletonCard.tsx      # Loading skeleton
│   │   └── UrgencyBadge.tsx      # Badges de urgência
│   └── Actions/
│       ├── LikeButton.tsx        # Botão de like
│       ├── BookmarkButton.tsx    # Botão de salvar
│       └── ShareButton.tsx       # Botão de compartilhar
├── hooks/
│   ├── useSession.ts             # Gerenciamento de sessão
│   ├── useArticleTracking.ts     # Tracking de artigo
│   ├── useScrollTracking.ts      # Tracking de scroll
│   └── useClickTracking.ts       # Tracking de cliques
├── services/
│   ├── InteractionTracker.ts     # Singleton de tracking
│   └── api.ts                    # Cliente HTTP
└── types/
    └── tracking.ts               # Tipos de tracking
```

### InteractionTracker (Singleton)

```typescript
// services/InteractionTracker.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

interface TrackingEvent {
  article_id: string;
  interaction_type: 'impression' | 'view' | 'scroll_stop' | 'click' | 'like' | 'share' | 'bookmark';
  timestamp: number;
  position?: number;
  duration?: number;
  scroll_velocity?: number;
  screen_position?: 'top' | 'middle' | 'bottom';
  viewport_time?: number;
}

class InteractionTracker {
  private static instance: InteractionTracker;
  
  private queue: TrackingEvent[] = [];
  private sessionId: string | null = null;
  private userId: number | null = null;
  private flushTimer: NodeJS.Timeout | null = null;
  
  private readonly BATCH_SIZE = 20;
  private readonly FLUSH_INTERVAL = 30000; // 30 segundos
  private readonly STORAGE_KEY = '@tracking_queue';

  private constructor() {
    this.loadPersistedQueue();
  }

  static getInstance(): InteractionTracker {
    if (!InteractionTracker.instance) {
      InteractionTracker.instance = new InteractionTracker();
    }
    return InteractionTracker.instance;
  }

  async initialize(userId: number, entrySource = 'organic') {
    this.userId = userId;
    
    // Cria sessão no backend
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        device_type: Platform.OS,
        entry_source: entrySource
      })
    });
    
    const { data } = await response.json();
    this.sessionId = data.id;
    
    // Inicia flush timer
    this.startFlushTimer();
    
    console.log('📊 Tracker inicializado:', this.sessionId);
  }

  track(event: Omit<TrackingEvent, 'timestamp'>) {
    if (!this.userId) return;
    
    this.queue.push({
      ...event,
      timestamp: Date.now()
    });
    
    this.persistQueue();
    
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  // Atalhos
  trackImpression(articleId: number, position: number) {
    this.track({ article_id: `news_${articleId}`, interaction_type: 'impression', position });
  }

  trackView(articleId: number, duration: number, screenPosition: 'top' | 'middle' | 'bottom') {
    this.track({ article_id: `news_${articleId}`, interaction_type: 'view', duration, screen_position: screenPosition });
  }

  trackScrollStop(articleId: number, viewportTime: number, scrollVelocity: number) {
    this.track({ article_id: `news_${articleId}`, interaction_type: 'scroll_stop', viewport_time: viewportTime, scroll_velocity: scrollVelocity });
  }

  trackClick(articleId: number, position: number) {
    this.track({ article_id: `news_${articleId}`, interaction_type: 'click', position });
  }

  trackLike(articleId: number) {
    this.track({ article_id: `news_${articleId}`, interaction_type: 'like' });
  }

  trackShare(articleId: number) {
    this.track({ article_id: `news_${articleId}`, interaction_type: 'share' });
  }

  trackBookmark(articleId: number) {
    this.track({ article_id: `news_${articleId}`, interaction_type: 'bookmark' });
  }

  async flush() {
    if (this.queue.length === 0 || !this.userId || !this.sessionId) return;
    
    const batch = [...this.queue];
    this.queue = [];
    this.persistQueue();
    
    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: this.userId,
          session_id: this.sessionId,
          device_type: Platform.OS,
          interactions: batch
        })
      });
      console.log(`📤 Enviados ${batch.length} eventos`);
    } catch (error) {
      // Requeue em caso de erro
      this.queue = [...batch, ...this.queue];
      this.persistQueue();
    }
  }

  async endSession() {
    await this.flush();
    
    if (this.sessionId) {
      await fetch(`/api/sessions/${this.sessionId}/end`, { method: 'PUT' });
      this.sessionId = null;
    }
    
    this.stopFlushTimer();
    console.log('📊 Sessão finalizada');
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }

  private stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private async persistQueue() {
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
  }

  private async loadPersistedQueue() {
    const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
    if (stored) this.queue = JSON.parse(stored);
  }
}

export const tracker = InteractionTracker.getInstance();
```

### Hook useSession

```typescript
// hooks/useSession.ts

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { tracker } from '../services/InteractionTracker';

export function useSession(userId: number | null) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!userId) return;
    
    // Inicializa tracker
    tracker.initialize(userId);

    // Escuta mudanças de estado do app
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App foi para background
        tracker.endSession();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App voltou
        tracker.initialize(userId);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      tracker.endSession();
    };
  }, [userId]);
}
```

### Hook useArticleTracking

```typescript
// hooks/useArticleTracking.ts

import { useEffect, useRef, useCallback } from 'react';
import { tracker } from '../services/InteractionTracker';

export function useArticleTracking(articleId: number, position: number) {
  const impressionTracked = useRef(false);
  const visibleStartTime = useRef<number | null>(null);

  const onVisibilityChange = useCallback((isVisible: boolean) => {
    if (isVisible) {
      // Artigo entrou na viewport
      visibleStartTime.current = Date.now();
      
      // Track impression (apenas uma vez)
      if (!impressionTracked.current) {
        tracker.trackImpression(articleId, position);
        impressionTracked.current = true;
      }
    } else if (visibleStartTime.current) {
      // Artigo saiu da viewport
      const duration = Date.now() - visibleStartTime.current;
      
      // Se ficou mais de 2 segundos, registra scroll_stop
      if (duration > 2000) {
        tracker.trackScrollStop(articleId, duration, 0);
      }
      
      visibleStartTime.current = null;
    }
  }, [articleId, position]);

  // Reset quando articleId muda
  useEffect(() => {
    impressionTracked.current = false;
    visibleStartTime.current = null;
  }, [articleId]);

  return { onVisibilityChange };
}
```

### Hook useClickTracking

```typescript
// hooks/useClickTracking.ts

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { tracker } from '../services/InteractionTracker';

export function useClickTracking(articleId: number, position: number) {
  const trackClick = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    tracker.trackClick(articleId, position);
  }, [articleId, position]);

  const trackLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    tracker.trackLike(articleId);
  }, [articleId]);

  const trackBookmark = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    tracker.trackBookmark(articleId);
  }, [articleId]);

  const trackShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    tracker.trackShare(articleId);
  }, [articleId]);

  return { trackClick, trackLike, trackBookmark, trackShare };
}
```

### Componente ArticleFeed (FlashList)

```tsx
// components/Feed/ArticleFeed.tsx

import { FlashList, ViewToken } from '@shopify/flash-list';
import { useCallback, useState, useRef } from 'react';
import { RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArticleCard } from './ArticleCard';
import { SkeletonCard } from './SkeletonCard';

interface ArticleFeedProps {
  userId: number;
}

export function ArticleFeed({ userId }: ArticleFeedProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  
  const PREFETCH_THRESHOLD = 10;
  const PAGE_SIZE = 30;

  // Carrega mais artigos
  const loadMore = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `/api/feeds/addictive?user_id=${userId}&offset=${offset}&limit=${PAGE_SIZE}`
      );
      const { data } = await response.json();
      setArticles(prev => [...prev, ...data]);
      setOffset(prev => prev + PAGE_SIZE);
    } finally {
      setIsLoading(false);
    }
  }, [offset, isLoading, userId]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    
    try {
      const response = await fetch(
        `/api/feeds/addictive?user_id=${userId}&limit=${PAGE_SIZE}&refresh=true`
      );
      const { data } = await response.json();
      setArticles(data);
      setOffset(PAGE_SIZE);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  // Tracking de visibilidade
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const ids = viewableItems
      .filter(item => item.isViewable)
      .map(item => item.item.id);
    setVisibleIds(ids);
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500
  });

  return (
    <FlashList
      data={articles}
      renderItem={({ item, index }) => (
        <ArticleCard 
          article={item} 
          position={index}
          isVisible={visibleIds.includes(item.id)}
        />
      )}
      estimatedItemSize={320}
      onEndReached={loadMore}
      onEndReachedThreshold={PREFETCH_THRESHOLD / articles.length}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig.current}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#FF3B30"
        />
      }
      ListFooterComponent={isLoading ? <SkeletonCards count={3} /> : null}
      removeClippedSubviews={true}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
    />
  );
}
```

### Componente ArticleCard

```tsx
// components/Feed/ArticleCard.tsx

import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useEffect } from 'react';
import { useClickTracking } from '../../hooks/useClickTracking';
import { useArticleTracking } from '../../hooks/useArticleTracking';
import { UrgencyBadge } from './UrgencyBadge';
import { ActionButton } from '../Actions/ActionButton';

interface ArticleCardProps {
  article: Article;
  position: number;
  isVisible: boolean;
  onPress?: () => void;
}

export function ArticleCard({ article, position, isVisible, onPress }: ArticleCardProps) {
  const { trackClick, trackLike, trackBookmark, trackShare } = useClickTracking(article.id, position);
  const { onVisibilityChange } = useArticleTracking(article.id, position);

  // Notifica mudança de visibilidade
  useEffect(() => {
    onVisibilityChange(isVisible);
  }, [isVisible, onVisibilityChange]);

  const handlePress = () => {
    trackClick();
    onPress?.();
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: position * 50 }}
      style={styles.card}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.95}>
        {/* Imagem */}
        {article.image_url && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: article.image_url }} style={styles.image} />
            
            {/* Badge de urgência */}
            {article.display?.urgency_badge && (
              <View style={styles.badgeOverlay}>
                <UrgencyBadge 
                  text={article.display.urgency_badge}
                  color={article.display.urgency_color}
                />
              </View>
            )}
          </View>
        )}

        {/* Conteúdo */}
        <View style={styles.content}>
          <View style={styles.meta}>
            <Text style={styles.source}>{article.site_name}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.time}>{article.display?.time_ago}</Text>
          </View>

          <Text style={styles.title} numberOfLines={3}>
            {article.title}
          </Text>

          {/* Ações */}
          <View style={styles.actions}>
            <ActionButton
              icon="star"
              isActive={article.is_liked}
              activeColor="#FFD60A"
              onPress={trackLike}
            />
            <ActionButton
              icon="bookmark"
              isActive={article.is_bookmarked}
              activeColor="#007AFF"
              onPress={trackBookmark}
            />
            <ActionButton
              icon="share"
              onPress={trackShare}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Indicador de descoberta */}
      {article.is_wildcard && (
        <View style={styles.discoveryBadge}>
          <Text style={styles.discoveryText}>💡 Pra você</Text>
        </View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141416',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  content: {
    padding: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  source: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  dot: {
    marginHorizontal: 6,
    color: '#636366',
  },
  time: {
    fontSize: 12,
    color: '#A1A1A6',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  discoveryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(175,82,222,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discoveryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
```

### Componente UrgencyBadge

```tsx
// components/Feed/UrgencyBadge.tsx

import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

interface UrgencyBadgeProps {
  text: string;
  color: string;
  pulse?: boolean;
}

export function UrgencyBadge({ text, color, pulse = false }: UrgencyBadgeProps) {
  const Wrapper = pulse ? PulsingWrapper : View;
  
  return (
    <Wrapper style={[styles.badge, { backgroundColor: `${color}20`, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </Wrapper>
  );
}

function PulsingWrapper({ children, style }: any) {
  return (
    <MotiView
      from={{ scale: 1, opacity: 1 }}
      animate={{ scale: 1.05, opacity: 0.9 }}
      transition={{ type: 'timing', duration: 800, loop: true }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
```

### Componente ActionButton (Animado)

```tsx
// components/Actions/ActionButton.tsx

import { TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonProps {
  icon: 'star' | 'bookmark' | 'share';
  isActive?: boolean;
  activeColor?: string;
  onPress: () => void;
}

const ICONS = {
  star: { outline: 'star-outline', filled: 'star' },
  bookmark: { outline: 'bookmark-outline', filled: 'bookmark' },
  share: { outline: 'share-outline', filled: 'share-outline' },
};

export function ActionButton({ icon, isActive, activeColor, onPress }: ActionButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handlePress = () => {
    setIsAnimating(true);
    onPress();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const iconName = isActive ? ICONS[icon].filled : ICONS[icon].outline;
  const iconColor = isActive ? activeColor : '#636366';

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button}>
      <MotiView
        animate={{
          scale: isAnimating ? [1, 0.8, 1.2, 1] : 1,
        }}
        transition={{ type: 'timing', duration: 300 }}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
      </MotiView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
```

### Componente SkeletonCard

```tsx
// components/Feed/SkeletonCard.tsx

import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';

export function SkeletonCard() {
  return (
    <MotiView style={styles.card}>
      <Skeleton colorMode="dark" width="100%" height={180} radius={12} />
      <View style={styles.content}>
        <Skeleton colorMode="dark" width="30%" height={14} radius={4} />
        <Skeleton colorMode="dark" width="100%" height={18} radius={4} />
        <Skeleton colorMode="dark" width="80%" height={18} radius={4} />
        <View style={styles.actions}>
          <Skeleton colorMode="dark" width={24} height={24} radius={12} />
          <Skeleton colorMode="dark" width={24} height={24} radius={12} />
          <Skeleton colorMode="dark" width={24} height={24} radius={12} />
        </View>
      </View>
    </MotiView>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141416',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
});
```

### Uso no App Principal

```tsx
// App.tsx ou _layout.tsx

import { useSession } from './hooks/useSession';
import { useAuth } from './hooks/useAuth';
import { ArticleFeed } from './components/Feed/ArticleFeed';

export default function App() {
  const { user } = useAuth();

  // Inicializa tracking
  useSession(user?.id);

  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="ParaVoce">
          {() => <ArticleFeed userId={user.id} />}
        </Tab.Screen>
        <Tab.Screen name="Agora" component={ChronologicalFeed} />
        <Tab.Screen name="Salvos" component={BookmarksScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

---

## 📦 Dependências Necessárias

```bash
# Core
npm install @shopify/flash-list
npm install moti
npm install expo-haptics

# Armazenamento
npm install @react-native-async-storage/async-storage

# UUID
npm install uuid
npm install --save-dev @types/uuid

# Ícones
npm install @expo/vector-icons

# Animações (se não usar Expo)
npm install react-native-reanimated
```

---

## 🎯 Checklist de Implementação

### Essencial (MVP)

- [ ] Criar/buscar usuário no primeiro acesso
- [ ] Salvar `user_id` localmente (AsyncStorage/SecureStore)
- [ ] Implementar onboarding com seleção de categorias (mínimo 3)
- [ ] Tab "Para Você" com `/api/feeds/addictive`
- [ ] Tab "Agora" com `/api/feed` (cronológico)
- [ ] Scroll infinito com `/api/feeds/addictive/more`
- [ ] Ações do card: ⭐ Like, 🔖 Bookmark, ↗️ Share
- [ ] Tracking básico: impressions + clicks + likes

### Engajamento (Alta Prioridade)

- [ ] Implementar sistema de sessões (start/end)
- [ ] Tracking completo (scroll_stop, view, viewport_time)
- [ ] Badges de urgência (URGENTE, AGORA, NOVO, Descoberta)
- [ ] Pull-to-refresh com animação satisfatória
- [ ] Haptic feedback nas ações
- [ ] Estados visuais (lido/não lido, liked, saved)

### Visual & UX

- [ ] Dark mode como padrão
- [ ] Skeleton loading com shimmer
- [ ] Animações de entrada dos cards (fade + slide)
- [ ] Animação de bounce nos botões de ação
- [ ] Empty states bonitos
- [ ] Error states com retry

### Avançado

- [ ] WebSocket para notícias em tempo real
- [ ] Push notifications baseadas em comportamento
- [ ] Usar predição de clique para destacar artigos
- [ ] Tela de perfil com estatísticas

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
| 4.0.0 | 2025-12-11 | Implementação React Native completa: hooks, componentes, tracking, animações |
| 3.0.0 | 2025-12-11 | Estrutura do app, design visual, ações do card (like/bookmark/share), badges de urgência |
| 2.0.0 | 2025-12-11 | Feed viciante, sistema de aprendizado, sessões |
| 1.0.0 | 2025-12-10 | Versão inicial |

