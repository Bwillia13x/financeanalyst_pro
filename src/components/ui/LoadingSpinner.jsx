import { cn } from '../../utils/cn';

const LoadingSpinner = ({
  size = 'default',
  className = '',
  text = 'Loading...',
  showText = true,
  variant = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground',
    white: 'text-white'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {showText && (
        <p className={cn('font-medium', textSizeClasses[size], variantClasses[variant])}>{text}</p>
      )}
    </div>
  );
};

// Full page loading spinner
export const FullPageLoader = ({ text = 'Loading FinanceAnalyst Pro...' }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg p-8 shadow-elevation-2">
        <LoadingSpinner size="lg" text={text} variant="primary" />
      </div>
    </div>
  );
};

// Inline loading spinner for buttons
export const ButtonSpinner = ({ className = '' }) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent w-4 h-4',
        className
      )}
    />
  );
};

// Skeleton loader for content
export const SkeletonLoader = ({ lines = 3, className = '', animated = true }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-4 bg-muted rounded',
            animated && 'animate-pulse',
            index === lines - 1 && 'w-3/4' // Last line shorter
          )}
        />
      ))}
    </div>
  );
};

// Chart loading placeholder
export const ChartLoader = ({ className = '' }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed border-muted',
        className
      )}
    >
      <div className="text-center space-y-2">
        <LoadingSpinner size="lg" variant="muted" showText={false} />
        <p className="text-sm text-muted-foreground">Loading chart data...</p>
      </div>
    </div>
  );
};

// Table loading placeholder
export const TableLoader = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={`header-${index}`} className="h-6 bg-muted rounded animate-pulse" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 bg-muted/60 rounded animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
