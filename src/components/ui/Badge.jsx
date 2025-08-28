import { forwardRef } from 'react';

import { cn } from '../../utils/cn';

/**
 * Minimal Badge component used only for tests / non-critical UI.
 * Provides a semantic <span> element with utility classes similar to shadcn/ui.
 */
const Badge = forwardRef(
  (
    {
      className = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-foreground',
      variant = 'default', // 'default' | 'outline'
      children,
      ...props
    },
    ref
  ) => {
    const variantClass =
      variant === 'outline'
        ? 'border border-input bg-transparent'
        : 'bg-primary text-primary-foreground';

    return (
      <span ref={ref} className={cn(className, variantClass)} {...props}>
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
export default Badge;
