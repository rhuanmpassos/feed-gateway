# 🃏 Cards

> Especificação completa dos cards de artigo

---

## Índice

1. [Card Padrão](#card-padrão)
2. [Card Compacto](#card-compacto)
3. [Card Breaking News](#card-breaking-news)
4. [Card Skeleton](#card-skeleton)
5. [Card Erro](#card-erro)

---

## Card Padrão

### Anatomia

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │                               │  │
│  │         IMAGEM                │  │  ← 180px, ratio 16:9
│  │        (expo-image)           │  │     borderRadius: 12
│  │                               │  │
│  └───────────────────────────────┘  │
│              ↑ 12px ↓               │
│  ┌────────┐                         │
│  │URGENTE │ (opcional)              │  ← Badge
│  └────────┘                         │
│              ↑ 8px ↓                │
│  Título do artigo que pode         │  ← 18px, Playfair SemiBold
│  ocupar até 2 linhas máximo        │     maxLines: 2
│              ↑ 8px ↓                │
│  Folha de S.Paulo • 5 min          │  ← 12px, Inter, #636366
│              ↑ 12px ↓               │
│  ⭐         🔖         ↗️           │  ← Ações
│              ↑ 16px ↓               │
└─────────────────────────────────────┘
     bg: #141416
     borderRadius: 16px
     padding: 16px
```

### Especificações

| Elemento | Propriedade | Valor |
|----------|-------------|-------|
| Container | background | `#141416` |
| | borderRadius | `16px` |
| | padding | `16px` |
| | marginBottom | `16px` |
| Imagem | height | `180px` |
| | aspectRatio | `16/9` |
| | borderRadius | `12px` |
| | placeholder | blurhash |
| Badge | marginTop | `12px` |
| | (ver componente Badge) | |
| Título | fontSize | `18px` |
| | fontFamily | PlayfairDisplay-SemiBold |
| | color | `#FFFFFF` |
| | lineHeight | `24px` |
| | maxLines | `2` |
| | marginTop | `8px` |
| Metadata | fontSize | `12px` |
| | fontFamily | Inter-Regular |
| | color | `#636366` |
| | marginTop | `8px` |
| Ações | marginTop | `12px` |
| | gap | `24px` |
| | justifyContent | `space-around` |

### Código Completo

```typescript
interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    image_url?: string;
    source_name: string;
    published_at: string;
    is_breaking?: boolean;
    is_wildcard?: boolean;
    time_since_published?: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
  onPress: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = React.memo(({
  article,
  isLiked,
  isBookmarked,
  onPress,
  onLike,
  onBookmark,
  onShare,
}) => {
  const getBadge = () => {
    if (article.is_breaking) return { type: 'urgent', text: 'URGENTE' };
    if (article.is_wildcard) return { type: 'discovery', text: '💡 Descoberta' };
    if (article.time_since_published < 30) return { type: 'now', text: 'AGORA' };
    if (article.time_since_published < 120) return { type: 'new', text: 'NOVO' };
    return null;
  };

  const badge = getBadge();
  const timeAgo = formatTimeAgo(article.published_at);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: '#141416',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {/* Imagem */}
      {article.image_url && (
        <Image
          source={{ uri: article.image_url }}
          style={{
            height: 180,
            borderRadius: 12,
          }}
          placeholder={blurhash}
          contentFit="cover"
          transition={200}
        />
      )}

      {/* Badge */}
      {badge && (
        <View style={{ marginTop: 12 }}>
          <Badge type={badge.type}>{badge.text}</Badge>
        </View>
      )}

      {/* Título */}
      <Text
        numberOfLines={2}
        style={{
          marginTop: 8,
          fontSize: 18,
          fontFamily: 'PlayfairDisplay-SemiBold',
          color: '#FFFFFF',
          lineHeight: 24,
        }}
      >
        {article.title}
      </Text>

      {/* Metadata */}
      <Text
        style={{
          marginTop: 8,
          fontSize: 12,
          fontFamily: 'Inter-Regular',
          color: '#636366',
        }}
      >
        {article.source_name} • {timeAgo}
      </Text>

      {/* Ações */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: 12,
        }}
      >
        <ActionButton
          icon="star"
          active={isLiked}
          activeColor="#FFD60A"
          onPress={onLike}
        />
        <ActionButton
          icon="bookmark"
          active={isBookmarked}
          activeColor="#007AFF"
          onPress={onBookmark}
        />
        <ActionButton
          icon="share"
          onPress={onShare}
        />
      </View>
    </Pressable>
  );
});
```

### Action Button Detalhado

```typescript
interface ActionButtonProps {
  icon: 'star' | 'bookmark' | 'share';
  active?: boolean;
  activeColor?: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  active,
  activeColor = '#FFFFFF',
  onPress,
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(1.2, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const icons = {
    star: active ? '⭐' : '☆',
    bookmark: active ? '🔖' : '🏷️',
    share: '↗️',
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <Text
          style={{
            fontSize: 24,
            color: active ? activeColor : '#636366',
          }}
        >
          {icons[icon]}
        </Text>
      </Animated.View>
    </Pressable>
  );
};
```

---

## Card Compacto

Para listas densas (Agora, Salvos).

### Anatomia

```
┌─────────────────────────────────────────────────────┐
│  ┌───────┐                                          │
│  │       │  Título do artigo que pode ocupar       │
│  │  IMG  │  até duas linhas no layout...           │
│  │ 60x60 │                                          │
│  │       │  G1 • 5 min                    ⭐ 🔖    │
│  └───────┘                                          │
└─────────────────────────────────────────────────────┘
    bg: #141416
    padding: 12px
    borderRadius: 12px
```

### Código

```typescript
const CompactCard: React.FC<ArticleCardProps> = React.memo(({
  article,
  isLiked,
  isBookmarked,
  onPress,
  onLike,
  onBookmark,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        backgroundColor: '#141416',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        marginHorizontal: 16,
      }}
    >
      {/* Thumbnail */}
      <Image
        source={{ uri: article.image_url }}
        style={{
          width: 60,
          height: 60,
          borderRadius: 8,
        }}
        contentFit="cover"
      />

      {/* Content */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 14,
            fontFamily: 'Inter-Medium',
            color: '#FFFFFF',
            lineHeight: 20,
          }}
        >
          {article.title}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: '#636366' }}>
            {article.source_name} • {formatTimeAgo(article.published_at)}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <SmallActionButton
              icon="star"
              active={isLiked}
              onPress={onLike}
            />
            <SmallActionButton
              icon="bookmark"
              active={isBookmarked}
              onPress={onBookmark}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
});
```

---

## Card Breaking News

Estilo especial para urgência máxima.

### Anatomia

```
┌─────────────────────────────────────────────────────┐
│ ▌                                                   │
│ ▌  ┌────────┐                                       │
│ ▌  │URGENTE │  Congresso aprova reforma tributária │
│ ▌  └────────┘  em votação histórica de 48 horas    │
│ ▌                                                   │
│ ▌              G1 • agora                          │
│ ▌                                                   │
└─────────────────────────────────────────────────────┘
    borderLeft: 3px solid #FF3B30
    bg: #1C1C1E
    padding: 12px 16px
```

### Código

```typescript
const BreakingCard: React.FC<{ article: Article; onPress: () => void }> = ({
  article,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#1C1C1E',
        borderLeftWidth: 3,
        borderLeftColor: '#FF3B30',
        padding: 12,
        paddingLeft: 16,
        marginBottom: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Badge type="urgent">URGENTE</Badge>

        <Text
          numberOfLines={2}
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 14,
            fontFamily: 'Inter-Medium',
            color: '#FFFFFF',
            lineHeight: 20,
          }}
        >
          {article.title}
        </Text>
      </View>

      <Text
        style={{
          marginTop: 4,
          fontSize: 12,
          color: '#636366',
        }}
      >
        {article.source_name} • agora
      </Text>
    </Pressable>
  );
};
```

---

## Card Skeleton

Estado de loading.

### Anatomia

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  │
│  │░░░░░░░░░░ shimmer ░░░░░░░░░░░│  │  ← 180px
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  │
│  └───────────────────────────────┘  │
│              ↑ 12px ↓               │
│  ┌────────────────────────────┐     │
│  │████████████████████████████│     │  ← título linha 1
│  └────────────────────────────┘     │
│  ┌──────────────────┐               │
│  │██████████████████│               │  ← título linha 2
│  └──────────────────┘               │
│              ↑ 8px ↓                │
│  ┌─────────────┐                    │
│  │█████████████│                    │  ← metadata
│  └─────────────┘                    │
└─────────────────────────────────────┘
```

### Código

```typescript
const SkeletonCard: React.FC = () => {
  return (
    <View
      style={{
        backgroundColor: '#141416',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16,
      }}
    >
      <Skeleton width="100%" height={180} borderRadius={12} />

      <View style={{ marginTop: 12 }}>
        <Skeleton width="100%" height={20} borderRadius={4} />
      </View>

      <View style={{ marginTop: 8 }}>
        <Skeleton width="70%" height={20} borderRadius={4} />
      </View>

      <View style={{ marginTop: 8 }}>
        <Skeleton width="40%" height={16} borderRadius={4} />
      </View>
    </View>
  );
};

// Lista de skeletons
const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
};
```

---

## Card Erro

Para quando falha o carregamento individual.

### Anatomia

```
┌─────────────────────────────────────┐
│                                     │
│              ⚠️                     │
│                                     │
│    Não foi possível carregar        │
│                                     │
│         [Tentar novamente]          │
│                                     │
└─────────────────────────────────────┘
```

### Código

```typescript
const ErrorCard: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <View
      style={{
        backgroundColor: '#141416',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        marginHorizontal: 16,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 32 }}>⚠️</Text>

      <Text
        style={{
          marginTop: 8,
          fontSize: 14,
          color: '#A1A1A6',
          textAlign: 'center',
        }}
      >
        Não foi possível carregar
      </Text>

      <Pressable
        onPress={onRetry}
        style={{
          marginTop: 12,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
          backgroundColor: '#1C1C1E',
        }}
      >
        <Text style={{ color: '#007AFF', fontSize: 14 }}>
          Tentar novamente
        </Text>
      </Pressable>
    </View>
  );
};
```

---

## Animações

### Entrada do Card

```typescript
const entering = FadeInDown.duration(300).springify();

<Animated.View entering={entering}>
  <ArticleCard {...props} />
</Animated.View>
```

### Press Feedback

```typescript
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(pressed ? 0.98 : 1) }],
  opacity: withTiming(pressed ? 0.9 : 1, { duration: 100 }),
}));
```

### Like Animation

```typescript
// Estrela pulsa e gira quando ativada
const likeAnimation = () => {
  scale.value = withSequence(
    withTiming(0.8, { duration: 100 }),
    withSpring(1.3, { damping: 4 }),
    withSpring(1)
  );
  rotation.value = withSequence(
    withTiming(-15, { duration: 100 }),
    withTiming(15, { duration: 100 }),
    withSpring(0)
  );
};
```


