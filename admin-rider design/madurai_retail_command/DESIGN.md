---
name: Madurai Retail Command
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3e4943'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6e7a73'
  outline-variant: '#bdc9c1'
  surface-tint: '#006c4e'
  primary: '#005d42'
  on-primary: '#ffffff'
  primary-container: '#047857'
  on-primary-container: '#9ffdd3'
  inverse-primary: '#7bd8b1'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#0047bf'
  on-tertiary: '#ffffff'
  tertiary-container: '#1e5fe7'
  on-tertiary-container: '#e6e9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#97f5cc'
  primary-fixed-dim: '#7bd8b1'
  on-primary-fixed: '#002115'
  on-primary-fixed-variant: '#00513a'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-numeric:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-code:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
  tamil-subtitle:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes a high-craft, rapid-throughput operational console for the back-office, physical POS counter, and fast-fulfillment dark store of a tier-2 regional supermarket anchor in Madurai. The aesthetic synthesizes the focused precision of Linear with the velocity, high data-density, and split-second legibility required in quick-commerce fulfillment floors like Zepto dark-stores and Blinkit partner dashboards.

### Emotional Response & Voice
- **Urgent yet Unflappable:** Floor operators, baggers, and counter cashiers work under intense order velocity. The UI projects calm, industrial certitude with ultra-crisp layouts, high-contrast states, and friction-free status tracking.
- **Rooted Regional Authenticity:** Designed specifically with dual-script parity (English primary, Tamil contextual microcopy) to ensure zero cognitive friction for shift workers navigating inventory, weighing scale reads, and rider handoffs.
- **Tactile Operational Feedback:** Interfaces behave like high-end mechanical instruments—micro-interactions are immediate, button actions produce unmistakable state confirmations, and critical alerts cut cleanly through visual noise.

### Design Movement
**Industrial Modernist Utility:** Blends dense tabular utility, 1px crisp structural grid lines, low-blur ambient layering, and focused optical contrast. Whitespace is strictly metered to maximize situational awareness on 1080p and 1440p point-of-sale desktop terminals without visual exhaustion.

## Colors

The color architecture is built for extended 12-hour shift resilience in indoor terminal environments. It maintains crisp contrast ratios exceeding WCAG AAA for operational critical paths (order totals, item weights, SKU barcoding, and dispatch timers).

### Palette Roles
- **Primary (Deep Emerald & Retail Green - `#047857`, `#064e3b`):** Anchors operational confirmation, completed picks, active cash registers, system health, and primary positive CTAs. Grounded in freshness and enterprise stability.
- **Secondary (Temple Gold & Madurai Marigold - `#d97706`, `#f59e0b`):** Dedicated to pending actions, delayed picks, warning states, VIP member counter highlights, and high-value cart badges.
- **Tertiary (Dispatch Logistics Blue - `#2563eb`):** Reserved exclusively for live logistics, delivery rider assignments, bay allocations, and GPS-synced runner steps.
- **Neutral (Slate Carbon & Clean Surfaces):** The base canvas runs on `#f8fafc` (Slate-50) to mitigate eye fatigue from flat white. Work surfaces sit on pure `#ffffff` cards bordered by razor-thin `#e2e8f0` dividers. Core typographic hierarchy uses `#0f172a` (Slate-900) down to `#64748b` (Slate-500).
- **System Destructive / Stock-out (`#e11d48` / `#be123c`):** Highlights missing units, broken weights, zero-inventory lines, and emergency cancel triggers.

### Surface Architecture
- **Canvas:** `#f8fafc`
- **Surface Elevation 0 (Inset/Well):** `#f1f5f9`
- **Surface Elevation 1 (Card/Table Row):** `#ffffff`
- **Surface Elevation 2 (Modal/Floating Drawer):** `#ffffff` with directional cast
- **Border Default:** `#e2e8f0`
- **Border Active/Focus:** `#047857`

## Typography

Typography prioritizes tabular scanning speed, instant metric recognition, and effortless dual-language comprehension. 

### Font Rules & Numerical Alignment
- **OpenType Feature Requirements:** `font-feature-settings: "tnum" 1, "cv05" 1, "cv08" 1, "ss01" 1` are mandatory across all tables, pricing cells, weights, and timestamps to eliminate column jank and layout shifting during real-time balance calculations.
- **Dual-Script Presentation:** All product items, aisle markers, and terminal alerts present English as primary with Tamil (`ஸ்ரீ அம்மன்` system tone) rendered directly adjacent or beneath at `tamil-subtitle` scale (11px, Slate-500) with identical baseline optics.
- **Hierarchy Precision:** 
  - `headline-xl` (28px) serves top-level register summary cash drawers and master terminal heads.
  - `label-numeric` (14px Bold Tabular) is standard for ₹ currency quantities, gram weight fractions, and stopwatch counters.
  - `label-code` (11px Uppercase Monospace Tracking) applies to SKU barcodes, bin numbers (e.g., `BIN-A14`), and order hash IDs.

## Layout & Spacing

This desktop-first system employs a compact, rigid grid framework tailored for fixed POS screens (1920×1080 and 1366×768 terminal displays) and floor dispatcher tablets.

### Layout Philosophy
- **Split-Pane Command Grid:** A persistent 3-column asymmetric layout:
  - **Left Rail (Navigation / Register Status):** Fixed 240px dock.
  - **Center Stage (Live Orders / Active Picking Pipeline / POS Scanner Feed):** Fluid 12-column subgrid spanning available flex space.
  - **Right Panel (Order Inspector / Weigh-Scale Readout / Dispatch Stage):** 380px or 440px sticky operational drawer.
- **Rhythm & Metrics:** An exacting 4px baseline module. Standard form controls, table rows, and button heights conform strictly to dense desktop heights: `28px` (compact), `34px` (default), and `42px` (primary checkout punch CTA).
- **Reflow Rules:**
  - **Desktop (1440px+):** All 3 panels visible simultaneously with no horizontal scroll.
  - **POS Compact / Tablet (1024px–1366px):** Left rail compresses into an icon-only 56px utility bar; Right inspector collapses into an anchored right flyout triggered via hotkey or item tap.

## Elevation & Depth

To avoid visual fatigue from muddy drop shadows under fluorescent supermarket lighting, this design system operates primarily through structured surface containment, micro-borders, and razor-sharp structural division.

### Tonal Hierarchy
- **Level 0 (Floor Canvas):** Flat `#f8fafc`. Acts as the structural substrate.
- **Level 1 (Operational Tiles & Cards):** `#ffffff` with a crisp `1px solid #e2e8f0` perimeter. No box shadow is applied in neutral resting states; depth is produced strictly through edge delineation.
- **Level 2 (Interactive Floating Modules / Hover States):** `#ffffff` with `border: 1px solid #cbd5e1` and an ambient, low-spread shadow: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Sticky Flyouts & Barcode Drawers):** Elevated via `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.
- **Level 4 (Critical Modal / Emergency Stoppage Dialog):** Pure `#ffffff` centered overlay with high-opacity backdrop shroud (`rgba(15, 23, 42, 0.60)`).

## Shapes

The shape vocabulary is strictly tailored to operational efficiency: compact, crisp, and slightly softened (`0.25rem` / `4px` baseline) to maintain structural density while avoiding the cold harshness of pure 0px brutalism.

### Geometric Rules
- **Buttons, Text Inputs, and Selectors:** Default to `4px` (`rounded-sm`).
- **Cards, Panels, and Table Headers:** Set to `6px` or `8px` (`rounded-md`), preserving a clean architectural enclosure without clipping tabular corner cells.
- **Status Badges, Live Timer Lozenges, and Keyboard Shortcuts (KBD):** Fully circular pill forms (`9999px`) to create clear semantic contrast against rectangular data tables and form controls.
- **Focus Rings:** Non-offset, 2px high-visibility solid rings using Emerald `#047857` with 2px outer gap (`ring-2 ring-emerald-600 ring-offset-2`).

## Components

### Buttons & Quick-Action Triggers
- **Primary Operational Button:** `#047857` background, white label, 34px height, 13px Inter Semibold. Hover transitions immediately to `#064e3b`. Active state shifts downward 1px for instant tactile tactile confirmation.
- **Secondary / Action Ghost:** Bordered by `#cbd5e1`, white background, `#0f172a` text.
- **Quick-Key Legend:** Every primary button renders an integrated keyboard shortcut badge on its right flank (e.g., `F2`, `⌘Enter`, `Space`) with faint slate background and border.

### Status Chips & Badges
- **Picking Stage (Pill Shape):**
  - *New / Unassigned:* Background `#fef3c7`, text `#92400e`, amber dot. Tamil marker: "புதியது".
  - *In-Pick / Bagging:* Background `#dbeafe`, text `#1e40af`, blue pulsing dot. Tamil marker: "பேக்கிங்".
  - *Ready for Dispatch:* Background `#dcfce7`, text `#166534`, emerald check. Tamil marker: "தயார்".
  - *Out of Stock / Alert:* Background `#ffe4e6`, text `#9f1239`, red icon. Tamil marker: "கையிருப்பில் இல்லை".

### Data Tables & POS Item Lists
- **Header:** Sticky, 32px height, `#f1f5f9` surface, 11px uppercase bold label styling with `#64748b` color.
- **Data Rows:** Standardized at 40px height for dense desktop data-entry. Includes alternating zebra striping (`#ffffff` and `#fafafa`). Border-bottom at 1px `#f1f5f9`.
- **Keyboard Navigation Highlight:** Active row has an inner left border: `3px solid #047857` with background tint `#f0fdf4`.

### Numeric & Barcode Inputs
- Monospaced digits with tabular metrics (`font-feature-settings: "tnum"`).
- High visual weight: 36px height, high-contrast borders (`#94a3b8`), with dynamic visual validation indicators (green check on certified weight match; red alert on SKU mismatch).

### Specialized Domain Components
- **Bilingual SKU Tile:** Contains English product title, Madurai Tamil translation subtext, physical shelf/aisle code (e.g., `Aisle 3 • Bay B`), real-time weight sensor sync icon, and high-contrast pack unit quantity.
- **Rider Allocation Banner:** Compact 48px dispatch strip displaying delivery partner status (Blinkit Fleet / Internal Sri Amman Runner), distance radius, vehicle reg ID, and immediate dispatch release lever switch.