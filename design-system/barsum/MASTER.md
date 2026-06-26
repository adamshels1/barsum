# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Barsum
**Generated:** 2026-06-25
**Category:** Educational platform for children (Kazakhstan)

---

## Global Rules

### Color Palette

Barsum brand colors — все другие цвета запрещены.

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary (Purple) | `#7B61FF` | `--purple` | Кнопки, акценты, родительский роль |
| Green | `#1FA463` | `--green` | Успех, детский акцент, монеты |
| Orange | `#EA8C2D` | `--orange` | Предупреждения, streak, награды |
| Ink (Text) | `#1E1B2E` | `--ink` | Основной текст |
| Muted | `#9AA0AE` | `--muted` | Вторичный текст |
| Background | `#EFEBFB` | `--background` | Фон страниц |
| White | `#FFFFFF` | `--white` | Карточки, поверхности |
| Destructive | `#DC2626` | `--destructive` | Ошибки, удаление |

**Role-based accents:**
- Родитель: Purple `#7B61FF`
- Ребёнок: Green `#1FA463`
- Эксперт: Ink `#1E1B2E`
- Администратор: Orange `#EA8C2D`

### Typography

- **Font:** Manrope (единственный шрифт проекта)
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- **Base size:** 16px (body), no text below 12px
- **Line-height:** 1.5 для body, 1.2 для заголовков

**Type Scale:**
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| display | 32px | 800 | Hero заголовки |
| h1 | 24px | 700 | Page titles |
| h2 | 20px | 700 | Section titles |
| h3 | 18px | 600 | Card titles |
| body-lg | 16px | 400 | Основной текст |
| body | 14px | 400 | Вторичный текст |
| caption | 12px | 400 | Метки, подписи |
| label | 12px | 600 | Бейджи, чипы |

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |
| `--space-3xl` | `64px` | Hero padding |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `8px` | Inputs, small chips |
| `rounded-md` | `12px` | Buttons |
| `rounded-lg` | `16px` | Input fields |
| `rounded-xl` | `20px` | Карточки |
| `rounded-2xl` | `24px` | Большие карточки (Claymorphism) |
| `rounded-full` | `9999px` | Аватары, монеты, пиллы |

### Shadow Depths (Claymorphism)

Claymorphism использует двойные тени: внешняя + внутренняя светлая.

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 4px rgba(123,97,255,0.08)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(123,97,255,0.12), inset 0 1px 0 rgba(255,255,255,0.6)` | Cards, buttons |
| `--shadow-lg` | `0 8px 24px rgba(123,97,255,0.16), inset 0 1px 0 rgba(255,255,255,0.7)` | Modals, elevated cards |
| `--shadow-xl` | `0 16px 40px rgba(123,97,255,0.2), inset 0 2px 0 rgba(255,255,255,0.8)` | Hero cards, featured |
| `--shadow-clay` | `0 6px 0 rgba(0,0,0,0.15)` | Clay bottom border эффект |

---

## Style: Claymorphism

**Keywords:** Soft 3D, chunky, playful, toy-like, bubbly, thick borders (3-4px), double shadows, rounded (20-24px)

**Best For:** Educational apps, children's apps — идеально для Barsum

**Key Effects:**
- Двойные тени (outer soft + inner light highlight)
- Мягкое нажатие на кнопки: `translateY(2px)` + уменьшение тени (200ms ease-out)
- Плавные переходы `150-300ms ease`
- Thick border bottom (`3-4px solid`) для clay-эффекта
- Яркие насыщенные цвета (не мутные)

---

## Component Specs

### Buttons

```css
/* Primary Button (Purple) */
.btn-primary {
  background: #7B61FF;
  color: white;
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  border: none;
  border-bottom: 4px solid #5B41DF;
  box-shadow: 0 4px 12px rgba(123,97,255,0.35);
  transition: all 200ms ease-out;
  cursor: pointer;
}
.btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
.btn-primary:active { transform: translateY(2px); border-bottom-width: 1px; box-shadow: 0 2px 6px rgba(123,97,255,0.25); }

/* Child Button (Green) */
.btn-child {
  background: #1FA463;
  border-bottom: 4px solid #168A50;
  box-shadow: 0 4px 12px rgba(31,164,99,0.35);
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: #7B61FF;
  border: 2px solid #7B61FF;
  border-bottom: 4px solid #7B61FF;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  transition: all 200ms ease-out;
  cursor: pointer;
}
```

### Cards (Claymorphism)

```css
.card {
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(123,97,255,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
  border: 1px solid rgba(123,97,255,0.08);
  transition: all 200ms ease;
}
.card:hover {
  box-shadow: 0 8px 24px rgba(123,97,255,0.18), inset 0 1px 0 rgba(255,255,255,0.7);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 14px 16px;
  border: 2px solid #E8E4F9;
  border-radius: 16px;
  font-size: 16px;
  font-family: 'Manrope', sans-serif;
  background: white;
  box-shadow: inset 0 2px 4px rgba(123,97,255,0.06);
  transition: border-color 200ms ease;
}
.input:focus {
  border-color: #7B61FF;
  outline: none;
  box-shadow: 0 0 0 3px rgba(123,97,255,0.15), inset 0 2px 4px rgba(123,97,255,0.06);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(30,27,46,0.5);
  backdrop-filter: blur(6px);
}
.modal {
  background: white;
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 16px 40px rgba(123,97,255,0.2), inset 0 2px 0 rgba(255,255,255,0.8);
  max-width: 480px;
  width: 90%;
}
```

### Coin Badge

```css
.coin-badge {
  background: linear-gradient(135deg, #1FA463, #16874F);
  color: white;
  border-radius: 9999px;
  padding: 6px 14px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 3px 0 rgba(0,0,0,0.15), 0 4px 8px rgba(31,164,99,0.3);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
```

### Navigation (bottom nav для мобайла)

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0; right: 0;
  background: white;
  border-top: 1px solid rgba(123,97,255,0.1);
  padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-around;
  box-shadow: 0 -4px 20px rgba(123,97,255,0.1);
}
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 44px;
  min-height: 44px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 12px;
  transition: all 200ms ease;
}
.bottom-nav-item.active { color: #7B61FF; }
.bottom-nav-item.active-child { color: #1FA463; }
```

---

## Mobile-First Breakpoints

| Breakpoint | Width | Context |
|------------|-------|---------|
| base | 375px | Small phone (primary) |
| sm | 640px | Large phone |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1440px | Wide desktop |

**All layouts start at 375px. No horizontal scroll ever.**

---

## Anti-Patterns (Do NOT Use)

- ❌ Мутные / приглушённые цвета (использовать только бренд-палитру)
- ❌ Любые шрифты кроме Manrope
- ❌ Скруглення < 8px (слишком острые для детского UI)
- ❌ Тени без цветового тинта (только серые box-shadow запрещены)
- ❌ Emojis как иконки — только Lucide SVG
- ❌ Отсутствие `cursor: pointer` на кликабельных элементах
- ❌ Мгновенные state changes без transition
- ❌ Текст ниже 12px
- ❌ Горизонтальный скролл на мобайле
- ❌ Контент под fixed navbar без отступа
- ❌ Низкий контраст: минимум 4.5:1

---

## Role Color Map (для middleware и условного рендера)

| Role | Primary Color | Background | Accent |
|------|--------------|------------|--------|
| `child` | `#1FA463` | `#F0FDF6` | `#EA8C2D` (streak) |
| `parent` | `#7B61FF` | `#EFEBFB` | `#1FA463` (coins) |
| `expert` | `#1E1B2E` | `#F8F7FF` | `#7B61FF` |
| `admin` | `#EA8C2D` | `#FFF8F0` | `#DC2626` |

---

## Pre-Delivery Checklist

- [ ] Только бренд-цвета Barsum (no random hex)
- [ ] Шрифт Manrope, минимум 12px
- [ ] Все иконки из Lucide (SVG)
- [ ] `cursor: pointer` на всех кликабельных
- [ ] Hover/active states с transition 150-300ms
- [ ] Claymorphism shadows на cards и кнопках
- [ ] Контраст текста ≥ 4.5:1
- [ ] Focus state виден (outline с цветом `--purple`)
- [ ] `prefers-reduced-motion` учтён
- [ ] Responsive: 375px → 768px → 1024px
- [ ] Нет горизонтального скролла
- [ ] Контент не скрыт за fixed navbar
- [ ] Safe area inset для bottom nav
