# SBOM Manager - Theme Reference Guide

## 🎨 Color Palette

### Dark Mode (Default)
```css
Background Primary:   #1a1f2e  /* Main background - navy from reference */
Background Secondary: #222939  /* Card/panel background */
Background Tertiary:  #2d3548  /* Hover states, input backgrounds */
Border:              #3d4558  /* All borders */
Text Primary:        #ffffff  /* Main text - WCAG AAA */
Text Secondary:      #a0aec0  /* Labels, secondary text */
Text Tertiary:       #718096  /* Muted text, placeholders */
Accent Blue:         #3b82f6  /* Buttons, links, highlights */
Accent Blue Hover:   #2563eb  /* Hover states */
```

### Light Mode
```css
Background Primary:   #f7fafc  /* Main background */
Background Secondary: #ffffff  /* Card/panel background */
Background Tertiary:  #e2e8f0  /* Hover states, input backgrounds */
Border:              #cbd5e0  /* All borders */
Text Primary:        #1a1a1a  /* Main text - WCAG AAA */
Text Secondary:      #4a5568  /* Labels, secondary text */
Text Tertiary:       #718096  /* Muted text, placeholders */
Accent Blue:         #3b82f6  /* Buttons, links, highlights */
Accent Blue Hover:   #2563eb  /* Hover states */
```

## 📏 Typography Scale

```css
/* Minimum 14px (text-xs) - Small labels, captions */
font-size: 14px;
line-height: 20px;

/* 16px (text-base) - Body text, forms, navigation */
font-size: 16px;
line-height: 24px;

/* 18px (text-lg) - Card subheadings */
font-size: 18px;
line-height: 28px;

/* 20px (text-xl) - Card headings, profile data */
font-size: 20px;
line-height: 30px;

/* 24px (text-2xl) - Page section headings */
font-size: 24px;
line-height: 32px;

/* 28px (text-3xl) - Main page headings */
font-size: 28px;
line-height: 36px;

/* 32px (text-4xl) - Large emphasis text */
font-size: 32px;
line-height: 40px;

/* 48px (text-5xl) - Dashboard metric numbers */
font-size: 48px;
line-height: 56px;

/* 56px (text-6xl) - Extra large metrics */
font-size: 56px;
line-height: 64px;
```

## 📐 Spacing System

### Padding
```css
/* Cards and panels */
padding: 32px;  /* p-8 */

/* Sidebar sections */
padding: 32px 16px;  /* py-8 px-4 */

/* Buttons and inputs */
padding: 12px 24px;  /* py-3 px-6 */

/* List items */
padding: 16px;  /* p-4 */
```

### Gaps
```css
/* Section gaps */
gap: 32px;  /* gap-8 */

/* Element gaps */
gap: 24px;  /* gap-6 */

/* Small gaps (between icons and text) */
gap: 16px;  /* gap-4 */
```

### Margins
```css
/* Section margins */
margin-bottom: 32px;  /* mb-8 */

/* Element margins */
margin-bottom: 24px;  /* mb-6 */
margin-top: 24px;     /* mt-6 */

/* Small margins (between label and input) */
margin-bottom: 8px;   /* mb-2 */
```

## 🎯 Component Patterns

### Metric Cards (Dashboard)
```tsx
<div className="bg-bg-card rounded-xl border border-border p-8 shadow-lg">
  <div className="text-center">
    <div className="text-6xl font-bold text-text-primary mb-3">
      {value}
    </div>
    <div className="text-base text-text-secondary font-medium">
      {label}
    </div>
  </div>
</div>
```

### Section Headings
```tsx
<h3 className="text-2xl font-medium text-text-primary mb-6">
  Section Title
</h3>
```

### Primary Button
```tsx
<button className="px-6 py-3 bg-accent-blue hover:bg-accent-blue-hover text-white text-base font-medium rounded-lg transition-colors">
  Action
</button>
```

### Input Field
```tsx
<input className="block w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-blue text-base" />
```

### Card with Content
```tsx
<div className="bg-bg-card rounded-xl border border-border p-8 shadow-lg">
  <h3 className="text-xl font-medium text-text-primary mb-4">
    Card Title
  </h3>
  <p className="text-base text-text-secondary">
    Card content...
  </p>
</div>
```

## 🔄 Theme Toggle Usage

### In Components
```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
    </button>
  );
}
```

### In Tailwind Classes
Use semantic tokens instead of hard-coded colors:
```tsx
// ✅ Correct - uses theme tokens
<div className="bg-bg-primary text-text-primary border-border">

// ❌ Wrong - hard-coded colors
<div className="bg-navy-950 text-white border-gray-600">
```

## 📱 Responsive Breakpoints

```css
/* Mobile first approach */
default    /* 0-640px - Mobile */
sm:        /* 640px+ - Large mobile */
md:        /* 768px+ - Tablet */
lg:        /* 1024px+ - Desktop (sidebar shows) */
xl:        /* 1280px+ - Large desktop */
```

## ♿ Accessibility

### Focus States
All interactive elements have visible focus:
```css
*:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}
```

### Touch Targets
Minimum 44px height for all interactive elements:
```tsx
<button className="min-h-[44px] px-6 py-3">Button</button>
```

### Contrast Ratios
- **Text:** 7:1 minimum (WCAG AAA)
- **Large text (24px+):** 4.5:1 minimum
- **Interactive elements:** 3:1 minimum

## 🚀 Quick Start

1. Theme is automatically applied via `ThemeProvider` in `App.tsx`
2. Use semantic color tokens (`bg-bg-primary`, `text-text-primary`, etc.)
3. Follow spacing conventions (p-8 for cards, gap-8 for sections)
4. Use proper font sizes (text-base minimum for body)
5. Add ThemeToggle component wherever theme switching is needed

---

**Last Updated:** March 14, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
