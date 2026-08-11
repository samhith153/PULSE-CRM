# PULSE CRM — Design System

Reverse-engineered from the reference dashboard screenshot, extended to cover every CRM surface (Leads, Pipeline, Companies, Contacts, Reports, Forecast, Settings, AI components). Where the reference doesn't show a pattern directly, the rule below is inferred from its visual language, not invented independently — noted with **[inferred]**.

---

## 1. Visual Personality (observed)

- Clean enterprise SaaS look: light-grey app canvas, white "floating" surfaces, one saturated brand blue used sparingly for emphasis.
- Medium-high information density (KPI row + two chart cards + two list cards visible without scrolling) but never cramped — achieved through generous internal padding rather than small type.
- Flat design: no skeuomorphism, no heavy gradients except two intentional accent gradients (area chart fill, one KPI sparkline).
- Rounded-everything: cards, buttons, badges, avatars, nav pills — nothing sharp-cornered.
- Exactly one card per screen carries strong color (Total Profit, filled blue) — a "hero KPI" pattern that establishes hierarchy at a glance.

---

## 2. Color Tokens

### Base
| Token | Value | Usage |
|---|---|---|
| `--background` | `#F4F5F7` | App canvas behind all cards |
| `--surface` | `#FFFFFF` | Cards, sidebar, header |
| `--surface-secondary` | `#F7F8FA` | Table header row, input fill |
| `--surface-hover` | `#F0F1F5` | Row/item hover |
| `--surface-selected` | `#EEF1FF` | Selected nav item background (light variant) |

### Border
| Token | Value |
|---|---|
| `--border` | `#E7E8ED` |
| `--border-subtle` | `#F0F1F4` |
| `--border-strong` | `#D5D7DE` |

### Text
| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#161821` | Titles, KPI numbers |
| `--text-secondary` | `#5B5F6B` | Card titles, body |
| `--text-muted` | `#9498A3` | Captions, helper text, nav labels |
| `--text-disabled` | `#C4C6CE` | Disabled controls |
| `--text-on-primary` | `#FFFFFF` | Text on filled-blue surfaces |

### Brand / Primary
| Token | Value | Usage |
|---|---|---|
| `--primary` | `#3D5AFE` | Active nav, primary buttons, hero KPI fill, primary chart series |
| `--primary-hover` | `#2F46E0` | |
| `--primary-active` | `#2437C2` | |
| `--primary-subtle` | `#EEF1FF` | Chip/badge backgrounds, selected states |

### Semantic
| Token | Value | Usage |
|---|---|---|
| `--success` | `#3DA35D` text / `#E6F6EA` bg | Positive trend badges, "On Process"/lime donut segment |
| `--success-strong` | `#7CC443` | Lime accent (bars, donut) — a secondary brand accent, not interchangeable with `--success` |
| `--warning` | `#B8860B` text / `#FBF2DD` bg | At-risk / medium priority |
| `--danger` | `#E5484D` text / `#FDEAEA` bg | Negative trend badges |
| `--info` | `#3D5AFE` text / `#EEF1FF` bg | Neutral informational badges |

### Data-viz palette (ordered, for series/categories)
`#3D5AFE` (primary blue) → `#7CC443` (lime) → `#8FA6F2` (soft blue) → `#B7C2F7` (paler blue) → `#5FD4C4` (teal, gradient fills only)

Chart gradient fills (area chart, hero sparkline) use the series color at 35% opacity fading to 0%, top to bottom — never a flat fill.

**Rule:** `--success-strong` (lime) is a chart/data accent, distinct from `--success` (semantic positive state). Don't use lime for form validation — reserve it for chart series and the "positive" donut segment.

---

## 3. Typography

**Family:** A geometric/humanist sans (visual match: Inter, Manrope, or General Sans). Fallback stack: `'Inter', 'Manrope', -apple-system, 'Segoe UI', sans-serif`.
**Weights used:** Regular (400), Medium (500), Semibold (600), Bold (700) only — no light or black weights anywhere. Numerals are tabular (fixed-width) so KPI figures don't jitter on update.

| Level | Size | Weight | Line-height | Letter-spacing | Usage |
|---|---|---|---|---|---|
| Page title | 28px | 700 | 1.2 | 0 | "Dashboard" |
| Page description | 14px | 400 | 1.4 | 0 | Subtitle under page title, `--text-muted` |
| Section/card title | 16px | 600 | 1.3 | 0 | "Sales Report Area", "Best Sellers" |
| KPI metric (large) | 26–30px | 700 | 1.1 | -0.01em | "$14,813.10", "786K" |
| KPI metric (donut center) | 24px | 700 | 1.1 | 0 | "786K" centered value |
| Body | 14px | 400 | 1.5 | 0 | Table cells, general text |
| Secondary/comparison text | 13px | 400 | 1.4 | 0 | "vs last month $12,534.00", `--text-muted` |
| Nav section label | 11px | 600 | 1.3 | 0.06em, uppercase | "MAIN MENU", "SETTINGS" |
| Nav item label | 14px | 500 | 1.3 | 0 | "Business Overview" |
| Badge/trend text | 12px | 600 | 1.2 | 0 | "+3.9%", "-2.8%" |
| Table header | 12px | 600 | 1.3 | 0.02em, uppercase-optional | "Seller", "Stats", "Total" — `--text-muted` |
| Button text | 14px | 600 | 1.2 | 0 | |
| Caption | 12px | 400 | 1.3 | 0 | Timestamps, meta |

---

## 4. Spacing Scale

8px base unit, consistent everywhere (page padding, card padding, grid gaps, form fields):

| Token | Value |
|---|---|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 20px |
| `xl` | 24px |
| `2xl` | 32px |
| `3xl` | 48px |

- Card internal padding: `xl` (24px)
- Grid gap between cards: `lg` (20px)
- Page outer padding: `2xl` (32px)
- Sidebar internal padding: `md`–`lg`
- Form field vertical gap: `md` (16px)

---

## 5. Radius & Shadow

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Inputs, small chips |
| `--radius-md` | 12px | Buttons, table cells, nav item pill |
| `--radius-lg` | 20px | Cards (standard, KPI, chart) |
| `--radius-full` | 999px | Pill buttons ("Export", "Monthly"), badges, avatars |

| Token | Value |
|---|---|
| `--shadow-card` | `0 1px 2px rgba(16,18,33,0.04), 0 8px 24px rgba(16,18,33,0.05)` |
| `--shadow-hover` | `0 4px 12px rgba(16,18,33,0.08)` |
| `--shadow-popover` | `0 12px 32px rgba(16,18,33,0.12)` |

No shadow on the sidebar or header — only on cards floating over `--background`. Never stack more than one shadow depth per element.

---

## 6. Application Shell

- **Sidebar:** 240px expanded / 72px collapsed **[inferred collapsed width]**. White surface, no border (separated from canvas by background color contrast only), rounded outer corner (~20px) as it floats inset from the viewport edge.
- **Header:** 72px height. Search field (pill, `--surface-secondary` fill, `--radius-full`) left-of-center, notification bell + avatar + name/email right-aligned.
- **Content padding:** `2xl` (32px) on all sides.
- **Max content width:** 1440px, centered on ultrawide.
- **Nav item:** height 44px, `--radius-md`, icon 20px + label 14px/500, `md` internal padding. Active state: `--primary` fill, white icon/text. Hover (inactive): `--surface-hover` background, no color change to icon.
- **Nav section label:** `xs` above, `sm` below, per the typography table.

---

## 7. Page Structure (applies to every major page)

```
PAGE
├── Page Header
│   ├── Title (28px/700)
│   ├── Description (14px/400, muted)
│   ├── Actions (right-aligned: secondary pill buttons, e.g. Export/Filter)
│   └── Optional filter bar
├── KPI Row (3–4 MetricCards, one may be "hero" filled-primary)
├── Primary Content (2-column grid: ChartCard + ChartCard, or ChartCard + TableCard)
└── Secondary Content (TableCard + supporting card)
```

Grid: KPI row = 4 equal columns (`lg` gap). Primary/secondary content = 2 equal columns on desktop, stacks to 1 column ≤1024px.

---

## 8. Card System

All cards share: `--surface` background, `--radius-lg`, `--shadow-card`, `xl` padding, header row = title (16px/600) + optional right-aligned control (dropdown pill or `⋮` menu icon), no visible border unless card is in a hover/interactive list context.

| Component | Distinguishing trait |
|---|---|
| `StandardCard` | Base primitive — everything below extends this |
| `MetricCard` | Label → large metric → trend badge → comparison line (see §9) |
| `ChartCard` | Header with period dropdown (pill, "Monthly ▾") + `⋮` menu; chart fills remaining height |
| `InsightCard` | `--primary-subtle` background instead of white, used for AI-generated content only (§21) |
| `ActivityCard` | List rows, avatar + text left, value right, `--border-subtle` row dividers |
| `ScoreCard` | Circular/radial score visual + label stack (§17) |
| `AIInsightCard` | InsightCard + small sparkle/AI glyph next to title + confidence tag |
| `RecommendationCard` | AIInsightCard + primary "Take action" button in footer |
| `PipelineCard` | Horizontal stage columns, header shows total value (§15) |
| `TableCard` | ChartCard shell wrapping a Table (§16) |

**Hover behavior:** cards are static (no lift/hover) unless individually clickable (e.g. a list row inside a card) — hover then applies `--surface-hover` to the row only, not the whole card.

---

## 9. KPI / Metric Cards

Structure, top to bottom:
1. Label (14px/500, `--text-secondary`) + optional top-right icon-in-circle (external-link glyph, 32px circle, `--surface-secondary` or white-on-primary for the hero card)
2. Metric (26–30px/700) — dominant element
3. Trend badge (pill, `success`/`danger` colors, 12px/600, arrow glyph + percentage)
4. Comparison caption (13px/400, muted): "vs last month $X"

**Hero variant** (one per KPI row max): `--primary` fill background, white text throughout, trend badge becomes white-on-translucent-white (`rgba(255,255,255,0.16)` bg, white text).

**Sparkline variant:** metric card may replace the trend badge + caption with a small inline area-chart (gradient fill, no axes, no gridlines) anchored to the card's bottom edge — used when the KPI itself is inherently a trend (e.g. Gross Margin).

Do not add borders, icons-as-decoration, or secondary metrics inside a KPI card — one number, one trend, one comparison.

---

## 10–14. Data Visualization

General rules across all chart types:
- No default library chrome. Strip axis lines to a single faint baseline (`--border-subtle`) or remove entirely for sparklines.
- Gridlines: horizontal only, `--border-subtle`, max 3–4 lines, never vertical.
- Font: chart labels 12px/500 `--text-muted`; data labels (e.g. "+9.9%" over bars) 11px/600 in a pill matching trend badge style.
- Tooltip: white surface, `--radius-md`, `--shadow-popover`, 12px padding, appears on hover/touch only.
- Chart padding: `md` (16px) internal to the card, below the header.

**Line/Area charts** — trends over time (revenue, engagement, forecast). Line thickness 2.5px, rounded caps, no points shown by default (points appear only on hover as a 6px filled circle). Area fill = series color gradient 35%→0% opacity.

**Bar charts** — categorical comparison (pipeline by stage, lead sources, team performance). Bar radius: top corners only, `--radius-sm` (8px). Consistent width with `sm`–`md` gaps between bars. Color hierarchy: the "current/selected" bar gets `--primary` solid fill; others get `--primary-subtle` or the paler blue tint — exactly as in the reference (Profit/Insight/Target lighter, Sale bar solid blue as the focal one).

**Donut charts** — proportional composition only (e.g. lead source mix, win/loss ratio). Thick stroke (not thin ring), rounded stroke caps at segment ends, center hosts the primary aggregate metric (26px/700) + label (12px muted) beneath. Segment order and color must map 1:1 with the data-viz palette in §2, consistently across every chart that shows the same category.

**[inferred] Funnel charts** — pipeline stage volume — use the same bar radius/gap rules as bar charts, oriented horizontally, width proportional to stage count.

---

## 15. Pipeline Visualization

Stages and their **fixed** semantic colors (used identically in Kanban board, funnel chart, badges, and table stage-pills everywhere in the app):

| Stage | Color |
|---|---|
| New | `#8FA6F2` (soft blue) |
| Contacted | `#3D5AFE` (primary) |
| Qualified | `#7CC443` (lime) |
| Proposal | `#B8860B` on `#FBF2DD` (warning tone) |
| Negotiation | `#E08A2C` on `#FDF0E1` **[inferred, orange]** |
| Won | `#3DA35D` on `#E6F6EA` (success) |
| Lost | `#E5484D` on `#FDEAEA` (danger) |

`PipelineCard`: stage columns of equal width, `--surface-secondary` background per column, column header = stage name + count + total value, cards inside are compact `StandardCard` variants (`--radius-md`, `sm` padding).

---

## 16. Table System

- Header row: `--surface-secondary` background, 12px/600 uppercase-tracked labels, `--text-muted`, 44px height, no vertical dividers.
- Row height: 56px (allows avatar + two-line cell as in "Best Sellers"). Row divider: 1px `--border-subtle`, full-width.
- Cell padding: `md` horizontal, vertical centered.
- Row hover: `--surface-hover`.
- Row selected: `--primary-subtle` background + 3px `--primary` left border accent.
- Sort indicator: small chevron next to header label, `--text-muted` default → `--text-primary` on active column.
- Pagination: bottom-right, pill page buttons, `--radius-full`, current page = `--primary` fill.
- Empty state: see §28. Loading state: skeleton rows matching exact column widths, `--surface-secondary` shimmer.
- High-emphasis cell values (Lead Score, Priority, Revenue, Stage, Status) render as a `Badge`/`ScoreCell`, never as plain text — this is what gives tables scannability at density.

---

## 17. Lead Score Component (single reusable primitive, used everywhere)

Visual: radial/ring gauge, 48px diameter in dense contexts (table row), 96px in Lead Details/Dashboard. Ring color interpolates along `--danger → --warning → --success` based on score tercile. Center shows numeric score (e.g. "82"), no decimal.

Composed states:
- **Overall Score** — the ring, always present.
- **Fit Score** / **Engagement Score** — shown as two thin horizontal sub-bars beneath the ring in expanded contexts only (Lead Details), each with a label + numeric value, same success/warning/danger color logic.
- **Priority** — derived text badge (Critical/High/Medium/Low, see §18), placed beside the ring, not inside it.
- **Trend** — small up/down arrow + delta, same badge style as KPI trend badges (§9), placed under the score number.

This exact component (not a per-page reimplementation) is used in: Lead list row (compact), Lead Details header (expanded), Dashboard "top leads" card, Reports, AI insight cards, Pipeline card.

---

## 18. Status System

Every status is a pill badge: `--radius-full`, 4px/10px padding, 12px/600 text, colored dot (6px circle) to the left of the label when used standalone (not embedded in a table cell that already has color).

**Priority:** Critical (`danger`), High (`#E08A2C`/`#FDF0E1`), Medium (`warning`), Low (`--text-muted`/`--surface-secondary`).
**Pipeline stage:** per §15 table.
**Generic:** Success / Warning / Danger / Info per §2 semantic tokens.

Rule: a status color is defined once, centrally, and referenced by every component that displays that status — never redefined per page.

---

## 19. Button System

| Variant | Style |
|---|---|
| Primary | `--primary` fill, white text, `--radius-full`, height 40px, `lg` horizontal padding |
| Secondary | White fill, `--border` outline, `--text-primary` text, same shape — matches "Export"/"Filter" pills in reference |
| Tertiary | No fill/border, `--primary` text, underline on hover |
| Ghost | No fill/border, `--text-secondary`, `--surface-hover` on hover only |
| Danger | `--danger` fill or `--danger` text on transparent (destructive-confirm contexts only) |
| Icon | 36px square, `--radius-md`, `--surface-secondary` fill, icon 18px centered |

States: hover = darken fill 8% or apply `--surface-hover`; active = darken 16%; focus = 2px `--primary` outline offset 2px; disabled = 40% opacity, no pointer events; loading = spinner replaces label, button width locked to prevent layout shift.

---

## 20. Form System

Inputs: 40px height, `--radius-sm`, 1px `--border`, `--surface` fill, `md` horizontal padding, 14px/400 text. Focus: `--border` → `--primary`, plus 3px `--primary-subtle` outer ring. Error: border → `--danger`, helper text below in `--danger`, 12px. Label: 13px/500 `--text-secondary`, `sm` below the input's top. Placeholder: `--text-muted`. Disabled: `--surface-secondary` fill, `--text-disabled` text.

Select/Combobox/Date picker share the input shell; dropdown panel uses `--shadow-popover` + `--radius-md`. Checkbox/Radio: 18px, `--radius-sm` (4px) for checkbox, full-round for radio, `--primary` when checked. Switch: pill track, `--border-strong` off / `--primary` on.

---

## 21. AI Components

AI content is visually marked by **surface**, not by a different type system: `--primary-subtle` background instead of white, everything else (radius, padding, typography scale) identical to a `StandardCard`. A small AI glyph (2–3 sparkle marks, 14px, `--primary`) sits left of the card title — the only decorative concession.

- **AI Insight Card** — title + 2–3 lines of body text (14px/400).
- **AI Recommendation** — Insight Card + one Primary button footer ("Apply", "Send follow-up").
- **AI Summary** — condensed InsightCard, no footer, used inline (e.g. top of Lead Details).
- **AI Explanation** — expandable text ("Why this score?"), collapsed by default, `Tertiary` button to expand.
- **AI Suggested Action** — list of 1–3 ghost-button rows inside an InsightCard.
- **AI Confidence indicator** — thin horizontal bar (4px height, `--radius-full`), fill = `--primary`, with a "High/Medium/Low confidence" 12px caption — not a percentage number, to avoid false precision.

---

## 22–25. Lead Details, Dashboard, Reports, Forecast

**Lead Details:** header band = name + company (18px/700) + expanded Lead Score component + Priority badge, all left-aligned in a single `StandardCard`; below it, 2-column layout — left column (wider): activity timeline, email conversation, AI insights; right column (narrower, sticky): contact info, company card, buying-stage indicator.

**Dashboard:** exact section order from §7, with the KPI row's hero card reserved for the single most important number (revenue or pipeline value) and AI insights placed after Activity, never above the fold ahead of hard numbers.

**Reports:** filter bar (date range pill + segment dropdowns) directly under page header; KPI row; then trend chart full-width before comparison charts/tables — analytical reading order, not decorative.

**Forecast [inferred]:** hero KPI = Expected Revenue with a confidence sub-caption ("±8% confidence") instead of a trend badge; stage distribution as a horizontal funnel bar (§10–14); risk/opportunity items as a two-column `ActivityCard` list using `warning`/`success` status dots.

---

## 26–29. States

**Interaction states** required on every interactive component: default, hover, focus (visible 2px ring, never removed for mouse users), active, selected, disabled, loading. Loading always uses geometry-matched skeletons (`--surface-secondary` shimmer), never a generic spinner except inside buttons.

**Empty states:** icon (24px, `--text-muted`) + one-line explanation of what's missing + one-line of why/what-to-do + a Primary or Secondary button when an action exists. Center-aligned inside the card/table area, `2xl` vertical padding.

**Error states:** specific and actionable — name the failed operation and the fix ("Couldn't load leads — check your connection and retry"), never "Something went wrong." Danger-tinted icon, Secondary "Retry" button.

---

## 30. Responsive Behavior

| Breakpoint | Sidebar | KPI row | Content grid | Tables |
|---|---|---|---|---|
| ≥1440px | Expanded (240px) | 4 columns | 2 columns | Full columns |
| 1024–1439px | Expanded | 2×2 grid | 2 columns | Full columns, horizontal scroll if needed |
| 768–1023px | Collapsed (72px, icons only) | 2×2 grid | 1 column, stacked | Card-per-row fallback for dense tables |
| <768px | Off-canvas drawer (hidden by default) | 1 column stacked | 1 column | Card-per-row (label:value pairs) |

Charts: below 768px, reduce chart height ~30% and hide secondary series in the legend rather than shrinking font sizes.

---

## 31. Accessibility

WCAG AA contrast minimum for all text/background pairs (verify `--text-muted` on `--surface-secondary` specifically — it's the tightest pair in this palette). Full keyboard navigation with visible focus rings (never `outline: none` without a replacement). Semantic HTML (`<table>`, `<button>`, `<nav>`, landmark regions). Icon-only buttons get `aria-label`. Status conveyed by color always has a redundant text/icon cue (never color alone — relevant for stage pills and score rings). Respect `prefers-reduced-motion`: disable chart entrance animations and skeleton shimmer motion.

---

## 32. Component Architecture

```
components/
├── ui/          Button, Card, Badge, Input, Select, Tooltip, Modal, Skeleton
├── charts/       LineChart, BarChart, AreaChart, DonutChart, FunnelChart
├── crm/          LeadScore, PipelineStage, StatusBadge, ActivityTimeline,
│                 AIInsightCard, RecommendationCard, ConfidenceBar
└── layout/       Sidebar, Header, PageContainer, PageHeader
```

Rule before adding anything new: does `ui/` already cover this? Can an existing `crm/` component be extended with a prop instead of forked? Only create new when neither holds.

---

## 33. Visual QA Checklist

- [ ] One color source (§2 tokens) — no hex values outside the token file
- [ ] One radius scale — cards always `--radius-lg`, buttons/badges always `--radius-full` or `--radius-md`, never mixed per-page
- [ ] One spacing scale — no arbitrary px values in component styles
- [ ] Stage/status colors identical across Pipeline, Lead list, Lead Details, Reports
- [ ] Lead Score component visually identical everywhere it appears
- [ ] AI components share the `--primary-subtle` surface convention, nothing else visually distinct
- [ ] Every interactive element has all 7 states implemented
- [ ] Table density (row height, padding) identical across every table in the app