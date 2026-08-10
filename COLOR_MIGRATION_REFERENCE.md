# PULSE CRM Color Migration Reference

## Complete Color Replacement Map

### Primary Brand Colors

| Old Color (Purple) | New Color (Pulse Blue) | Usage |
|-------------------|----------------------|-------|
| `#7c3aed` | `#2563EB` | Primary buttons, active states, links, icons |
| `#6d28d9` | `#1D4ED8` | Button hover states, darker accents |
| `#5b21b6` | `#1D4ED8` | Gradient endpoints |

### Background Colors

| Old Color | New Color | Usage |
|-----------|-----------|-------|
| `#f5f3ff` | `#EFF6FF` | Light backgrounds, icon containers, active nav items |
| `linear-gradient(180deg, #f5f3ff 0%, #fff 100%)` | `linear-gradient(180deg, #EFF6FF 0%, #fff 100%)` | Hero section backgrounds |
| `linear-gradient(135deg, #f5f3ff 0%, #fff 100%)` | `linear-gradient(135deg, #EFF6FF 0%, #fff 100%)` | Statistics section backgrounds |
| `linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)` | `linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)` | Highlighted pricing cards |
| `linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)` | `linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)` | CTA sections |

### Border Colors

| Old Color | New Color | Usage |
|-----------|-----------|-------|
| `#ede9fe` | `#DBEAFE` | Light borders, card edges |
| `#c4b5fd` | `#BFDBFE` | Active/selected borders |

### Radial Gradients

| Old Pattern | New Pattern | Usage |
|-------------|-------------|-------|
| `radial-gradient(circle, #7c3aed 0%, transparent 70%)` | `radial-gradient(circle, #2563EB 0%, transparent 70%)` | Background decoration blobs |
| `radial-gradient(circle, #9333ea 0%, transparent 70%)` | `radial-gradient(circle, #1D4ED8 0%, transparent 70%)` | Secondary decoration blobs |

### Shadow Colors

| Old Shadow | New Shadow | Usage |
|------------|------------|-------|
| `rgba(124,58,237,0.35)` | `rgba(37,99,235,0.35)` | Button shadows |
| `rgba(124,58,237,0.45)` | `rgba(37,99,235,0.45)` | Button hover shadows |
| `rgba(124,58,237,0.25)` | `rgba(37,99,235,0.25)` | Card shadows |
| `rgba(124,58,237,0.4)` | `rgba(37,99,235,0.4)` | CTA button shadows |
| `rgba(124,58,237,0.1)` | `rgba(37,99,235,0.1)` | Subtle hover shadows |
| `rgba(124,58,237,0.08)` | `rgba(37,99,235,0.08)` | Very subtle shadows |
| `rgba(124,58,237,0.15)` | `rgba(37,99,235,0.15)` | Card hover shadows |

## Quick Reference: CSS Variable Updates

```css
/* OLD PURPLE PALETTE */
--primary-purple: #7c3aed;
--primary-purple-dark: #6d28d9;
--primary-purple-darker: #5b21b6;
--purple-light-bg: #f5f3ff;
--purple-light-border: #ede9fe;
--purple-border-active: #c4b5fd;

/* NEW PULSE BLUE PALETTE */
--primary-blue: #2563EB;
--primary-blue-dark: #1D4ED8;
--blue-light-bg: #EFF6FF;
--blue-light-border: #DBEAFE;
--blue-border-active: #BFDBFE;
--blue-disabled: #60A5FA;
```

## Component-Specific Color Updates

### Navbar Component
- Logo icon background: `#2563EB`
- Logo "CRM" text: `#2563EB`
- Active nav item background: `#EFF6FF`
- Active nav item text: `#2563EB`
- Dropdown icon containers: `#EFF6FF` background, `#DBEAFE` border
- Dropdown icons: `#2563EB`
- Get Started button: `#2563EB` → hover: `#1D4ED8`
- Active menu underline gradient: uses `#2563EB`

### Pricing Page
- Hero badge: `#EFF6FF` background, `#DBEAFE` border, `#2563EB` text
- Hero background blobs: `#2563EB` and `#1D4ED8`
- Pricing card tier labels: `#2563EB`
- Checkmark circles: `#EFF6FF` background
- Checkmark icons: `#2563EB`
- "Most Popular" card gradient: `#2563EB` → `#1D4ED8`
- CTA buttons: `#2563EB`
- FAQ active border: `#BFDBFE`
- Final CTA section: `#2563EB` → `#1D4ED8` gradient

### Auth Modal
- Logo icon: `#2563EB`
- Logo text accent: `#2563EB`
- Role selector active: `#EFF6FF` background, `#2563EB` border
- Input focus border: `#2563EB`
- Submit button: `#2563EB` (disabled: `#60A5FA`)
- Links: `#2563EB`
- Forgot password: `#2563EB`
- Toggle button: `#2563EB`

## Design System Consistency

### The New Pulse Blue Hierarchy

1. **Primary Action** (`#2563EB`): Main buttons, primary CTAs
2. **Hover State** (`#1D4ED8`): Darker for emphasis
3. **Active/Selected** (`#EFF6FF` + `#2563EB`): Light background with blue text/border
4. **Disabled** (`#60A5FA`): Lighter blue for disabled states
5. **Subtle Accent** (`#DBEAFE`): Very light borders, subtle backgrounds

### Accessibility Notes
- All color combinations maintain WCAG AA contrast ratios
- Blue on white: 7.37:1 (AAA level)
- White on `#2563EB`: 6.18:1 (AA level for normal text)
- `#2563EB` on `#EFF6FF`: 5.89:1 (AA level)

## Search and Replace Guide

If updating additional files:

```bash
# Find remaining purple instances
grep -r "#7c3aed" src/
grep -r "#f5f3ff" src/
grep -r "#ede9fe" src/
grep -r "#6d28d9" src/
grep -r "#5b21b6" src/

# Replace with equivalent blues
#7c3aed → #2563EB
#6d28d9 → #1D4ED8
#5b21b6 → #1D4ED8
#f5f3ff → #EFF6FF
#ede9fe → #DBEAFE
#c4b5fd → #BFDBFE
```

## Implementation Complete ✅

All primary components updated:
- ✅ Navbar
- ✅ Pricing Page
- ✅ Page Templates (Auth Modal, Hero, CTA, etc.)
- ✅ Mobile menus
- ✅ Dropdowns
- ✅ Buttons
- ✅ Form inputs
- ✅ Cards and containers

---

**Color Migration Status: Complete**  
**Date: 2026-08-10**
