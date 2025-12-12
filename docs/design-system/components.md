# 🧩 Componentes Base

> Componentes reutilizáveis do Design System

---

## Índice

1. [Button](#button)
2. [Badge](#badge)
3. [IconButton](#iconbutton)
4. [Toggle](#toggle)
5. [Input](#input)
6. [Chip](#chip)
7. [Avatar](#avatar)
8. [Skeleton](#skeleton)
9. [Toast](#toast)

---

## Button

### Variantes

| Variante | Background | Text | Border |
|----------|------------|------|--------|
| `primary` | `#FF3B30` | `#FFFFFF` | - |
| `secondary` | `#1C1C1E` | `#FFFFFF` | `#636366` |
| `ghost` | `transparent` | `#007AFF` | - |
| `danger` | `#FF3B30` | `#FFFFFF` | - |

### Tamanhos

| Size | Height | Font | Padding |
|------|--------|------|---------|
| `sm` | 36px | 14px | 12px |
| `md` | 44px | 16px | 16px |
| `lg` | 52px | 18px | 20px |

### Código

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  children: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  onPress,
  children,
}) => {
  const styles = {
    primary: { bg: '#FF3B30', text: '#FFFFFF' },
    secondary: { bg: '#1C1C1E', text: '#FFFFFF', border: '#636366' },
    ghost: { bg: 'transparent', text: '#007AFF' },
    danger: { bg: '#FF3B30', text: '#FFFFFF' },
  };

  const sizes = {
    sm: { height: 36, fontSize: 14, paddingHorizontal: 12 },
    md: { height: 44, fontSize: 16, paddingHorizontal: 16 },
    lg: { height: 52, fontSize: 18, paddingHorizontal: 20 },
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: styles[variant].bg,
          height: sizes[size].height,
          paddingHorizontal: sizes[size].paddingHorizontal,
          borderRadius: 12,
          opacity: pressed ? 0.8 : disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={styles[variant].text} />
      ) : (
        <Text style={{ color: styles[variant].text, fontSize: sizes[size].fontSize }}>
          {children}
        </Text>
      )}
    </Pressable>
  );
};
```

### Visual

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────────┐  │
│  │        Começar →              │  │  ← primary
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │        Cancelar               │  │  ← secondary
│  └───────────────────────────────┘  │
│                                     │
│          Pular etapa                │  ← ghost
│                                     │
│  ┌───────────────────────────────┐  │
│  │   🔄  Carregando...           │  │  ← loading
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## Badge

### Variantes

| Tipo | Background | Text | Uso |
|------|------------|------|-----|
| `urgent` | `rgba(255,59,48,0.15)` | `#FF3B30` | Breaking news |
| `now` | `rgba(255,149,0,0.15)` | `#FF9500` | < 30 min |
| `new` | `rgba(52,199,89,0.15)` | `#34C759` | < 2 horas |
| `discovery` | `rgba(175,82,222,0.15)` | `#AF52DE` | Wildcards |

### Código

```typescript
type BadgeType = 'urgent' | 'now' | 'new' | 'discovery';

interface BadgeProps {
  type: BadgeType;
  children: string;
}

const Badge: React.FC<BadgeProps> = ({ type, children }) => {
  const styles = {
    urgent: { bg: 'rgba(255,59,48,0.15)', text: '#FF3B30' },
    now: { bg: 'rgba(255,149,0,0.15)', text: '#FF9500' },
    new: { bg: 'rgba(52,199,89,0.15)', text: '#34C759' },
    discovery: { bg: 'rgba(175,82,222,0.15)', text: '#AF52DE' },
  };

  return (
    <View
      style={{
        backgroundColor: styles[type].bg,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: styles[type].text,
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {children}
      </Text>
    </View>
  );
};
```

### Visual

```
┌────────┐  ┌────────┐  ┌────────┐  ┌─────────────┐
│URGENTE │  │ AGORA  │  │  NOVO  │  │💡 Descoberta│
└────────┘  └────────┘  └────────┘  └─────────────┘
  🔴          🟠          🟢           🟣
```

---

## IconButton

### Tamanhos

| Size | Área | Ícone |
|------|------|-------|
| `sm` | 32px | 16px |
| `md` | 44px | 24px |
| `lg` | 56px | 32px |

### Código

```typescript
interface IconButtonProps {
  icon: keyof typeof Icons;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  active?: boolean;
  onPress: () => void;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  color = '#636366',
  active = false,
  onPress,
}) => {
  const sizes = {
    sm: { container: 32, icon: 16 },
    md: { container: 44, icon: 24 },
    lg: { container: 56, icon: 32 },
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: sizes[size].container,
        height: sizes[size].container,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: sizes[size].container / 2,
        backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'transparent',
        transform: [{ scale: pressed ? 0.9 : 1 }],
      })}
    >
      <Icon
        name={icon}
        size={sizes[size].icon}
        color={active ? '#FFD60A' : color}
      />
    </Pressable>
  );
};
```

### Visual

```
    ⭐         🔖         ↗️
  (32px)    (44px)    (44px)
   like    bookmark   share
```

---

## Toggle

### Estados

| Estado | Track | Thumb |
|--------|-------|-------|
| OFF | `#636366` | `#FFFFFF` |
| ON | `#34C759` | `#FFFFFF` |
| Disabled | `#48484A` | `#A1A1A6` |

### Código

```typescript
interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ value, onValueChange, disabled }) => {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: '#636366', true: '#34C759' }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#636366"
    />
  );
};
```

---

## Input

### Estados

| Estado | Border | Background |
|--------|--------|------------|
| Default | `#636366` | `#141416` |
| Focused | `#007AFF` | `#141416` |
| Error | `#FF3B30` | `#141416` |
| Disabled | `#48484A` | `#1C1C1E` |

### Código

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled,
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? '#FF3B30'
    : focused
    ? '#007AFF'
    : '#636366';

  return (
    <View>
      {label && (
        <Text style={{ color: '#A1A1A6', fontSize: 14, marginBottom: 8 }}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#636366"
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 48,
          backgroundColor: '#141416',
          borderWidth: 1,
          borderColor,
          borderRadius: 12,
          paddingHorizontal: 16,
          color: '#FFFFFF',
          fontSize: 16,
        }}
      />
      {error && (
        <Text style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};
```

---

## Chip

### Estados

| Estado | Background | Border | Text |
|--------|------------|--------|------|
| Default | `#1C1C1E` | `#636366` | `#A1A1A6` |
| Selected | `rgba(255,59,48,0.15)` | `#FF3B30` | `#FFFFFF` |
| Disabled | `#1C1C1E` | `#48484A` | `#48484A` |

### Código

```typescript
interface ChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress: () => void;
}

const Chip: React.FC<ChipProps> = ({ label, icon, selected, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: selected ? 'rgba(255,59,48,0.15)' : '#1C1C1E',
        borderColor: selected ? '#FF3B30' : '#636366',
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {icon && <Text style={{ marginRight: 8 }}>{icon}</Text>}
      <Text style={{ color: selected ? '#FFFFFF' : '#A1A1A6', fontSize: 14 }}>
        {label}
      </Text>
      {selected && <Text style={{ marginLeft: 8, color: '#FF3B30' }}>✓</Text>}
    </Pressable>
  );
};
```

### Visual

```
┌──────────────┐  ┌──────────────┐
│ 🏛️ Política  │  │ 💻 Tecnologia│
│      ○       │  │      ✓      │
└──────────────┘  └──────────────┘
   default         selected
```

---

## Avatar

### Tamanhos

| Size | Dimensão | Font |
|------|----------|------|
| `sm` | 32px | 14px |
| `md` | 48px | 18px |
| `lg` | 80px | 28px |

### Código

```typescript
interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  source?: string;
  name?: string;
}

const Avatar: React.FC<AvatarProps> = ({ size = 'md', source, name }) => {
  const sizes = {
    sm: { container: 32, font: 14 },
    md: { container: 48, font: 18 },
    lg: { container: 80, font: 28 },
  };

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={{
          width: sizes[size].container,
          height: sizes[size].container,
          borderRadius: sizes[size].container / 2,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: sizes[size].container,
        height: sizes[size].container,
        borderRadius: sizes[size].container / 2,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: sizes[size].font }}>
        {initials || '👤'}
      </Text>
    </View>
  );
};
```

---

## Skeleton

### Código

```typescript
const Skeleton: React.FC<{ width: number | string; height: number; borderRadius?: number }> = ({
  width,
  height,
  borderRadius = 8,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-100, 100]) }],
  }));

  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#1C1C1E',
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            backgroundColor: '#2C2C2E',
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};
```

### Visual

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  │  ← shimmer
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  │
│  └───────────────────────────────┘  │
│  ┌────────────────────────┐         │
│  │████████████████████████│         │  ← shimmer
│  └────────────────────────┘         │
│  ┌────────────────┐                 │
│  │████████████████│                 │  ← shimmer
│  └────────────────┘                 │
└─────────────────────────────────────┘
```

---

## Toast

### Tipos

| Tipo | Background | Ícone |
|------|------------|-------|
| `success` | `#34C759` | ✓ |
| `error` | `#FF3B30` | ✕ |
| `info` | `#007AFF` | ℹ |
| `warning` | `#FF9500` | ⚠ |

### Código

```typescript
const Toast = {
  show: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const colors = {
      success: '#34C759',
      error: '#FF3B30',
      info: '#007AFF',
      warning: '#FF9500',
    };

    // Usando react-native-toast-message ou similar
    ToastMessage.show({
      type,
      text1: message,
      position: 'bottom',
      visibilityTime: 3000,
      props: {
        backgroundColor: colors[type],
      },
    });
  },
};

// Uso
Toast.show('Artigo salvo!', 'success');
Toast.show('Erro ao carregar', 'error');
```


