import React from 'react';

import { cn } from '../../utils/cn';

/**
 * Simple progress bar component.
 * Accepts `value` (0-100) and optional className.
 */
const Progress = React.forwardRef(({ value = 0, className = 'h-1 bg-muted', ...props }, ref) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div ref={ref} className={cn('w-full rounded bg-muted/50', className)} {...props}>
      <div
        className="h-full rounded bg-primary transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
});

Progress.displayName = 'Progress';

export { Progress };
export default Progress;
