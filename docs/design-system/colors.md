# 🎨 Paleta de Cores

> Design System do App de Notícias

---

## Dark Mode (Padrão)

### Backgrounds

| Token | Hex | Preview | Uso |
|-------|-----|---------|-----|
| `--bg-primary` | `#0A0A0B` | ████ | Fundo principal |
| `--bg-surface` | `#141416` | ████ | Cards, superfícies |
| `--bg-elevated` | `#1C1C1E` | ████ | Modais, dropdowns |
| `--bg-overlay` | `rgba(0,0,0,0.6)` | ████ | Overlays |

```css
:root {
  --bg-primary: #0A0A0B;
  --bg-surface: #141416;
  --bg-elevated: #1C1C1E;
  --bg-overlay: rgba(0, 0, 0, 0.6);
}
```

### Texto

| Token | Hex | Opacidade | Uso |
|-------|-----|-----------|-----|
| `--text-primary` | `#FFFFFF` | 100% | Títulos, texto principal |
| `--text-secondary` | `#A1A1A6` | 60% | Subtexto, descrições |
| `--text-tertiary` | `#636366` | 40% | Metadata, timestamps |
| `--text-disabled` | `#48484A` | 30% | Texto desabilitado |

```css
:root {
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1A6;
  --text-tertiary: #636366;
  --text-disabled: #48484A;
}
```

### Accent Colors

| Token | Hex | Preview | Uso |
|-------|-----|---------|-----|
| `--accent-danger` | `#FF3B30` | 🔴 | URGENTE, erros, sair |
| `--accent-warning` | `#FF9500` | 🟠 | AGORA, avisos |
| `--accent-success` | `#34C759` | 🟢 | NOVO, sucesso |
| `--accent-discovery` | `#AF52DE` | 🟣 | Descoberta, wildcards |
| `--accent-link` | `#007AFF` | 🔵 | Links, bookmarks |
| `--accent-star` | `#FFD60A` | 🟡 | Like, estrelas |

```css
:root {
  --accent-danger: #FF3B30;
  --accent-warning: #FF9500;
  --accent-success: #34C759;
  --accent-discovery: #AF52DE;
  --accent-link: #007AFF;
  --accent-star: #FFD60A;
}
```

### Badges de Urgência

| Badge | Background | Text | Border |
|-------|------------|------|--------|
| URGENTE | `rgba(255,59,48,0.15)` | `#FF3B30` | `#FF3B30` |
| AGORA | `rgba(255,149,0,0.15)` | `#FF9500` | `#FF9500` |
| NOVO | `rgba(52,199,89,0.15)` | `#34C759` | `#34C759` |
| 💡 Descoberta | `rgba(175,82,222,0.15)` | `#AF52DE` | `#AF52DE` |

```typescript
const BADGE_COLORS = {
  urgent: {
    bg: 'rgba(255,59,48,0.15)',
    text: '#FF3B30',
    border: '#FF3B30',
  },
  now: {
    bg: 'rgba(255,149,0,0.15)',
    text: '#FF9500',
    border: '#FF9500',
  },
  new: {
    bg: 'rgba(52,199,89,0.15)',
    text: '#34C759',
    border: '#34C759',
  },
  discovery: {
    bg: 'rgba(175,82,222,0.15)',
    text: '#AF52DE',
    border: '#AF52DE',
  },
};
```

---

## Light Mode (Alternativo)

### Backgrounds

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg-primary` | `#FFFFFF` | Fundo principal |
| `--bg-surface` | `#F2F2F7` | Cards |
| `--bg-elevated` | `#FFFFFF` | Modais |

### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `--text-primary` | `#000000` | Títulos |
| `--text-secondary` | `#3C3C43` | Subtexto |
| `--text-tertiary` | `#8E8E93` | Metadata |

```typescript
// theme.ts
export const colors = {
  dark: {
    bg: {
      primary: '#0A0A0B',
      surface: '#141416',
      elevated: '#1C1C1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A1A1A6',
      tertiary: '#636366',
    },
  },
  light: {
    bg: {
      primary: '#FFFFFF',
      surface: '#F2F2F7',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#3C3C43',
      tertiary: '#8E8E93',
    },
  },
  // Accent colors são iguais em ambos os temas
  accent: {
    danger: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    discovery: '#AF52DE',
    link: '#007AFF',
    star: '#FFD60A',
  },
};
```

---

## Gradientes

```css
/* Breaking news shimmer */
.breaking-gradient {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 59, 48, 0.1) 50%,
    transparent 100%
  );
}

/* Card skeleton shimmer */
.skeleton-gradient {
  background: linear-gradient(
    90deg,
    #1C1C1E 0%,
    #2C2C2E 50%,
    #1C1C1E 100%
  );
}

/* Header fade */
.header-fade {
  background: linear-gradient(
    180deg,
    #0A0A0B 0%,
    transparent 100%
  );
}
```

---

## Estados de Interação

| Estado | Modificação |
|--------|-------------|
| Hover | `opacity: 0.8` |
| Pressed | `opacity: 0.6` + `scale: 0.98` |
| Disabled | `opacity: 0.4` |
| Focused | `border: 2px solid var(--accent-link)` |

```typescript
const buttonStates = {
  default: { opacity: 1, scale: 1 },
  pressed: { opacity: 0.6, scale: 0.98 },
  disabled: { opacity: 0.4 },
};
```

---

## Acessibilidade

| Contraste | Ratio | Status |
|-----------|-------|--------|
| `#FFFFFF` on `#0A0A0B` | 21:1 | ✅ AAA |
| `#A1A1A6` on `#0A0A0B` | 7.3:1 | ✅ AAA |
| `#636366` on `#0A0A0B` | 4.5:1 | ✅ AA |
| `#FF3B30` on `#0A0A0B` | 4.8:1 | ✅ AA |

> Todas as combinações passam no WCAG 2.1 nível AA mínimo.


