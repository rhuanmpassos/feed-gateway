# 📚 Documentação do Feed App

> Documentação completa para desenvolvimento do app de notícias

---

## 📁 Estrutura

```
docs/
├── README.md                    ← Você está aqui
│
├── design-system/               ← Visual & UI
│   ├── colors.md               - Paleta de cores (dark/light mode)
│   ├── spacing.md              - Espaçamentos e grid
│   ├── typography.md           - Fontes e estilos de texto
│   ├── components.md           - Componentes base (Button, Badge, etc)
│   └── cards.md                - Cards de artigo (padrão, compacto, skeleton)
│
├── mobile/                      ← App React Native/Expo
│   ├── navigation.md           - Estrutura de navegação
│   ├── screens.md              - Todas as 11 telas do app
│   ├── error-states.md         - Estados de erro, vazios, offline
│   ├── interactions.md         - Sistema de tracking de usuário
│   └── performance.md          - Otimização e performance Expo
│
└── backend/                     ← APIs e Backend
    ├── api-reference.md        - Todas as APIs com exemplos reais
    ├── websocket.md            - Eventos em tempo real
    └── recommendations.md      - Algoritmo de recomendação
```

---

## 🚀 Quick Links

### Design System

| Arquivo | O que contém |
|---------|--------------|
| [colors.md](./design-system/colors.md) | Paleta dark/light, badges, estados |
| [spacing.md](./design-system/spacing.md) | Grid 4px, margins, safe areas |
| [typography.md](./design-system/typography.md) | Playfair, Inter, escalas |
| [components.md](./design-system/components.md) | Button, Badge, Input, Toggle, Chip |
| [cards.md](./design-system/cards.md) | Card padrão, compacto, breaking, skeleton |

### Mobile App

| Arquivo | O que contém |
|---------|--------------|
| [navigation.md](./mobile/navigation.md) | Stacks, tabs, deep linking |
| [screens.md](./mobile/screens.md) | Splash, onboarding, feeds, perfil |
| [error-states.md](./mobile/error-states.md) | Offline, erro, vazio, loading |
| [interactions.md](./mobile/interactions.md) | Tracking, sessões, hooks |
| [performance.md](./mobile/performance.md) | FlashList, Reanimated, memoization |

### Backend

| Arquivo | O que contém |
|---------|--------------|
| [api-reference.md](./backend/api-reference.md) | Todas as APIs com request/response |
| [websocket.md](./backend/websocket.md) | Eventos real-time, breaking news |
| [recommendations.md](./backend/recommendations.md) | Algoritmo de personalização |

---

## 🎨 Design Visual - Resumo

### Cores Principais

```
Dark Mode:
- Background:  #0A0A0B
- Surface:     #141416
- Text:        #FFFFFF / #A1A1A6 / #636366

Accents:
- Danger:      #FF3B30 (URGENTE)
- Warning:     #FF9500 (AGORA)
- Success:     #34C759 (NOVO)
- Discovery:   #AF52DE (💡 Descoberta)
- Link:        #007AFF (Bookmark)
- Star:        #FFD60A (Like)
```

### Tipografia

```
Títulos:    Playfair Display (serif)
Corpo:      Inter (sans-serif)
Badges:     Inter Bold, uppercase, 10px
```

---

## 📱 Telas do App - Resumo

| # | Tela | Descrição |
|---|------|-----------|
| 1 | Splash | Logo + loading |
| 2 | Onboarding Proposta | "Notícias que importam" |
| 3 | Onboarding Categorias | Selecionar mínimo 3 |
| 4 | Onboarding Notificações | Pedir permissão push |
| 5 | Para Você | Feed personalizado |
| 6 | Agora | Feed cronológico |
| 7 | Salvos | Bookmarks |
| 8 | Perfil | Configurações |
| 9 | Artigo | WebView + ações |
| 10 | Editar Interesses | Alterar categorias |
| 11 | Config Notificações | Toggles de push |

---

## 📡 APIs - Resumo

### Principais Endpoints

```
GET  /api/feeds/addictive     → Feed personalizado
GET  /api/feed                → Feed cronológico
GET  /api/feeds/breaking      → Breaking news
POST /api/interactions/batch  → Enviar tracking
POST /api/sessions            → Iniciar sessão
GET  /api/bookmarks           → Artigos salvos
GET  /api/users/:id/profile   → Perfil do usuário
```

### WebSocket Events

```
→ Server emits:
  new_article       - Novo artigo publicado
  breaking_news     - Notícia urgente
  feed_refresh      - Sinal para recarregar

← Client emits:
  subscribe_breaking  - Inscrever em urgentes
  subscribe_categories - Inscrever em categorias
```

---

## ✅ Checklist de Implementação

### Fase 1: Setup
- [ ] Criar projeto Expo com TypeScript
- [ ] Configurar navegação (React Navigation)
- [ ] Implementar tema (dark mode)
- [ ] Carregar fontes (Playfair, Inter)

### Fase 2: Onboarding
- [ ] Splash screen com animação
- [ ] Tela de proposta de valor
- [ ] Seleção de categorias
- [ ] Permissão de notificações
- [ ] Persistir preferências

### Fase 3: Feeds
- [ ] Tela Para Você (FlashList)
- [ ] Tela Agora (cronológico)
- [ ] Cards de artigo
- [ ] Pull to refresh
- [ ] Infinite scroll
- [ ] Skeleton loading

### Fase 4: Ações
- [ ] Like (⭐)
- [ ] Bookmark (🔖)
- [ ] Share (↗️)
- [ ] WebView para artigo

### Fase 5: Tracking
- [ ] Session management
- [ ] Impression tracking
- [ ] Click tracking
- [ ] View duration
- [ ] Batch submission

### Fase 6: Perfil
- [ ] Tela de perfil
- [ ] Editar interesses
- [ ] Configurações de notificação
- [ ] Logout

### Fase 7: Polish
- [ ] Animações (Reanimated)
- [ ] Haptic feedback
- [ ] Estados de erro
- [ ] Offline handling
- [ ] Performance optimization

---

## 🔗 Links Úteis

- **Backend**: https://versace-feed.onrender.com
- **Gateway**: https://feed-gateway.onrender.com
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org

---

## 📝 Changelog

| Data | Versão | Mudanças |
|------|--------|----------|
| 2025-12-11 | 1.0.0 | Estrutura inicial com 13 documentos |

