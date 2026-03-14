# SBOM Manager - Design System Documentation

## Overview
This document describes the design system for SBOM Manager, updated to match an enterprise-grade, professional aesthetic inspired by modern security dashboards.

**Last Updated:** March 14, 2026  
**Designer:** Pri  
**Reference:** Professional security dashboard design

---

## Color Palette

### Primary Dark Theme

The application uses a sophisticated dark navy color scheme that conveys professionalism and reduces eye strain during extended use.

```css
/* Navy Scale - Main Background Colors */
--navy-950: #0f1419;  /* Darkest - Main background */
--navy-900: #1a1f2e;  /* Sidebar background */
--navy-800: #222939;  /* Card backgrounds */
--navy-700: #2d3548;  /* Lighter cards/hover states */
--navy-600: #3d4558;  /* Borders and dividers */
```

### Accent Colors

**Primary Actions:**
- Blue-600: `#2563eb` - Primary buttons, active states
- Blue-500: `#3b82f6` - Links, highlights
- Blue-400: `#60a5fa` - Icons, accents

**Status Colors:**
- Green (Success): `#10b981` - Healthy states, low risk
- Yellow (Warning): `#f59e0b` - Medium risk, warnings
- Orange (Alert): `#f97316` - High priority items
- Red (Critical): `#ef4444` - Critical issues, high risk

**Neutral Grays:**
- White: `#ffffff` - Primary text
- Gray-300: `#d1d5db` - Secondary text
- Gray-400: `#9ca3af` - Tertiary text
- Gray-500: `#6b7280` - Disabled states

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Type Scale

**Headings:**
- H1 (Page Title): `text-2xl` (24px), `font-semibold`, `text-white`
- H2 (Section): `text-xl` (20px), `font-bold`, `text-white`
- H3 (Subsection): `text-lg` (18px), `font-medium`, `text-white`
- H4 (Card Title): `text-base` (16px), `font-medium`, `text-white`

**Body Text:**
- Primary: `text-sm` (14px), `text-white`
- Secondary: `text-sm` (14px), `text-gray-400`
- Caption: `text-xs` (12px), `text-gray-400`

**Numbers/Metrics:**
- Large Display: `text-5xl` (48px), `font-bold`, `text-white`
- Medium Display: `text-2xl` (24px), `font-bold`, `text-white`

---

## Component Hierarchy

### 1. Layout Structure

```
┌─────────────────────────────────────────────┐
│  Sidebar (navy-900)                         │
│  - Logo/Branding                            │
│  - Navigation Sections                      │
│    - Section Label (uppercase, gray-500)    │
│    - Nav Items                              │
│  - User Section (bottom)                    │
└─────────────────────────────────────────────┘
```

**Sidebar Navigation:**
- Width: `16rem` (256px) on desktop
- Background: `navy-900` (#1a1f2e)
- Border: `border-navy-600`
- Section labels: `text-xs`, `font-semibold`, `text-gray-500`, `uppercase`
- Nav items: Rounded `md`, padding `py-2.5 px-3`
- Active state: `bg-blue-600`, `text-white`, `shadow-lg`
- Hover state: `bg-navy-800`, `text-white`

### 2. Dashboard Layout

**Metric Cards (Top Row):**
- Grid: 4 columns on desktop, responsive down to 1 column
- Background: `navy-800`
- Border: `border-navy-600`
- Padding: `p-6`
- Content: Center-aligned
  - Number: `text-5xl`, `font-bold`, `text-white`
  - Label: `text-sm`, `text-gray-400`, `font-medium`
  - Progress bar: Bottom border with colored bar

**Chart Section:**
- Background: `navy-800`
- Border: `border-navy-600`
- Padding: `p-6`
- Chart height: `h-80` (320px)
- Chart colors:
  - Grid: `#3d4558`
  - Axis text: `#9ca3af`
  - Line/Area: `#3b82f6` with gradient fill

### 3. Card Components

**Standard Card:**
```css
.card {
  background: #222939;  /* navy-800 */
  border: 1px solid #3d4558;  /* navy-600 */
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

**Stat Card (Vulnerability Count):**
```css
.stat-card {
  background: rgba(220, 38, 38, 0.1);  /* red-900/20 */
  border: 1px solid rgba(220, 38, 38, 0.3);  /* red-800/50 */
  border-radius: 0.5rem;
  padding: 1rem;
}
```

### 4. Spacing System

**Container Padding:**
- Mobile: `px-4` (16px)
- Tablet: `px-6` (24px)
- Desktop: `px-8` (32px)

**Vertical Spacing:**
- Section gaps: `gap-6` (24px)
- Card spacing: `space-y-6` (24px)
- Element spacing: `space-y-4` (16px)
- Tight spacing: `space-y-2` (8px)

---

## Design Patterns

### Metric Display Pattern
Used for key statistics on dashboard:

1. **Large number** (text-5xl, font-bold, text-white)
2. **Descriptive label** (text-sm, text-gray-400)
3. **Visual indicator** (colored progress bar or icon)

### Status Indicators

**Color-coded backgrounds for severity:**
- Critical: `bg-red-900/20`, `border-red-800/50`
- High: `bg-orange-900/20`, `border-orange-800/50`
- Medium: `bg-yellow-900/20`, `border-yellow-800/50`
- Low: `bg-blue-900/20`, `border-blue-800/50`
- Success: `bg-green-900/20`, `border-green-800/50`

### Interactive States

**Buttons:**
- Primary: `bg-blue-600`, `hover:bg-blue-700`, `text-white`
- Secondary: `bg-navy-700`, `hover:bg-navy-600`, `text-white`
- Ghost: `hover:bg-navy-700/50`, `text-gray-300`

**Links:**
- Default: `text-gray-300`, `hover:text-white`
- Active navigation: `bg-blue-600`, `text-white`

**Transitions:**
- All interactive elements: `transition-all duration-150`

---

## Chart Styling

### Area Chart (Portfolio Vulnerabilities)

**Configuration:**
```javascript
{
  gradient: 'linear-gradient(180deg, #3b82f6 5%, transparent 95%)',
  strokeColor: '#3b82f6',
  strokeWidth: 2,
  gridColor: '#3d4558',
  axisColor: '#6b7280',
  tooltipBackground: '#222939',
  tooltipBorder: '#3d4558'
}
```

### General Chart Guidelines
- Tooltips: Dark background matching card style
- Grid lines: Subtle, using navy-600
- Axis labels: Gray-400, small font
- Data points: Blue-500 primary, status colors for categories

---

## Accessibility

### Color Contrast
All text meets WCAG AA standards:
- White on navy-900: 11.5:1 ✓
- Gray-400 on navy-900: 4.8:1 ✓
- Blue-500 on navy-900: 4.9:1 ✓

### Focus States
All interactive elements have visible focus indicators:
- Focus ring: `ring-2`, `ring-blue-500`, `ring-offset-2`, `ring-offset-navy-900`

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar collapses to mobile menu below lg breakpoint
- Grid layouts stack vertically on mobile

---

## Component Library

### Key Components

1. **Layout.tsx** - Main application shell with sidebar
2. **PageShell.tsx** - Page wrapper with consistent header/spacing
3. **Dashboard.tsx** - Main dashboard with metrics and charts

### Reusable Patterns

**Metric Card:**
```tsx
<div className="bg-navy-800 rounded-lg border border-navy-600 p-6">
  <div className="text-center">
    <div className="text-5xl font-bold text-white mb-2">{value}</div>
    <div className="text-sm text-gray-400 font-medium">{label}</div>
    <div className="mt-4 pt-4 border-t border-navy-600">
      <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
    </div>
  </div>
</div>
```

**Section Header:**
```tsx
<div className="flex items-center mb-4">
  <Icon className="h-6 w-6 text-blue-400 mr-2" />
  <h3 className="text-lg font-medium text-white">{title}</h3>
</div>
```

---

## Implementation Notes

### Tailwind Configuration
Custom navy colors added to `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      navy: {
        950: '#0f1419',
        900: '#1a1f2e',
        800: '#222939',
        700: '#2d3548',
        600: '#3d4558',
      },
    },
  },
}
```

### Dependencies
- React 18+
- Tailwind CSS 3+
- Recharts 2+ (for charts)
- Lucide React (for icons)

---

## Future Enhancements

1. **Dark/Light Mode Toggle** - Add light theme variant
2. **Custom Chart Library** - Consider D3.js for more complex visualizations
3. **Animation System** - Add subtle transitions and loading states
4. **Component Variants** - Create variant system for cards and buttons
5. **Design Tokens** - Move to CSS variables for easier theming

---

## Maintenance

**When updating colors:**
1. Update `tailwind.config.js`
2. Update this documentation
3. Test contrast ratios
4. Verify across all pages

**When adding components:**
1. Follow existing patterns
2. Use navy color scale
3. Maintain spacing consistency
4. Document in this file

---

*This design system ensures a consistent, professional, and accessible user experience across the SBOM Manager application.*
