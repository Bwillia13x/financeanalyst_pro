import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React, { forwardRef } from 'react';

import { cn } from '../../utils/cn';
import Icon from '../AppIcon';

const buttonVariants = cva(
  // Base styles with institutional design system - Mobile optimized
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none touch-manipulation',

  {
    variants: {
      // ===== INSTITUTIONAL VARIANT SYSTEM =====
      variant: {
        // Primary Actions - Brand Colors
        primary: `
          bg-brand-primary text-foreground-inverse
          hover:bg-brand-secondary hover:shadow-lg hover:shadow-brand-primary/25
          focus:bg-brand-secondary focus:shadow-lg focus:shadow-brand-primary/25
          active:bg-brand-primary active:scale-[0.98]
          shadow-md
          border border-brand-primary/20
          transition-all duration-200
        `,
        secondary: `
          bg-brand-secondary text-foreground-inverse
          hover:bg-brand-accent hover:shadow-lg hover:shadow-brand-secondary/25
          focus:bg-brand-accent focus:shadow-lg focus:shadow-brand-secondary/25
          active:bg-brand-secondary active:scale-[0.98]
          shadow-md
          border border-brand-secondary/20
          transition-all duration-200
        `,

        // Gradient Variants - Enhanced Visual Appeal
        gradient: `
          bg-gradient-to-r from-brand-primary to-brand-secondary text-foreground-inverse
          hover:from-brand-secondary hover:to-brand-accent hover:shadow-xl hover:shadow-brand-primary/30
          focus:from-brand-secondary focus:to-brand-accent focus:shadow-xl focus:shadow-brand-primary/30
          active:scale-[0.98]
          shadow-lg
          border-0
          transition-all duration-200
        `,
        gradientPrimary: `
          bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 text-white
          hover:from-blue-700 hover:via-blue-800 hover:to-teal-700 hover:shadow-xl hover:shadow-blue-500/30
          focus:from-blue-700 focus:via-blue-800 focus:to-teal-700 focus:shadow-xl focus:shadow-blue-500/30
          active:scale-[0.98]
          shadow-lg
          border-0
          transition-all duration-200
        `,
        gradientSuccess: `
          bg-gradient-to-r from-emerald-500 to-green-600 text-white
          hover:from-emerald-600 hover:to-green-700 hover:shadow-xl hover:shadow-emerald-500/30
          focus:from-emerald-600 focus:to-green-700 focus:shadow-xl focus:shadow-emerald-500/30
          active:scale-[0.98]
          shadow-lg
          border-0
          transition-all duration-200
        `,

        // Status-Based Variants
        success: `
          bg-brand-success text-foreground-inverse
          hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25
          focus:bg-emerald-700 focus:shadow-lg focus:shadow-emerald-500/25
          active:bg-emerald-800 active:scale-[0.98]
          shadow-md
          border border-emerald-600/20
          transition-all duration-200
        `,
        warning: `
          bg-brand-warning text-foreground-inverse
          hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/25
          focus:bg-amber-600 focus:shadow-lg focus:shadow-amber-500/25
          active:bg-amber-800 active:scale-[0.98]
          shadow-md
          border border-amber-500/20
          transition-all duration-200
        `,
        danger: `
          bg-brand-error text-foreground-inverse
          hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25
          focus:bg-red-700 focus:shadow-lg focus:shadow-red-500/25
          active:bg-red-800 active:scale-[0.98]
          shadow-md
          border border-red-600/20
          transition-all duration-200
        `,
        info: `
          bg-brand-info text-foreground-inverse
          hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25
          focus:bg-blue-700 focus:shadow-lg focus:shadow-blue-500/25
          active:bg-blue-800 active:scale-[0.98]
          shadow-md
          border border-blue-600/20
          transition-all duration-200
        `,

        // Surface Variants
        outline: `
          border-2 border-border bg-background text-foreground
          hover:bg-interactive-hover hover:border-border-secondary hover:shadow-md
          focus:bg-interactive-focus focus:border-brand-accent focus:shadow-md
          active:bg-interactive-active active:scale-[0.98]
          shadow-sm
          transition-all duration-200
        `,
        ghost: `
          bg-transparent text-foreground-secondary
          hover:bg-interactive-hover hover:text-foreground hover:shadow-sm
          focus:bg-interactive-focus focus:text-foreground focus:shadow-sm
          active:bg-interactive-active active:scale-[0.98]
          border border-transparent
          transition-all duration-200
        `,
        subtle: `
          bg-background-secondary text-foreground
          hover:bg-background-tertiary hover:shadow-md
          focus:bg-interactive-focus focus:shadow-md
          active:bg-interactive-active active:scale-[0.98]
          border border-border
          transition-all duration-200
        `,

        // Modern Variants
        glass: `
          bg-white/10 backdrop-blur-md text-foreground border border-white/20
          hover:bg-white/20 hover:shadow-lg hover:shadow-white/10
          focus:bg-white/20 focus:shadow-lg focus:shadow-white/10
          active:bg-white/30 active:scale-[0.98]
          shadow-md
          transition-all duration-200
        `,
        glow: `
          bg-brand-primary text-foreground-inverse
          hover:shadow-lg hover:shadow-brand-primary/50 hover:shadow-2xl
          focus:shadow-lg focus:shadow-brand-primary/50 focus:shadow-2xl
          active:scale-[0.98]
          shadow-lg shadow-brand-primary/30
          border-0
          transition-all duration-200
        `,
        elevated: `
          bg-background text-foreground
          hover:shadow-xl hover:shadow-brand-primary/10 hover:-translate-y-0.5
          focus:shadow-xl focus:shadow-brand-primary/10 focus:-translate-y-0.5
          active:scale-[0.98] active:translate-y-0
          shadow-lg border border-border
          transition-all duration-200
        `,

        // Special Purpose Variants
        link: `
          bg-transparent text-brand-accent underline-offset-4
          hover:text-brand-secondary hover:underline hover:bg-transparent
          focus:text-brand-secondary focus:underline focus:bg-transparent
          active:text-brand-primary
          p-0 h-auto border-none shadow-none
        `,
        minimal: `
          bg-transparent text-foreground-muted
          hover:text-foreground hover:bg-interactive-hover/50
          focus:text-foreground focus:bg-interactive-focus/50
          active:text-foreground active:bg-interactive-active/50
          border border-transparent
        `,

        // Financial Domain Variants
        financial: `
          bg-background text-financial-asset
          hover:bg-financial-asset-light hover:shadow-md
          focus:bg-financial-asset-light focus:shadow-md
          active:bg-background
          border border-financial-asset/30
          font-medium
        `,
        financialPositive: `
          bg-financial-revenue-light text-financial-revenue-dark
          hover:bg-financial-revenue hover:text-foreground-inverse hover:shadow-md
          focus:bg-financial-revenue focus:text-foreground-inverse focus:shadow-md
          active:bg-financial-revenue-medium
          border border-financial-revenue/30
        `,
        financialNegative: `
          bg-financial-expense-light text-financial-expense-dark
          hover:bg-financial-expense hover:text-foreground-inverse hover:shadow-md
          focus:bg-financial-expense focus:text-foreground-inverse focus:shadow-md
          active:bg-financial-expense-medium
          border border-financial-expense/30
        `,

        // ===== MOBILE OPTIMIZED VARIANTS =====
        mobilePrimary: `
          bg-brand-primary text-foreground-inverse
          hover:bg-brand-secondary hover:shadow-lg hover:shadow-brand-primary/25
          focus:bg-brand-secondary focus:shadow-lg focus:shadow-brand-primary/25
          active:bg-brand-primary active:scale-[0.98]
          shadow-md
          border border-brand-primary/20
          transition-all duration-200
          min-h-[44px] px-6 py-3 text-base font-medium
        `,
        mobileSecondary: `
          bg-background text-foreground
          hover:bg-background-secondary hover:shadow-md
          focus:bg-background-secondary focus:shadow-md
          active:bg-background-tertiary active:scale-[0.98]
          border-2 border-brand-primary
          transition-all duration-200
          min-h-[44px] px-6 py-3 text-base font-medium
        `,
        mobileAction: `
          bg-gradient-to-r from-brand-primary to-brand-secondary text-foreground-inverse
          hover:from-brand-secondary hover:to-brand-accent hover:shadow-xl hover:shadow-brand-primary/30
          focus:from-brand-secondary focus:to-brand-accent focus:shadow-xl focus:shadow-brand-primary/30
          active:scale-[0.98]
          shadow-lg
          border-0
          transition-all duration-200
          min-h-[48px] px-8 py-4 text-lg font-semibold
        `,
        mobileGhost: `
          bg-transparent text-foreground
          hover:bg-background-secondary hover:shadow-sm
          focus:bg-background-secondary focus:shadow-sm
          active:bg-background-tertiary active:scale-[0.98]
          border border-transparent
          transition-all duration-200
          min-h-[44px] px-4 py-2 text-base
        `,
        mobileDanger: `
          bg-destructive text-destructive-foreground
          hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25
          focus:bg-destructive/90 focus:shadow-lg focus:shadow-destructive/25
          active:bg-destructive/80 active:scale-[0.98]
          shadow-md
          border border-destructive/20
          transition-all duration-200
          min-h-[44px] px-6 py-3 text-base font-medium
        `
      },

      // ===== INSTITUTIONAL SIZE SYSTEM =====
      size: {
        xs: 'h-7 px-2 py-1 text-xs font-medium gap-1.5 rounded-md',
        sm: 'h-8 px-3 py-1.5 text-sm font-medium gap-2 rounded-md',
        default: 'h-10 px-4 py-2 text-sm font-medium gap-2 rounded-lg',
        lg: 'h-11 px-6 py-2.5 text-base font-medium gap-2.5 rounded-lg',
        xl: 'h-12 px-8 py-3 text-lg font-semibold gap-3 rounded-lg',
        '2xl': 'h-14 px-10 py-4 text-xl font-semibold gap-3 rounded-xl',

        // Special sizes for specific use cases
        iconXs: 'h-6 w-6 p-0.5 rounded-md',
        iconSm: 'h-8 w-8 p-1 rounded-md',
        icon: 'h-10 w-10 p-1.5 rounded-lg',
        iconLg: 'h-11 w-11 p-2 rounded-lg',
        iconXl: 'h-12 w-12 p-2.5 rounded-lg',
        icon2xl: 'h-14 w-14 p-3 rounded-xl',

        // ===== MOBILE OPTIMIZED SIZES =====
        // iOS/Android touch target minimum is 44px
        mobileXs: 'min-h-[44px] px-4 py-2 text-sm font-medium gap-2 rounded-lg',
        mobileSm: 'min-h-[44px] px-6 py-3 text-base font-medium gap-2.5 rounded-lg',
        mobile: 'min-h-[48px] px-8 py-4 text-base font-medium gap-3 rounded-lg',
        mobileLg: 'min-h-[52px] px-10 py-4 text-lg font-semibold gap-3 rounded-xl',
        mobileXl: 'min-h-[56px] px-12 py-5 text-xl font-semibold gap-4 rounded-xl',

        // Mobile icon sizes
        mobileIcon: 'min-h-[44px] min-w-[44px] p-3 rounded-lg',
        mobileIconLg: 'min-h-[48px] min-w-[48px] p-3.5 rounded-lg',
        mobileIconXl: 'min-h-[52px] min-w-[52px] p-4 rounded-xl'
      },

      // ===== ADDITIONAL INSTITUTIONAL FEATURES =====
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      },

      loading: {
        true: 'cursor-wait',
        false: 'cursor-pointer'
      }
    },

    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
      loading: false
    },

    compoundVariants: [
      // Full width adjustments
      {
        fullWidth: true,
        size: 'xs',
        class: 'px-2'
      },
      {
        fullWidth: true,
        size: 'sm',
        class: 'px-3'
      },
      {
        fullWidth: true,
        size: 'default',
        class: 'px-4'
      },
      {
        fullWidth: true,
        size: 'lg',
        class: 'px-6'
      },
      {
        fullWidth: true,
        size: 'xl',
        class: 'px-8'
      },
      {
        fullWidth: true,
        size: '2xl',
        class: 'px-10'
      }
    ]
  }
);

const Button = forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      loading = false,
      iconName = null,
      iconComponent = null,
      iconPosition = 'left',
      iconSize = null,
      fullWidth = false,
      disabled = false,
      type: typeProp,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      tooltip,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    // Enhanced icon size mapping for institutional system
    const iconSizeMap = {
      xs: 12,
      sm: 14,
      default: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      iconXs: 10,
      iconSm: 12,
      icon: 16,
      iconLg: 18,
      iconXl: 20,
      icon2xl: 24,
      // Mobile optimized sizes
      mobileXs: 16,
      mobileSm: 18,
      mobile: 20,
      mobileLg: 24,
      mobileXl: 28,
      mobileIcon: 20,
      mobileIconLg: 24,
      mobileIconXl: 28
    };

    const calculatedIconSize = iconSize || iconSizeMap[size] || 16;

    // Enhanced loading spinner with institutional styling
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
        data-testid="button-loading-spinner"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // Enhanced icon rendering with proper accessibility
    const renderIcon = () => {
      const IconComp = iconComponent;
      const spacingClass = cn(
        children && iconPosition === 'left' && 'mr-2',
        children && iconPosition === 'right' && 'ml-2',
        !children && 'mx-0' // No spacing if icon-only button
      );

      const iconElement = IconComp ? (
        <IconComp size={calculatedIconSize} className={spacingClass} aria-hidden="true" />
      ) : iconName ? (
        <Icon
          name={iconName}
          size={calculatedIconSize}
          className={spacingClass}
          aria-hidden="true"
        />
      ) : null;

      return iconElement;
    };

    // Generate accessible label for icon-only buttons
    const getAccessibleLabel = () => {
      if (ariaLabel) return ariaLabel;
      if (!children && iconName) {
        // Convert icon name to readable label
        return iconName
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
      }
      return undefined;
    };

    const accessibleLabel = getAccessibleLabel();

    return (
      <Comp
        className={cn(
          buttonVariants({
            variant,
            size,
            fullWidth,
            loading,
            className
          })
        )}
        ref={ref}
        type={!asChild ? (typeProp ?? 'button') : undefined}
        disabled={isDisabled}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-busy={loading ? 'true' : undefined}
        aria-label={accessibleLabel}
        aria-describedby={ariaDescribedBy}
        title={tooltip}
        data-testid={props['data-testid'] || 'button'}
        {...props}
      >
        {/* Loading State */}
        {loading && (
          <>
            <LoadingSpinner />
            <span role="status" aria-live="polite" className="sr-only">
              Loading...
            </span>
          </>
        )}

        {/* Icon (Left Position) */}
        {!loading && (iconName || iconComponent) && iconPosition === 'left' && renderIcon()}

        {/* Button Content */}
        {!loading && children && (
          <span
            className={cn(
              'truncate', // Prevent text overflow
              // Special styling for icon-only buttons
              !children && (iconName || iconComponent) && 'sr-only'
            )}
          >
            {children}
          </span>
        )}

        {/* Icon (Right Position) */}
        {!loading && (iconName || iconComponent) && iconPosition === 'right' && renderIcon()}

        {/* Icon-only button screen reader text */}
        {!children && (iconName || iconComponent) && !loading && accessibleLabel && (
          <span className="sr-only">{accessibleLabel}</span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export default Button;
