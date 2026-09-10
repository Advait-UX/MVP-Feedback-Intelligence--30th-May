# Feedback Intelligence — Lyra Design Standards
# THIS FILE IS LAW — Follow every rule here without exception

> **Owner:** Advait Patil (advait.patil@nice.com)
> **Product:** NiCE CXone · Feedback Intelligence · Initiative CXFM-2

---

## ⚠️ MANDATORY READING — Read BEFORE making any changes

**`docs/FLOWS.md`** — Complete screen inventory, navigation map, all states, all data fields, and every modal/drawer. This is the authoritative reference for what screens must exist. If a screen or flow is not in FLOWS.md, ask before inventing it. If a screen IS in FLOWS.md and is not implemented, it must be built.

**`docs/INTERACTIONS.md`** — Every single click interaction, navigation event, toggle, modal open/close, dropdown, and state change extracted directly from the source HTML prototype. Read this before implementing ANY button, link, or interactive element. This is the ground truth for "on click of A, B opens."

**`docs/INSTRUCTIONS.md`** — Full product spec, requirements, and acceptance criteria.

**Do not implement a screen from memory.** Always check FLOWS.md and INTERACTIONS.md first.

---
> **Stack:** React 19 + TypeScript + Vite + Tailwind v4
> **Full spec:** `docs/INSTRUCTIONS.md`

```bash
npm install && npm run dev   # localhost:5173
```

---

## ⚠️ ABSOLUTE RULES — Never Break These

1. **NEVER use hardcoded hex, rgb(), rgba(), or hsl() values.** Always use CSS custom properties.
2. **NEVER use any font other than Inter.** Weights: 400 (Regular), 500 (Medium), 600 (Semi Bold) only.
3. **NEVER invent spacing, radius, or shadow values.** Only use tokens defined in this file.
4. **NEVER use Tailwind arbitrary values** like `w-[347px]` or `text-[13px]`. Use tokens.
5. **ALWAYS check `design-system/css/theme.css` and `design-system/tokens/lyra-tokens.json`** before adding any new style.
6. **ALWAYS follow WCAG 2.1 AA contrast.** Minimum 4.5:1 for body text, 3:1 for large text and UI components.
7. **ALWAYS apply Lyra visual patterns** — whitespace, hierarchy, consistency, contrast, repetition.

---

## Design Token Sources (read in this priority order)

| Source | Path | Use for |
|---|---|---|
| Lyra JSON tokens | `design-system/tokens/lyra-tokens.json` | Color primitives (`--lyra-brand-*`, `--lyra-slate-*`, etc.) |
| Project theme | `design-system/css/theme.css` | Spacing, shadows, radius, Tailwind mappings |
| Lyra Storybook | https://na1.dev.nice-incontact.com/sol/?path=/docs/introduction--docs | Visual reference, component behaviour |

---

## 1. Color Tokens

### Lyra Semantic Color Tokens (use THESE — not primitives)

```css
/* Backgrounds */
--lyra-color-bg-surface-canvas          /* #FBFCFE  — App shell outer canvas */
--lyra-color-bg-surface-base            /* #FFFFFF  — Cards, panes, white surfaces */
--lyra-color-bg-surface-shell           /* #F5F7F9  — Sidebar + topbar background */
--lyra-color-bg-surface-overlay         /* #FFFFFF  — Modals, dropdowns */
--lyra-color-bg-primary                 /* #166CCA  — Primary button fill */
--lyra-color-bg-field                   /* #FFFFFF  — Input backgrounds */
--lyra-color-bg-disabled                /* rgba(0,0,0,6%)  — Disabled backgrounds */
--lyra-color-bg-active-subtle           /* #F1F7FE  — Selected / active row */
--lyra-color-bg-active-moderate         /* #D3E6FD  — Stronger active state */
--lyra-color-bg-active-strong           /* #166CCA  — Active accent fill */
--lyra-color-bg-destructive             /* #BD2A2A  — Destructive action fill */
--lyra-color-bg-ai                      /* rgba(143,115,227,4%)  — AI surface wash */
--lyra-color-bg-surface-inverse         /* #2A2D32  — Dark surfaces */

/* Foreground / Text */
--lyra-color-fg-default                 /* rgba(0,0,0,80%)  — Primary text */
--lyra-color-fg-secondary               /* rgba(0,0,0,60%)  — Supporting / muted text */
--lyra-color-fg-disabled                /* rgba(0,0,0,30%)  — Disabled text */
--lyra-color-fg-inverse                 /* #FFFFFF  — Text on dark surfaces */
--lyra-color-fg-link                    /* #185BA4  — Links */
--lyra-color-fg-active-strong           /* #185BA4  — Active / selected text */
--lyra-color-fg-on-primary              /* #FFFFFF  — Text on primary button */
--lyra-color-fg-on-desctructive         /* #FFFFFF  — Text on destructive */
--lyra-color-fg-action                  /* #5D6A79  — Action icons / secondary actions */

/* Borders */
--lyra-color-border-subtle              /* rgba(0,0,0,10%)  — Lightest dividers */
--lyra-color-border-soft                /* rgba(0,0,0,16%)  — Card borders */
--lyra-color-border-medium              /* rgba(0,0,0,32%)  — Emphasis borders */
--lyra-color-border-strong              /* rgba(0,0,0,46%)  — Highest contrast border */
--lyra-color-border-active              /* #185BA4  — Focused / selected state */
--lyra-color-border-focus-default       /* #185BA4  — Focus ring inner color */
--lyra-color-border-disabled            /* rgba(0,0,0,10%)  — Disabled borders */

/* Status */
--lyra-color-status-success-subtle      /* #EBFAED  — Success bg */
--lyra-color-status-success-medium      /* #64B96F  — Success indicator */
--lyra-color-status-success-strong      /* #23722D  — Success text/icon */
--lyra-color-status-warning-subtle      /* #FFFAE0  — Warning bg */
--lyra-color-status-warning-medium      /* #FACB33  — Warning indicator */
--lyra-color-status-warning-strong      /* #8E6800  — Warning text */
--lyra-color-status-critical-subtle     /* #FFF0F0  — Error bg */
--lyra-color-status-critical-medium     /* #FA7F7F  — Error indicator */
--lyra-color-status-critical-strong     /* #BD2A2A  — Error text */
--lyra-color-status-info-subtle         /* #F0F5FF  — Info bg */
--lyra-color-status-info-medium         /* #789FED  — Info indicator */
--lyra-color-status-info-strong         /* #2D5BB9  — Info text */

/* Interaction states */
--lyra-color-state-bg-hover-opacity     /* rgba(0,0,0,4%)   — Default hover overlay */
--lyra-color-state-bg-pressed-opacity   /* rgba(0,0,0,8%)   — Pressed overlay */
--lyra-color-state-bg-hover-primary     /* #185BA4  — Primary hover */
--lyra-color-state-bg-pressed-primary   /* #164479  — Primary pressed */
--lyra-color-state-bg-hover-secondary   /* #FBFCFE  — Secondary hover */
--lyra-color-state-bg-hover-active-subtle  /* #E8F1FC */
--lyra-color-state-bg-pressed-active-subtle /* #D3E6FD */
```

### Lyra Color Primitives (use only when no semantic token exists)

```css
/* Brand (CXone Blue) */
--lyra-brand-50   #e9f1fc    --lyra-brand-100  #cfe0f8
--lyra-brand-200  #a6c6f0    --lyra-brand-300  #72a6e8
--lyra-brand-400  #4896ec    --lyra-brand-500  #3d81e7  /* brand primary */
--lyra-brand-600  #166cca    --lyra-brand-700  #185ba4
--lyra-brand-800  #164479    --lyra-brand-900  #0c2459

/* Slate (primary neutral) */
--lyra-slate-50   #fbfcfe    --lyra-slate-100  #f5f7f9
--lyra-slate-200  #eef0f2    --lyra-slate-300  #d2d8db
--lyra-slate-400  #a8b3bb    --lyra-slate-500  #82959e
--lyra-slate-600  #526b7a    --lyra-slate-700  #3f5e69
--lyra-slate-800  #3f4e5d    --lyra-slate-900  #1d2630

/* Status primitives */
--lyra-green-500  #23722D (success strong)
--lyra-orange-500 #ec7000 (warning)
--lyra-red-500    #d83434 (error)
--lyra-purple-700 #4E39A8 (AI)
```

### AI Feature Color Treatment
Any feature powered by LLM/AI MUST use:
```css
background:    var(--lyra-color-bg-ai);            /* lavender wash */
color:         #4E39A8;                             /* purple-700 */
border-color:  #4E39A8;                             /* --lyra-color-border-field-ai */
```
Include a visible "AI" badge chip on the surface.

### FI-Specific: VU Score Colors
```
76–100 High    → --lyra-color-status-success-strong  (#23722D) on --lyra-color-status-success-subtle
50–75  Medium  → --lyra-color-status-warning-strong  (#8E6800) on --lyra-color-status-warning-subtle
0–49   Low     → --lyra-color-status-critical-strong (#BD2A2A) on --lyra-color-status-critical-subtle
No data        → --lyra-slate-400
```

---

## 2. Typography

**Font:** Inter only. Load via Google Fonts or local. No other typeface.
**CSS var:** `--font-sans` → `"Inter", system-ui, -apple-system, sans-serif`

### Type Scale (Figma + Storybook authoritative)

| Class | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| `.heading-xl` | 24px | 600 | 28px | -0.02em | Page titles |
| `.heading-lg` | 20px | 600 | 24px | -0.01em | Section headers |
| `.heading-md` | 16px | 500 | 20px | -0.01em | Card titles, modal headings |
| `.heading-sm` | 14px | 500 | 18px | 0 | Sub-labels |
| `.heading-xs` | 12px | 500 | 16px | +0.01em + UPPERCASE | Column headers, overlines |
| `.body-lg` | 16px | 400 | 28px | -0.01em | Long-form reading text |
| `.body-lg-emphasized` | 16px | 500 | 28px | -0.01em | Callout text |
| `.body-md` | 14px | 400 | 24px | 0 | **Default — use for everything** |
| `.body-md-emphasized` | 14px | 500 | 24px | 0 | Inline emphasis, bold label-value |
| `.body-sm` | 12px | 400 | 20px | +0.01em | Captions, helper text |
| `.body-sm-emphasized` | 12px | 500 | 20px | +0.01em | Small bold labels |
| `.label` | 14px | 500 | 20px | 0 | Form labels, table headers |

### CSS Implementation

```css
/* Apply as Tailwind classes wherever possible */
.heading-xl  { font: 600 24px/28px var(--font-sans); letter-spacing: -0.02em; }
.heading-lg  { font: 600 20px/24px var(--font-sans); letter-spacing: -0.01em; }
.heading-md  { font: 500 16px/20px var(--font-sans); letter-spacing: -0.01em; }
.heading-sm  { font: 500 14px/18px var(--font-sans); letter-spacing: 0; }
.heading-xs  { font: 500 12px/16px var(--font-sans); letter-spacing: 0.01em; text-transform: uppercase; }
.body-lg     { font: 400 16px/28px var(--font-sans); letter-spacing: -0.01em; }
.body-md     { font: 400 14px/24px var(--font-sans); letter-spacing: 0; }        /* DEFAULT */
.body-sm     { font: 400 12px/20px var(--font-sans); letter-spacing: 0.01em; }
.label       { font: 500 14px/20px var(--font-sans); letter-spacing: 0; }
```

### Typography Rules
- `body-md` is the default. Set it on `<body>` and let elements inherit.
- Use `heading-xs` + UPPERCASE for ALL table column headers and section overlines.
- Never mix weight 700 (Bold) — Lyra uses 400 / 500 / 600 only.
- Minimum text size is 12px (`.body-sm`). Nothing smaller.
- Primary text (`--lyra-color-fg-default`) on white background = **14.7:1 contrast** ✓
- Secondary text (`--lyra-color-fg-secondary`) on white = **8.6:1 contrast** ✓

---

## 3. Spacing

**Base unit: 4px.** Every margin, padding, and gap must be a multiple of 4.

```css
--space-1:  4px    --space-2:  8px    --space-3:  12px   --space-4:  16px
--space-5:  20px   --space-6:  24px   --space-7:  32px   --space-10: 40px
--space-12: 48px   --space-16: 64px   --space-20: 80px   --space-24: 96px
```

**Tailwind mapping:** `p-1`=4px, `p-2`=8px, `p-3`=12px, `p-4`=16px, `p-5`=20px, `p-6`=24px, `p-8`=32px

### Spacing Conventions
- **Card internal padding:** `--space-5` (20px) or `--space-6` (24px)
- **Row item padding:** `--space-3` vertical (12px), `--space-4` horizontal (16px)
- **Section gap:** `--space-6` (24px)
- **Inline element gap (icons + text):** `--space-2` (8px)
- **Form field gap:** `--space-4` (16px) between fields
- **White space is generous.** When in doubt, add more space.

---

## 4. Border Radius

```css
--radius-xs:   4px    /* Chips, badges, small tags */
--radius-sm:   6px    /* Inputs, dropdowns, small controls */
--radius-md:   8px    /* Buttons, cards, banners */
--radius-lg:   12px   /* Panels, large cards, drawers */
--radius-xl:   16px   /* Modals, large overlays */
--radius-full: 9999px /* Pills, avatars, circular elements */
```

**Rule:** Every rounded element must use one of the above. No arbitrary values.

---

## 5. Elevation / Shadows

From Lyra Storybook (Lyra theme):

```css
--sol-effect-shadowsm: 0px 2px 6px 0px rgba(0,0,0,4%)    /* Inline cards */
--sol-effect-shadowmd: 0px 4px 12px 0px rgba(0,0,0,6%)   /* Floating panels, hover */
--sol-effect-shadowlg: 0px 12px 24px 0px rgba(0,0,0,8%)  /* Modals, dropdowns */
--sol-effect-shadowxl: 0px 20px 40px 0px rgba(0,0,0,12%) /* Large overlays */

/* Project alias tokens (from theme.css) */
--shadow-sm: equivalent to shadowsm
--shadow-md: equivalent to shadowmd
--shadow-lg: equivalent to shadowlg
```

**Focus ring (accessibility — never omit):**
```css
/* Active ring from Storybook */
--sol-effect-activering: 0px 0px 1px 3px rgba(44,138,242,25%)

/* Implement as: */
outline: 2px solid var(--lyra-color-border-focus-default);
outline-offset: 2px;
/* or box-shadow: */
box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--lyra-brand-500);
```

---

## 6. Component Patterns

### Buttons

```tsx
/* PRIMARY — filled brand blue */
className="
  bg-[--lyra-color-bg-primary] text-[--lyra-color-fg-on-primary]
  rounded-[--radius-md] px-4 py-2
  text-sm font-medium leading-6
  hover:bg-[--lyra-color-state-bg-hover-primary]
  active:bg-[--lyra-color-state-bg-pressed-primary]
  focus-visible:outline-2 focus-visible:outline-[--lyra-color-border-focus-default]
  disabled:opacity-40 disabled:cursor-not-allowed
"

/* SECONDARY — outlined */
className="
  bg-[--lyra-color-bg-surface-base] text-[--lyra-color-fg-default]
  border border-[--lyra-color-border-soft] rounded-[--radius-md] px-4 py-2
  text-sm font-medium leading-6
  hover:bg-[--lyra-color-state-bg-hover-opacity]
  focus-visible:outline-2 focus-visible:outline-[--lyra-color-border-focus-default]
"

/* GHOST — no background */
className="
  text-[--lyra-color-fg-default] rounded-[--radius-md] px-3 py-1.5
  hover:bg-[--lyra-color-state-bg-hover-opacity]
"

/* DESTRUCTIVE */
className="
  bg-[--lyra-color-bg-destructive] text-[--lyra-color-fg-on-desctructive]
  rounded-[--radius-md] px-4 py-2
  hover:bg-[--lyra-color-state-bg-hover-critical-strong]
"
```

**Button sizes:**
- SM: `h-8` (32px), `px-3`, `text-sm`
- MD: `h-9` (36px), `px-4`, `text-sm` ← default
- LG: `h-10` (40px), `px-5`, `text-sm`

### Form Inputs

```tsx
/* Text input, select, textarea */
className="
  bg-[--lyra-color-bg-field] text-[--lyra-color-fg-default]
  border border-[--lyra-color-border-soft] rounded-[--radius-sm]
  px-3 py-2 text-sm leading-6 w-full
  placeholder:text-[--lyra-color-fg-disabled]
  focus:border-[--lyra-color-border-active]
  focus:outline-none focus:ring-2 focus:ring-[--lyra-brand-500] focus:ring-offset-2
  disabled:bg-[--lyra-color-bg-disabled] disabled:text-[--lyra-color-fg-disabled]
  disabled:cursor-not-allowed
"
```

**Input heights:** 32px (sm) · 36px (md/default) · 40px (lg)

### Cards & Panels

```tsx
/* Standard card */
className="
  bg-[--lyra-color-bg-surface-base]
  border border-[--lyra-color-border-soft] rounded-[--radius-lg]
  shadow-[--sol-effect-shadowsm]
  p-5 /* or p-6 for larger cards */
"

/* Floating panel / dropdown */
className="
  bg-[--lyra-color-bg-surface-overlay]
  border border-[--lyra-color-border-soft] rounded-[--radius-lg]
  shadow-[--sol-effect-shadowlg]
"
```

### Status Pills (badges)

```tsx
/* Active / Success */
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  style={{ background: 'var(--lyra-color-status-success-subtle)', color: 'var(--lyra-color-status-success-strong)' }}>
  Active
</span>

/* Paused / Warning */
style={{ background: 'var(--lyra-color-status-warning-subtle)', color: 'var(--lyra-color-status-warning-strong)' }}

/* Draft / Neutral */
style={{ background: 'var(--lyra-slate-100)', color: 'var(--lyra-slate-600)' }}

/* Ended / Disabled */
style={{ background: 'var(--lyra-slate-200)', color: 'var(--lyra-slate-500)' }}

/* Critical / Error */
style={{ background: 'var(--lyra-color-status-critical-subtle)', color: 'var(--lyra-color-status-critical-strong)' }}
```

All pills: `border-radius: var(--radius-full)` · font: `body-sm-emphasized` (12px/500)

### Tables

```tsx
/* Table wrapper */
className="w-full text-sm"

/* Column header th */
className="
  px-4 py-2.5 text-left
  heading-xs  /* 12px/500/UPPERCASE */
  text-[--lyra-color-fg-secondary]
  border-b border-[--lyra-color-border-subtle]
"

/* Data row tr */
className="
  border-b border-[--lyra-color-border-subtle]
  hover:bg-[--lyra-color-state-bg-hover-opacity]
  cursor-pointer transition-colors duration-150
"

/* Active/selected row tr */
className="bg-[--lyra-color-bg-active-subtle]"

/* Data cell td */
className="px-4 py-3 text-[--lyra-color-fg-default]"  /* body-md */
```

### Info / Status Banners

```tsx
/* Info banner */
className="
  bg-[--lyra-color-status-info-subtle]
  border border-[rgba(45,91,185,0.2)] rounded-[--radius-md]
  px-4 py-3 text-sm text-[--lyra-color-status-info-strong]
  flex items-start gap-3
"
/* Prepend an info icon in --lyra-color-status-info-strong color */
```

### Dropdown / Popover Menu

```tsx
className="
  bg-[--lyra-color-bg-surface-overlay]
  border border-[--lyra-color-border-soft] rounded-[--radius-lg]
  shadow-[--sol-effect-shadowlg]
  py-1 min-w-[160px]
"
/* Menu item: */
className="
  px-3 py-2 text-sm text-[--lyra-color-fg-default]
  hover:bg-[--lyra-color-state-bg-hover-opacity]
  cursor-pointer
"
```

### Modal / Dialog

```tsx
/* Overlay */
className="fixed inset-0 bg-[rgba(0,0,0,0.24)] z-50 flex items-center justify-center"

/* Dialog box */
className="
  bg-[--lyra-color-bg-surface-overlay]
  rounded-[--radius-xl] shadow-[--sol-effect-shadowlg]
  w-full max-w-lg p-6
"
```

### Slide-in Drawer / Detail Panel

```tsx
className="
  fixed inset-y-0 right-0 bg-[--lyra-color-bg-surface-base]
  border-l border-[--lyra-color-border-soft]
  shadow-[--sol-effect-shadowlg]
  w-[480px] p-6 flex flex-col
"
```

---

## 7. App Shell Layout

```
┌─────────────────────────────────────────────────────┐
│  TOPBAR (56px h)  bg: --lyra-color-bg-surface-shell │
├──────────────┬──────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT                        │
│  256px (exp) │  bg: --lyra-color-bg-surface-canvas  │
│  60px (coll) │  padding: 24px                       │
│  bg: shell   │  > white .pane card floats inside    │
└──────────────┴──────────────────────────────────────┘
```

```tsx
/* AppShell <main> — CRITICAL: must be flex flex-col */
<main
  className="flex flex-col flex-1 overflow-auto"
  style={{ background: 'var(--lyra-color-bg-surface-canvas)' }}
>
  {/* Without flex-col, children's flex-1 won't fill height → white gap */}

/* Content pane (white floating card) */
<div
  className="flex-1 rounded-[--radius-lg] m-4 md:m-6"
  style={{
    background: 'var(--lyra-color-bg-surface-base)',
    border: '1px solid var(--lyra-color-border-subtle)',
  }}
>
```

---

## 8. Iconography

- Use **lucide-react** icons only (already installed).
- Icon sizes must use Lyra size tokens:
  - `--sol-size-icon-xs` = 12px
  - `--sol-size-icon-sm` = 16px (default for inline icons)
  - `--sol-size-icon-md` = 20px (default for button icons)
  - `--sol-size-icon-lg` = 24px (navigation, prominent icons)
- Icon color must use a foreground token (`--lyra-color-fg-default`, `--lyra-color-fg-secondary`, etc.) — never hardcoded.
- Always pair icons with visible text labels or `aria-label`.

---

## 9. Accessibility (WCAG 2.1 AA — Non-Negotiable)

### Contrast Requirements
| Text type | Minimum ratio | Pass check |
|---|---|---|
| Body text (14px) | 4.5:1 | `fg-default` on white = 14.7:1 ✓ |
| Large text (18px+/bold 14px+) | 3:1 | `fg-secondary` on white = 8.6:1 ✓ |
| UI components (borders, icons) | 3:1 | Always verify status colors |
| Disabled elements | No minimum | Must look visually distinct |

### Focus
- **Every interactive element** must have a visible focus indicator.
- Use the Lyra focus ring: `outline: 2px solid var(--lyra-color-border-focus-default); outline-offset: 2px;`
- Never `outline: none` without a replacement.
- Focus must be keyboard-navigable in logical DOM order.

### Interactive targets
- Minimum touch/click target: **32×32px** (`--sol-size-control-md`)
- Recommended: **36×36px** or larger for primary actions.

### ARIA
- All icon-only buttons: `aria-label`
- All form fields: `<label>` with `htmlFor` or `aria-label`
- Status indicators: `role="status"` or `aria-live="polite"` where appropriate
- Tables: `<thead>` with `<th scope="col">` for every column

---

## 10. Design Principles — Always Apply

### Hierarchy
- Every screen has **one** primary action. Make it obvious.
- Size, weight, and color create hierarchy — use them intentionally.
- `heading-xl` → `heading-lg` → `body-md` — never skip levels.

### Whitespace (White Balance)
- When in doubt, add more space. Lyra is spacious.
- Sections separated by `--space-6` (24px) minimum.
- Content inside cards: `--space-5` (20px) padding minimum.
- Crowded UI = bad UX. Breathe.

### Contrast
- Foreground always contrasts background by ≥4.5:1.
- Status colors: always use the subtle bg + strong text pairing (never strong bg alone).
- Interactive vs. non-interactive elements must look obviously different.

### Consistency
- Same component = same appearance everywhere.
- Same action = same button style everywhere.
- Same data type = same typography treatment everywhere.
- Never create one-off styles for edge cases — extend the pattern.

### Repetition
- Repeat visual patterns to create familiarity.
- KPI cards: all same height, same padding, same structure.
- Table rows: uniform height, same hover behavior.

### Harmony
- Brand blue (#166CCA) is the single accent color for interactive elements.
- Status colors are reserved for status — never decorative.
- AI purple is reserved for AI features only.
- Do not mix more than 3 colors in a single component.

---

## 11. What NOT To Do

```
❌ style={{ color: '#185ba4' }}           → ✅ color: var(--lyra-color-fg-link)
❌ className="text-[13px]"                → ✅ className="text-sm" (14px) or body-sm (12px)
❌ className="p-[14px]"                   → ✅ className="p-3" (12px) or "p-4" (16px)
❌ className="rounded-[10px]"             → ✅ className="rounded-[--radius-md]" (8px)
❌ className="shadow-[0_2px_8px_#000]"   → ✅ shadow-[--sol-effect-shadowsm]
❌ font-family: 'Geist'                   → ✅ font-family: var(--font-sans) = Inter
❌ font-weight: 700                        → ✅ font-weight: 600 (semi-bold max)
❌ font-size: 11px                         → ✅ minimum 12px (.body-sm)
❌ Using red for non-error states          → ✅ use status-critical only for errors/critical
❌ Purple for non-AI features              → ✅ purple is AI-only
```

---

## 12. FI Product Patterns

### Campaign Status Pills
```
Active   → status-success-subtle bg + status-success-strong text
Paused   → status-warning-subtle bg + status-warning-strong text
Draft    → lyra-slate-100 bg + lyra-slate-600 text
Ended    → lyra-slate-200 bg + lyra-slate-500 text
```

### Response Rate Progress Bar
```
≥60% → status-success-strong color (#23722D)
≥40% → status-warning-strong color (#8E6800)
<40% → status-critical-strong color (#BD2A2A)
```

### Working Copy indicator
Show alongside campaign status pill as a separate chip:
```
bg: --lyra-brand-50, color: --lyra-brand-700, border: --lyra-brand-200
text: "Working copy" in body-sm-emphasized
```

### KPI Cards
- Fixed accent bar: 3px top border, color varies per card
- Large metric: `heading-xl` (24px/600)
- Label: `body-sm` secondary color, UPPERCASE
- Delta badge: `body-sm-emphasized` with status color
- Sparkline: smooth bezier curve, gradient fill, glowing endpoint dot

### AI-generated content markers
Any LLM-generated text, topic, or question:
- Wrap in `--lyra-color-bg-ai` container
- Show AI sparkle/wand icon in purple (`#4E39A8`)
- Include "AI" badge chip

---

## 13. Key Files

```
design-system/css/theme.css              ← Spacing, shadows, Tailwind config — read before styling
design-system/tokens/lyra-tokens.json    ← Color primitive definitions
src/pages/SurveyCampaignMonitoringPage.tsx ← Main Operations Dashboard
src/components/layout/AppShell.tsx       ← Shell, sidebar, topbar
docs/INSTRUCTIONS.md                     ← Full product spec
```

---

## 14. Figma & Storybook References

| Resource | URL / Key |
|---|---|
| Lyra Storybook (colors) | https://na1.dev.nice-incontact.com/sol/?path=/docs/guidelines-design-tokens-color-tokens--docs&globals=theme:lyra |
| Lyra Storybook (effects) | https://na1.dev.nice-incontact.com/sol/?path=/docs/guidelines-design-tokens-effect-tokens--docs&globals=theme:lyra |
| Lyra Storybook (sizes) | https://na1.dev.nice-incontact.com/sol/?path=/docs/guidelines-design-tokens-size-tokens--docs&globals=theme:lyra |
| Lyra Storybook (typography) | https://na1.dev.nice-incontact.com/sol/?path=/docs/guidelines-typography-typography-classes--docs |
| Lyra Figma file | `qyCq4jUOrpYcpHhpNCdgA5` |
| FI UX designs | `QEkgewFhKC66vlF8uwzNPT` |
| Concepts / Ops Dashboard | `pH9UhI6hH8goWwoE8Fes3C` |
| Confluence | https://nice-ce-cxone-prod.atlassian.net/wiki/spaces/CXFI/overview |
| Jira | https://nice-ce-cxone-prod.atlassian.net/jira/software/c/projects/CXFI/issues |

Lyra library key (Figma MCP `importComponentSetByKeyAsync`):
`lk-0e299d4975a9508371724884ae85eed14bfe69a7c4a32debe25165f76d97b8d19044fa7c016e811edfc48253e9fcdabc443bf29c00434d4f8b5f292b4da09db3`

Lyra Figma node IDs (pass as `nodeId` to MCP tools):
```
Base Colors:     14840:18536    Typography:  16788:14400
Semantic Tokens: 17289:41052    Spacing:     16807:13894
Shadows:         17432:301870   Forms/Input: 16926:20792
Suite Shell:     20269:73060    Overlays:    17015:32476
```

---

> **Remember:** Lyra is not a suggestion — it's a standard. Every pixel, every padding value,
> every color, every font weight must trace back to a token in this file or the Lyra Storybook.
> The goal is a UI where any screen could be placed next to any other and look like they belong
> to the same product family.
