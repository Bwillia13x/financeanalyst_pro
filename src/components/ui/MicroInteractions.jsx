import React, { useState, useEffect } from 'react';

import { cn } from '../../utils/cn';

/**
 * Micro-interactions and animations for enhanced user experience
 * Provides subtle feedback and visual polish throughout the interface
 */

// ===== ANIMATED COMPONENTS =====

export const PulseDot = ({ active = false, color = 'blue', size = 'sm', className }) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div
      className={cn(
        'rounded-full transition-all duration-300',
        sizeClasses[size],
        colorClasses[color],
        active && 'animate-pulse',
        className
      )}
    />
  );
};

export const LoadingSpinner = ({ size = 'md', color = 'blue', className }) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-500',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], colorClasses[color], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const SuccessCheckmark = ({ size = 'md', className, delay = 0 }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div
      className={cn('flex items-center justify-center', sizeClasses[size], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <svg
        className="animate-checkmark"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20,6 9,17 4,12" />
      </svg>
    </div>
  );
};

// ===== INTERACTIVE COMPONENTS =====

export const HoverCard = ({
  children,
  className,
  scale = true,
  glow = false,
  lift = true,
  ...props
}) => (
  <div
    className={cn(
      'transition-all duration-300 ease-out',
      scale && 'hover:scale-[1.02]',
      lift && 'hover:-translate-y-1',
      glow && 'hover:shadow-lg hover:shadow-blue-500/25',
      'cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const RippleButton = ({
  children,
  onClick,
  className,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  ...props
}) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = event => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    onClick?.(event);
  };

  return (
    <button className={cn('relative overflow-hidden', className)} onClick={handleClick} {...props}>
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor
          }}
        />
      ))}
    </button>
  );
};

// ===== STATUS INDICATORS =====

export const StatusIndicator = ({ status = 'idle', size = 'sm', showLabel = false, className }) => {
  const statusConfig = {
    idle: { color: 'gray', pulse: false, label: 'Idle' },
    loading: { color: 'blue', pulse: true, label: 'Loading' },
    success: { color: 'green', pulse: false, label: 'Success' },
    error: { color: 'red', pulse: false, label: 'Error' },
    warning: { color: 'yellow', pulse: true, label: 'Warning' },
    active: { color: 'green', pulse: true, label: 'Active' }
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <PulseDot active={config.pulse} color={config.color} size={size} />
      {showLabel && (
        <span className="text-sm text-foreground-secondary capitalize">{config.label}</span>
      )}
    </div>
  );
};

// ===== PROGRESS COMPONENTS =====

export const ProgressRing = ({
  progress = 0,
  size = 60,
  strokeWidth = 4,
  color = 'blue',
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500'
  };

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn('transition-all duration-500 ease-out', colorClasses[color])}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium text-foreground">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

// ===== NOTIFICATION COMPONENTS =====

export const ToastNotification = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✓' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '✗' },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠'
    },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'ℹ' }
  };

  const config = typeConfig[type];

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg transition-all duration-300',
        config.bg,
        config.border,
        config.text,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
        className
      )}
    >
      <div className="flex items-center space-x-3">
        <span className="text-lg">{config.icon}</span>
        <span className="flex-1">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ===== ANIMATED NUMBERS =====

export const AnimatedNumber = ({
  value,
  duration = 1000,
  format = n => n.toLocaleString(),
  className
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOutCubic;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={className}>{format(Math.round(displayValue))}</span>;
};

// ===== SKELETON COMPONENTS =====

export const SkeletonText = ({ lines = 1, width = 'full', className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={cn(
          'h-4 bg-slate-200 rounded animate-pulse',
          width === 'full'
            ? 'w-full'
            : width === 'long'
              ? 'w-3/4'
              : width === 'medium'
                ? 'w-1/2'
                : 'w-1/4'
        )}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className }) => (
  <div className={cn('p-6 border border-slate-200 rounded-lg animate-pulse', className)}>
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-slate-200 rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
      </div>
    </div>
  </div>
);

// ===== EXPORT ALL COMPONENTS =====
export default LoadingSpinner;
