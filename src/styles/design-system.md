# FinanceAnalyst Pro Design System

## Color Palette Consolidation

### Current Color System Status

✅ **CSS Custom Properties Defined**: Core color variables established in `tailwind.css`
⚠️ **Inconsistent Usage**: Components using hardcoded Tailwind classes instead of design tokens

### Standardized Color Categories

#### 1. **Semantic Colors** (High Priority)

```css
/* Status & Feedback */
--color-success: #27ae60 (green-600) --color-warning: #f39c12 (amber-500) --color-error: #e74c3c
  (red-600) --color-destructive: #e74c3c (red-600) /* Interactive Elements */
  --color-primary: #1e3a5f (navy-800) --color-secondary: #4a90a4 (teal-600) --color-accent: #e67e22
  (orange-600);
```

#### 2. **Financial Data Colors** (Domain Specific)

```css
/* Revenue & Income - Green Spectrum */
--color-revenue: #059669 (emerald-600) --color-revenue-light: #d1fae5 (emerald-50)
  /* Expenses & Costs - Red Spectrum */ --color-expense: #dc2626 (red-600)
  --color-expense-light: #fef2f2 (red-50) /* Assets - Blue Spectrum */ --color-asset: #2563eb
  (blue-600) --color-asset-light: #dbeafe (blue-50) /* Liabilities - Orange Spectrum */
  --color-liability: #ea580c (orange-600) --color-liability-light: #fff7ed (orange-50);
```

#### 3. **UI Foundation Colors**

```css
/* Backgrounds & Surfaces */
--color-background: #fafbfc (gray-50) --color-card: #ffffff (white) --color-muted: #f8f9fa
  (gray-100) /* Text & Borders */ --color-foreground: #2c3e50 (slate-700) --color-border: #e1e8ed
  (gray-200) --color-muted-foreground: #7f8c8d (gray-500);
```

### Consolidation Strategy

#### Phase 1: Replace Hardcoded Colors

- **Financial Tables**: Use semantic financial colors
- **Status Indicators**: Use semantic status colors
- **Interactive Elements**: Use semantic interactive colors

#### Phase 2: Component Standardization

- **Buttons**: Consistent variant system
- **Cards**: Uniform background and border colors
- **Tables**: Standardized row and header styling

#### Phase 3: Accessibility Compliance

- **Contrast Ratios**: Ensure WCAG AA compliance
- **Color Blind Friendly**: Test with simulation tools
- **High Contrast Mode**: Support system preferences

### Implementation Priorities

#### High Impact Components (Fix First)

1. `FinancialSpreadsheet.jsx` - 74 color matches
2. `AnalysisResults.jsx` - 35 color matches
3. Financial data tables across platform
4. Button and interactive element variants

#### Medium Impact Components

5. Dashboard components
6. Chart and visualization components
7. Navigation elements

#### Low Impact Components

8. Modal and popup components
9. Form elements
10. Footer and utility components

### Success Metrics

- **Color Consistency**: 90% of components use design tokens
- **Accessibility**: All text meets WCAG AA contrast requirements
- **Maintainability**: Centralized color changes affect all components
- **Performance**: Reduced CSS bundle size through consolidation

## Spacing Scale System

### Standardized Spacing Scale

Based on 4px base unit for consistent visual rhythm:

```css
/* Base Spacing Scale */
--spacing-0: 0px; /* none */
--spacing-1: 4px; /* xs - tight spacing */
--spacing-2: 8px; /* sm - small spacing */
--spacing-3: 12px; /* base - default spacing */
--spacing-4: 16px; /* md - medium spacing */
--spacing-5: 20px; /* lg - large spacing */
--spacing-6: 24px; /* xl - extra large */
--spacing-8: 32px; /* 2xl - section spacing */
--spacing-10: 40px; /* 3xl - major sections */
--spacing-12: 48px; /* 4xl - page sections */
--spacing-16: 64px; /* 5xl - layout sections */
--spacing-20: 80px; /* 6xl - major layouts */
--spacing-24: 96px; /* 7xl - page margins */
```

### Component-Specific Spacing

#### Financial Tables

- **Cell Padding**: `px-4 py-3` (16px/12px) - Optimal data density
- **Row Spacing**: `space-y-1` (4px) - Clear row separation
- **Section Spacing**: `space-y-6` (24px) - Clear section breaks
- **Header Padding**: `px-6 py-4` (24px/16px) - Prominent headers

#### Cards & Containers

- **Card Padding**: `p-6` (24px) - Standard card inner spacing
- **Card Margins**: `mb-6` (24px) - Consistent card separation
- **Container Max Width**: `max-w-7xl` - Optimal reading width
- **Container Padding**: `px-4 sm:px-6 lg:px-8` - Responsive margins

#### Navigation Elements

- **Tab Padding**: `px-4 py-2` (16px/8px) - Comfortable tap targets
- **Button Padding**: `px-4 py-2.5` (16px/10px) - Standard button size
- **Nav Spacing**: `space-x-2` (8px) - Clear separation
- **Secondary Nav**: `p-1` (4px) - Compact navigation container

#### Form Elements

- **Input Padding**: `px-3 py-2.5` (12px/10px) - Comfortable text input
- **Label Spacing**: `mb-2` (8px) - Clear label association
- **Field Spacing**: `space-y-4` (16px) - Logical field grouping
- **Form Sections**: `space-y-6` (24px) - Clear section separation

### Layout Spacing Hierarchy

#### Page Level (Macro Spacing)

```css
/* Page margins */
.page-container {
  @apply px-4 sm:px-6 lg:px-8 py-8;
}

/* Major section spacing */
.section-spacing {
  @apply mb-12 lg:mb-16;
}

/* Component group spacing */
.component-group {
  @apply space-y-8;
}
```

#### Component Level (Micro Spacing)

```css
/* Component internal spacing */
.component-inner {
  @apply p-6;
}

/* Element spacing within components */
.element-spacing {
  @apply space-y-4;
}

/* Text element spacing */
.text-spacing {
  @apply space-y-2;
}
```

### Responsive Spacing Strategy

#### Mobile First Approach

- **Base**: Mobile-optimized spacing (smaller values)
- **sm** (640px+): Slight increase for tablet
- **md** (768px+): Standard desktop spacing
- **lg** (1024px+): Generous desktop spacing
- **xl** (1280px+): Maximum comfortable spacing

#### Responsive Spacing Classes

```css
/* Responsive padding example */
.responsive-padding {
  @apply px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12;
}

/* Responsive margins example */
.responsive-margin {
  @apply mb-6 sm:mb-8 lg:mb-12;
}
```

### Usage Guidelines

#### Do's ✅

- Use spacing scale values consistently
- Apply responsive spacing for different screen sizes
- Group related elements with smaller spacing
- Separate sections with larger spacing
- Maintain vertical rhythm with consistent spacing

#### Don'ts ❌

- Don't use arbitrary spacing values
- Don't mix spacing scales within the same component
- Don't ignore responsive spacing needs
- Don't create visual hierarchy without spacing
- Don't use spacing smaller than 4px base unit

### Implementation Priority

#### Phase 1: Core Components

- Financial tables and data components
- Navigation and header elements
- Card and container components

#### Phase 2: Interactive Elements

- Form elements and inputs
- Buttons and controls
- Modal and popup components

#### Phase 3: Layout Systems

- Grid and flexbox layouts
- Page and section layouts
- Responsive breakpoint adjustments

## Button Component Guidelines

The primary Button component is defined at `src/components/ui/Button.jsx`.

### Defaults and Types

- **Default type**: Buttons default to `type="button"` to prevent accidental form submissions.
- **Submit buttons**: Inside forms, set `type="submit"` explicitly on buttons that should submit.
- **asChild**: When using `asChild`, the underlying element is rendered without a `type` attribute; set the `type` on the child element if needed.

### Loading Accessibility

- **Disabled while loading**: `disabled` is applied when `loading` is true.
- **ARIA**: Adds `aria-busy="true"` and `aria-disabled="true"` when `loading`.
- **Spinner**: Loading spinner is marked `aria-hidden="true"`.
- **Live region**: A screen-reader only `<span role="status" aria-live="polite">Loading...</span>` is rendered while loading.

### Data Attributes

- Arbitrary `data-*` attributes (e.g., `data-testid`) pass through to the underlying element for testing and analytics.

### Icons and Layout

- Use `iconName` or `iconComponent` with `iconPosition` (left/right). Spacing adjusts automatically when `children` are present.
- `fullWidth` stretches the button to the container width.

### Variants and Sizes

- Supported `variant` values include: `default`, `primary`, `secondary`, `outline`, `ghost`, `link`, `destructive`, `success`, `warning`, `danger`, `minimal`.
- Supported `size` values include: `xs`, `sm`, `default`, `lg`, `xl`, `icon`.

### Examples

```jsx
// In a form: submit and cancel
<form onSubmit={handleSubmit}>
  <Button type="submit" variant="primary" loading={isSubmitting} data-testid="save-btn">
    Save
  </Button>
  <Button variant="outline" onClick={onCancel}>
    Cancel
  </Button>
</form>

// As a link using asChild
<Button asChild variant="link">
  <a href="#details">View details</a>
  {/* Set type on the child if it's a <button> */}
</Button>
```
