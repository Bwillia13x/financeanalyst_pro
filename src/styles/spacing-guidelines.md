# Spacing System Guidelines

## Overview

Our spacing system provides consistent visual hierarchy and breathing room throughout the FinanceAnalyst Pro platform. It uses a comprehensive scale based on 4px increments with semantic naming for different use cases.

## Spacing Scale

### Base Spacing Scale (4px increments)
- `0`: 0px
- `px`: 1px
- `0.5`: 2px
- `1`: 4px
- `1.5`: 6px
- `2`: 8px
- `2.5`: 10px
- `3`: 12px
- `3.5`: 14px
- `4`: 16px
- `5`: 20px
- `6`: 24px
- `7`: 28px
- `8`: 32px
- `9`: 36px
- `10`: 40px
- `11`: 44px
- `12`: 48px
- `14`: 56px
- `16`: 64px
- `18`: 72px
- `20`: 80px
- `24`: 96px

## Semantic Spacing Categories

### Content Spacing
Used for spacing between content elements within components.

- `content-xs`: 8px - Small gaps between related elements
- `content-sm`: 12px - Form elements and small components
- `content-md`: 16px - Standard component spacing
- `content-lg`: 24px - Section spacing within components
- `content-xl`: 32px - Major section spacing
- `content-2xl`: 48px - Page section spacing

### Layout Spacing
Used for spacing between major layout elements.

- `layout-xs`: 12px - Tight layout spacing
- `layout-sm`: 16px - Card and panel spacing
- `layout-md`: 24px - Component layout spacing
- `layout-lg`: 32px - Section layout spacing
- `layout-xl`: 48px - Page layout spacing
- `layout-2xl`: 64px - Major page layout spacing

### Component Spacing
Used for padding and margins within components.

- `component-padding-xs`: 8px - Small component padding
- `component-padding-sm`: 12px - Button and input padding
- `component-padding-md`: 16px - Card and modal padding
- `component-padding-lg`: 24px - Large component padding
- `component-padding-xl`: 32px - Extra large component padding

- `component-margin-xs`: 4px - Micro spacing
- `component-margin-sm`: 8px - Small gaps
- `component-margin-md`: 12px - Standard gaps
- `component-margin-lg`: 16px - Large gaps
- `component-margin-xl`: 24px - Section gaps

## Usage Guidelines

### Page Layout
```css
/* Page container */
.page-container {
  padding: var(--layout-spacing-lg);
}

/* Section spacing */
.page-section {
  margin-bottom: var(--layout-spacing-xl);
}

/* Component spacing */
.component-grid {
  gap: var(--layout-spacing-md);
}
```

### Component Spacing
```css
/* Card padding */
.card {
  padding: var(--component-padding-md);
}

/* Button group spacing */
.button-group {
  gap: var(--component-margin-xs);
}

/* Form field spacing */
.form-field {
  margin-bottom: var(--component-margin-lg);
}
```

### Content Spacing
```css
/* Text spacing */
.paragraph-stack {
  margin-bottom: var(--content-spacing-md);
}

/* Inline element spacing */
.inline-elements {
  gap: var(--content-spacing-sm);
}
```

## Responsive Spacing

Our spacing system automatically adjusts for different screen sizes:

- **Mobile (< 640px)**: Reduced spacing for better space utilization
- **Tablet (640px - 1024px)**: Standard spacing scale
- **Desktop (> 1024px)**: Generous spacing for better visual hierarchy

## CSS Custom Properties

All spacing values are available as CSS custom properties:

```css
/* Direct spacing values */
padding: var(--spacing-4); /* 16px */

/* Semantic spacing */
padding: var(--component-padding-md); /* 16px */
margin: var(--layout-spacing-lg); /* 32px */
gap: var(--content-spacing-sm); /* 12px */
```

## Utility Classes

### Stack Spacing
Apply consistent vertical spacing between child elements:

```html
<div class="spacing-stack-xs">...</div>
<div class="spacing-stack-sm">...</div>
<div class="spacing-stack-md">...</div>
<div class="spacing-stack-lg">...</div>
<div class="spacing-stack-xl">...</div>
<div class="spacing-stack-2xl">...</div>
```

### Inline Spacing
Apply consistent horizontal spacing between child elements:

```html
<div class="spacing-inline-xs">...</div>
<div class="spacing-inline-sm">...</div>
<div class="spacing-inline-md">...</div>
<div class="spacing-inline-lg">...</div>
<div class="spacing-inline-xl">...</div>
```

### Grid Spacing
Apply consistent gaps in grid layouts:

```html
<div class="spacing-grid-xs">...</div>
<div class="spacing-grid-sm">...</div>
<div class="spacing-grid-md">...</div>
<div class="spacing-grid-lg">...</div>
```

### Component Patterns
Pre-built spacing patterns for common components:

```html
<div class="spacing-card">...</div>
<div class="spacing-card-compact">...</div>
<div class="spacing-section">...</div>
<div class="spacing-section-compact">...</div>
<div class="spacing-form-group">...</div>
<div class="spacing-button-group">...</div>
```

### Typography Spacing
Consistent line heights and spacing for text:

```html
<p class="spacing-text-xs">...</p>
<p class="spacing-text-sm">...</p>
<p class="spacing-text-md">...</p>
<p class="spacing-text-lg">...</p>
<p class="spacing-text-xl">...</p>
```

## Best Practices

### 1. Use Semantic Spacing
Always prefer semantic spacing over arbitrary values:

```css
/* ✅ Good */
padding: var(--component-padding-md);
gap: var(--content-spacing-sm);

/* ❌ Avoid */
padding: 16px;
gap: 12px;
```

### 2. Maintain Hierarchy
Use larger spacing for higher-level elements:

```css
/* Page level */
.page-container { padding: var(--layout-spacing-xl); }

/* Section level */
.page-section { margin-bottom: var(--layout-spacing-lg); }

/* Component level */
.component { padding: var(--component-padding-md); }

/* Element level */
.element { margin-bottom: var(--content-spacing-sm); }
```

### 3. Consider Responsive Design
Spacing should scale appropriately across devices:

```css
/* Responsive spacing using our system */
.responsive-component {
  padding: var(--component-padding-sm); /* 12px on mobile, scales up */
}
```

### 4. Consistency Across Components
Use the same spacing patterns for similar components:

```css
/* Consistent card spacing */
.card-primary { padding: var(--component-padding-md); }
.card-secondary { padding: var(--component-padding-md); }
.card-compact { padding: var(--component-padding-sm); }
```

## Accessibility Considerations

### Touch Targets
Ensure interactive elements meet minimum size requirements:

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: var(--component-padding-sm);
}
```

### Focus Spacing
Provide adequate space for focus indicators:

```css
.focus-element {
  padding: var(--component-padding-xs);
  margin: calc(var(--component-margin-xs) * -1);
}
```

## Examples

### Card Component
```css
.card {
  padding: var(--component-padding-md);
  margin-bottom: var(--component-margin-md);
  border-radius: var(--spacing-2);
}
```

### Form Layout
```css
.form-container {
  gap: var(--content-spacing-lg);
}

.form-field {
  margin-bottom: var(--component-margin-lg);
}
```

### Navigation
```css
.nav-container {
  gap: var(--layout-spacing-md);
}

.nav-item {
  padding: var(--component-padding-sm);
}
```

### Grid Layout
```css
.grid-container {
  display: grid;
  gap: var(--layout-spacing-md);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

## Migration Guide

### From Arbitrary Spacing
Replace hardcoded spacing values with our semantic tokens:

```css
/* Before */
.my-component {
  padding: 16px;
  margin-bottom: 24px;
  gap: 12px;
}

/* After */
.my-component {
  padding: var(--component-padding-md);
  margin-bottom: var(--layout-spacing-md);
  gap: var(--content-spacing-sm);
}
```

### From Inconsistent Spacing
Standardize spacing across similar components:

```css
/* Before */
.card-1 { padding: 12px; }
.card-2 { padding: 16px; }
.card-3 { padding: 20px; }

/* After */
.card-standard { padding: var(--component-padding-md); }
.card-compact { padding: var(--component-padding-sm); }
.card-large { padding: var(--component-padding-lg); }
```

This spacing system ensures visual consistency, better user experience, and easier maintenance across the entire FinanceAnalyst Pro platform.
