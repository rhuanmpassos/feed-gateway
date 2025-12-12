# 📡 API Reference

> Documentação completa das APIs do Feed Gateway com exemplos reais

---

## Base URL

```
Produção: https://feed-gateway.onrender.com
Local:    http://localhost:3001
```

## Headers

```http
Content-Type: application/json
```

---

## Índice

1. [Autenticação JWT](#autenticação-jwt)
2. [Usuários](#usuários)
3. [Feeds](#feeds)
4. [Artigos](#artigos)
5. [Interações](#interações)
6. [Sessões](#sessões)
7. [Bookmarks](#bookmarks)
8. [Perfil do Usuário](#perfil-do-usuário)
9. [Categorias](#categorias)

---

## Autenticação JWT

O sistema utiliza autenticação via JWT (JSON Web Tokens). Após login/registro, o token deve ser enviado em todas as requisições autenticadas.

### Header de Autenticação

```http
Authorization: Bearer <token>
```

---

### POST /api/auth/register

Registra um novo usuário.

**Request:**
```json
{
  "email": "usuario@email.com",
  "password": "senhaSegura123",
  "name": "João Silva"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "usuario@email.com",
      "name": "João Silva",
      "created_at": "2025-12-11T22:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Erros:**
| Código | Descrição |
|--------|-----------|
| 400 | Email ou senha faltando / Senha muito curta (< 6 caracteres) |
| 400 | Email já cadastrado |

---

### POST /api/auth/login

Autentica um usuário existente.

**Request:**
```json
{
  "email": "usuario@email.com",
  "password": "senhaSegura123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "usuario@email.com",
      "name": "João Silva",
      "created_at": "2025-12-11T22:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Erros:**
| Código | Descrição |
|--------|-----------|
| 400 | Email ou senha faltando |
| 401 | Email ou senha incorretos |

---

### GET /api/auth/me

Retorna dados do usuário autenticado.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "usuario@email.com",
    "name": "João Silva",
    "created_at": "2025-12-11T22:00:00.000Z"
  }
}
```

---

### POST /api/auth/refresh

Renova o token JWT.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### PUT /api/auth/password

Atualiza a senha do usuário autenticado.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "currentPassword": "senhaAntiga123",
  "newPassword": "senhaNova456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Senha atualizada com sucesso"
}
```

**Erros:**
| Código | Descrição |
|--------|-----------|
| 400 | Campos faltando / Nova senha muito curta |
| 401 | Senha atual incorreta |

---

## Usuários

### POST /api/users

Cria ou busca usuário por email (endpoint legado, sem autenticação).

**Request:**
```json
{
  "email": "usuario@email.com",
  "name": "João Silva"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "usuario@email.com",
    "name": "João Silva",
    "created_at": "2025-12-11T22:00:00.000Z"
  },
  "isNew": true
}
```

**Response (200) - Usuário já existe:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "usuario@email.com",
    "name": "João Silva",
    "created_at": "2025-11-26T10:00:00.000Z"
  },
  "isNew": false
}
```

---

### GET /api/users/email/:email

Busca usuário por email.

**Request:**
```
GET /api/users/email/usuario@email.com
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "usuario@email.com",
    "name": "João Silva",
    "created_at": "2025-11-26T10:00:00.000Z"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Usuário não encontrado"
}
```

---

## Feeds

### GET /api/feeds/addictive

**Descrição:** Feed personalizado pelo algoritmo de recomendação.

**Query Parameters:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| user_id | number | ✅ | ID do usuário |
| limit | number | ❌ | Quantidade (default: 50) |
| offset | number | ❌ | Paginação (default: 0) |
| refresh | boolean | ❌ | Forçar refresh (default: false) |

**Request:**
```
GET /api/feeds/addictive?user_id=123&limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "Congresso aprova reforma tributária em votação histórica",
      "summary": "A Câmara dos Deputados aprovou nesta terça-feira...",
      "url": "https://g1.globo.com/politica/noticia/2025/12/11/congresso-aprova...",
      "image_url": "https://s2.glbimg.com/abc123.jpg",
      "source_name": "G1",
      "source_url": "https://g1.globo.com",
      "published_at": "2025-12-11T21:30:00.000Z",
      "category_id": 1,
      "category_name": "Política",
      "is_breaking": true,
      "score": 0.95,
      "display_metadata": {
        "is_breaking": true,
        "is_trending": false,
        "time_ago_text": "5 min",
        "sentiment": "neutral",
        "predicted_click_probability": 0.87
      }
    },
    {
      "id": "def456",
      "title": "Bitcoin atinge nova máxima histórica após anúncio do Fed",
      "summary": "A criptomoeda mais valiosa do mundo superou...",
      "url": "https://infomoney.com.br/mercados/bitcoin...",
      "image_url": "https://images.infomoney.com.br/def456.jpg",
      "source_name": "InfoMoney",
      "source_url": "https://infomoney.com.br",
      "published_at": "2025-12-11T21:15:00.000Z",
      "category_id": 2,
      "category_name": "Economia",
      "is_breaking": false,
      "score": 0.82,
      "display_metadata": {
        "is_breaking": false,
        "is_trending": true,
        "time_ago_text": "15 min",
        "sentiment": "positive",
        "predicted_click_probability": 0.75
      }
    },
    {
      "id": "ghi789",
      "title": "Como a Finlândia se tornou líder mundial em educação",
      "summary": "O país nórdico revolucionou seu sistema educacional...",
      "url": "https://bbc.com/portuguese/artigos/ghi789",
      "image_url": "https://ichef.bbci.co.uk/ghi789.jpg",
      "source_name": "BBC Brasil",
      "source_url": "https://bbc.com/portuguese",
      "published_at": "2025-12-11T20:00:00.000Z",
      "category_id": 8,
      "category_name": "Educação",
      "is_breaking": false,
      "is_wildcard": true,
      "score": 0.65,
      "display_metadata": {
        "is_breaking": false,
        "is_trending": false,
        "is_wildcard": true,
        "time_ago_text": "1h",
        "sentiment": "positive",
        "predicted_click_probability": 0.45
      }
    }
  ],
  "count": 3,
  "feed_type": "addictive"
}
```

**Lógica do Score:**
- Artigos são ranqueados por um score calculado pelo `EngagementFeedService`
- Score considera: categoria preferida, recência, breaking news, wildcards, predição de clique
- Wildcards (5-10% do feed) são artigos fora das preferências para descoberta

---

### GET /api/feed

**Descrição:** Feed cronológico (mais recentes primeiro).

**Query Parameters:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| limit | number | ❌ | Quantidade (default: 50) |
| offset | number | ❌ | Paginação (default: 0) |
| category_id | number | ❌ | Filtrar por categoria |

**Request:**
```
GET /api/feed?limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "xyz999",
      "title": "Apple anuncia novo MacBook Pro com chip M4",
      "summary": "A gigante de tecnologia revelou hoje...",
      "url": "https://techcrunch.com/2025/12/11/apple-m4-macbook...",
      "image_url": "https://techcrunch.com/wp-content/uploads/xyz999.jpg",
      "source_name": "TechCrunch",
      "source_url": "https://techcrunch.com",
      "published_at": "2025-12-11T21:45:00.000Z",
      "category_id": 4,
      "category_name": "Tecnologia"
    },
    {
      "id": "abc123",
      "title": "Congresso aprova reforma tributária...",
      "published_at": "2025-12-11T21:30:00.000Z"
    }
  ],
  "count": 2,
  "total": 1542,
  "has_more": true
}
```

---

### GET /api/feeds/breaking

**Descrição:** Notícias urgentes (últimas 2 horas com is_breaking=true).

**Query Parameters:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| limit | number | ❌ | Quantidade (default: 10) |

**Request:**
```
GET /api/feeds/breaking?limit=5
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "Congresso aprova reforma tributária em votação histórica",
      "summary": "A Câmara dos Deputados aprovou...",
      "url": "https://g1.globo.com/...",
      "source_name": "G1",
      "published_at": "2025-12-11T21:30:00.000Z",
      "is_breaking": true,
      "time_ago_text": "5 min"
    },
    {
      "id": "bre456",
      "title": "Dólar dispara e atinge R$ 6,15 após decisão do Copom",
      "summary": "A moeda americana subiu 2,3%...",
      "url": "https://folha.uol.com.br/...",
      "source_name": "Folha de S.Paulo",
      "published_at": "2025-12-11T21:15:00.000Z",
      "is_breaking": true,
      "time_ago_text": "20 min"
    }
  ],
  "count": 2,
  "feed_type": "breaking"
}
```

---

### GET /api/feeds/predict

**Descrição:** Artigos com maior probabilidade de clique para o usuário.

**Query Parameters:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| user_id | number | ✅ | ID do usuário |
| limit | number | ❌ | Quantidade (default: 10) |

**Request:**
```
GET /api/feeds/predict?user_id=123&limit=5
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "article_id": "abc123",
      "title": "Congresso aprova reforma tributária...",
      "click_probability": 0.92,
      "reasons": [
        "Categoria preferida: Política",
        "Contém palavra-chave: 'reforma'",
        "Breaking news"
      ]
    },
    {
      "article_id": "def456",
      "title": "Bitcoin atinge nova máxima...",
      "click_probability": 0.85,
      "reasons": [
        "Histórico de cliques em Economia",
        "Horário preferido do usuário"
      ]
    }
  ],
  "count": 2,
  "feed_type": "prediction"
}
```

---

## Artigos

### GET /api/articles/:id

**Descrição:** Detalhes de um artigo específico.

**Request:**
```
GET /api/articles/abc123
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "Congresso aprova reforma tributária em votação histórica",
    "summary": "A Câmara dos Deputados aprovou nesta terça-feira a reforma tributária após meses de negociação entre governo e oposição.",
    "content": null,
    "url": "https://g1.globo.com/politica/noticia/2025/12/11/congresso-aprova...",
    "image_url": "https://s2.glbimg.com/abc123.jpg",
    "source_id": 1,
    "source_name": "G1",
    "source_url": "https://g1.globo.com",
    "category_id": 1,
    "category_name": "Política",
    "published_at": "2025-12-11T21:30:00.000Z",
    "created_at": "2025-12-11T21:31:15.000Z",
    "is_breaking": true,
    "view_count": 1542,
    "like_count": 234,
    "bookmark_count": 89
  }
}
```

---

### POST /api/articles/:id/like

**Descrição:** Curtir um artigo.

**Request:**
```
POST /api/articles/abc123/like
Content-Type: application/json

{
  "user_id": 123
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Artigo curtido com sucesso",
  "data": {
    "article_id": "abc123",
    "liked": true,
    "like_count": 235
  }
}
```

---

### DELETE /api/articles/:id/like

**Descrição:** Remover curtida de um artigo.

**Request:**
```
DELETE /api/articles/abc123/like
Content-Type: application/json

{
  "user_id": 123
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Curtida removida com sucesso",
  "data": {
    "article_id": "abc123",
    "liked": false,
    "like_count": 234
  }
}
```

---

### GET /api/articles/liked

**Descrição:** Lista de artigos curtidos pelo usuário.

**Query Parameters:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| user_id | number | ✅ | ID do usuário |
| limit | number | ❌ | Quantidade (default: 50) |

**Request:**
```
GET /api/articles/liked?user_id=123&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "Congresso aprova reforma tributária...",
      "source_name": "G1",
      "liked_at": "2025-12-11T21:35:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Interações

### POST /api/interactions/batch

**Descrição:** Enviar lote de interações do usuário.

**Request:**
```json
{
  "user_id": 123,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_type": "ios",
  "interactions": [
    {
      "article_id": "abc123",
      "interaction_type": "impression",
      "timestamp": 1702329600000,
      "position": 0,
      "screen_position": "top"
    },
    {
      "article_id": "abc123",
      "interaction_type": "scroll_stop",
      "timestamp": 1702329605000,
      "duration": 2500,
      "viewport_time": 2500,
      "scroll_velocity": 0
    },
    {
      "article_id": "abc123",
      "interaction_type": "click",
      "timestamp": 1702329608000,
      "position": 0
    },
    {
      "article_id": "abc123",
      "interaction_type": "view",
      "timestamp": 1702329668000,
      "duration": 60
    },
    {
      "article_id": "abc123",
      "interaction_type": "like",
      "timestamp": 1702329670000
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Interações registradas com sucesso",
  "data": {
    "processed": 5,
    "failed": 0
  }
}
```

**Tipos de Interação:**
| Tipo | Descrição | Dados Extras |
|------|-----------|--------------|
| `impression` | Card apareceu na tela | position, screen_position |
| `scroll_stop` | Usuário parou no card | duration, viewport_time |
| `click` | Tocou para abrir | position |
| `view` | Fechou artigo | duration |
| `like` | Curtiu | - |
| `bookmark` | Salvou | - |
| `share` | Compartilhou | - |

---

### POST /api/interactions

**Descrição:** Enviar interação única.

**Request:**
```json
{
  "user_id": 123,
  "article_id": "abc123",
  "interaction_type": "click",
  "duration": null,
  "position": 0
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Interação registrada"
}
```

---

## Sessões

### POST /api/sessions

**Descrição:** Iniciar nova sessão do usuário.

**Request:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": 123,
  "device_type": "ios",
  "is_first_session": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 123,
    "start_time": "2025-12-11T22:00:00.000Z",
    "device_type": "ios",
    "is_first_session": false
  }
}
```

---

### PUT /api/sessions/:id/end

**Descrição:** Finalizar sessão.

**Request:**
```json
{
  "duration_seconds": 342
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "end_time": "2025-12-11T22:05:42.000Z",
    "duration_seconds": 342
  }
}
```

---

### GET /api/sessions/user/:userId

**Descrição:** Histórico de sessões do usuário.

**Request:**
```
GET /api/sessions/user/123?limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "start_time": "2025-12-11T22:00:00.000Z",
      "end_time": "2025-12-11T22:05:42.000Z",
      "duration_seconds": 342,
      "device_type": "ios"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "start_time": "2025-12-11T18:00:00.000Z",
      "end_time": "2025-12-11T18:15:30.000Z",
      "duration_seconds": 930,
      "device_type": "ios"
    }
  ],
  "count": 2
}
```

---

## Bookmarks

### POST /api/bookmarks

**Descrição:** Salvar artigo.

**Request:**
```json
{
  "user_id": 123,
  "article_id": "abc123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Artigo salvo com sucesso",
  "data": {
    "id": 456,
    "user_id": 123,
    "article_id": "abc123",
    "created_at": "2025-12-11T22:10:00.000Z"
  }
}
```

---

### DELETE /api/bookmarks/:id

**Descrição:** Remover bookmark.

**Request:**
```
DELETE /api/bookmarks/456
```

**Response (200):**
```json
{
  "success": true,
  "message": "Bookmark removido"
}
```

---

### GET /api/bookmarks

**Descrição:** Lista de artigos salvos.

**Query Parameters:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| user_id | number | ✅ | ID do usuário |
| limit | number | ❌ | Quantidade (default: 50) |
| offset | number | ❌ | Paginação (default: 0) |

**Request:**
```
GET /api/bookmarks?user_id=123&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "bookmark_id": 456,
      "article": {
        "id": "abc123",
        "title": "Congresso aprova reforma tributária...",
        "summary": "A Câmara dos Deputados aprovou...",
        "image_url": "https://s2.glbimg.com/abc123.jpg",
        "source_name": "G1",
        "published_at": "2025-12-11T21:30:00.000Z"
      },
      "saved_at": "2025-12-11T22:10:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Perfil do Usuário

### GET /api/users/:id/profile

**Descrição:** Perfil resumido do usuário (estatísticas e thresholds).

**Request:**
```
GET /api/users/123/profile
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "total_clicks": 127,
    "total_sessions": 34,
    "total_days_active": 15,
    "first_interaction_at": "2025-11-26T10:00:00.000Z",
    "last_active_at": "2025-12-11T22:00:00.000Z",
    "has_enough_clicks_for_triggers": true,
    "has_enough_days_for_temporal": false,
    "has_enough_interactions_for_prediction": true
  }
}
```

---

### GET /api/users/:id/profile/full

**Descrição:** Perfil completo com padrões detectados.

**Request:**
```
GET /api/users/123/profile/full
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "total_clicks": 127,
    "total_sessions": 34,
    "temporal_patterns": {
      "preferred_hours": [8, 12, 19, 21],
      "preferred_days": [1, 2, 3, 4, 5],
      "avg_session_duration": 285
    },
    "emotional_triggers": {
      "responds_to_urgency": true,
      "responds_to_breaking": true,
      "responds_to_positive": false
    },
    "high_affinity_keywords": [
      { "keyword": "reforma", "affinity": 0.85 },
      { "keyword": "economia", "affinity": 0.78 },
      { "keyword": "tecnologia", "affinity": 0.72 }
    ],
    "preferred_categories": [
      { "category_id": 1, "name": "Política", "affinity": 0.9 },
      { "category_id": 2, "name": "Economia", "affinity": 0.8 }
    ]
  }
}
```

---

### GET /api/users/:id/patterns

**Descrição:** Padrões de comportamento detectados.

**Request:**
```
GET /api/users/123/patterns
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "temporal": {
      "most_active_hour": 21,
      "most_active_day": "Wednesday",
      "avg_session_duration_seconds": 285,
      "sessions_per_week": 12
    },
    "content": {
      "preferred_categories": ["Política", "Economia", "Tecnologia"],
      "avg_read_time_seconds": 45,
      "scroll_behavior": "fast"
    },
    "engagement": {
      "like_rate": 0.15,
      "bookmark_rate": 0.08,
      "share_rate": 0.02,
      "click_through_rate": 0.35
    }
  }
}
```

---

### PUT /api/users/:id/preferences

**Descrição:** Atualizar preferências de categorias.

**Request:**
```json
{
  "category_ids": [1, 2, 4, 7]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Preferências atualizadas",
  "data": {
    "categories": [
      { "id": 1, "name": "Política" },
      { "id": 2, "name": "Economia" },
      { "id": 4, "name": "Tecnologia" },
      { "id": 7, "name": "Ciência" }
    ]
  }
}
```

---

## Categorias

### GET /api/categories

**Descrição:** Lista todas as categorias disponíveis.

**Request:**
```
GET /api/categories
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Política", "slug": "politica", "icon": "🏛️" },
    { "id": 2, "name": "Economia", "slug": "economia", "icon": "💰" },
    { "id": 3, "name": "Esportes", "slug": "esportes", "icon": "⚽" },
    { "id": 4, "name": "Tecnologia", "slug": "tecnologia", "icon": "💻" },
    { "id": 5, "name": "Entretenimento", "slug": "entretenimento", "icon": "🎬" },
    { "id": 6, "name": "Mundo", "slug": "mundo", "icon": "🌍" },
    { "id": 7, "name": "Ciência", "slug": "ciencia", "icon": "🔬" },
    { "id": 8, "name": "Educação", "slug": "educacao", "icon": "📚" },
    { "id": 9, "name": "Saúde", "slug": "saude", "icon": "🏥" },
    { "id": 10, "name": "Negócios", "slug": "negocios", "icon": "💼" }
  ],
  "count": 10
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

### Formato de Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email é obrigatório",
    "details": {
      "field": "email",
      "received": null
    }
  }
}
```

