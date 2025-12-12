# ⚡ Guia de Performance - Expo & React Native

> Guia completo para construir um app de notícias otimizado, rápido e fluido usando Expo.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Configuração Inicial](#-configuração-inicial)
3. [Otimização de Listas](#-otimização-de-listas)
4. [Otimização de Imagens](#-otimização-de-imagens)
5. [Prevenção de Re-renders](#-prevenção-de-re-renders)
6. [Gerenciamento de Estado](#-gerenciamento-de-estado)
7. [Animações Performáticas](#-animações-performáticas)
8. [Carregamento e Bundle](#-carregamento-e-bundle)
9. [Monitoramento e Profiling](#-monitoramento-e-profiling)
10. [Checklist Final](#-checklist-final)

---

## 🎯 Visão Geral

### Metas de Performance

| Métrica | Meta | Crítico |
|---------|------|---------|
| **Time to Interactive (TTI)** | < 3s | < 5s |
| **Frame Rate** | 60 FPS | > 45 FPS |
| **Memory Usage** | < 150MB | < 250MB |
| **Bundle Size** | < 15MB | < 25MB |
| **Scroll Performance** | Sem jank | Mínimo jank |

### Arquitetura de Performance

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CAMADAS DE OTIMIZAÇÃO                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   🔧 CONFIGURAÇÃO                                                   │
│   ├── Hermes Engine (JavaScript otimizado)                          │
│   ├── New Architecture (Fabric + TurboModules)                      │
│   └── Tree Shaking (redução de bundle)                              │
│                                                                      │
│   📱 RUNTIME                                                        │
│   ├── FlashList (listas virtualizadas)                              │
│   ├── expo-image (imagens otimizadas)                               │
│   ├── React.memo (prevenção de re-render)                           │
│   └── Zustand (estado minimalista)                                  │
│                                                                      │
│   🎨 UI/UX                                                          │
│   ├── Reanimated 3 (animações nativas)                              │
│   ├── Skeleton loading (percepção de velocidade)                    │
│   └── Prefetch (antecipação de dados)                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuração Inicial

### 1. Expo SDK 52+ (Recomendado)

```bash
# Criar novo projeto com SDK mais recente
npx create-expo-app@latest news-app
cd news-app

# Atualizar projeto existente
npx expo install expo@latest
```

### 2. Habilitar Hermes Engine

O Hermes é um motor JavaScript otimizado que:
- ✅ Reduz tempo de inicialização em ~50%
- ✅ Diminui uso de memória em ~30%
- ✅ Melhora tempo de execução

**app.json:**
```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

> ⚠️ No Expo SDK 48+, Hermes já é o padrão!

### 3. New Architecture (Fabric + TurboModules)

A nova arquitetura do React Native oferece:
- ✅ Renderização síncrona (Fabric)
- ✅ Lazy loading de módulos nativos (TurboModules)
- ✅ Comunicação mais rápida JS ↔ Nativo

**app.json:**
```json
{
  "expo": {
    "experiments": {
      "reactCompiler": true
    },
    "newArchEnabled": true
  }
}
```

### 4. Dependências Otimizadas

```bash
# Listas performáticas
npx expo install @shopify/flash-list

# Imagens otimizadas
npx expo install expo-image

# Animações nativas
npx expo install react-native-reanimated

# Gestos
npx expo install react-native-gesture-handler

# Estado minimalista
npm install zustand

# Skeletons
npm install moti

# Haptics
npx expo install expo-haptics
```

### 5. babel.config.js Otimizado

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated DEVE ser o último
      'react-native-reanimated/plugin',
    ],
  };
};
```

---

## 📜 Otimização de Listas

### FlashList vs FlatList

| Aspecto | FlatList | FlashList |
|---------|----------|-----------|
| **Performance** | Boa | 5-10x melhor |
| **Memória** | Alta | Baixa |
| **Recycling** | Não | Sim |
| **Blank Areas** | Comum | Raro |

### Configuração Ideal do FlashList

```tsx
import { FlashList } from '@shopify/flash-list';

function ArticleFeed({ articles }: { articles: Article[] }) {
  return (
    <FlashList
      data={articles}
      renderItem={({ item }) => <ArticleCard article={item} />}
      
      // CRÍTICO: Estimativa de tamanho do item
      estimatedItemSize={320}
      
      // Performance
      removeClippedSubviews={true}
      
      // Scroll suave
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      
      // Pré-carregamento (quantos itens extras renderizar)
      drawDistance={500}
      
      // Threshold para carregar mais (0.5 = 50% antes do fim)
      onEndReachedThreshold={0.5}
      onEndReached={loadMore}
      
      // Keyboard
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      
      // Key extractor
      keyExtractor={(item) => item.id.toString()}
    />
  );
}
```

### Otimizações Avançadas de Lista

```tsx
// 1. Pre-calculate item layouts (se altura for fixa)
const getItemLayout = useCallback((data: any, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
}), []);

// 2. Extrair renderItem para fora (evita recriação)
const renderItem = useCallback(({ item, index }: { item: Article; index: number }) => (
  <ArticleCard article={item} position={index} />
), []);

// 3. Memoizar componente do item
const ArticleCard = React.memo(({ article, position }: ArticleCardProps) => {
  // ... renderização
});

// 4. Usar windowSize para controlar renderização
<FlashList
  // ... outras props
  overrideItemLayout={(layout, item, index, maxColumns, extraData) => {
    // Customize layout por item se necessário
    layout.size = item.is_featured ? 400 : 320;
  }}
/>
```

### Evitar Erros Comuns em Listas

```tsx
// ❌ ERRADO: Função inline (recria a cada render)
<FlashList
  renderItem={({ item }) => <Card item={item} onPress={() => handlePress(item)} />}
/>

// ✅ CORRETO: Função memoizada
const handlePress = useCallback((item: Article) => {
  navigation.navigate('Article', { id: item.id });
}, [navigation]);

const renderItem = useCallback(({ item }: { item: Article }) => (
  <Card item={item} onPress={handlePress} />
), [handlePress]);

<FlashList renderItem={renderItem} />
```

---

## 🖼️ Otimização de Imagens

### expo-image (Recomendado)

O `expo-image` é superior ao `Image` nativo porque:
- ✅ Cache automático em disco e memória
- ✅ Lazy loading integrado
- ✅ Suporte a blurhash/thumbhash (placeholder)
- ✅ Transições suaves
- ✅ Suporte a WebP, AVIF, SVG

```tsx
import { Image } from 'expo-image';

// Placeholder com blurhash
const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

function ArticleImage({ url }: { url: string }) {
  return (
    <Image
      source={{ uri: url }}
      style={styles.image}
      
      // Placeholder enquanto carrega
      placeholder={blurhash}
      
      // Transição suave
      transition={200}
      
      // Content fit
      contentFit="cover"
      
      // Cache agressivo
      cachePolicy="memory-disk"
      
      // Prioridade de carregamento
      priority="high" // ou "low" para imagens fora da viewport
      
      // Recycling (para listas)
      recyclingKey={url}
    />
  );
}
```

### Prefetch de Imagens

```tsx
import { Image } from 'expo-image';

// Prefetch das próximas N imagens
async function prefetchImages(articles: Article[], count = 5) {
  const urls = articles
    .slice(0, count)
    .map(a => a.image_url)
    .filter(Boolean);
  
  await Promise.all(
    urls.map(url => Image.prefetch(url))
  );
}

// Uso no feed
useEffect(() => {
  if (articles.length > 0) {
    const nextArticles = articles.slice(currentIndex + 1, currentIndex + 6);
    prefetchImages(nextArticles);
  }
}, [articles, currentIndex]);
```

### Otimização de Formato

```tsx
// Preferir WebP (30-50% menor que JPEG)
const optimizedUrl = useMemo(() => {
  if (!imageUrl) return null;
  
  // Se usar CDN como Cloudinary, Imgix, etc.
  return `${imageUrl}?format=webp&quality=80&width=400`;
}, [imageUrl]);
```

### Placeholder com Blurhash

```tsx
import { Image } from 'expo-image';

// Gerar blurhash no backend e enviar junto com artigo
interface Article {
  id: number;
  title: string;
  image_url: string;
  image_blurhash?: string; // "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
}

function ArticleImage({ article }: { article: Article }) {
  return (
    <Image
      source={{ uri: article.image_url }}
      placeholder={article.image_blurhash}
      transition={300}
      style={styles.image}
    />
  );
}
```

---

## 🔄 Prevenção de Re-renders

### React.memo

```tsx
// Componente que NÃO deve re-renderizar a menos que props mudem
const ArticleCard = React.memo(function ArticleCard({ 
  article, 
  onPress 
}: ArticleCardProps) {
  return (
    <TouchableOpacity onPress={() => onPress(article.id)}>
      <Text>{article.title}</Text>
    </TouchableOpacity>
  );
});

// Com comparação customizada
const ArticleCard = React.memo(
  function ArticleCard({ article, onPress }: ArticleCardProps) {
    return (/* ... */);
  },
  (prevProps, nextProps) => {
    // Retorna true se props são iguais (não re-renderiza)
    return prevProps.article.id === nextProps.article.id &&
           prevProps.article.is_liked === nextProps.article.is_liked;
  }
);
```

### useCallback

```tsx
function ArticleFeed() {
  // ❌ ERRADO: Nova função a cada render
  const handlePress = (id: number) => {
    navigation.navigate('Article', { id });
  };
  
  // ✅ CORRETO: Função memoizada
  const handlePress = useCallback((id: number) => {
    navigation.navigate('Article', { id });
  }, [navigation]);
  
  // ✅ CORRETO: Para ações que não dependem de parâmetros
  const handleRefresh = useCallback(async () => {
    await fetchArticles();
  }, [fetchArticles]);
  
  return (
    <FlashList
      renderItem={({ item }) => (
        <ArticleCard article={item} onPress={handlePress} />
      )}
    />
  );
}
```

### useMemo

```tsx
function ArticleFeed({ articles, filter }: Props) {
  // ❌ ERRADO: Filtra a cada render
  const filteredArticles = articles.filter(a => a.category === filter);
  
  // ✅ CORRETO: Só recalcula quando articles ou filter mudam
  const filteredArticles = useMemo(() => {
    return articles.filter(a => a.category === filter);
  }, [articles, filter]);
  
  // ✅ Para cálculos pesados
  const articleStats = useMemo(() => {
    return {
      total: articles.length,
      byCategory: groupBy(articles, 'category'),
      avgReadTime: calculateAvgReadTime(articles),
    };
  }, [articles]);
  
  return <FlashList data={filteredArticles} />;
}
```

### Evitar Funções Inline

```tsx
// ❌ ERRADO: Cria nova função a cada render
<Button onPress={() => setCount(count + 1)} />
<FlatList renderItem={({ item }) => <Item item={item} />} />

// ✅ CORRETO: Define fora ou usa useCallback
const increment = useCallback(() => setCount(c => c + 1), []);
const renderItem = useCallback(({ item }) => <Item item={item} />, []);

<Button onPress={increment} />
<FlatList renderItem={renderItem} />
```

### Evitar Objetos/Arrays Inline

```tsx
// ❌ ERRADO: Novo objeto a cada render
<View style={{ padding: 16, margin: 8 }} />
<Component data={[1, 2, 3]} />

// ✅ CORRETO: Usar StyleSheet ou constantes
const styles = StyleSheet.create({
  container: { padding: 16, margin: 8 }
});
const DATA = [1, 2, 3];

<View style={styles.container} />
<Component data={DATA} />
```

---

## 🗄️ Gerenciamento de Estado

### Zustand (Recomendado)

Zustand é mais performático que Redux porque:
- ✅ Sem boilerplate
- ✅ Re-renders seletivos automáticos
- ✅ Bundle menor (~1KB vs ~7KB do Redux)
- ✅ TypeScript nativo

```typescript
// stores/useArticleStore.ts
import { create } from 'zustand';

interface ArticleState {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setArticles: (articles: Article[]) => void;
  addArticles: (articles: Article[]) => void;
  likeArticle: (id: number) => void;
  bookmarkArticle: (id: number) => void;
}

export const useArticleStore = create<ArticleState>((set) => ({
  articles: [],
  isLoading: false,
  error: null,
  
  setArticles: (articles) => set({ articles }),
  
  addArticles: (newArticles) => set((state) => ({
    articles: [...state.articles, ...newArticles]
  })),
  
  likeArticle: (id) => set((state) => ({
    articles: state.articles.map(a => 
      a.id === id ? { ...a, is_liked: !a.is_liked } : a
    )
  })),
  
  bookmarkArticle: (id) => set((state) => ({
    articles: state.articles.map(a => 
      a.id === id ? { ...a, is_bookmarked: !a.is_bookmarked } : a
    )
  })),
}));
```

### Seletores para Performance

```typescript
// ❌ ERRADO: Re-renderiza sempre que qualquer coisa muda
function Component() {
  const { articles, isLoading, error } = useArticleStore();
  // ...
}

// ✅ CORRETO: Só re-renderiza quando 'articles' muda
function Component() {
  const articles = useArticleStore((state) => state.articles);
  // ...
}

// ✅ CORRETO: Múltiplos seletores
function Component() {
  const articles = useArticleStore((state) => state.articles);
  const isLoading = useArticleStore((state) => state.isLoading);
  // ...
}

// ✅ CORRETO: Seletor derivado (shallow comparison)
import { shallow } from 'zustand/shallow';

function Component() {
  const { articles, isLoading } = useArticleStore(
    (state) => ({ articles: state.articles, isLoading: state.isLoading }),
    shallow
  );
}
```

### Separar Stores por Domínio

```typescript
// stores/useUserStore.ts
export const useUserStore = create<UserState>((set) => ({
  user: null,
  preferences: [],
  // ...
}));

// stores/useArticleStore.ts
export const useArticleStore = create<ArticleState>((set) => ({
  articles: [],
  // ...
}));

// stores/useTrackingStore.ts
export const useTrackingStore = create<TrackingState>((set) => ({
  sessionId: null,
  queue: [],
  // ...
}));
```

---

## 🎬 Animações Performáticas

### react-native-reanimated 3

Reanimated executa animações na **thread nativa**, sem bloquear a thread JS.

```tsx
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  Extrapolation 
} from 'react-native-reanimated';

function AnimatedCard({ article }: { article: Article }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };
  
  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* ... */}
      </Animated.View>
    </Pressable>
  );
}
```

### Animação de Like (Bounce)

```tsx
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence,
  withSpring 
} from 'react-native-reanimated';

function LikeButton({ isLiked, onPress }: LikeButtonProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = () => {
    // Bounce animation
    scale.value = withSequence(
      withSpring(0.8, { damping: 10 }),
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    
    onPress();
  };
  
  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <Ionicons 
          name={isLiked ? 'star' : 'star-outline'} 
          size={24} 
          color={isLiked ? '#FFD60A' : '#636366'} 
        />
      </Animated.View>
    </Pressable>
  );
}
```

### Skeleton Loading Animado

```tsx
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';

function SkeletonCard() {
  return (
    <MotiView style={styles.card}>
      <Skeleton 
        colorMode="dark" 
        width="100%" 
        height={180} 
        radius={12}
      />
      <MotiView style={styles.content}>
        <Skeleton colorMode="dark" width="30%" height={14} radius={4} />
        <Skeleton colorMode="dark" width="100%" height={18} radius={4} />
        <Skeleton colorMode="dark" width="80%" height={18} radius={4} />
      </MotiView>
    </MotiView>
  );
}

// Shimmer customizado (sem moti)
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

function Shimmer({ width, height }: { width: number; height: number }) {
  const translateX = useSharedValue(-width);
  
  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, { duration: 1500 }),
      -1, // infinite
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return (
    <View style={[styles.shimmer, { width, height }]}>
      <Animated.View style={[styles.shimmerOverlay, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
```

### Animação de Entrada de Lista

```tsx
import Animated, { 
  useAnimatedStyle, 
  withDelay, 
  withSpring,
  FadeInDown 
} from 'react-native-reanimated';

function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={styles.card}
    >
      {/* ... */}
    </Animated.View>
  );
}

// OU manualmente
function ArticleCard({ article, index }: { article: Article; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    const delay = index * 50;
    opacity.value = withDelay(delay, withSpring(1));
    translateY.value = withDelay(delay, withSpring(0));
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* ... */}
    </Animated.View>
  );
}
```

---

## 📦 Carregamento e Bundle

### Lazy Loading de Telas

```tsx
import { lazy, Suspense } from 'react';

// Carrega tela apenas quando necessário
const ArticleScreen = lazy(() => import('./screens/ArticleScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Article" component={ArticleScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </Suspense>
  );
}
```

### Preload de Assets na Splash

```tsx
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Mantém splash visível enquanto carrega
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Preload fonts
        await Font.loadAsync({
          'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
          'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
          'Playfair-Bold': require('./assets/fonts/Playfair-Bold.ttf'),
        });
        
        // Preload images críticas
        await Asset.loadAsync([
          require('./assets/logo.png'),
          require('./assets/placeholder.png'),
        ]);
        
        // Preload dados iniciais (opcional)
        await prefetchInitialData();
        
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Navigation />
    </View>
  );
}
```

### Otimização de Bundle

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tree shaking melhorado
config.transformer.minifierConfig = {
  keep_classnames: false,
  keep_fnames: false,
  mangle: {
    toplevel: true,
  },
  output: {
    ascii_only: true,
    wrap_iife: true,
  },
};

module.exports = config;
```

### Analisar Bundle Size

```bash
# Gera relatório de tamanho do bundle
npx expo export --dump-sourcemap

# Visualizar
npx source-map-explorer dist/bundles/ios-*.js
```

---

## 📊 Monitoramento e Profiling

### React DevTools Profiler

```bash
# Instalar React DevTools
npm install -g react-devtools

# Executar
react-devtools
```

### Performance Monitor Nativo

```tsx
// Ativar FPS monitor em desenvolvimento
import { LogBox } from 'react-native';

if (__DEV__) {
  // Mostra FPS e outras métricas
  const { connectToDevTools } = require('react-devtools-core');
  connectToDevTools({
    host: 'localhost',
    port: 8097,
  });
}
```

### Custom Performance Hooks

```tsx
// hooks/useRenderCount.ts
import { useRef } from 'react';

export function useRenderCount(componentName: string) {
  const count = useRef(0);
  count.current++;
  
  if (__DEV__) {
    console.log(`[${componentName}] Render #${count.current}`);
  }
  
  return count.current;
}

// hooks/usePerformance.ts
export function usePerformance(label: string) {
  const startTime = useRef(Date.now());
  
  useEffect(() => {
    const duration = Date.now() - startTime.current;
    if (__DEV__) {
      console.log(`[PERF] ${label}: ${duration}ms`);
    }
  }, []);
}

// Uso
function ArticleFeed() {
  useRenderCount('ArticleFeed');
  usePerformance('ArticleFeed mount');
  
  return (/* ... */);
}
```

### Flipper (Debug)

```bash
# Instalar Flipper
# https://fbflipper.com/

# Adicionar ao projeto
npx expo install react-native-flipper
```

---

## ✅ Checklist Final

### Configuração

- [ ] Expo SDK 52+
- [ ] Hermes Engine ativo
- [ ] New Architecture habilitada
- [ ] babel.config.js com reanimated plugin

### Listas

- [ ] Usar `@shopify/flash-list` em vez de FlatList
- [ ] Definir `estimatedItemSize`
- [ ] Memoizar `renderItem` com `useCallback`
- [ ] Memoizar componentes de item com `React.memo`
- [ ] Usar `keyExtractor` correto

### Imagens

- [ ] Usar `expo-image` em vez de Image
- [ ] Implementar placeholders (blurhash)
- [ ] Prefetch de imagens próximas
- [ ] Usar formato WebP quando possível
- [ ] Cache policy configurado

### Re-renders

- [ ] `React.memo` em componentes de lista
- [ ] `useCallback` para funções passadas como props
- [ ] `useMemo` para cálculos pesados
- [ ] Evitar funções/objetos inline
- [ ] StyleSheet fora do componente

### Estado

- [ ] Zustand como gerenciador de estado
- [ ] Seletores específicos (não pegar estado inteiro)
- [ ] Stores separadas por domínio
- [ ] Shallow comparison quando necessário

### Animações

- [ ] Usar react-native-reanimated 3
- [ ] `useNativeDriver: true` para Animated API
- [ ] Animações de entrada com stagger
- [ ] Skeleton loading com shimmer

### Carregamento

- [ ] Preload de fonts na splash
- [ ] Preload de assets críticos
- [ ] Lazy loading de telas secundárias
- [ ] Prefetch de dados

### Bundle

- [ ] Tree shaking configurado
- [ ] Analisar bundle size periodicamente
- [ ] Remover dependências não usadas

---

## 📈 Métricas de Sucesso

Após implementar todas as otimizações:

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| TTI | 4-6s | < 2s | < 3s ✅ |
| FPS scroll | 40-50 | 58-60 | 60 ✅ |
| Memória | 200-300MB | 100-150MB | < 150MB ✅ |
| Bundle | 25-30MB | 12-15MB | < 15MB ✅ |

---

## 📚 Recursos Adicionais

- [Expo Performance Guide](https://docs.expo.dev/guides/performance/)
- [FlashList Documentation](https://shopify.github.io/flash-list/)
- [expo-image Documentation](https://docs.expo.dev/versions/latest/sdk/image/)
- [Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Native Performance](https://reactnative.dev/docs/performance)

---

**Versão:** 1.0.0  
**Data:** 2025-12-11

