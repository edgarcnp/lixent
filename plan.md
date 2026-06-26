# Lixent Demo — Generative UI Redesign

## Direction: Warm & Approachable (Direction 2)

**Palette:** Stone/sand neutrals, amber accent, 8-10px radius
**Feel:** Notion, Arc browser, Cal.com

---

## Features to Implement

| # | Feature | Description |
|---|---------|-------------|
| A | Theme Gallery Grid | Replace theme dropdown with visual card grid |
| C | Accordion Sections | Collapsible sidebar sections with summaries |
| D | Font Preview | Pangram card below font picker |
| E | Floating Summary Pill | Glassmorphism config summary in preview area |

---

## Color Tokens

### Light Mode
| Token | Value |
|-------|-------|
| `--demo-bg` | `#f5f3ef` |
| `--demo-surface` | `#ffffff` |
| `--demo-surface-2` | `#ebe8e3` |
| `--demo-border` | `#e5e1dc` |
| `--demo-border-hover` | `#cdc8c1` |
| `--demo-text` | `#1c1917` |
| `--demo-text-muted` | `#78716c` |
| `--demo-accent` | `#d97706` |
| `--demo-accent-hover` | `#b45309` |
| `--demo-success` | `#16a34a` |
| `--demo-radius` | `8px` |
| `--demo-radius-lg` | `10px` |

### Dark Mode
| Token | Value |
|-------|-------|
| `--demo-bg` | `#111110` |
| `--demo-surface` | `#1c1b1a` |
| `--demo-surface-2` | `#272524` |
| `--demo-border` | `#2a2826` |
| `--demo-border-hover` | `#3d3a37` |
| `--demo-text` | `#e7e5e4` |
| `--demo-text-muted` | `#a8a29e` |
| `--demo-accent` | `#f59e0b` |
| `--demo-accent-hover` | `#d97706` |

---

## Component Specs

### 1. Theme Gallery Grid

**Layout:** 3-column grid, 8px gap

**Card size:** ~80×72px

**Card anatomy:**
- Color strip (4px) at top showing theme's bg/accent/text
- Theme name (12px, medium)
- "dark" badge if applicable (10px, muted)

**States:**
- Default: `--demo-surface` bg, `--demo-border` border
- Hover: Border brightens, scale 1.02, shadow lifts
- Selected: `--demo-accent` 2px border, check icon top-right

**Theme color strip:** Render 3 mini color swatches from theme CSS vars (bg, accent, text)

### 2. Accordion Sections

**Sections (in order):**
1. Theme & Font — expanded by default
2. License
3. Identity (copyright, email, URL, year, gravatar)
4. Styling (font size, weight, line height, letter spacing) — collapsed by default

**Header anatomy:**
- Chevron (IconChevronDown, rotates 90° on expand, 200ms)
- Title (13px, semibold)
- Summary badge (11px, muted, pill shape)

**Summary formats:**
- Theme & Font: "Minimal · Default"
- License: "MIT"
- Identity: "John Doe · example.com"
- Styling: "18px · 400"

**Expand/collapse:** `max-height` + `opacity` transition, 250ms ease

### 3. Font Preview Card

**Position:** Below font dropdown

**Content:**
- Pangram: "The quick brown fox jumps over the lazy dog." in selected font
- Specimen: "AaBbCcDd 0123456789" in 12px muted

**Styling:** `--demo-bg` bg, 1px border, 6px radius, 12px padding

**Empty state:** "Select a font to preview" in muted text

**Transition:** Font change triggers opacity fade (200ms)

### 4. Floating Summary Pill

**Position:** Bottom-center of preview area

**Content:** "MIT · John Doe · 2024–2026 · Minimal · Inter"

**Styling:**
- `--demo-surface` bg with `backdrop-filter: blur(8px)`
- 1px border, 9999px radius
- Shadow: `0 4px 12px rgba(0,0,0,0.15)`
- 12px font, medium weight

**Interaction:** Click copies config JSON, shows "Copied!" for 2s

### 5. Header

**Layout:** 48px height, space-between

**Left:** "Lixent Demo" 15px semibold

**Right:** 3 icon buttons (GitHub, Dark mode, Close) 32×32px each

**Button style:** `--demo-surface` bg, 1px border, 8px radius

### 6. Input Fields

| Property | Value |
|----------|-------|
| Bg | `--demo-bg` |
| Border | 1px `--demo-border` |
| Radius | 8px |
| Padding | 10px 12px |
| Font | 13px |
| Focus | Amber border + `0 0 0 3px rgba(217,119,6,0.12)` ring |
| Hover | Border brightens |

### 7. Select Dropdowns

Same as inputs, with custom ChevronDown arrow

Font dropdown: Custom overlay with font previews per option

### 8. Toggle Switch

**Custom switch (replaces checkbox):**
- Track: 36×20px, 9999px radius
- Off: `--demo-border` bg, `--demo-surface-2` knob
- On: `--demo-accent` bg, white knob
- Knob: 16×16px circle, slides with 200ms transition

### 9. Action Buttons

**Reset:** Transparent, muted text, full width

**Copy/Download:** `--demo-accent` bg, white text, 8px radius, stacked full width

### 10. Preview Frame

- Header bg: `--demo-surface-2`
- Dots: 10px, muted red/yellow/green
- URL bar: 11px mono, centered
- Frame: 12px radius, layered shadow

### 11. Year Range

Same as inputs, two side-by-side with en-dash separator

---

## Implementation Order

1. Update CSS tokens (demo.css) — Direction 2 palette
2. Theme gallery grid (HTML + CSS + JS)
3. Accordion sections (HTML + CSS + JS)
4. Font preview card (HTML + CSS + JS)
5. Floating summary pill (HTML + CSS + JS)
6. Toggle switch (CSS)
7. Restyle inputs/selects/buttons (CSS)
8. Restyle preview frame (CSS)
9. Update header (CSS)
10. Run cq, commit

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/styles/demo.css` | All token + component restyling |
| `src/pages/index.astro` | Theme gallery HTML, accordion HTML, font preview HTML, pill HTML, toggle markup |
| `src/demo/ui.ts` | Theme gallery click handlers, accordion toggle, font preview update, pill update + copy |

---

## Post-Implementation

- Delete `plan.md`
- Verify 122 tests still pass
- Verify dark mode works
- Verify responsive layout (mobile)
