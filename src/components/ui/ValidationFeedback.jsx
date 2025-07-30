import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ValidationFeedback = ({
  type = 'error', // 'error', 'warning', 'success', 'info'
  message,
  className,
  size = 'default', // 'sm', 'default', 'lg'
  variant = 'default', // 'default', 'inline', 'floating', 'subtle'
  showIcon = true,
  dismissible = false,
  onDismiss,
  position = 'bottom', // 'top', 'bottom', 'left', 'right' (for floating)
  children,
  ...props
}) => {
  // Icon mapping
  const iconMap = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info
  };

  const Icon = iconMap[type];

  // Size configurations
  const sizeConfig = {
    sm: {
      text: 'text-xs',
      icon: 12,
      padding: 'p-2',
      gap: 'gap-1'
    },
    default: {
      text: 'text-sm',
      icon: 14,
      padding: 'p-3',
      gap: 'gap-2'
    },
    lg: {
      text: 'text-base',
      icon: 16,
      padding: 'p-4',
      gap: 'gap-3'
    }
  };

  const config = sizeConfig[size];

  // Type-based styling
  const typeStyles = {
    error: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      text: 'text-destructive',
      icon: 'text-destructive'
    },
    warning: {
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      text: 'text-warning-foreground',
      icon: 'text-warning'
    },
    success: {
      bg: 'bg-success/10',
      border: 'border-success/20',
      text: 'text-success-foreground',
      icon: 'text-success'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-500'
    }
  };

  const styles = typeStyles[type];

  // Variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'inline':
        return 'flex items-center';
      case 'floating':
        return cn(
          'absolute z-50 shadow-lg rounded-lg',
          position === 'top' && 'bottom-full mb-2',
          position === 'bottom' && 'top-full mt-2',
          position === 'left' && 'right-full mr-2',
          position === 'right' && 'left-full ml-2'
        );
      case 'subtle':
        return 'border-0 bg-transparent';
      default:
        return 'rounded-lg border';
    }
  };

  // Don't render if no message and no children
  if (!message && !children) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-start',
        config.gap,
        config.padding,
        styles.bg,
        styles.border,
        getVariantClasses(),
        className
      )}
      {...props}
    >
      {/* Icon */}
      {showIcon && Icon && (
        <Icon
          size={config.icon}
          className={cn('flex-shrink-0 mt-0.5', styles.icon)}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {message && (
          <p className={cn(config.text, styles.text, 'font-medium')}>
            {message}
          </p>
        )}
        {children && (
          <div className={cn(config.text, styles.text)}>
            {children}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors',
            styles.text
          )}
          aria-label="Dismiss"
        >
          <X size={config.icon} />
        </button>
      )}
    </div>
  );
};

// Field-specific validation component
const FieldValidation = ({
  error,
  warning,
  success,
  info,
  className,
  ...props
}) => {
  // Determine the highest priority message
  let type, message;
  
  if (error) {
    type = 'error';
    message = error;
  } else if (warning) {
    type = 'warning';
    message = warning;
  } else if (success) {
    type = 'success';
    message = success;
  } else if (info) {
    type = 'info';
    message = info;
  } else {
    return null;
  }

  return (
    <ValidationFeedback
      type={type}
      message={message}
      size="sm"
      variant="inline"
      className={className}
      {...props}
    />
  );
};

// List of validation errors/warnings
const ValidationList = ({
  items = [],
  className,
  showNumbers = false,
  ...props
}) => {
  if (!items.length) return null;

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {items.map((item, index) => (
        <ValidationFeedback
          key={index}
          type={item.type || 'error'}
          message={showNumbers ? `${index + 1}. ${item.message}` : item.message}
          size="sm"
          variant="inline"
        />
      ))}
    </div>
  );
};

// Summary validation component for forms
const ValidationSummary = ({
  errors = [],
  warnings = [],
  className,
  title = 'Please fix the following issues:',
  collapsible = false,
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsible);
  
  const totalIssues = errors.length + warnings.length;
  
  if (totalIssues === 0) return null;

  const allItems = [
    ...errors.map(error => ({ type: 'error', message: error })),
    ...warnings.map(warning => ({ type: 'warning', message: warning }))
  ];

  return (
    <div className={cn('space-y-3', className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          {title}
        </h4>
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCollapsed ? `Show ${totalIssues} issues` : 'Hide'}
          </button>
        )}
      </div>

      {/* Issues list */}
      {!isCollapsed && (
        <ValidationList
          items={allItems}
          showNumbers
        />
      )}

      {/* Collapsed summary */}
      {isCollapsed && (
        <p className="text-sm text-muted-foreground">
          {errors.length > 0 && `${errors.length} error${errors.length > 1 ? 's' : ''}`}
          {errors.length > 0 && warnings.length > 0 && ', '}
          {warnings.length > 0 && `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  );
};

// Real-time validation status indicator
const ValidationStatus = ({
  isValidating = false,
  isValid = true,
  className,
  size = 'default',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (isValidating) {
    return (
      <div
        className={cn(
          'border-2 border-blue-500 border-t-transparent rounded-full animate-spin',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }

  if (isValid) {
    return (
      <CheckCircle
        className={cn('text-success', className)}
        size={size === 'sm' ? 12 : size === 'lg' ? 20 : 16}
        {...props}
      />
    );
  }

  return (
    <AlertCircle
      className={cn('text-destructive', className)}
      size={size === 'sm' ? 12 : size === 'lg' ? 20 : 16}
      {...props}
    />
  );
};

export default ValidationFeedback;
export { FieldValidation, ValidationList, ValidationSummary, ValidationStatus };