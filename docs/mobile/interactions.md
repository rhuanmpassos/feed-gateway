# 🎯 Sistema de Interações e Tracking

> Como rastrear comportamento do usuário para personalização

---

## Índice

1. [Tipos de Interação](#tipos-de-interação)
2. [Session Management](#session-management)
3. [Tracking Hooks](#tracking-hooks)
4. [Implementação por Tela](#implementação-por-tela)
5. [Batch Submission](#batch-submission)
6. [Offline Queue](#offline-queue)

---

## Tipos de Interação

| Tipo | Trigger | Dados Coletados | Peso |
|------|---------|-----------------|------|
| `impression` | Card entra no viewport | article_id, position, timestamp | Baixo |
| `scroll_stop` | Usuário para no card 1+ seg | article_id, duration, viewport_time | Médio |
| `click` | Toca para abrir artigo | article_id, position | Alto |
| `view` | Fecha artigo | article_id, duration | Alto |
| `like` | Toca ⭐ | article_id | Muito Alto |
| `bookmark` | Toca 🔖 | article_id | Alto |
| `share` | Toca ↗️ | article_id | Muito Alto |

### Estrutura de Dados

```typescript
interface Interaction {
  article_id: string;
  interaction_type: 'impression' | 'scroll_stop' | 'click' | 'view' | 'like' | 'bookmark' | 'share';
  timestamp: number;
  duration?: number;           // Para scroll_stop e view
  position?: number;           // Posição no feed (0-indexed)
  scroll_velocity?: number;    // Velocidade de scroll
  screen_position?: string;    // 'top' | 'middle' | 'bottom'
  viewport_time?: number;      // Tempo visível na tela
  scroll_direction?: string;   // 'up' | 'down'
}

interface InteractionBatch {
  user_id: number;
  session_id: string;
  device_type: string;
  interactions: Interaction[];
}
```

---

## Session Management

### Criar Sessão

```typescript
// hooks/useSession.ts
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionStartRef = useRef<number>(0);

  const startSession = useCallback(async () => {
    const id = uuidv4();
    const userId = await AsyncStorage.getItem('user_id');
    
    setSessionId(id);
    sessionStartRef.current = Date.now();
    
    // Notificar backend
    await api.post('/sessions', {
      id,
      user_id: parseInt(userId!),
      device_type: Platform.OS,
      is_first_session: await isFirstSession(),
    });

    return id;
  }, []);

  const endSession = useCallback(async () => {
    if (!sessionId) return;

    const duration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    
    await api.put(`/sessions/${sessionId}/end`, {
      duration_seconds: duration,
    });

    setSessionId(null);
  }, [sessionId]);

  return { sessionId, startSession, endSession };
}

async function isFirstSession(): Promise<boolean> {
  const hasSession = await AsyncStorage.getItem('has_had_session');
  if (!hasSession) {
    await AsyncStorage.setItem('has_had_session', 'true');
    return true;
  }
  return false;
}
```

### App State Handling

```typescript
// hooks/useAppSession.ts
import { AppState, AppStateStatus } from 'react-native';

export function useAppSession() {
  const { sessionId, startSession, endSession } = useSession();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    startSession();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        // App indo para background
        endSession();
      } else if (appState.current.match(/inactive|background/) && nextState === 'active') {
        // App voltando ao foreground
        startSession();
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
      endSession();
    };
  }, []);

  return sessionId;
}
```

---

## Tracking Hooks

### InteractionTracker Singleton

```typescript
// services/InteractionTracker.ts
class InteractionTrackerService {
  private queue: Interaction[] = [];
  private sessionId: string | null = null;
  private userId: number | null = null;
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 20;
  private readonly FLUSH_INTERVAL = 10000; // 10 segundos

  setSession(sessionId: string, userId: number) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  track(interaction: Omit<Interaction, 'timestamp'>) {
    if (!this.sessionId || !this.userId) return;

    this.queue.push({
      ...interaction,
      timestamp: Date.now(),
    });

    // Flush imediato se atingiu o tamanho do batch
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
    } else {
      // Schedule flush
      this.scheduleFlush();
    }
  }

  private scheduleFlush() {
    if (this.flushTimeout) return;

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  async flush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await api.post('/interactions/batch', {
        user_id: this.userId,
        session_id: this.sessionId,
        device_type: Platform.OS,
        interactions: batch,
      });
    } catch (error) {
      // Re-adicionar à fila se falhar
      this.queue = [...batch, ...this.queue];
      
      // Salvar offline se persistir o erro
      if (!navigator.onLine) {
        await this.saveOffline(batch);
      }
    }
  }

  private async saveOffline(batch: Interaction[]) {
    const existing = await AsyncStorage.getItem('offline_interactions');
    const queue = existing ? JSON.parse(existing) : [];
    queue.push(...batch);
    await AsyncStorage.setItem('offline_interactions', JSON.stringify(queue));
  }

  async syncOffline() {
    const offline = await AsyncStorage.getItem('offline_interactions');
    if (!offline) return;

    const queue = JSON.parse(offline);
    if (queue.length === 0) return;

    try {
      await api.post('/interactions/batch', {
        user_id: this.userId,
        session_id: this.sessionId,
        device_type: Platform.OS,
        interactions: queue,
      });
      await AsyncStorage.removeItem('offline_interactions');
    } catch {
      // Manter offline
    }
  }
}

export const InteractionTracker = new InteractionTrackerService();
```

### useImpressionTracking

```typescript
// hooks/useImpressionTracking.ts
import { useCallback, useRef } from 'react';
import { ViewToken } from 'react-native';

export function useImpressionTracking() {
  const viewedItems = useRef(new Set<string>());

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((item) => {
        if (!viewedItems.current.has(item.key as string)) {
          viewedItems.current.add(item.key as string);
          
          InteractionTracker.track({
            article_id: item.key as string,
            interaction_type: 'impression',
            position: item.index ?? 0,
            screen_position: getScreenPosition(item.index ?? 0),
          });
        }
      });
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // 50% visível
    minimumViewTime: 100, // 100ms mínimo
  };

  return { onViewableItemsChanged, viewabilityConfig };
}

function getScreenPosition(index: number): string {
  if (index < 3) return 'top';
  if (index < 10) return 'middle';
  return 'bottom';
}
```

### useScrollStopTracking

```typescript
// hooks/useScrollStopTracking.ts
import { useRef, useCallback } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

export function useScrollStopTracking() {
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastPosition = useRef(0);
  const scrollStartTime = useRef(0);
  const currentVisibleItem = useRef<string | null>(null);
  const visibleItemStartTime = useRef(0);

  const handleScrollBegin = useCallback(() => {
    scrollStartTime.current = Date.now();
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
  }, []);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      const scrollVelocity = Math.abs(contentOffset.y - lastPosition.current);
      lastPosition.current = contentOffset.y;

      // Usuário parou de scrollar
      scrollTimeout.current = setTimeout(() => {
        if (currentVisibleItem.current) {
          const viewportTime = Date.now() - visibleItemStartTime.current;
          
          if (viewportTime > 1000) { // Mais de 1 segundo
            InteractionTracker.track({
              article_id: currentVisibleItem.current,
              interaction_type: 'scroll_stop',
              duration: viewportTime,
              viewport_time: viewportTime,
              scroll_velocity: scrollVelocity,
            });
          }
        }
      }, 500); // Espera 500ms sem movimento
    },
    []
  );

  const setVisibleItem = useCallback((articleId: string | null) => {
    if (currentVisibleItem.current !== articleId) {
      currentVisibleItem.current = articleId;
      visibleItemStartTime.current = Date.now();
    }
  }, []);

  return {
    handleScrollBegin,
    handleScrollEnd,
    setVisibleItem,
  };
}
```

### useClickTracking

```typescript
// hooks/useClickTracking.ts
export function useClickTracking() {
  const trackClick = useCallback((articleId: string, position?: number) => {
    InteractionTracker.track({
      article_id: articleId,
      interaction_type: 'click',
      position,
    });
  }, []);

  return { trackClick };
}
```

### useViewTracking

```typescript
// hooks/useViewTracking.ts
export function useViewTracking(articleId: string) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      
      if (duration > 5) { // Só conta se ficou mais de 5 segundos
        InteractionTracker.track({
          article_id: articleId,
          interaction_type: 'view',
          duration,
        });
      }
    };
  }, [articleId]);
}
```

---

## Implementação por Tela

### FeedScreen

```typescript
export function FeedScreen() {
  const sessionId = useAppSession();
  const { onViewableItemsChanged, viewabilityConfig } = useImpressionTracking();
  const { handleScrollBegin, handleScrollEnd, setVisibleItem } = useScrollStopTracking();
  const { trackClick } = useClickTracking();

  // Configurar tracker com sessão
  useEffect(() => {
    if (sessionId) {
      const userId = /* get from context/storage */;
      InteractionTracker.setSession(sessionId, userId);
    }
  }, [sessionId]);

  const handleArticlePress = (article: Article, index: number) => {
    trackClick(article.id, index);
    navigation.navigate('Article', { articleId: article.id, articleUrl: article.url });
  };

  return (
    <FlashList
      data={articles}
      renderItem={({ item, index }) => (
        <ArticleCard
          article={item}
          onPress={() => handleArticlePress(item, index)}
        />
      )}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onScrollBeginDrag={handleScrollBegin}
      onScrollEndDrag={handleScrollEnd}
      onMomentumScrollEnd={handleScrollEnd}
    />
  );
}
```

### ArticleScreen

```typescript
export function ArticleScreen({ route }) {
  const { articleId, articleUrl } = route.params;
  
  // Tracking de view
  useViewTracking(articleId);

  const handleLike = () => {
    InteractionTracker.track({
      article_id: articleId,
      interaction_type: 'like',
    });
  };

  const handleBookmark = () => {
    InteractionTracker.track({
      article_id: articleId,
      interaction_type: 'bookmark',
    });
  };

  const handleShare = () => {
    InteractionTracker.track({
      article_id: articleId,
      interaction_type: 'share',
    });
  };

  return (
    <View>
      <WebView source={{ uri: articleUrl }} />
      <ActionBar
        onLike={handleLike}
        onBookmark={handleBookmark}
        onShare={handleShare}
      />
    </View>
  );
}
```

---

## Batch Submission

### Payload de Exemplo

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
      "article_id": "def456",
      "interaction_type": "impression",
      "timestamp": 1702329670000,
      "position": 1,
      "screen_position": "top"
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "processed": 5,
  "message": "Interações registradas com sucesso"
}
```

---

## Offline Queue

### Sync ao Voltar Online

```typescript
// hooks/useNetworkSync.ts
import NetInfo from '@react-native-community/netinfo';

export function useNetworkSync() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // Sincronizar interações offline
        InteractionTracker.syncOffline();
      }
    });

    return () => unsubscribe();
  }, []);
}
```

### Storage Structure

```typescript
// AsyncStorage keys
const STORAGE_KEYS = {
  OFFLINE_INTERACTIONS: 'offline_interactions',
  USER_ID: 'user_id',
  SESSION_ID: 'current_session_id',
  HAS_HAD_SESSION: 'has_had_session',
};

// Estrutura armazenada
interface OfflineData {
  interactions: Interaction[];
  pendingSince: number;
}
```

---

## Best Practices

### 1. Não bloquear UI

```typescript
// ❌ Ruim - bloqueia a UI
const handlePress = async () => {
  await api.post('/interactions', { ... });
  navigation.navigate('Article');
};

// ✅ Bom - não bloqueia
const handlePress = () => {
  InteractionTracker.track({ ... }); // Fire and forget
  navigation.navigate('Article');
};
```

### 2. Debounce scroll

```typescript
// Usar debounce para scroll events
import { debounce } from 'lodash';

const debouncedScrollEnd = useMemo(
  () => debounce(handleScrollEnd, 150),
  [handleScrollEnd]
);
```

### 3. Limpar ao desmontar

```typescript
useEffect(() => {
  return () => {
    // Flush antes de desmontar
    InteractionTracker.flush();
  };
}, []);
```

### 4. Não duplicar

```typescript
// Usar Set para evitar duplicatas
const viewedItems = useRef(new Set<string>());

if (!viewedItems.current.has(articleId)) {
  viewedItems.current.add(articleId);
  InteractionTracker.track({ ... });
}
```


