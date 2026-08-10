# Pulse — Design System Spec (landing page → dashboard)

Use this as the single source of truth to restyle the existing dashboard so it matches the Pulse
landing page. Everything is token-based: **never hardcode colors** (`text-white`, `bg-[#5b3df5]`)
in components — always use the semantic tokens below.

Stack assumed: React + Tailwind v4 (CSS-first config via `@theme` in `src/styles.css`) + lucide-react
icons + shadcn/ui (new-york style, slate base, CSS variables on).

---

## 1. Color tokens (oklch)

Paste into `src/styles.css`.

```css
:root {
  --radius: 0.75rem;

  /* Brand */
  --cream:        oklch(0.9448 0.016 82.79);   /* warm page band            #f0e9dd-ish */
  --cream-border: oklch(0.9142 0.0174 84.59);
  --surface-warm: oklch(0.9706 0.0057 84.57);  /* subtle card / muted bg    */
  --ink:          oklch(0.1951 0.016 284.82);  /* near-black, cool          */
  --ink-band:     oklch(0.2007 0.0159 290.62); /* dark section background   */
  --link:         oklch(0.5741 0.2015 262);    /* focus ring + links        */
  --brand-purple: oklch(0.4685 0.1522 301.7);  /* primary accent            */
  --brand-blue:   oklch(0.5124 0.209 274.64);  /* hero mesh base            */
  --brand-cyan:   oklch(0.8168 0.1193 205.31); /* positive delta / data pop */

  /* Semantic (light) */
  --background: oklch(1 0 0);
  --foreground: oklch(0.1951 0.016 284.82);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1951 0.016 284.82);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.1951 0.016 284.82);
  --primary: oklch(0.1951 0.016 284.82);        /* ink, not purple */
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.9706 0.0057 84.57);
  --secondary-foreground: oklch(0.1951 0.016 284.82);
  --muted: oklch(0.9706 0.0057 84.57);
  --muted-foreground: oklch(0.474 0.0128 285.9);
  --accent: oklch(0.9706 0.0057 84.57);
  --accent-foreground: oklch(0.1951 0.016 284.82);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.915 0.005 285);
  --input: oklch(0.915 0.005 285);
  --ring: oklch(0.5741 0.2015 262);

  /* Charts */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);

  /* Sidebar */
  --sidebar: oklch(0.984 0.003 247.858);
  --sidebar-foreground: oklch(0.1951 0.016 284.82);
  --sidebar-primary: oklch(0.1951 0.016 284.82);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.9706 0.0057 84.57);
  --sidebar-accent-foreground: oklch(0.1951 0.016 284.82);
  --sidebar-border: oklch(0.915 0.005 285);
  --sidebar-ring: oklch(0.5741 0.2015 262);

  /* Gradients (feature badges / icon tiles) */
  --grad-teal-purple:  linear-gradient(135deg, oklch(0.7038 0.123 182.5),  oklch(0.4685 0.1522 301.7));
  --grad-pink-purple:  linear-gradient(135deg, oklch(0.6559 0.2118 354.31), oklch(0.4685 0.1522 301.7));
  --grad-orange-pink:  linear-gradient(135deg, oklch(0.729 0.1696 35.11),  oklch(0.6559 0.2118 354.31));
  --grad-blue-purple:  linear-gradient(135deg, oklch(0.5124 0.209 274.64), oklch(0.4685 0.1522 301.7));

  /* Elevation */
  --shadow-float: 0 24px 60px -20px oklch(0.1951 0.016 284.82 / 22%);
  --shadow-nav:   0 6px 24px -12px  oklch(0.1951 0.016 284.82 / 25%);
}
```

Expose them to Tailwind:

```css
@theme inline {
  --color-cream: var(--cream);
  --color-cream-border: var(--cream-border);
  --color-surface-warm: var(--surface-warm);
  --color-ink: var(--ink);
  --color-ink-band: var(--ink-band);
  --color-link: var(--link);
  --color-brand-purple: var(--brand-purple);
  --color-brand-blue: var(--brand-blue);
  --color-brand-cyan: var(--brand-cyan);
  /* plus the standard --color-background / --color-primary / … mappings */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --radius-sm:  calc(var(--radius) - 4px);
  --radius-md:  calc(var(--radius) - 2px);
  --radius-lg:  var(--radius);
  --radius-xl:  calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
}
```

### Color usage rules for the dashboard

| Surface | Token / class |
|---|---|
| App background | `bg-background` (white) or `bg-surface-warm` for a warmer canvas |
| Sidebar | `bg-sidebar` + `border-sidebar-border`; active item `bg-sidebar-accent text-sidebar-primary` with a `brand-purple` left indicator or icon tint |
| Cards / panels | `bg-card border border-border rounded-2xl` |
| Dark hero/summary band inside dashboard | `bg-ink-band text-primary-foreground` (use `mesh-hero` for the animated version) |
| Primary CTA (e.g. "New Report") | `bg-ink text-background` pill, or `bg-brand-purple text-primary-foreground` for the accent variant |
| Positive delta / sparkline highs | `text-brand-cyan` |
| Negative delta | `text-destructive` |
| Chart series | purple → cyan → blue ramp: `brand-purple`, `brand-cyan`, `brand-blue`, then `chart-4`, `chart-5` |
| Stage bars (New/Qualified/…) | alternate `brand-blue` / `brand-cyan` / `brand-purple`, with the count label in `primary-foreground` |
| Focus ring | `ring-2 ring-ring ring-offset-2` (`--ring` = link blue) |

On the **dark band only**, replace neutrals with alpha layers on `primary-foreground`:
`bg-primary-foreground/8`, `border-primary-foreground/12`, body copy `text-primary-foreground/70`.

---

## 2. Typography

- Family: **Inter** everywhere (`--font-sans`), `-webkit-font-smoothing: antialiased`.
- Page title: `text-3xl md:text-[2.75rem] font-bold tracking-tight` (e.g. "Reports & analytics").
- Section heading: `text-base font-semibold tracking-tight`.
- Card metric: `text-2xl font-semibold`.
- Label above metric: `text-xs text-muted-foreground` (uppercase optional: `uppercase tracking-wide text-[11px]`).
- Body/sub: `text-sm leading-relaxed text-muted-foreground`.
- Micro/meta: `text-[11px]` or `text-[10px]` at `/55`–`/60` opacity.

---

## 3. Shape, spacing, elevation

- Radii: pills for buttons (`rounded-full`), `rounded-2xl` for cards/panels, `rounded-xl` for icon tiles (`size-9 grid place-items-center`), `rounded-lg` for chips/selects.
- Borders are 1px and low-contrast: `border-border` (light) / `border-primary-foreground/12` (dark).
- Card padding: `p-4` compact, `p-6` standard; grid gaps `gap-3`/`gap-4`.
- Shadows only on floating things: `shadow-float` (big panels/modals), `shadow-nav` (hovered buttons, dropdowns). Flat cards get **no** shadow — borders do the work.
- Glass panels over the dark band: `bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/15 shadow-float`.

---

## 4. Components to port

### Pill button (`PillButton`)
```tsx
const pillVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-200 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        dark:    "bg-ink text-background hover:-translate-y-0.5 hover:shadow-nav",
        light:   "bg-background text-ink hover:-translate-y-0.5 hover:shadow-nav border border-transparent",
        outline: "border border-border bg-background text-ink hover:bg-secondary",
      },
      size: { sm: "h-9 px-4", md: "h-11 px-6", lg: "h-13 px-7 text-base" },
    },
    defaultVariants: { variant: "dark", size: "md" },
  },
);
```
Dashboard mapping: "New Report" = `dark`; "Customize Layout" / date range = `outline`; CTA on dark band = `light`.

### Stat tile
Icon tile (`size-9 rounded-xl bg-primary-foreground/15` or `bg-secondary`) → label (`text-xs muted`) →
value (`text-2xl font-semibold`) → delta row `text-[11px] text-brand-cyan` with `ArrowUpRight` + "vs last week" in muted.

### Chip / filter select
`inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs` + `ChevronDown` at `size={13}`.

### List row
`flex items-center gap-2 rounded-xl bg-secondary px-3 py-2` — icon (`text-brand-purple`, 14px), flex-1 label `text-xs`, right-aligned value `text-xs font-semibold`.

### Insight / AI banner
`rounded-2xl border bg-brand-purple/10 p-4` (light) or `bg-brand-purple/40` on dark, with `Sparkles` icon tile, title `text-sm font-medium`, body `text-xs muted`, and a pill action `arrow-nudge`.

### Area chart
Inline SVG, `viewBox="0 0 100 90" preserveAspectRatio="none"`, filled area at 12% opacity, 2px stroke with `vectorEffect="non-scaling-stroke"`, point dots `r=1.6` in `brand-cyan`. Axis labels `text-[10px]` muted, `flex justify-between`.

Icons: **lucide-react**, sizes 13/14/16 in UI chrome, `strokeWidth` default.

---

## 5. Motion vocabulary

Add these utilities/keyframes to `src/styles.css`; they're what make the landing page feel alive.

```css
@utility reveal {                 /* fade+rise on scroll, driven by data-visible */
  opacity: 0; transform: translateY(22px);
  transition: opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1);
  &[data-visible="true"] { opacity: 1; transform: none; }
}
@utility reveal-scale {           /* same, with a 0.96 scale-in */
  opacity: 0; transform: scale(.96) translateY(18px);
  transition: opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1);
  &[data-visible="true"] { opacity: 1; transform: none; }
}
@utility arrow-nudge {            /* icon slides 4px right on hover */
  & svg { transition: transform .25s cubic-bezier(.22,1,.36,1); }
  &:hover svg { transform: translateX(4px); }
}
@keyframes rise-in { from { opacity:0; transform: translateY(24px) } to { opacity:1; transform:none } }
@utility rise-in { opacity:0; animation: rise-in .6s cubic-bezier(.22,1,.36,1) forwards; }

@keyframes fade-in-soft { from { opacity:0 } to { opacity:1 } }
@utility fade-in-soft { animation: fade-in-soft .32s ease-out both; }

@keyframes shimmer-sweep { 0% { transform: translateX(-120%) } 100% { transform: translateX(220%) } }
@utility shimmer {                /* loading/skeleton sweep */
  &::after {
    content:""; position:absolute; inset:0; width:40%;
    background: linear-gradient(90deg, transparent, oklch(1 0 0 / 10%), transparent);
    animation: shimmer-sweep 3.6s ease-in-out infinite; pointer-events:none;
  }
}

/* Animated gradient mesh — use behind a dashboard hero/summary band */
@utility mesh-hero { background-color: var(--brand-blue); position:relative; isolation:isolate; overflow:hidden; }
@utility mesh-blob { position:absolute; border-radius:9999px; filter: blur(70px); opacity:.85; will-change: transform; }
@keyframes drift-a { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(8%,10%,0) scale(1.15)} }
@keyframes drift-b { 0%,100%{transform:translate3d(0,0,0) scale(1.1)} 50%{transform:translate3d(-10%,-8%,0) scale(.95)} }
@keyframes drift-c { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(6%,-12%,0) scale(1.2)} }
@utility drift-a { animation: drift-a 22s ease-in-out infinite; }
@utility drift-b { animation: drift-b 28s ease-in-out infinite; }
@utility drift-c { animation: drift-c 25s ease-in-out infinite; }

/* Grid backdrop for dark panels */
@utility circuit-bg {
  background-image:
    linear-gradient(to right,  oklch(1 0 0 / 12%) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(1 0 0 / 12%) 1px, transparent 1px);
  background-size: 56px 56px;
  animation: circuit-drift 40s linear infinite;
  mask-image: radial-gradient(ellipse at center, black, transparent 78%);
}
@keyframes circuit-drift { from { background-position:0 0,0 0 } to { background-position:56px 112px,56px 112px } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important; animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

Scroll-reveal hook (`useReveal`) — IntersectionObserver at `threshold 0.15`, `rootMargin "0px 0px -60px 0px"`, disconnects after first hit. `useCountUp` animates metrics with cubic ease-out over ~1.4s when the tile enters view — perfect for KPI cards.

**Timing rules:** easing `cubic-bezier(.22,1,.36,1)` for entrances, `ease-out` for fades; 200–250ms for hovers, 400–600ms for entrances, staggered by `transitionDelay: index * 60–90ms` in grids. Hover lift is always `-translate-y-0.5` + `shadow-nav`.

---

## 6. Layout patterns

- Content max width `max-w-6xl`/`max-w-7xl`, horizontal padding `px-6`.
- Section rhythm on marketing: `py-28 md:py-36`; in-app: `py-8` with `space-y-6`.
- KPI row: `grid gap-3 sm:grid-cols-3 lg:grid-cols-5`.
- Chart + side panel: `grid gap-3 lg:grid-cols-[1.4fr_1fr]`.
- Responsive header rule (important): rows mixing text + widgets use
  `grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between`,
  with `min-w-0` on text containers, `shrink-0` on icons/avatars, `truncate` on single-line titles.

---

## 7. Quick mapping for your current dashboard screenshot

| Current | Change to |
|---|---|
| Purple sidebar active pill | `bg-sidebar-accent` + `text-brand-purple` icon, 2px `brand-purple` left bar, `rounded-xl` |
| "+ New Report" solid purple button | Pill `variant="dark"` (ink) — keep purple only for the AI/Sparkles affordance |
| Square KPI cards w/ shadows | `rounded-2xl border border-border bg-card p-4`, no shadow; icon tile top-right → move to top-left `size-9 rounded-xl bg-secondary` |
| KPI numbers static | animate with `useCountUp` + `reveal` stagger |
| Revenue line chart purple | keep `brand-purple` stroke, 12% fill, `brand-cyan` point dots |
| "Deals by stage" bars | ramp `brand-blue → brand-cyan → brand-purple`, `rounded-full`, count centered in `primary-foreground` |
| Header search bar | `rounded-full border border-border bg-secondary h-11 px-4`, `Search` icon 16px muted, `⌘K` chip `rounded-md bg-background text-[11px]` |
| Floating AI orb | `grad-blue-purple` background + `shadow-float`, `Sparkles` icon, hover `-translate-y-0.5` |

Dark mode: keep the same tokens, swap `--background` to `--ink-band`, `--card` to a `+4%` lift of it, and body copy to `primary-foreground/70`.
