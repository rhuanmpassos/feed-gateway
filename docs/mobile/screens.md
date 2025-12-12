# 📱 Telas do App

> Especificação completa de todas as telas

---

## Índice

1. [Splash Screen](#1-splash-screen)
2. [Onboarding - Proposta](#2-onboarding---proposta)
3. [Onboarding - Categorias](#3-onboarding---categorias)
4. [Onboarding - Notificações](#4-onboarding---notificações)
5. [Para Você (Feed)](#5-para-você-feed)
6. [Agora (Cronológico)](#6-agora-cronológico)
7. [Salvos (Bookmarks)](#7-salvos-bookmarks)
8. [Perfil](#8-perfil)
9. [Artigo (WebView)](#9-artigo-webview)
10. [Editar Interesses](#10-editar-interesses)
11. [Configurar Notificações](#11-configurar-notificações)

---

## 1. Splash Screen

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│              STATUS BAR             │
│          (hidden ou light)          │
│                                     │
│                                     │
│                                     │
│               ┌─────┐               │
│               │     │               │
│               │ 📰  │  ← Logo       │
│               │     │    (fade in)  │
│               └─────┘               │
│                                     │
│            Nome do App              │
│         (fade in com delay)         │
│                                     │
│                                     │
│              ○ ○ ○                  │
│         (loading dots)              │
│                                     │
└─────────────────────────────────────┘

Fundo: #0A0A0B
Logo: Branco ou accent
Duração: 2-3 segundos
```

### Lógica

```typescript
// screens/SplashScreen.tsx
export function SplashScreen() {
  const navigation = useNavigation();
  
  useEffect(() => {
    async function bootstrap() {
      // 1. Carregar fonts
      await Font.loadAsync({ ... });
      
      // 2. Carregar assets
      await Asset.loadAsync([ ... ]);
      
      // 3. Verificar usuário
      const userId = await AsyncStorage.getItem('user_id');
      const hasCompletedOnboarding = await AsyncStorage.getItem('onboarding_complete');
      
      // 4. Navegar
      if (userId && hasCompletedOnboarding) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      }
    }
    
    bootstrap();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image source={logo} entering={FadeIn.duration(500)} />
      <Animated.Text entering={FadeIn.delay(300)}>App Name</Animated.Text>
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}
```

---

## 2. Onboarding - Proposta

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│               ┌─────┐               │
│               │ 📰  │               │
│               └─────┘               │
│                                     │
│       Notícias que importam         │
│       ─────────────────────         │
│                                     │
│    Curadas por IA, personalizadas   │
│    para você. Sem ruído, sem        │
│    clickbait, só o que interessa.   │
│                                     │
│                                     │
│      ┌─────────────────────────┐    │
│      │      Começar →          │    │
│      └─────────────────────────┘    │
│                                     │
│           Já tenho conta            │
│                                     │
│              ○ ● ○                  │
│                                     │
└─────────────────────────────────────┘
```

### Código

```typescript
export function OnboardingWelcomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.delay(200)}>
          <Text style={styles.icon}>📰</Text>
        </Animated.View>
        
        <Animated.Text entering={FadeInUp.delay(400)} style={styles.title}>
          Notícias que importam
        </Animated.Text>
        
        <Animated.Text entering={FadeInUp.delay(600)} style={styles.subtitle}>
          Curadas por IA, personalizadas para você. 
          Sem ruído, sem clickbait, só o que interessa.
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <Button onPress={() => navigation.navigate('Categories')}>
          Começar →
        </Button>
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Já tenho conta</Text>
        </TouchableOpacity>
        
        <PageIndicator current={0} total={3} />
      </View>
    </SafeAreaView>
  );
}
```

---

## 3. Onboarding - Categorias

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  ←  (voltar)            Pular →     │
│                                     │
│    O que te interessa?              │
│    ────────────────────             │
│                                     │
│    Selecione pelo menos 3           │
│    categorias.                      │
│                                     │
│    ┌──────────────┐  ┌──────────────┐
│    │ 🏛️ Política  │  │ 💰 Economia  │
│    │      ○       │  │      ✓      │
│    └──────────────┘  └──────────────┘
│                                     │
│    ┌──────────────┐  ┌──────────────┐
│    │ ⚽ Esportes  │  │ 💻 Tecnologia│
│    │      ✓      │  │      ✓       │
│    └──────────────┘  └──────────────┘
│                                     │
│    ┌──────────────┐  ┌──────────────┐
│    │ 🎬 Entreten. │  │ 🌍 Mundo     │
│    │      ○       │  │      ○       │
│    └──────────────┘  └──────────────┘
│                                     │
│      ┌─────────────────────────┐    │
│      │   Continuar (3/3) →     │    │
│      └─────────────────────────┘    │
│                                     │
│              ○ ○ ●                  │
│                                     │
└─────────────────────────────────────┘
```

### Código

```typescript
export function OnboardingCategoriesScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const { data: categories } = useCategories();
  const navigation = useNavigation();

  const toggleCategory = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id) 
        : [...prev, id]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const canContinue = selected.length >= 3;

  const handleContinue = async () => {
    await api.post('/users/preferences', { category_ids: selected });
    navigation.navigate('Notifications');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        leftAction={() => navigation.goBack()}
        rightLabel="Pular"
        rightAction={() => navigation.navigate('Notifications')}
      />

      <Text style={styles.title}>O que te interessa?</Text>
      <Text style={styles.subtitle}>Selecione pelo menos 3 categorias.</Text>

      <View style={styles.grid}>
        {categories?.map(category => (
          <Chip
            key={category.id}
            icon={category.icon}
            label={category.name}
            selected={selected.includes(category.id)}
            onPress={() => toggleCategory(category.id)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button 
          disabled={!canContinue} 
          onPress={handleContinue}
        >
          Continuar ({selected.length}/3) →
        </Button>
        <PageIndicator current={1} total={3} />
      </View>
    </SafeAreaView>
  );
}
```

---

## 4. Onboarding - Notificações

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  ←  (voltar)            Pular →     │
│                                     │
│                                     │
│               ┌─────┐               │
│               │ 🔔  │               │
│               └─────┘               │
│                                     │
│       Quer saber primeiro?          │
│       ────────────────────          │
│                                     │
│    Ative as notificações para       │
│    receber alertas de notícias      │
│    importantes na hora.             │
│                                     │
│                                     │
│      ┌─────────────────────────┐    │
│      │  Ativar Notificações    │    │
│      └─────────────────────────┘    │
│                                     │
│           Agora não                 │
│                                     │
│              ● ○ ○                  │
│                                     │
└─────────────────────────────────────┘
```

### Código

```typescript
export function OnboardingNotificationsScreen() {
  const navigation = useNavigation();

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    await AsyncStorage.setItem('notifications_enabled', status === 'granted' ? 'true' : 'false');
    finishOnboarding();
  };

  const skipNotifications = async () => {
    await AsyncStorage.setItem('notifications_enabled', 'false');
    finishOnboarding();
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        leftAction={() => navigation.goBack()}
        rightLabel="Pular"
        rightAction={skipNotifications}
      />

      <View style={styles.content}>
        <Text style={styles.icon}>🔔</Text>
        <Text style={styles.title}>Quer saber primeiro?</Text>
        <Text style={styles.subtitle}>
          Ative as notificações para receber alertas de notícias importantes na hora.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button onPress={requestPermission}>
          Ativar Notificações
        </Button>
        <TouchableOpacity onPress={skipNotifications}>
          <Text style={styles.link}>Agora não</Text>
        </TouchableOpacity>
        <PageIndicator current={2} total={3} />
      </View>
    </SafeAreaView>
  );
}
```

---

## 5. Para Você (Feed)

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  Para Você                      🔔  │
│  ──────────                         │
│                                     │
│  Bom dia! 👋                        │
│  ✨ Feito para você                 │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [CARD ARTIGO 1]                    │
│  - Imagem                           │
│  - Badge URGENTE                    │
│  - Título                           │
│  - Fonte • tempo                    │
│  - ⭐ 🔖 ↗️                          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [CARD ARTIGO 2]                    │
│  - Badge 💡 Descoberta              │
│  - ...                              │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [CARD ARTIGO 3]                    │
│  - ...                              │
│                                     │
│           ↓ scroll infinito ↓       │
│                                     │
├──────────┬──────────┬───────┬───────┤
│  Para    │  Agora   │ Salvos│ Perfil│
│  Você ●  │    ⚡    │   🔖  │   👤  │
└──────────┴──────────┴───────┴───────┘
```

### Código

```typescript
export function FeedScreen() {
  const { data, fetchNextPage, hasNextPage, isLoading, refetch } = useAddictiveFeed();
  const [refreshing, setRefreshing] = useState(false);
  const { startSession, endSession } = useSession();

  useEffect(() => {
    startSession();
    return () => endSession();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEndReached = () => {
    if (hasNextPage) fetchNextPage();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Para Você" rightIcon="bell" />
      
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          {getGreeting()}! 👋
        </Text>
        <Text style={styles.subGreeting}>✨ Feito para você</Text>
      </View>

      <FlashList
        data={data?.pages.flatMap(page => page.data) ?? []}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            onPress={() => handleArticlePress(item)}
            onLike={() => handleLike(item.id)}
            onBookmark={() => handleBookmark(item.id)}
            onShare={() => handleShare(item)}
          />
        )}
        estimatedItemSize={300}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
          />
        }
        ListEmptyComponent={isLoading ? <SkeletonList /> : <EmptyFeed />}
        ListFooterComponent={hasNextPage ? <LoadingMore /> : null}
      />
    </SafeAreaView>
  );
}
```

---

## 6. Agora (Cronológico)

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  Agora                          🔔  │
│  ─────                              │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  🔴 ACONTECENDO AGORA               │
│  ───────────────────                │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ▌ URGENTE  Congresso vota...    ││
│  │ ▌          G1 • 2 min           ││
│  ├─────────────────────────────────┤│
│  │ ▌ URGENTE  Dólar dispara...     ││
│  │ ▌          Folha • 5 min        ││
│  └─────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│                                     │
│  📰 ÚLTIMAS NOTÍCIAS                │
│  ──────────────────                 │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 19:45                           ││
│  │ [IMG] Apple anuncia novo...     ││
│  │       TechCrunch • agora        ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 19:30                           ││
│  │ [IMG] Seleção brasileira...     ││
│  │       ESPN • 15 min             ││
│  └─────────────────────────────────┘│
│                                     │
├──────────┬──────────┬───────┬───────┤
│  Para    │  Agora   │ Salvos│ Perfil│
│  Você    │    ⚡ ●  │   🔖  │   👤  │
└──────────┴──────────┴───────┴───────┘
```

### Código

```typescript
export function ChronologicalFeedScreen() {
  const { data: breaking } = useBreakingNews();
  const { data: chronological, fetchNextPage } = useChronologicalFeed();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Agora" />

      <FlashList
        data={chronological?.pages.flatMap(page => page.data) ?? []}
        renderItem={({ item }) => <CompactCard article={item} />}
        estimatedItemSize={80}
        onEndReached={fetchNextPage}
        ListHeaderComponent={
          <>
            {breaking && breaking.length > 0 && (
              <BreakingNewsSection articles={breaking} />
            )}
            <SectionTitle>📰 ÚLTIMAS NOTÍCIAS</SectionTitle>
          </>
        }
      />
    </SafeAreaView>
  );
}

function BreakingNewsSection({ articles }) {
  return (
    <View style={styles.breakingSection}>
      <SectionTitle>🔴 ACONTECENDO AGORA</SectionTitle>
      <View style={styles.breakingList}>
        {articles.map(article => (
          <BreakingCard key={article.id} article={article} />
        ))}
      </View>
    </View>
  );
}
```

---

## 7. Salvos (Bookmarks)

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  Salvos                         🔍  │
│  ──────                             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  📌 ARTIGOS SALVOS (12)             │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [IMG] Título do artigo salvo    ││
│  │       G1 • Salvo há 2 dias   🗑️ ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [IMG] Outro artigo salvo        ││
│  │       Folha • Salvo há 1 sem 🗑️ ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [IMG] Mais um artigo...         ││
│  │       TechCrunch • 1 mês    🗑️  ││
│  └─────────────────────────────────┘│
│                                     │
│                                     │
├──────────┬──────────┬───────┬───────┤
│  Para    │  Agora   │ Salvos│ Perfil│
│  Você    │    ⚡    │  🔖 ● │   👤  │
└──────────┴──────────┴───────┴───────┘
```

### Código

```typescript
export function BookmarksScreen() {
  const { data: bookmarks, isLoading } = useBookmarks();
  const removeBookmark = useRemoveBookmark();

  const handleSwipeDelete = (id: string) => {
    Alert.alert(
      'Remover bookmark',
      'Deseja remover este artigo dos salvos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => removeBookmark.mutate(id)
        },
      ]
    );
  };

  if (isLoading) return <SkeletonList />;

  if (!bookmarks?.length) return <EmptyBookmarks />;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Salvos" rightIcon="search" />
      
      <Text style={styles.count}>
        📌 ARTIGOS SALVOS ({bookmarks.length})
      </Text>

      <FlashList
        data={bookmarks}
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => handleSwipeDelete(item.id)}>
            <BookmarkCard article={item} />
          </SwipeableRow>
        )}
        estimatedItemSize={80}
      />
    </SafeAreaView>
  );
}
```

---

## 8. Perfil

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  Perfil                             │
│  ──────                             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│     ┌───────────┐                   │
│     │    👤     │  usuario@email    │
│     └───────────┘  Membro desde Dez │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  📊 SUAS ESTATÍSTICAS               │
│                                     │
│  ┌──────────┬──────────┬──────────┐ │
│  │   127    │    34    │    15    │ │
│  │  Lidos   │ Sessões  │   Dias   │ │
│  └──────────┴──────────┴──────────┘ │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ⚙️ CONFIGURAÇÕES                   │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 📂 Seus Interesses            → ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 🔔 Notificações               → ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 🌙 Tema                       → ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 📖 Histórico de Leitura       → ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🚪 Sair da Conta                ││
│  └─────────────────────────────────┘│
│                                     │
│           Versão 1.0.0              │
│                                     │
├──────────┬──────────┬───────┬───────┤
│  Para    │  Agora   │ Salvos│ Perfil│
│  Você    │    ⚡    │  🔖   │  👤 ● │
└──────────┴──────────┴───────┴───────┘
```

---

## 9. Artigo (WebView)

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  ←        g1.com.br              ⋮  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━ 45%       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │                                 ││
│  │           WEBVIEW               ││
│  │                                 ││
│  │    (conteúdo do site externo)   ││
│  │                                 ││
│  │                                 ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│                                     │
│     ⭐         🔖         ↗️        │
│    Like      Salvar   Compartilhar  │
│                                     │
└─────────────────────────────────────┘
```

### Código

```typescript
export function ArticleScreen({ route }) {
  const { articleId, articleUrl } = route.params;
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const startTime = useRef(Date.now());
  const { trackClick, trackView } = useTracking();

  useEffect(() => {
    // Track click ao abrir
    trackClick(articleId);

    return () => {
      // Track view ao fechar
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      trackView(articleId, duration);
    };
  }, []);

  const domain = new URL(articleUrl).hostname.replace('www.', '');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.domain} numberOfLines={1}>{domain}</Text>
        <Menu options={['Abrir no navegador', 'Copiar link']} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: articleUrl }}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        style={styles.webview}
      />

      {/* Footer Actions */}
      <View style={styles.footer}>
        <ActionButton icon="star" label="Like" onPress={handleLike} />
        <ActionButton icon="bookmark" label="Salvar" onPress={handleBookmark} />
        <ActionButton icon="share" label="Compartilhar" onPress={handleShare} />
      </View>
    </SafeAreaView>
  );
}
```

---

## 10. Editar Interesses

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  ←  Seus Interesses          Salvar │
│                                     │
├─────────────────────────────────────┤
│                                     │
│    Edite suas categorias favoritas  │
│    Mínimo de 3 selecionadas         │
│                                     │
│    (Grid de Chips - igual           │
│     ao Onboarding)                  │
│                                     │
│    ℹ️ Suas preferências afetam      │
│       o feed "Para Você"            │
│                                     │
└─────────────────────────────────────┘
```

---

## 11. Configurar Notificações

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  ←  Notificações                    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  🔔 NOTIFICAÇÕES PUSH               │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Notificações gerais         🔘  ││
│  │ Receba alertas de notícias      ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Breaking News                🔘  ││
│  │ Alertas de notícias urgentes    ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Suas categorias              🔘  ││
│  │ Novidades das suas preferências ││
│  └─────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ⏰ HORÁRIO DE SILÊNCIO             │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Não perturbe               🔘    ││
│  │ 22:00 - 08:00                   ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

---

## Estados de Erro e Vazios

Ver **[error-states.md](./error-states.md)** para documentação completa de todos os estados de erro, vazios e offline.


