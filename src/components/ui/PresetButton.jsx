import React from 'react';
import { cn } from '../../utils/cn';

const PresetButton = ({
  children,
  onClick,
  active = false,
  size = 'sm',
  className,
  title,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-[11px]',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-md border transition-smooth capitalize',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted text-foreground-secondary hover:bg-muted/80 border-border',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default PresetButton;

