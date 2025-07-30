import React from 'react';
import { Calculator, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { cn } from '../../utils/cn';

const LoadingState = ({
  type = 'default', // 'default', 'calculation', 'financial', 'inline'
  size = 'default', // 'sm', 'default', 'lg'
  message,
  className,
  showIcon = true,
  variant = 'default', // 'default', 'subtle', 'pulsing'
  ...props
}) => {
  // Get appropriate icon based on type
  const getIcon = () => {
    switch (type) {
      case 'calculation':
        return Calculator;
      case 'financial':
        return DollarSign;
      case 'trend':
        return TrendingUp;
      case 'percentage':
        return Percent;
      default:
        return Calculator;
    }
  };

  const Icon = getIcon();

  // Size configurations
  const sizeConfig = {
    sm: {
      spinner: 'w-3 h-3 border',
      icon: 12,
      text: 'text-xs',
      gap: 'gap-1',
      padding: 'p-1'
    },
    default: {
      spinner: 'w-4 h-4 border-2',
      icon: 16,
      text: 'text-sm',
      gap: 'gap-2',
      padding: 'p-2'
    },
    lg: {
      spinner: 'w-6 h-6 border-2',
      icon: 20,
      text: 'text-base',
      gap: 'gap-3',
      padding: 'p-3'
    }
  };

  const config = sizeConfig[size];

  // Variant styles
  const variantStyles = {
    default: 'text-muted-foreground',
    subtle: 'text-muted-foreground/70',
    pulsing: 'text-muted-foreground animate-pulse'
  };

  // Inline variant for table cells and small spaces
  if (type === 'inline') {
    return (
      <div className={cn('flex items-center justify-center', config.gap, className)} {...props}>
        <div className={cn(
          config.spinner,
          'border-muted-foreground border-t-transparent rounded-full animate-spin',
          variantStyles[variant]
        )} />
        {message && (
          <span className={cn(config.text, variantStyles[variant])}>
            {message}
          </span>
        )}
      </div>
    );
  }

  // Default card-style loading state
  const defaultMessage = {
    calculation: 'Calculating...',
    financial: 'Processing financial data...',
    trend: 'Analyzing trends...',
    percentage: 'Computing percentages...',
    default: 'Loading...'
  };

  const displayMessage = message || defaultMessage[type];

  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      config.padding,
      config.gap,
      'bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30',
      className
    )} {...props}>
      <div className="flex items-center gap-2">
        {/* Animated spinner */}
        <div className={cn(
          config.spinner,
          'border-muted-foreground border-t-transparent rounded-full animate-spin',
          variantStyles[variant]
        )} />
        
        {/* Icon with subtle animation */}
        {showIcon && (
          <Icon 
            size={config.icon} 
            className={cn(
              'animate-pulse',
              variantStyles[variant]
            )} 
          />
        )}
      </div>
      
      {/* Loading message */}
      {displayMessage && (
        <p className={cn(
          config.text,
          'font-medium text-center',
          variantStyles[variant]
        )}>
          {displayMessage}
        </p>
      )}
    </div>
  );
};

// Skeleton component for table cells and consistent spacing
const LoadingSkeleton = ({
  width = 'w-20',
  height = 'h-6',
  className,
  variant = 'default', // 'default', 'currency', 'percentage'
  ...props
}) => {
  const variantClasses = {
    default: 'bg-muted',
    currency: 'bg-emerald-100',
    percentage: 'bg-blue-100'
  };

  return (
    <div
      className={cn(
        'animate-pulse rounded-md',
        width,
        height,
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};

// Pulse component for subtle loading indicators
const LoadingPulse = ({
  children,
  className,
  isLoading = false,
  ...props
}) => {
  if (!isLoading) {
    return children;
  }

  return (
    <div className={cn('animate-pulse opacity-50', className)} {...props}>
      {children}
    </div>
  );
};

// Dots animation for minimal loading states
const LoadingDots = ({
  size = 'default',
  className,
  variant = 'default',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    default: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  };

  const variantClasses = {
    default: 'bg-muted-foreground',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning'
  };

  return (
    <div 
      className={cn('flex items-center gap-1', className)} 
      {...props}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            variantClasses[variant]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );
};

// Export all components
export default LoadingState;
export { LoadingSkeleton, LoadingPulse, LoadingDots };