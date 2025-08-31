/**
 * Institutional Design Tokens System
 * Centralized design tokens for FinanceAnalyst Pro
 * Provides type-safe access to design system values
 */

export const DESIGN_TOKENS = {
  // ===== BRAND COLORS =====
  brand: {
    primary: 'var(--color-brand-primary)',
    secondary: 'var(--color-brand-secondary)',
    accent: 'var(--color-brand-accent)',
    success: 'var(--color-brand-success)',
    warning: 'var(--color-brand-warning)',
    error: 'var(--color-brand-error)',
    info: 'var(--color-brand-info)'
  },

  // ===== SEMANTIC COLORS =====
  colors: {
    // Background
    background: 'var(--color-background)',
    backgroundSecondary: 'var(--color-background-secondary)',
    backgroundTertiary: 'var(--color-background-tertiary)',
    backgroundOverlay: 'var(--color-background-overlay)',

    // Foreground
    foreground: 'var(--color-foreground)',
    foregroundSecondary: 'var(--color-foreground-secondary)',
    foregroundTertiary: 'var(--color-foreground-tertiary)',
    foregroundMuted: 'var(--color-foreground-muted)',
    foregroundInverse: 'var(--color-foreground-inverse)',

    // Interactive States
    interactive: {
      hover: 'var(--color-interactive-hover)',
      active: 'var(--color-interactive-active)',
      focus: 'var(--color-interactive-focus)',
      selected: 'var(--color-interactive-selected)'
    },

    // Borders
    border: 'var(--color-border)',
    borderSecondary: 'var(--color-border-secondary)',
    borderTertiary: 'var(--color-border-tertiary)',
    borderFocus: 'var(--color-border-focus)',
    borderError: 'var(--color-border-error)',

    // Legacy compatibility
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    accent: 'var(--color-accent)',
    destructive: 'var(--color-destructive)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    info: 'var(--color-info)',
    muted: 'var(--color-muted)',
    card: 'var(--color-card)',
    popover: 'var(--color-popover)',
    input: 'var(--color-input)',
    ring: 'var(--color-ring)'
  },

  // ===== FINANCIAL DOMAIN COLORS =====
  financial: {
    revenue: {
      primary: 'var(--color-financial-revenue)',
      light: 'var(--color-financial-revenue-light)',
      medium: 'var(--color-financial-revenue-medium)',
      dark: 'var(--color-financial-revenue-dark)'
    },
    expense: {
      primary: 'var(--color-financial-expense)',
      light: 'var(--color-financial-expense-light)',
      medium: 'var(--color-financial-expense-medium)',
      dark: 'var(--color-financial-expense-dark)'
    },
    asset: {
      primary: 'var(--color-financial-asset)',
      light: 'var(--color-financial-asset-light)',
      medium: 'var(--color-financial-asset-medium)',
      dark: 'var(--color-financial-asset-dark)'
    },
    liability: {
      primary: 'var(--color-financial-liability)',
      light: 'var(--color-financial-liability-light)',
      medium: 'var(--color-financial-liability-medium)',
      dark: 'var(--color-financial-liability-dark)'
    },
    equity: {
      primary: 'var(--color-financial-equity)',
      light: 'var(--color-financial-equity-light)',
      medium: 'var(--color-financial-equity-medium)',
      dark: 'var(--color-financial-equity-dark)'
    }
  },

  // ===== CHART COLORS =====
  chart: {
    color1: 'var(--color-chart-1)',
    color2: 'var(--color-chart-2)',
    color3: 'var(--color-chart-3)',
    color4: 'var(--color-chart-4)',
    color5: 'var(--color-chart-5)',
    color6: 'var(--color-chart-6)',
    color7: 'var(--color-chart-7)',
    color8: 'var(--color-chart-8)',
    color9: 'var(--color-chart-9)',
    color10: 'var(--color-chart-10)',
    // Array format for easy iteration
    colors: [
      'var(--color-chart-1)',
      'var(--color-chart-2)',
      'var(--color-chart-3)',
      'var(--color-chart-4)',
      'var(--color-chart-5)',
      'var(--color-chart-6)',
      'var(--color-chart-7)',
      'var(--color-chart-8)',
      'var(--color-chart-9)',
      'var(--color-chart-10)'
    ]
  },

  // ===== SHADOW SYSTEM =====
  shadows: {
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    '2xl': 'var(--shadow-2xl)'
  },

  // ===== TYPOGRAPHY SYSTEM =====
  typography: {
    fonts: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace']
    },
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
      '6xl': '3.75rem' // 60px
    },
    weights: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    lineHeights: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    }
  },

  // ===== SPACING SYSTEM =====
  spacing: {
    // Base unit (4px)
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    32: '8rem', // 128px
    40: '10rem', // 160px
    48: '12rem', // 192px
    56: '14rem', // 224px
    64: '16rem' // 256px
  },

  // ===== BORDER RADIUS SYSTEM =====
  radius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px'
  },

  // ===== Z-INDEX SYSTEM =====
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
    dropdown: '1000',
    sticky: '1020',
    banner: '1030',
    overlay: '1040',
    modal: '1050',
    popover: '1060',
    skipLink: '1070',
    toast: '1080',
    tooltip: '1090'
  },

  // ===== BREAKPOINTS =====
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // ===== ANIMATION SYSTEM =====
  animations: {
    duration: {
      fastest: '50ms',
      fast: '100ms',
      normal: '200ms',
      slow: '300ms',
      slowest: '500ms'
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Get a design token value
 * @param {string} path - Dot-notation path to token (e.g., 'colors.foreground')
 * @returns {string} CSS custom property value
 */
export function getToken(path) {
  const keys = path.split('.');
  let value = DESIGN_TOKENS;

  for (const key of keys) {
    value = value?.[key];
  }

  if (typeof value !== 'string') {
    console.warn(`Design token not found: ${path}`);
    return '';
  }

  return value;
}

/**
 * Get all chart colors as an array
 * @returns {string[]} Array of chart color CSS custom properties
 */
export function getChartColors() {
  return DESIGN_TOKENS.chart.colors;
}

/**
 * Get financial colors for a specific category
 * @param {string} category - 'revenue', 'expense', 'asset', 'liability', 'equity'
 * @param {string} variant - 'primary', 'light', 'medium', 'dark' (default: 'primary')
 * @returns {string} CSS custom property value
 */
export function getFinancialColor(category, variant = 'primary') {
  return DESIGN_TOKENS.financial[category]?.[variant] || '';
}

/**
 * Get semantic color
 * @param {string} semantic - Semantic color name
 * @param {string} variant - Variant (for interactive states)
 * @returns {string} CSS custom property value
 */
export function getColor(semantic, variant) {
  if (variant && DESIGN_TOKENS.colors[semantic]?.[variant]) {
    return DESIGN_TOKENS.colors[semantic][variant];
  }
  return DESIGN_TOKENS.colors[semantic] || '';
}

/**
 * Get shadow token
 * @param {string} size - Shadow size ('xs', 'sm', 'md', 'lg', 'xl', '2xl')
 * @returns {string} CSS shadow value
 */
export function getShadow(size) {
  return DESIGN_TOKENS.shadows[size] || DESIGN_TOKENS.shadows.md;
}

// ===== EXPORT DEFAULT =====
export default DESIGN_TOKENS;
