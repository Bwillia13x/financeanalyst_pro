# Enhanced Financial Input Components

A collection of professional, minimalist financial input components designed for financial analysis applications. These components follow design principles of simplicity, functionality, and consistency while providing advanced features for financial data entry and display.

## Components Overview

### 1. FinancialInput
A comprehensive input component with smart formatting, validation, and financial-specific features.

**Features:**
- Multi-format support (currency, percentage, number)
- Real-time validation with custom messages
- Smart number formatting with locale support
- Loading states and error handling
- Keyboard navigation (Enter to save, Escape to cancel)
- Auto-focus capability

**Usage:**
```jsx
import { FinancialInput } from './components/ui';

<FinancialInput
  label="Annual Revenue"
  value={1250000}
  onChange={setValue}
  type="currency"
  currency="USD"
  required
  min={0}
  description="Enter the company's annual revenue"
  onValidation={(isValid, message) => console.log(isValid, message)}
/>
```

**Props:**
- `type`: 'currency' | 'percentage' | 'number'
- `currency`: String (default: 'USD')
- `locale`: String (default: 'en-US')
- `decimals`: Number (default: 2)
- `allowNegative`: Boolean (default: true)
- `min`, `max`: Number limits
- `loading`: Boolean for loading state
- `error`: String for error message
- `required`: Boolean
- `onValidation`: Function callback for validation

### 2. EditableCell
Inline editing component perfect for spreadsheet-like interfaces with financial data.

**Features:**
- Click-to-edit functionality
- Visual feedback with save/cancel buttons
- Formula cell support with auto-calculation indicators
- Multiple variants (default, adjusted, formula)
- Smart formatting for different data types
- Keyboard shortcuts (Enter/Tab to save, Escape to cancel)

**Usage:**
```jsx
import { EditableCell } from './components/ui';

<EditableCell
  value={450000}
  onChange={handleChange}
  type="currency"
  variant="adjusted"
  isFormula={false}
  showEditIcon={true}
/>
```

**Props:**
- `value`: Any - the current value
- `onChange`: Function - callback when value changes
- `type`: 'currency' | 'percentage' | 'number' | 'text'
- `variant`: 'default' | 'adjusted' | 'formula'
- `isFormula`: Boolean - prevents editing and shows formula styling
- `disabled`: Boolean
- `loading`: Boolean
- `error`: String

### 3. CurrencyInput
Advanced currency input with multi-currency support, trend indicators, and abbreviation display.

**Features:**
- Multi-currency support with proper formatting
- Abbreviation display (1.2M instead of 1,200,000)
- Trend indicators comparing to previous values
- Locale-aware formatting
- Size variants (sm, default, lg)
- Visual variants (default, filled, minimal)

**Usage:**
```jsx
import { CurrencyInput } from './components/ui';

<CurrencyInput
  value={2400000}
  onChange={setValue}
  currency="USD"
  abbreviateDisplay={true}
  showTrend={true}
  previousValue={2100000}
  size="default"
  variant="default"
/>
```

**Props:**
- `currency`: String - currency code (USD, EUR, GBP, etc.)
- `abbreviateDisplay`: Boolean - show abbreviated format for large numbers
- `showTrend`: Boolean - show trend indicator
- `previousValue`: Number - for trend comparison
- `size`: 'sm' | 'default' | 'lg'
- `variant`: 'default' | 'filled' | 'minimal'

### 4. LoadingState
Flexible loading state components for various use cases in financial applications.

**Features:**
- Multiple types (calculation, financial, trend, inline)
- Size variants
- Different animation styles (default, subtle, pulsing)
- Contextual icons and messages

**Usage:**
```jsx
import { LoadingState, LoadingSkeleton, LoadingDots } from './components/ui';

// Full loading state
<LoadingState 
  type="calculation" 
  message="Calculating DCF model..."
  size="default"
/>

// Inline loading
<LoadingState type="inline" size="sm" />

// Skeleton loader
<LoadingSkeleton width="w-24" height="h-4" variant="currency" />

// Dots animation
<LoadingDots size="default" variant="primary" />
```

### 5. ValidationFeedback
Comprehensive validation and feedback system for forms and inputs.

**Features:**
- Multiple feedback types (error, warning, success, info)
- Field-level validation
- Validation summaries with collapsible sections
- Real-time validation status indicators
- Consistent styling and behavior

**Usage:**
```jsx
import { 
  ValidationFeedback, 
  FieldValidation, 
  ValidationSummary,
  ValidationStatus 
} from './components/ui';

// Individual feedback
<ValidationFeedback
  type="error"
  message="Revenue cannot be negative"
/>

// Field validation
<FieldValidation
  error="Invalid input"
  warning="Check this value"
  success="Valid input"
/>

// Validation summary
<ValidationSummary
  errors={["Error 1", "Error 2"]}
  warnings={["Warning 1"]}
  collapsible={true}
/>

// Status indicator
<ValidationStatus
  isValidating={false}
  isValid={true}
/>
```

## Design Principles

### 1. Minimalist Aesthetics
- Clean, uncluttered interfaces
- Subtle shadows and borders
- Consistent spacing using Tailwind's scale
- Professional color palette suited for financial applications

### 2. Functional Beauty
- Every visual element serves a purpose
- Smart defaults that work out of the box
- Progressive disclosure of advanced features
- Contextual feedback and guidance

### 3. Consistent Behavior
- Standardized keyboard shortcuts across components
- Uniform validation patterns
- Consistent loading and error states
- Predictable user interactions

### 4. Professional Focus
- Financial data formatting standards
- Industry-appropriate validation rules
- Calculation-aware interfaces
- Multi-currency and locale support

## Integration with Existing Theme

These components integrate seamlessly with your existing design system:

- Uses CSS custom properties from `tailwind.css`
- Follows established color schemes and typography
- Consistent with existing UI component patterns
- Dark mode ready (via CSS custom properties)

## Accessibility

All components follow accessibility best practices:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast color ratios
- Focus management

## Browser Support

Components are tested and work with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Optimized bundle size with tree shaking
- Efficient re-renders with React optimization patterns
- Minimal DOM manipulation
- Lightweight animations using CSS transforms

## Demo

Visit `/financial-inputs-demo` to see all components in action with interactive examples and code snippets.

## Contributing

When extending these components:

1. Maintain the minimalist design philosophy
2. Follow existing prop patterns and naming conventions
3. Include proper TypeScript definitions
4. Add comprehensive tests
5. Update documentation with new features

## Testing

Run tests with:
```bash
npm test
```

Components include unit tests covering:
- Rendering with various props
- User interactions
- Validation logic
- Accessibility features
- Error handling