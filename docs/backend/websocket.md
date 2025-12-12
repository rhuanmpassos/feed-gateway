# 🔌 WebSocket

> Comunicação em tempo real via WebSocket

---

## Conexão

### URL

```
Produção: wss://feed-gateway.onrender.com
Local:    ws://localhost:3001
```

### Conectar

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('wss://feed-gateway.onrender.com', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('Conectado:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Desconectado:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Erro de conexão:', error.message);
});
```

---

## Eventos do Servidor → Cliente

### `new_article`

Emitido quando um novo artigo é publicado.

**Payload:**
```json
{
  "id": "abc123",
  "title": "Congresso aprova reforma tributária",
  "summary": "A Câmara dos Deputados aprovou...",
  "source_name": "G1",
  "category_id": 1,
  "category_name": "Política",
  "is_breaking": true,
  "published_at": "2025-12-11T22:30:00.000Z",
  "image_url": "https://s2.glbimg.com/abc123.jpg"
}
```

**Handler:**
```typescript
socket.on('new_article', (article: Article) => {
  // Adicionar no topo do feed se for breaking
  if (article.is_breaking) {
    setBreakingNews(prev => [article, ...prev]);
    showNotification(`🔴 ${article.title}`);
  }
  
  // Atualizar badge do tab "Agora"
  incrementUnreadCount();
});
```

---

### `breaking_news`

Emitido para notícias urgentes (prioridade alta).

**Payload:**
```json
{
  "id": "bre789",
  "title": "URGENTE: Presidente anuncia medidas econômicas",
  "summary": "Em pronunciamento há pouco...",
  "source_name": "Folha de S.Paulo",
  "category_id": 1,
  "published_at": "2025-12-11T22:35:00.000Z",
  "urgency_level": "high"
}
```

**Handler:**
```typescript
socket.on('breaking_news', (article: BreakingArticle) => {
  // Mostrar banner no topo da tela
  showBreakingBanner(article);
  
  // Vibrar dispositivo
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  
  // Push notification se app em background
  if (AppState.currentState !== 'active') {
    sendLocalNotification({
      title: '🔴 URGENTE',
      body: article.title,
      data: { articleId: article.id },
    });
  }
});
```

---

### `article_updated`

Emitido quando um artigo existente é atualizado.

**Payload:**
```json
{
  "id": "abc123",
  "updated_fields": ["title", "summary"],
  "title": "Título atualizado do artigo",
  "summary": "Resumo atualizado...",
  "updated_at": "2025-12-11T22:40:00.000Z"
}
```

**Handler:**
```typescript
socket.on('article_updated', (update: ArticleUpdate) => {
  // Atualizar artigo no cache
  queryClient.setQueryData(['article', update.id], (old: Article) => ({
    ...old,
    ...update,
  }));
});
```

---

### `feed_refresh`

Sinaliza que o feed deve ser recarregado (ex: muitos novos artigos).

**Payload:**
```json
{
  "reason": "batch_import",
  "new_articles_count": 25,
  "timestamp": "2025-12-11T22:45:00.000Z"
}
```

**Handler:**
```typescript
socket.on('feed_refresh', (data: FeedRefreshSignal) => {
  // Mostrar badge "25 novas notícias"
  setNewArticlesCount(data.new_articles_count);
  
  // Opcional: auto-refresh se usuário no topo
  if (scrollPosition === 0) {
    refetchFeed();
  }
});
```

---

## Eventos do Cliente → Servidor

### `subscribe_categories`

Inscrever-se para receber artigos de categorias específicas.

**Emit:**
```typescript
socket.emit('subscribe_categories', {
  user_id: 123,
  category_ids: [1, 2, 4], // Política, Economia, Tecnologia
});
```

**Server Response:**
```typescript
socket.on('subscribed', (data) => {
  console.log('Inscrito em:', data.categories);
});
```

---

### `subscribe_breaking`

Inscrever-se para receber breaking news.

**Emit:**
```typescript
socket.emit('subscribe_breaking', {
  user_id: 123,
  enabled: true,
});
```

---

### `unsubscribe_categories`

Cancelar inscrição de categorias.

**Emit:**
```typescript
socket.emit('unsubscribe_categories', {
  user_id: 123,
  category_ids: [4], // Remover Tecnologia
});
```

---

### `ping`

Manter conexão ativa.

**Emit:**
```typescript
// Enviar ping a cada 30 segundos
setInterval(() => {
  socket.emit('ping');
}, 30000);

socket.on('pong', () => {
  console.log('Conexão ativa');
});
```

---

## Implementação Completa

### WebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

const GATEWAY_URL = 'wss://feed-gateway.onrender.com';

export function useWebSocket(userId: number | null) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Conectar
    const socket = io(GATEWAY_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Eventos de conexão
    socket.on('connect', () => {
      console.log('WebSocket conectado');
      
      // Inscrever-se nas categorias do usuário
      socket.emit('subscribe_breaking', { user_id: userId, enabled: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket desconectado:', reason);
    });

    // Eventos de conteúdo
    socket.on('new_article', (article) => {
      // Invalidar cache do feed
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      
      // Atualizar contador de não lidos
      queryClient.setQueryData(['unread_count'], (old: number) => (old || 0) + 1);
    });

    socket.on('breaking_news', (article) => {
      // Adicionar ao cache de breaking
      queryClient.setQueryData(['breaking'], (old: Article[]) => 
        [article, ...(old || [])].slice(0, 10)
      );
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [userId, queryClient]);

  // Gerenciar estado do app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && socketRef.current?.disconnected) {
        socketRef.current.connect();
      } else if (state === 'background') {
        // Manter conexão por 30 segundos em background
        setTimeout(() => {
          if (AppState.currentState === 'background') {
            socketRef.current?.disconnect();
          }
        }, 30000);
      }
    });

    return () => subscription.remove();
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit, isConnected: socketRef.current?.connected };
}
```

### Uso no App

```typescript
// App.tsx ou contexto global
function App() {
  const { userId } = useAuth();
  const { emit, isConnected } = useWebSocket(userId);

  return (
    <WebSocketContext.Provider value={{ emit, isConnected }}>
      <Navigation />
    </WebSocketContext.Provider>
  );
}

// Em um componente
function FeedScreen() {
  const { isConnected } = useWebSocket();
  
  return (
    <View>
      {!isConnected && (
        <Banner type="warning">
          Reconectando...
        </Banner>
      )}
      <FeedList />
    </View>
  );
}
```

---

## Breaking News Banner

### Componente

```typescript
// components/BreakingBanner.tsx
import Animated, { 
  FadeInDown, 
  FadeOutUp,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface BreakingBannerProps {
  article: Article;
  onPress: () => void;
  onDismiss: () => void;
}

export function BreakingBanner({ article, onPress, onDismiss }: BreakingBannerProps) {
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withTiming(0.7, { duration: 500 }),
      -1,
      true
    ),
  }));

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      exiting={FadeOutUp}
      style={styles.container}
    >
      <Pressable onPress={onPress} style={styles.content}>
        <Animated.View style={[styles.indicator, pulseStyle]} />
        <View style={styles.textContainer}>
          <Text style={styles.label}>🔴 URGENTE</Text>
          <Text style={styles.title} numberOfLines={2}>
            {article.title}
          </Text>
        </View>
      </Pressable>
      
      <Pressable onPress={onDismiss} style={styles.dismiss}>
        <Text style={styles.dismissText}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  dismiss: {
    padding: 8,
  },
  dismissText: {
    color: '#636366',
    fontSize: 16,
  },
});
```

---

## Reconexão Inteligente

```typescript
// utils/websocket.ts
class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(userId: number) {
    this.socket = io(GATEWAY_URL, {
      transports: ['websocket'],
      reconnection: false, // Gerenciamos manualmente
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.subscribeUser(userId);
    });

    this.socket.on('disconnect', () => {
      this.attemptReconnect(userId);
    });

    this.socket.on('connect_error', () => {
      this.attemptReconnect(userId);
    });
  }

  private attemptReconnect(userId: number) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido');
      return;
    }

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Tentativa de reconexão ${this.reconnectAttempts}...`);
      this.socket?.connect();
    }, delay);
  }

  private subscribeUser(userId: number) {
    this.socket?.emit('subscribe_breaking', { user_id: userId, enabled: true });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const wsManager = new WebSocketManager();
```

