# 🧠 Sistema de Recomendação

> Como funciona o algoritmo de personalização do feed

---

## Visão Geral

O sistema de recomendação usa uma combinação de:

1. **Content-Based Filtering** - Baseado no histórico individual do usuário
2. **Recency Boost** - Notícias mais recentes têm prioridade
3. **Breaking News Priority** - Urgentes aparecem primeiro
4. **Wildcard Injection** - Artigos fora do perfil para descoberta
5. **Engagement Prediction** - ML para prever probabilidade de clique

---

## Fluxo do Algoritmo

```
┌─────────────────────────────────────────────────────────────────┐
│                     GET /feeds/addictive                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. BUSCAR PERFIL DO USUÁRIO                                    │
│     - Categorias preferidas                                     │
│     - Keywords de afinidade                                     │
│     - Padrões temporais                                         │
│     - Gatilhos emocionais                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. BUSCAR CANDIDATOS                                           │
│     - Artigos das últimas 48 horas                              │
│     - Não vistos pelo usuário                                   │
│     - Limite: 200 candidatos                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. CALCULAR SCORE POR ARTIGO                                   │
│     score = base_score                                          │
│           + category_affinity * 0.3                             │
│           + keyword_match * 0.2                                 │
│           + recency_boost * 0.2                                 │
│           + breaking_boost * 0.15                               │
│           + predicted_ctr * 0.15                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. ORDENAR E DIVERSIFICAR                                      │
│     - Sort by score DESC                                        │
│     - Evitar mesma fonte consecutiva                            │
│     - Evitar mesma categoria 3x seguidas                        │
│     - Injetar 5-10% wildcards                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. RETORNAR FEED                                               │
│     - Breaking news no topo (se houver)                         │
│     - Artigos ranqueados                                        │
│     - Wildcards intercalados                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cálculo de Score

### Fórmula Completa

```javascript
function calculateScore(article, userProfile) {
  let score = 0.5; // Base score

  // 1. Afinidade de categoria (0-0.3)
  if (userProfile.preferred_categories.includes(article.category_id)) {
    const categoryAffinity = getCategoryAffinity(userProfile, article.category_id);
    score += categoryAffinity * 0.3;
  }

  // 2. Match de keywords (0-0.2)
  const keywordScore = calculateKeywordMatch(article, userProfile.high_affinity_keywords);
  score += keywordScore * 0.2;

  // 3. Boost de recência (0-0.2)
  const hoursAgo = getHoursAgo(article.published_at);
  const recencyBoost = Math.max(0, 1 - (hoursAgo / 48)); // Decay em 48h
  score += recencyBoost * 0.2;

  // 4. Boost de breaking (0-0.15)
  if (article.is_breaking) {
    score += 0.15;
  }

  // 5. Predição de CTR (0-0.15)
  if (userProfile.has_enough_interactions_for_prediction) {
    const predictedCTR = predictClickProbability(article, userProfile);
    score += predictedCTR * 0.15;
  }

  // 6. Penalidades
  if (userProfile.recently_seen_sources.includes(article.source_id)) {
    score -= 0.1; // Diversidade de fonte
  }

  return Math.min(1, Math.max(0, score));
}
```

### Pesos

| Fator | Peso | Descrição |
|-------|------|-----------|
| Category Affinity | 30% | Quanto o usuário gosta da categoria |
| Keyword Match | 20% | Keywords do título/summary vs histórico |
| Recency | 20% | Quão recente é o artigo |
| Breaking | 15% | É notícia urgente? |
| Predicted CTR | 15% | ML de probabilidade de clique |

---

## Perfil do Usuário

### Estrutura

```typescript
interface UserProfile {
  user_id: number;
  
  // Thresholds
  has_enough_clicks_for_triggers: boolean;  // >= 50 cliques
  has_enough_days_for_temporal: boolean;    // >= 14 dias
  has_enough_interactions_for_prediction: boolean; // >= 100 interações
  
  // Preferências calculadas
  preferred_categories: CategoryAffinity[];
  high_affinity_keywords: KeywordAffinity[];
  
  // Padrões temporais
  temporal_patterns: {
    preferred_hours: number[];    // [8, 12, 19, 21]
    preferred_days: number[];     // [1, 2, 3, 4, 5] (seg-sex)
    avg_session_duration: number; // segundos
  };
  
  // Gatilhos emocionais
  emotional_triggers: {
    responds_to_urgency: boolean;
    responds_to_breaking: boolean;
    responds_to_positive: boolean;
    responds_to_negative: boolean;
  };
  
  // Embedding do perfil (para similaridade)
  profile_embedding: number[]; // 384 dimensões
}
```

### Cálculo de Afinidade de Categoria

```sql
SELECT 
  category_id,
  COUNT(*) as total_clicks,
  COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () as affinity
FROM user_interactions ui
JOIN articles a ON ui.article_id = a.id
WHERE ui.user_id = $1 
  AND ui.interaction_type = 'click'
  AND ui.created_at > NOW() - INTERVAL '30 days'
GROUP BY category_id
ORDER BY affinity DESC;
```

### Cálculo de Keywords de Afinidade

```sql
-- Extrai keywords dos títulos clicados e calcula frequência
WITH clicked_titles AS (
  SELECT a.title
  FROM user_interactions ui
  JOIN articles a ON ui.article_id = a.id
  WHERE ui.user_id = $1 AND ui.interaction_type = 'click'
)
SELECT 
  keyword,
  COUNT(*) as frequency,
  COUNT(*) * 1.0 / (SELECT COUNT(*) FROM clicked_titles) as affinity
FROM clicked_titles, unnest(extract_keywords(title)) as keyword
GROUP BY keyword
HAVING COUNT(*) >= 3
ORDER BY affinity DESC
LIMIT 50;
```

---

## Wildcards (Descoberta)

### O que são?

Wildcards são artigos **fora das preferências** do usuário, inseridos para:
- Evitar "filter bubble"
- Descobrir novos interesses
- Manter o feed surpreendente

### Regras

```javascript
const WILDCARD_CONFIG = {
  percentage: 0.08,        // 8% do feed
  min_quality_score: 0.6,  // Só artigos de qualidade
  exclude_categories: [],  // Categorias que o usuário rejeitou ativamente
  prefer_trending: true,   // Preferir artigos populares
};

function selectWildcards(allArticles, userProfile, count) {
  return allArticles
    .filter(a => !userProfile.preferred_categories.includes(a.category_id))
    .filter(a => a.quality_score >= WILDCARD_CONFIG.min_quality_score)
    .sort((a, b) => b.view_count - a.view_count) // Trending
    .slice(0, count);
}
```

### Posicionamento

```javascript
function interlaceWildcards(rankedFeed, wildcards) {
  const result = [...rankedFeed];
  const positions = [5, 12, 20, 30]; // Posições fixas
  
  wildcards.forEach((wildcard, i) => {
    if (positions[i] < result.length) {
      wildcard.is_wildcard = true;
      result.splice(positions[i], 0, wildcard);
    }
  });
  
  return result;
}
```

---

## Predição de Clique (ML)

### Features Usadas

```javascript
const PREDICTION_FEATURES = [
  // Usuário
  'user_category_affinity',      // Afinidade com categoria
  'user_source_affinity',        // Afinidade com fonte
  'user_keyword_matches',        // Keywords do título no histórico
  'user_hour_preference',        // É horário preferido?
  'user_day_preference',         // É dia preferido?
  
  // Artigo
  'article_recency_hours',       // Horas desde publicação
  'article_is_breaking',         // É urgente?
  'article_title_length',        // Comprimento do título
  'article_has_image',           // Tem imagem?
  'article_source_credibility',  // Score da fonte
  
  // Contexto
  'session_articles_seen',       // Quantos já viu na sessão
  'session_duration_minutes',    // Quanto tempo na sessão
  'position_in_feed',            // Posição no feed
];
```

### Modelo Simples (Heurístico)

```javascript
function predictClickProbability(article, userProfile, context) {
  let probability = 0.3; // Base
  
  // Categoria preferida
  if (userProfile.preferred_categories.includes(article.category_id)) {
    probability += 0.25;
  }
  
  // Fonte preferida
  if (userProfile.preferred_sources?.includes(article.source_id)) {
    probability += 0.15;
  }
  
  // Keywords match
  const keywordMatch = countKeywordMatches(article.title, userProfile.high_affinity_keywords);
  probability += Math.min(keywordMatch * 0.05, 0.2);
  
  // Breaking news + usuário responde a urgência
  if (article.is_breaking && userProfile.emotional_triggers?.responds_to_urgency) {
    probability += 0.2;
  }
  
  // Horário preferido
  const currentHour = new Date().getHours();
  if (userProfile.temporal_patterns?.preferred_hours?.includes(currentHour)) {
    probability += 0.1;
  }
  
  // Decay por posição
  probability *= Math.exp(-context.position * 0.02);
  
  return Math.min(1, probability);
}
```

---

## Thresholds de Ativação

### Quando cada feature é ativada

| Feature | Threshold | Razão |
|---------|-----------|-------|
| Category Affinity | 10 cliques | Mínimo para ter dados |
| Keyword Affinity | 30 cliques | Precisa de volume |
| Temporal Patterns | 14 dias | 2 semanas de uso |
| Emotional Triggers | 50 cliques | Padrão estatístico |
| Click Prediction | 100 interações | Dados suficientes |
| Profile Embedding | 20 cliques | Embedding significativo |

### Verificação

```javascript
function checkUserThresholds(stats) {
  return {
    has_enough_clicks_for_triggers: stats.total_clicks >= 50,
    has_enough_days_for_temporal: stats.days_active >= 14,
    has_enough_interactions_for_prediction: stats.total_interactions >= 100,
    has_enough_sessions_for_push: stats.total_sessions >= 10,
  };
}
```

---

## Atualização do Perfil

### Quando atualizar

| Trigger | Ação |
|---------|------|
| Novo clique | Incrementar contadores |
| A cada 10 cliques | Recalcular keywords |
| Diariamente | Recalcular temporal patterns |
| A cada 50 cliques | Recalcular embedding |

### Job de Atualização

```javascript
// Executado após batch de interações
async function updateUserProfile(userId, interactions) {
  const clickInteractions = interactions.filter(i => i.interaction_type === 'click');
  
  if (clickInteractions.length === 0) return;
  
  // Atualizar contadores
  await incrementClickCount(userId, clickInteractions.length);
  
  const stats = await getUserStats(userId);
  
  // Recalcular keywords se threshold
  if (stats.total_clicks % 10 === 0) {
    await recalculateKeywordAffinity(userId);
  }
  
  // Recalcular embedding se threshold
  if (stats.total_clicks % 50 === 0) {
    await recalculateProfileEmbedding(userId);
  }
}
```

---

## Diversificação

### Evitar Repetição

```javascript
function diversifyFeed(rankedArticles) {
  const result = [];
  const recentSources = [];
  const recentCategories = [];
  
  for (const article of rankedArticles) {
    // Evitar mesma fonte 2x seguidas
    if (recentSources.slice(-1)[0] === article.source_id) {
      continue;
    }
    
    // Evitar mesma categoria 3x seguidas
    if (recentCategories.slice(-2).every(c => c === article.category_id)) {
      continue;
    }
    
    result.push(article);
    recentSources.push(article.source_id);
    recentCategories.push(article.category_id);
  }
  
  return result;
}
```

---

## Métricas de Sucesso

### KPIs do Algoritmo

| Métrica | Descrição | Meta |
|---------|-----------|------|
| CTR | Click-through rate | > 25% |
| Time on Article | Tempo médio lendo | > 30s |
| Session Duration | Duração da sessão | > 5 min |
| Return Rate | Taxa de retorno diário | > 40% |
| Wildcard CTR | Cliques em wildcards | > 10% |

### Query de Métricas

```sql
-- CTR por categoria
SELECT 
  c.name as category,
  COUNT(CASE WHEN ui.interaction_type = 'click' THEN 1 END) as clicks,
  COUNT(CASE WHEN ui.interaction_type = 'impression' THEN 1 END) as impressions,
  COUNT(CASE WHEN ui.interaction_type = 'click' THEN 1 END) * 1.0 / 
    NULLIF(COUNT(CASE WHEN ui.interaction_type = 'impression' THEN 1 END), 0) as ctr
FROM user_interactions ui
JOIN articles a ON ui.article_id = a.id
JOIN categories c ON a.category_id = c.id
WHERE ui.created_at > NOW() - INTERVAL '7 days'
GROUP BY c.name
ORDER BY ctr DESC;
```

