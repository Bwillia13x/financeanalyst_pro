import React from 'react';
import { cn } from '../../utils/cn';

const TabNav = ({ items = [], activeId, onChange, className }) => {
  return (
    <nav className={cn('flex items-center gap-2 flex-wrap', className)} aria-label="Tabs">
      {items.map(item => {
        const Icon = item.icon;
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange?.(item.id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-smooth',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-foreground-secondary hover:bg-muted/80 border-border'
            )}
            aria-current={active ? 'page' : undefined}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default TabNav;

