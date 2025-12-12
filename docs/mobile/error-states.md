# ⚠️ Estados de Erro, Vazios e Offline

> Fluxos completos para cenários de erro e estados vazios

---

## Índice

1. [Sem Internet](#1-sem-internet)
2. [Falha ao Carregar Feed](#2-falha-ao-carregar-feed)
3. [Timeout](#3-timeout)
4. [Feed Vazio](#4-feed-vazio)
5. [Sem Bookmarks](#5-sem-bookmarks)
6. [Falha ao Logar](#6-falha-ao-logar)
7. [Carregando Mais](#7-carregando-mais)
8. [Pull to Refresh](#8-pull-to-refresh)
9. [Falha em Ação](#9-falha-em-ação)
10. [Componentes Reutilizáveis](#10-componentes-reutilizáveis)

---

## 1. Sem Internet

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│               📡                    │
│           (icon grande)             │
│                                     │
│        Sem conexão                  │
│        ──────────────               │
│                                     │
│    Verifique sua conexão com        │
│    a internet e tente novamente.    │
│                                     │
│                                     │
│      ┌─────────────────────────┐    │
│      │    Tentar novamente     │    │
│      └─────────────────────────┘    │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘

Fundo: #0A0A0B
Ícone: #636366, 64px
Título: #FFFFFF, 20px
Subtítulo: #A1A1A6, 14px
Botão: bg #1C1C1E, text #007AFF
```

### Detecção

```typescript
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  return isConnected;
}
```

### Componente

```typescript
interface OfflineScreenProps {
  onRetry: () => void;
}

export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.title}>Sem conexão</Text>
        <Text style={styles.subtitle}>
          Verifique sua conexão com a internet e tente novamente.
        </Text>
        <Button variant="secondary" onPress={onRetry}>
          Tentar novamente
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A1A1A6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});
```

### Uso no Feed

```typescript
export function FeedScreen() {
  const isConnected = useNetworkStatus();
  const { data, error, refetch, isLoading } = useAddictiveFeed();

  // Sem internet
  if (!isConnected) {
    return <OfflineScreen onRetry={refetch} />;
  }

  // Loading
  if (isLoading) {
    return <SkeletonList />;
  }

  // Erro
  if (error) {
    return <ErrorScreen error={error} onRetry={refetch} />;
  }

  // Sucesso
  return <FeedList data={data} />;
}
```

---

## 2. Falha ao Carregar Feed

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│               ⚠️                    │
│           (icon grande)             │
│                                     │
│      Ops! Algo deu errado           │
│      ─────────────────────          │
│                                     │
│    Não foi possível carregar        │
│    o feed. Tente novamente.         │
│                                     │
│                                     │
│      ┌─────────────────────────┐    │
│      │    Tentar novamente     │    │
│      └─────────────────────────┘    │
│                                     │
│         Ver detalhes                │
│                                     │
└─────────────────────────────────────┘

Ícone: ⚠️ ou ilustração
"Ver detalhes": link para expandir erro técnico (debug)
```

### Componente

```typescript
interface ErrorScreenProps {
  error: Error;
  onRetry: () => void;
  showDetails?: boolean;
}

export function ErrorScreen({ error, onRetry, showDetails = false }: ErrorScreenProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Ops! Algo deu errado</Text>
      <Text style={styles.subtitle}>
        Não foi possível carregar o feed. Tente novamente.
      </Text>

      <Button variant="secondary" onPress={onRetry}>
        Tentar novamente
      </Button>

      {showDetails && __DEV__ && (
        <>
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.detailsLink}>
              {expanded ? 'Ocultar' : 'Ver'} detalhes
            </Text>
          </TouchableOpacity>
          
          {expanded && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
```

### Diferentes tipos de erro

```typescript
function getErrorMessage(error: Error): { title: string; subtitle: string } {
  if (error.message.includes('Network')) {
    return {
      title: 'Problema de conexão',
      subtitle: 'Verifique sua internet e tente novamente.',
    };
  }
  
  if (error.message.includes('500')) {
    return {
      title: 'Servidor indisponível',
      subtitle: 'Nossos servidores estão passando por manutenção. Tente em alguns minutos.',
    };
  }
  
  if (error.message.includes('401') || error.message.includes('403')) {
    return {
      title: 'Sessão expirada',
      subtitle: 'Faça login novamente para continuar.',
    };
  }
  
  return {
    title: 'Ops! Algo deu errado',
    subtitle: 'Não foi possível completar a operação.',
  };
}
```

---

## 3. Timeout

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│               ⏱️                    │
│                                     │
│      Demorou demais                 │
│      ─────────────────              │
│                                     │
│    A requisição excedeu o           │
│    tempo limite. Tente novamente.   │
│                                     │
│      ┌─────────────────────────┐    │
│      │    Tentar novamente     │    │
│      └─────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Implementação

```typescript
// Fetch com timeout
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new TimeoutError('A requisição excedeu o tempo limite');
    }
    throw error;
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
```

---

## 4. Feed Vazio

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│               📰                    │
│                                     │
│      Nada por aqui ainda            │
│      ───────────────────            │
│                                     │
│    Estamos preparando seu feed      │
│    personalizado. Volte em breve!   │
│                                     │
│      ┌─────────────────────────┐    │
│      │      Atualizar          │    │
│      └─────────────────────────┘    │
│                                     │
│         Explorar categorias         │
│                                     │
└─────────────────────────────────────┘
```

### Componente

```typescript
interface EmptyFeedProps {
  onRefresh: () => void;
  onExplore: () => void;
}

export function EmptyFeed({ onRefresh, onExplore }: EmptyFeedProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.delay(200)}>
        <Text style={styles.icon}>📰</Text>
        <Text style={styles.title}>Nada por aqui ainda</Text>
        <Text style={styles.subtitle}>
          Estamos preparando seu feed personalizado. Volte em breve!
        </Text>

        <Button onPress={onRefresh}>Atualizar</Button>

        <TouchableOpacity onPress={onExplore}>
          <Text style={styles.link}>Explorar categorias</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
```

---

## 5. Sem Bookmarks

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│               🔖                    │
│                                     │
│      Nenhum artigo salvo            │
│      ───────────────────            │
│                                     │
│    Toque em 🔖 em qualquer          │
│    artigo para salvá-lo aqui.       │
│                                     │
│      ┌─────────────────────────┐    │
│      │    Explorar notícias    │    │
│      └─────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Componente

```typescript
export function EmptyBookmarks({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔖</Text>
      <Text style={styles.title}>Nenhum artigo salvo</Text>
      <Text style={styles.subtitle}>
        Toque em 🔖 em qualquer artigo para salvá-lo aqui.
      </Text>
      <Button variant="secondary" onPress={onExplore}>
        Explorar notícias
      </Button>
    </View>
  );
}
```

---

## 6. Falha ao Logar

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  ←  Login                           │
│                                     │
│                                     │
│    Email                            │
│    ┌─────────────────────────────┐  │
│    │ usuario@email.com           │  │
│    └─────────────────────────────┘  │
│                                     │
│    Senha                            │
│    ┌─────────────────────────────┐  │
│    │ ••••••••         ⚠️ Erro    │  │ ← border vermelho
│    └─────────────────────────────┘  │
│    Email ou senha incorretos        │ ← texto erro
│                                     │
│      ┌─────────────────────────┐    │
│      │        Entrar           │    │
│      └─────────────────────────┘    │
│                                     │
│         Esqueci minha senha         │
│                                     │
└─────────────────────────────────────┘
```

### Erros de Formulário

```typescript
type FormErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validação
    const newErrors: FormErrors = {};
    
    if (!email) newErrors.email = 'Email é obrigatório';
    else if (!isValidEmail(email)) newErrors.email = 'Email inválido';
    
    if (!password) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      // Sucesso - navegar
    } catch (error) {
      if (error.response?.status === 401) {
        setErrors({ general: 'Email ou senha incorretos' });
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Muitas tentativas. Tente em 5 minutos.' });
      } else {
        setErrors({ general: 'Erro ao conectar. Tente novamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Input
        label="Senha"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
      />

      {errors.general && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}

      <Button onPress={handleLogin} loading={isLoading}>
        Entrar
      </Button>
    </View>
  );
}
```

---

## 7. Carregando Mais

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  [CARD]                             │
│                                     │
│  [CARD]                             │
│                                     │
│  [CARD]                             │
│                                     │
│         ┌──────────────┐            │
│         │   ○ ○ ○      │            │ ← spinner ou dots
│         │ Carregando   │            │
│         └──────────────┘            │
│                                     │
└─────────────────────────────────────┘
```

### Componente

```typescript
export function LoadingMore() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#636366" />
      <Text style={styles.text}>Carregando mais...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: '#636366',
    fontFamily: 'Inter-Regular',
  },
});
```

### No Feed

```typescript
<FlashList
  data={articles}
  renderItem={...}
  onEndReached={fetchNextPage}
  onEndReachedThreshold={0.5}
  ListFooterComponent={
    isFetchingNextPage ? <LoadingMore /> : null
  }
/>
```

---

## 8. Pull to Refresh

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│            ↓ Puxe para              │
│              atualizar              │
│                                     │
│         ┌──────────────┐            │
│         │   ↻          │            │ ← ícone rotacionando
│         │ Atualizando  │            │
│         └──────────────┘            │
│                                     │
│  [CARD]                             │
│                                     │
│  [CARD]                             │
│                                     │
└─────────────────────────────────────┘
```

### Implementação

```typescript
export function FeedScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { refetch } = useFeed();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <FlashList
      data={articles}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
          colors={['#FF3B30']} // Android
          progressBackgroundColor="#141416" // Android
        />
      }
    />
  );
}
```

### Custom Pull Indicator (Opcional)

```typescript
import { MotiView } from 'moti';

function CustomPullIndicator({ refreshing }: { refreshing: boolean }) {
  return (
    <View style={styles.pullContainer}>
      <MotiView
        animate={{
          rotate: refreshing ? '360deg' : '0deg',
        }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: refreshing,
        }}
      >
        <Text style={styles.refreshIcon}>↻</Text>
      </MotiView>
      <Text style={styles.pullText}>
        {refreshing ? 'Atualizando...' : 'Puxe para atualizar'}
      </Text>
    </View>
  );
}
```

---

## 9. Falha em Ação

### Toast de Erro

```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ⚠️ Não foi possível salvar      ││ ← toast no topo
│  └─────────────────────────────────┘│
│                                     │
│  [CONTEÚDO NORMAL]                  │
│                                     │
└─────────────────────────────────────┘
```

### Implementação

```typescript
const handleBookmark = async (articleId: string) => {
  try {
    await api.post(`/bookmarks`, { article_id: articleId });
    Toast.show('Artigo salvo!', 'success');
  } catch (error) {
    Toast.show('Não foi possível salvar', 'error');
    
    // Reverter UI otimista se necessário
    setBookmarked(false);
  }
};

const handleLike = async (articleId: string) => {
  // Otimistic update
  setLiked(true);
  
  try {
    await api.post(`/articles/${articleId}/like`);
  } catch (error) {
    // Reverter
    setLiked(false);
    Toast.show('Erro ao curtir', 'error');
  }
};
```

### Retry Automático

```typescript
import { useQueryClient } from '@tanstack/react-query';

function useRetryableAction() {
  const queryClient = useQueryClient();
  
  const executeWithRetry = async (
    action: () => Promise<void>,
    options: { maxRetries?: number; onFinalError?: () => void } = {}
  ) => {
    const { maxRetries = 3, onFinalError } = options;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        await action();
        return;
      } catch (error) {
        attempts++;
        if (attempts === maxRetries) {
          onFinalError?.();
          Toast.show('Falha após várias tentativas', 'error');
        } else {
          // Backoff exponencial
          await new Promise(r => setTimeout(r, 1000 * attempts));
        }
      }
    }
  };
  
  return { executeWithRetry };
}
```

---

## 10. Componentes Reutilizáveis

### EmptyState Genérico

```typescript
interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(200)}>
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>
      
      <Animated.Text entering={FadeInUp.delay(300)} style={styles.title}>
        {title}
      </Animated.Text>
      
      <Animated.Text entering={FadeInUp.delay(400)} style={styles.subtitle}>
        {subtitle}
      </Animated.Text>

      {actionLabel && onAction && (
        <Animated.View entering={FadeInUp.delay(500)}>
          <Button variant="secondary" onPress={onAction}>
            {actionLabel}
          </Button>
        </Animated.View>
      )}

      {secondaryLabel && onSecondary && (
        <TouchableOpacity onPress={onSecondary}>
          <Text style={styles.secondaryLink}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Uso
<EmptyState
  icon="📡"
  title="Sem conexão"
  subtitle="Verifique sua internet e tente novamente."
  actionLabel="Tentar novamente"
  onAction={retry}
/>

<EmptyState
  icon="🔖"
  title="Nenhum artigo salvo"
  subtitle="Toque em 🔖 em qualquer artigo para salvá-lo aqui."
  actionLabel="Explorar notícias"
  onAction={goToFeed}
/>
```

### ErrorBoundary

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Algo deu errado"
      subtitle="Ocorreu um erro inesperado."
      actionLabel="Tentar novamente"
      onAction={resetErrorBoundary}
    />
  );
}

// Uso
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <FeedScreen />
</ErrorBoundary>
```

### Skeleton List

```typescript
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} delay={index * 100} />
      ))}
    </View>
  );
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <Animated.View entering={FadeIn.delay(delay)} style={styles.card}>
      <Skeleton width="100%" height={180} borderRadius={12} />
      <View style={{ marginTop: 12 }}>
        <Skeleton width="100%" height={20} />
      </View>
      <View style={{ marginTop: 8 }}>
        <Skeleton width="70%" height={20} />
      </View>
      <View style={{ marginTop: 8 }}>
        <Skeleton width="40%" height={16} />
      </View>
    </Animated.View>
  );
}
```

---

## Resumo de Estados

| Estado | Ícone | Título | Ação |
|--------|-------|--------|------|
| Sem internet | 📡 | Sem conexão | Tentar novamente |
| Erro no feed | ⚠️ | Algo deu errado | Tentar novamente |
| Timeout | ⏱️ | Demorou demais | Tentar novamente |
| Feed vazio | 📰 | Nada por aqui | Atualizar |
| Sem bookmarks | 🔖 | Nenhum salvo | Explorar |
| Sem likes | ⭐ | Nenhum curtido | Explorar |
| Servidor offline | 🔧 | Em manutenção | - |
| Sessão expirada | 🔐 | Sessão expirada | Fazer login |


