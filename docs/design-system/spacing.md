# 📐 Sistema de Espaçamento

> Escala consistente para margens, paddings e gaps

---

## Escala Base (4px)

Usamos uma escala de 4px como base para manter consistência.

| Token | Valor | Uso comum |
|-------|-------|-----------|
| `--space-0` | `0px` | Reset |
| `--space-1` | `4px` | Micro espaços, gaps de ícones |
| `--space-2` | `8px` | Espaço entre elementos inline |
| `--space-3` | `12px` | Padding interno de badges |
| `--space-4` | `16px` | Padding padrão de cards |
| `--space-5` | `20px` | Gap entre cards |
| `--space-6` | `24px` | Margens de seção |
| `--space-8` | `32px` | Espaço entre seções |
| `--space-10` | `40px` | Header height |
| `--space-12` | `48px` | Large section gaps |
| `--space-16` | `64px` | Extra large |
| `--space-20` | `80px` | Bottom tab height |

```typescript
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};
```

---

## Layout Grid

### Screen Margins

```
┌────────────────────────────────────┐
│←──16px──→ CONTENT ←──16px──→      │
│                                    │
│  Margem lateral padrão: 16px       │
│                                    │
└────────────────────────────────────┘
```

```typescript
const SCREEN_PADDING = 16;
```

### Card Padding

```
┌────────────────────────────────────┐
│  ┌──────────────────────────────┐  │
│  │←16px→               ←16px→│  │
│  │                              │  │
│  │   CARD CONTENT              │  │
│  │                              │  │
│  │            ↑16px↓           │  │
│  └──────────────────────────────┘  │
│               ↑16px↓               │
│  ┌──────────────────────────────┐  │
│  │      NEXT CARD              │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

```typescript
const CARD_STYLES = {
  padding: 16,
  marginBottom: 16,
  marginHorizontal: 16,
};
```

---

## Componentes Específicos

### Header

```
┌────────────────────────────────────┐
│        ↑ Status Bar (44px)         │
├────────────────────────────────────┤
│←16px→ TÍTULO              ÍCONE←16px│
│        ↑56px↓                       │
├────────────────────────────────────┤
```

```typescript
const HEADER = {
  height: 56,
  paddingHorizontal: 16,
  statusBarHeight: 44, // iOS
};
```

### Bottom Tab Bar

```
┌────────────────────────────────────┐
│   🏠      ⚡      🔖      👤       │
│   ↑48px↓                           │
├────────────────────────────────────┤
│        ↓ Safe Area (34px)          │
└────────────────────────────────────┘
```

```typescript
const BOTTOM_TAB = {
  height: 48,
  safeAreaBottom: 34, // iPhone X+
  totalHeight: 82,
};
```

### Card Anatomy

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────────┐ │
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │
│  │░░░░░░░░ IMAGE (180px) ░░░░░░░│ │ ← ratio 16:9
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │
│  └───────────────────────────────┘ │
│          ↑12px↓                     │
│  ┌────────┐                         │
│  │ BADGE  │ ← padding: 6px 10px     │
│  └────────┘                         │
│          ↑8px↓                      │
│  Título do artigo que pode         │ ← line-height: 24px
│  ocupar até 2 linhas               │
│          ↑8px↓                      │
│  Fonte • 5 min                      │ ← metadata
│          ↑12px↓                     │
│  ⭐        🔖        ↗️             │ ← ações: gap 24px
│          ↑16px↓                     │
└─────────────────────────────────────┘
```

```typescript
const CARD_ANATOMY = {
  padding: 16,
  borderRadius: 16,
  image: {
    height: 180,
    aspectRatio: 16 / 9,
    borderRadius: 12,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 12,
  },
  title: {
    marginTop: 8,
    lineHeight: 24,
    maxLines: 2,
  },
  metadata: {
    marginTop: 8,
  },
  actions: {
    marginTop: 12,
    gap: 24,
  },
};
```

---

## Safe Areas

### iOS

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

// iPhone 14 Pro típico:
// top: 59px (Dynamic Island)
// bottom: 34px (Home Indicator)
// left/right: 0px
```

### Android

```typescript
// Android típico:
// top: 24px (Status Bar)
// bottom: 0px ou 48px (Navigation Bar)
```

---

## Touch Targets

Mínimo de 44x44px para áreas tocáveis (guideline Apple).

```typescript
const TOUCH_TARGET = {
  minWidth: 44,
  minHeight: 44,
};

// Para ícones menores, use hitSlop
<TouchableOpacity
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  <Icon size={24} />
</TouchableOpacity>
```

---

## Responsive Breakpoints

| Device | Width | Colunas |
|--------|-------|---------|
| iPhone SE | 375px | 1 |
| iPhone 14 | 390px | 1 |
| iPhone 14 Pro Max | 430px | 1 |
| iPad Mini | 768px | 2 |
| iPad Pro | 1024px | 3 |

```typescript
const useColumns = () => {
  const { width } = useWindowDimensions();
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
};
```


