import React, { useState, useEffect, useRef } from 'react';

import { cn } from '../../utils/cn';

/**
 * Mobile-First Layout Components
 * Optimized for touch interactions and mobile-first design patterns
 */

/**
 * Mobile Container with proper safe areas and touch targets
 */
export const MobileContainer = ({
  children,
  className = '',
  padding = 'default',
  safeArea = true,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-2',
    default: 'p-4',
    large: 'p-6'
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-background',
        safeArea && 'pb-safe-area-inset-bottom',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Mobile Card with touch-optimized interactions
 */
export const MobileCard = ({
  children,
  onClick,
  onLongPress,
  className = '',
  variant = 'default',
  interactive = false,
  pressed = false,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef(null);

  const handleTouchStart = () => {
    setIsPressed(true);
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
      }, 500);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = e => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    onClick?.(e);
  };

  const variants = {
    default: 'bg-card border border-border',
    elevated: 'bg-card border border-border shadow-lg',
    outlined: 'bg-transparent border-2 border-border',
    filled: 'bg-background-secondary border border-border-secondary'
  };

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-150',
        'min-h-[44px] min-w-[44px]', // iOS touch target minimum
        variants[variant],
        interactive && 'cursor-pointer active:scale-[0.98]',
        (pressed || isPressed) && 'scale-[0.98] shadow-inner',
        className
      )}
      onTouchStart={interactive ? handleTouchStart : undefined}
      onTouchEnd={interactive ? handleTouchEnd : undefined}
      onClick={interactive ? handleClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Mobile Action Sheet for bottom sheet interactions
 */
export const MobileActionSheet = ({
  isOpen,
  onClose,
  title,
  children,
  actions = [],
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Action Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl z-50',
          'transform transition-transform duration-300 ease-out',
          'max-h-[80vh] overflow-hidden',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-border rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-6 pb-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground text-center">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="border-t border-border p-4 space-y-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className={cn(
                  'w-full py-3 px-4 rounded-lg font-medium text-base',
                  'transition-colors duration-150',
                  'min-h-[44px]', // Touch target
                  action.destructive
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-background-secondary'
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

/**
 * Mobile Swipe Container for swipeable content
 */
export const MobileSwipeContainer = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
  ...props
}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = e => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = e => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
    if (isUpSwipe && onSwipeUp) onSwipeUp();
    if (isDownSwipe && onSwipeDown) onSwipeDown();
  };

  return (
    <div
      className={cn('touch-pan-y', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Mobile Tab Bar for bottom navigation
 */
export const MobileTabBar = ({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
  safeArea = true
}) => {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30',
        safeArea && 'pb-safe-area-inset-bottom',
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-lg',
                'transition-all duration-200 min-w-[60px] min-h-[60px]',
                'active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon && (
                <tab.icon
                  size={20}
                  className={cn('mb-1 transition-colors', isActive && 'text-primary')}
                />
              )}
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Mobile Pull to Refresh
 */
export const MobilePullToRefresh = ({
  children,
  onRefresh,
  refreshing = false,
  className = '',
  pullThreshold = 80,
  ...props
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef(null);

  const handleTouchStart = e => {
    if (refreshing) return;
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  const handleTouchMove = e => {
    if (!isPulling || refreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);

    if (containerRef.current?.scrollTop === 0 && distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, pullThreshold * 2));
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling || refreshing) return;

    if (pullDistance >= pullThreshold) {
      onRefresh?.();
    }

    setPullDistance(0);
    setIsPulling(false);
  };

  const progress = Math.min(pullDistance / pullThreshold, 1);
  const rotation = progress * 360;

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined
      }}
      {...props}
    >
      {/* Pull Indicator */}
      {pullDistance > 0 && (
        <div className="flex items-center justify-center py-4 bg-background-secondary">
          <div
            className="transition-transform duration-200"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <span className="ml-2 text-sm text-muted-foreground">
            {progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      )}

      {children}
    </div>
  );
};

/**
 * Mobile Responsive Grid
 */
export const MobileGrid = ({
  children,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'default',
  className = '',
  ...props
}) => {
  const gapClasses = {
    none: 'gap-0',
    small: 'gap-2',
    default: 'gap-4',
    large: 'gap-6'
  };

  const columnClasses = `grid-cols-${columns.default} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg}`;

  return (
    <div className={cn('grid', columnClasses, gapClasses[gap], className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Mobile Form Controls
 */
export const MobileInput = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className={cn('space-y-1', className)}>
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}

      <input
        className={cn(
          'w-full px-4 py-3 text-base rounded-lg border border-border',
          'bg-background text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'transition-colors duration-200',
          'min-h-[44px]', // iOS touch target
          error && 'border-destructive focus:ring-destructive'
        )}
        {...props}
      />

      {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export const MobileSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  ...props
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}

      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn(
            'w-full px-4 py-3 pr-10 text-base rounded-lg border border-border',
            'bg-background text-foreground appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-colors duration-200',
            'min-h-[44px]', // iOS touch target
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

/**
 * Mobile Loading States
 */
export const MobileSkeleton = ({ variant = 'default', className = '', ...props }) => {
  const variants = {
    default: 'h-4',
    card: 'h-20',
    avatar: 'w-12 h-12 rounded-full',
    button: 'h-11 w-24',
    input: 'h-11'
  };

  return (
    <div
      className={cn('bg-background-secondary rounded animate-pulse', variants[variant], className)}
      {...props}
    />
  );
};

export const MobileSkeletonCard = ({ className = '' }) => (
  <MobileCard className={className}>
    <div className="p-4 space-y-3">
      <MobileSkeleton variant="default" className="w-3/4" />
      <MobileSkeleton variant="default" className="w-1/2" />
      <div className="flex space-x-2">
        <MobileSkeleton variant="button" />
        <MobileSkeleton variant="button" />
      </div>
    </div>
  </MobileCard>
);

export default MobileContainer;
