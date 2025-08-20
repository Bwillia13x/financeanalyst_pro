import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

import { cn } from '../../utils/cn';
import Icon from '../AppIcon';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow',
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow',
        outline: 'border border-border bg-background hover:bg-muted hover:text-foreground shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm hover:shadow',
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
        success: 'bg-success text-success-foreground hover:bg-success/90 shadow-sm hover:shadow',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm hover:shadow',
        danger: 'bg-error text-error-foreground hover:bg-error/90 shadow-sm hover:shadow',
        minimal: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        xs: 'h-8 rounded-md px-2 text-xs',
        xl: 'h-12 rounded-md px-10 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

const Button = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      loading = false,
      iconName = null,
      iconPosition = 'left',
      iconSize = null,
      fullWidth = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Icon size mapping based on button size
    const iconSizeMap = {
      xs: 12,
      sm: 14,
      default: 16,
      lg: 18,
      xl: 20,
      icon: 16
    };

    const calculatedIconSize = iconSize || iconSizeMap[size] || 16;

    // Loading spinner
    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        data-loading="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // Icon rendering
    const renderIcon = () => {
      if (!iconName) return null;

      return (
        <Icon
          name={iconName}
          size={calculatedIconSize}
          className={cn(
            children && iconPosition === 'left' && 'mr-2',
            children && iconPosition === 'right' && 'ml-2'
          )}
        />
      );
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {iconName && iconPosition === 'left' && renderIcon()}
        {children}
        {iconName && iconPosition === 'right' && renderIcon()}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export default Button;
