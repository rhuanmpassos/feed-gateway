# 🔤 Tipografia

> Fontes, tamanhos e estilos do Design System

---

## Famílias de Fonte

### Fontes Primárias

| Tipo | Família | Fallback | Uso |
|------|---------|----------|-----|
| **Títulos** | Playfair Display | Lora, Georgia, serif | Headlines, títulos de artigos |
| **Corpo** | Inter | SF Pro Text, system-ui | Texto geral, UI |
| **Mono** | JetBrains Mono | Menlo, monospace | Código, números |

```typescript
export const fontFamily = {
  serif: {
    regular: 'PlayfairDisplay-Regular',
    medium: 'PlayfairDisplay-Medium',
    semiBold: 'PlayfairDisplay-SemiBold',
    bold: 'PlayfairDisplay-Bold',
  },
  sans: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  mono: {
    regular: 'JetBrainsMono-Regular',
  },
};
```

### Carregamento no Expo

```typescript
// App.tsx
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

const [fontsLoaded] = useFonts({
  'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
  'PlayfairDisplay-Medium': PlayfairDisplay_500Medium,
  'PlayfairDisplay-SemiBold': PlayfairDisplay_600SemiBold,
  'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
  'Inter-Regular': Inter_400Regular,
  'Inter-Medium': Inter_500Medium,
  'Inter-SemiBold': Inter_600SemiBold,
  'Inter-Bold': Inter_700Bold,
});
```

---

## Escala de Tamanhos

| Token | Size | Line Height | Uso |
|-------|------|-------------|-----|
| `--text-xs` | 10px | 14px | Labels micro |
| `--text-sm` | 12px | 16px | Captions, metadata |
| `--text-base` | 14px | 20px | Texto padrão UI |
| `--text-md` | 16px | 24px | Parágrafos |
| `--text-lg` | 18px | 26px | Títulos de card |
| `--text-xl` | 20px | 28px | Subtítulos |
| `--text-2xl` | 24px | 32px | Títulos de seção |
| `--text-3xl` | 28px | 36px | Títulos de página |
| `--text-4xl` | 32px | 40px | Headlines |

```typescript
export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
};

export const lineHeight = {
  xs: 14,
  sm: 16,
  base: 20,
  md: 24,
  lg: 26,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
};
```

---

## Estilos de Texto

### Tokens Semânticos

```typescript
export const textStyles = {
  // Títulos
  h1: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    lineHeight: 40,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 24,
    lineHeight: 32,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: 'PlayfairDisplay-Medium',
    fontSize: 20,
    lineHeight: 28,
    color: '#FFFFFF',
  },

  // Títulos de Card
  cardTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Corpo
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#A1A1A6',
  },
  bodySmall: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#A1A1A6',
  },

  // UI
  button: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },

  // Metadata
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#636366',
  },
  timestamp: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#636366',
  },

  // Badges
  badge: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Tab Bar
  tabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    lineHeight: 14,
  },
};
```

---

## Aplicação por Componente

### Card de Artigo

```
┌─────────────────────────────────────┐
│                                     │
│  [IMAGEM]                           │
│                                     │
│  ┌────────┐                         │
│  │URGENTE │ ← badge: 10px, BOLD     │
│  └────────┘   uppercase, tracking   │
│                                     │
│  Título do artigo que ocupa        │ ← cardTitle: 18px
│  até duas linhas no máximo         │   PlayfairDisplay-SemiBold
│                                     │
│  G1 • 5 min                        │ ← caption: 12px, Inter
│                                     │
│  ⭐        🔖        ↗️             │
│                                     │
└─────────────────────────────────────┘
```

### Header da Página

```
┌─────────────────────────────────────┐
│                                     │
│  Para Você                     🔔  │ ← h2: 24px, Playfair Bold
│  ──────────                         │
│                                     │
│  Bom dia! 👋                       │ ← body: 16px, Inter
│  ✨ Feito para você                │ ← bodySmall: 14px, accent
│                                     │
└─────────────────────────────────────┘
```

### Breaking News Compacto

```
┌─────────────────────────────────────┐
│ ┌────────┐                          │
│ │URGENTE │ Congresso vota...       │ ← badge + bodySmall
│ └────────┘ G1 • 2 min              │ ← caption
└─────────────────────────────────────┘
```

---

## Responsividade

### Escala Dinâmica

```typescript
import { PixelRatio } from 'react-native';

const fontScale = PixelRatio.getFontScale();

// Limitar escala para não quebrar layout
const clampedScale = Math.min(Math.max(fontScale, 0.85), 1.3);

const scaledSize = (size: number) => size * clampedScale;
```

### Acessibilidade

```typescript
// Respeitar configurações do sistema
import { useAccessibilityInfo } from 'react-native';

const { prefersDarkMode, isReduceMotionEnabled } = useAccessibilityInfo();
```

---

## Anti-patterns

❌ **Não fazer:**

```typescript
// Tamanhos arbitrários
fontSize: 17 // Use a escala!

// Fontes inline
fontFamily: 'Arial'

// Line height muito apertado
lineHeight: 1.0

// Misturar serif e sans no mesmo card
```

✅ **Fazer:**

```typescript
// Usar tokens
fontSize: fontSize.lg // 18px

// Usar famílias definidas
fontFamily: fontFamily.serif.semiBold

// Line height confortável
lineHeight: lineHeight.lg // 26px

// Consistência visual
```


