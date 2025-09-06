import React, { forwardRef } from 'react';

import { cn } from '../../utils/cn';

/**
 * StatusBadge
 * A small, standardized status badge using design tokens.
 * Tones: success | warning | destructive | neutral
 * Variants: soft (default) | solid | outline
 * Sizes: xs | sm | md
 * Options: dot (boolean) to show a leading colored dot
 */
const toneClasses = {
  success: {
    soft: 'bg-success/10 text-success border border-success/30',
    solid: 'bg-success text-success-foreground border border-transparent',
    outline: 'text-success border border-success bg-transparent'
  },
  warning: {
    soft: 'bg-warning/10 text-warning border border-warning/30',
    solid: 'bg-warning text-warning-foreground border border-transparent',
    outline: 'text-warning border border-warning bg-transparent'
  },
  destructive: {
    soft: 'bg-destructive/10 text-destructive border border-destructive/30',
    solid: 'bg-destructive text-destructive-foreground border border-transparent',
    outline: 'text-destructive border border-destructive bg-transparent'
  },
  neutral: {
    soft: 'bg-muted text-muted-foreground border border-border',
    solid: 'bg-muted text-foreground border border-transparent',
    outline: 'text-foreground border border-border bg-transparent'
  }
};

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5'
};

const dotToneBg = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  neutral: 'bg-muted-foreground'
};

const StatusBadge = forwardRef(
  (
    {
      className,
      tone = 'neutral', // success | warning | destructive | neutral
      variant = 'soft', // soft | solid | outline
      size = 'sm', // xs | sm | md
      dot = true,
      children,
      label,
      ...props
    },
    ref
  ) => {
    const toneKey = tone in toneClasses ? tone : 'neutral';
    const variantKey = variant in toneClasses[toneKey] ? variant : 'soft';
    const sizeKey = size in sizeClasses ? size : 'sm';

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium leading-none',
          'transition-smooth select-none',
          sizeClasses[sizeKey],
          toneClasses[toneKey][variantKey],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full mr-1', dotToneBg[toneKey])}
            aria-hidden="true"
          />
        )}
        <span>{children ?? label}</span>
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };
export default StatusBadge;
