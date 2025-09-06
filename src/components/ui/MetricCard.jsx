import React from 'react';
import { cn } from '../../utils/cn';

const colorMap = {
  primary: { text: 'text-primary', bubble: 'bg-primary/10 text-primary' },
  success: { text: 'text-success', bubble: 'bg-success/10 text-success' },
  warning: { text: 'text-warning', bubble: 'bg-warning/10 text-warning' },
  destructive: { text: 'text-destructive', bubble: 'bg-destructive/10 text-destructive' },
  accent: { text: 'text-accent', bubble: 'bg-accent/10 text-accent' },
  neutral: { text: 'text-foreground', bubble: 'bg-muted text-foreground' }
};

const MetricCard = ({
  label,
  value,
  icon: Icon,
  color = 'primary',
  caption,
  captionColor = 'foreground-secondary',
  className
}) => {
  const c = colorMap[color] || colorMap.neutral;

  return (
    <div className={cn('bg-card border border-border rounded-xl shadow-elevation-1 p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground-secondary">{label}</p>
          <p className={cn('text-2xl font-bold', c.text)}>{value}</p>
          {caption && (
            <p className={cn('text-sm mt-1', typeof captionColor === 'string' ? `text-${captionColor}` : 'text-foreground-secondary')}>
              {caption}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', c.bubble)}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;

