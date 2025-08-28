import { forwardRef } from 'react';

import { cn } from '../../utils/cn';

/**
 * Minimal alert component group with shadcn-like API used only in a few internal pages.
 * Allows import { Alert, AlertDescription } from "components/ui/Alert".
 */
const Alert = forwardRef(
  ({ className = 'relative w-full rounded-lg border p-4', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      {...props}
      className={cn('bg-card text-card-foreground', className)}
    />
  )
);
Alert.displayName = 'Alert';

const AlertDescription = forwardRef(
  ({ className = 'text-sm [&_p]:leading-relaxed', ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription };
export default Alert;
