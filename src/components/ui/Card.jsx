import React, { forwardRef } from 'react';

import { cn } from '../../utils/cn';

// ===== INSTITUTIONAL CARD SYSTEM =====

const Card = forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      interactive = false,
      elevated = false,
      bordered = true,
      padding = 'default',
      ...props
    },
    ref
  ) => {
    // ===== INSTITUTIONAL VARIANT SYSTEM =====
    const variantClasses = {
      default: 'bg-background border-border',
      secondary: 'bg-background-secondary border-border-secondary',
      tertiary: 'bg-background-tertiary border-border-tertiary',
      financial: 'bg-background border-financial-asset/10',
      success: 'bg-background border-brand-success/20',
      warning: 'bg-background border-brand-warning/20',
      error: 'bg-background border-brand-error/20',
      info: 'bg-background border-brand-info/20'
    };

    // ===== INSTITUTIONAL SIZE SYSTEM =====
    const sizeClasses = {
      xs: 'rounded-md',
      sm: 'rounded-lg',
      default: 'rounded-lg',
      lg: 'rounded-xl',
      xl: 'rounded-2xl'
    };

    // ===== INSTITUTIONAL PADDING SYSTEM =====
    const paddingClasses = {
      none: 'p-0',
      xs: 'p-3',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
      xl: 'p-10'
    };

    // ===== INSTITUTIONAL INTERACTION SYSTEM =====
    const interactionClasses = interactive
      ? 'hover:shadow-lg hover:shadow-brand-primary/5 hover:border-border-secondary transition-all duration-200 cursor-pointer active:scale-[0.98]'
      : '';

    // ===== INSTITUTIONAL ELEVATION SYSTEM =====
    const elevationClasses = elevated ? 'shadow-lg shadow-brand-primary/5' : 'shadow-sm';

    return (
      <div
        ref={ref}
        className={cn(
          // Base institutional styling
          'bg-background text-foreground',
          'transition-all duration-200 ease-out',

          // Variant styling
          variantClasses[variant],
          sizeClasses[size],

          // Border and elevation
          bordered ? 'border' : 'border-none',
          elevationClasses,

          // Padding
          paddingClasses[padding],

          // Interactions
          interactionClasses,

          // Custom classes
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      spacing = 'default',
      align = 'start',
      ...props
    },
    ref
  ) => {
    // ===== HEADER SPACING SYSTEM =====
    const spacingClasses = {
      none: 'space-y-0',
      tight: 'space-y-1',
      default: 'space-y-1.5',
      relaxed: 'space-y-2',
      loose: 'space-y-3'
    };

    // ===== HEADER ALIGNMENT SYSTEM =====
    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    };

    // ===== HEADER VARIANT SYSTEM =====
    const variantClasses = {
      default: 'flex flex-col',
      horizontal: 'flex flex-row justify-between items-center',
      compact: 'flex flex-col space-y-1',
      financial: 'flex flex-col space-y-1.5 border-b border-financial-asset/10 pb-4'
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          spacingClasses[spacing],
          alignClasses[align],
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(
  (
    {
      className,
      level = 'h3',
      size = 'default',
      weight = 'semibold',
      variant = 'default',
      ...props
    },
    ref
  ) => {
    // ===== TITLE SIZE SYSTEM =====
    const sizeClasses = {
      xs: 'text-sm',
      sm: 'text-base',
      default: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
      '2xl': 'text-3xl',
      '3xl': 'text-4xl'
    };

    // ===== TITLE WEIGHT SYSTEM =====
    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold'
    };

    // ===== TITLE VARIANT SYSTEM =====
    const variantClasses = {
      default: 'text-foreground leading-tight tracking-tight',
      secondary: 'text-foreground-secondary leading-normal',
      muted: 'text-foreground-muted leading-normal',
      financial: 'text-financial-asset leading-tight tracking-tight font-semibold',
      success: 'text-brand-success leading-tight tracking-tight',
      warning: 'text-brand-warning leading-tight tracking-tight',
      error: 'text-brand-error leading-tight tracking-tight'
    };

    const Component = level;

    return (
      <Component
        ref={ref}
        className={cn(sizeClasses[size], weightClasses[weight], variantClasses[variant], className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(
  ({ className, size = 'default', variant = 'default', ...props }, ref) => {
    // ===== DESCRIPTION SIZE SYSTEM =====
    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      default: 'text-sm',
      lg: 'text-base'
    };

    // ===== DESCRIPTION VARIANT SYSTEM =====
    const variantClasses = {
      default: 'text-foreground-secondary leading-relaxed',
      secondary: 'text-foreground-tertiary leading-normal',
      muted: 'text-foreground-muted leading-normal',
      financial: 'text-financial-asset/80 leading-relaxed font-medium'
    };

    return (
      <p
        ref={ref}
        className={cn(sizeClasses[size], variantClasses[variant], className)}
        {...props}
      />
    );
  }
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(
  ({ className, padding = 'none', spacing = 'default', ...props }, ref) => {
    // ===== CONTENT PADDING SYSTEM =====
    const paddingClasses = {
      none: 'p-0',
      xs: 'px-3 py-2',
      sm: 'px-4 py-3',
      default: 'px-6 py-4',
      lg: 'px-8 py-6',
      xl: 'px-10 py-8'
    };

    // ===== CONTENT SPACING SYSTEM =====
    const spacingClasses = {
      none: 'space-y-0',
      tight: 'space-y-2',
      default: 'space-y-4',
      relaxed: 'space-y-6',
      loose: 'space-y-8'
    };

    return (
      <div
        ref={ref}
        className={cn(paddingClasses[padding], spacingClasses[spacing], className)}
        {...props}
      />
    );
  }
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(
  (
    {
      className,
      variant = 'default',
      align = 'start',
      justify = 'start',
      spacing = 'default',
      ...props
    },
    ref
  ) => {
    // ===== FOOTER VARIANT SYSTEM =====
    const variantClasses = {
      default: 'flex',
      horizontal: 'flex flex-row',
      vertical: 'flex flex-col',
      grid: 'grid grid-cols-2 gap-4'
    };

    // ===== FOOTER ALIGNMENT SYSTEM =====
    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    };

    // ===== FOOTER JUSTIFICATION SYSTEM =====
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    };

    // ===== FOOTER SPACING SYSTEM =====
    const spacingClasses = {
      none: 'gap-0',
      tight: 'gap-2',
      default: 'gap-4',
      relaxed: 'gap-6',
      loose: 'gap-8'
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          alignClasses[align],
          justifyClasses[justify],
          spacingClasses[spacing],
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';

// ===== SPECIALIZED FINANCIAL CARDS =====

const FinancialCard = forwardRef(
  (
    {
      className,
      type = 'asset', // 'asset', 'liability', 'revenue', 'expense', 'equity'
      value,
      label,
      change,
      changeType = 'neutral', // 'positive', 'negative', 'neutral'
      icon,
      ...props
    },
    ref
  ) => {
    // ===== FINANCIAL TYPE STYLING =====
    const typeStyles = {
      asset: {
        border: 'border-financial-asset/20',
        bg: 'bg-financial-asset/5',
        text: 'text-financial-asset-dark'
      },
      liability: {
        border: 'border-financial-liability/20',
        bg: 'bg-financial-liability/5',
        text: 'text-financial-liability-dark'
      },
      revenue: {
        border: 'border-financial-revenue/20',
        bg: 'bg-financial-revenue/5',
        text: 'text-financial-revenue-dark'
      },
      expense: {
        border: 'border-financial-expense/20',
        bg: 'bg-financial-expense/5',
        text: 'text-financial-expense-dark'
      },
      equity: {
        border: 'border-financial-equity/20',
        bg: 'bg-financial-equity/5',
        text: 'text-financial-equity-dark'
      }
    };

    const changeStyles = {
      positive: 'text-financial-revenue-dark',
      negative: 'text-financial-expense-dark',
      neutral: 'text-foreground-secondary'
    };

    return (
      <Card
        ref={ref}
        variant="secondary"
        className={cn('border-2', typeStyles[type].border, typeStyles[type].bg, className)}
        {...props}
      >
        <CardContent padding="default" spacing="tight">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon && <div className={cn('p-2 rounded-lg', typeStyles[type].bg)}>{icon}</div>}
              <div>
                <p className="text-sm font-medium text-foreground-secondary">{label}</p>
                <p className={cn('text-2xl font-bold', typeStyles[type].text)}>{value}</p>
              </div>
            </div>
            {change && (
              <div className={cn('text-right', changeStyles[changeType])}>
                <p className="text-sm font-medium">{change}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
FinancialCard.displayName = 'FinancialCard';

// ===== EXPORT ALL COMPONENTS =====
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, FinancialCard };
