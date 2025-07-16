import PropTypes from 'prop-types';
import React from 'react';

import { cn } from '../../utils/cn';

const Progress = React.forwardRef(({
  className,
  value = 0,
  max = 100,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      ref={ref}
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={ariaLabel || `Progress: ${percentage}%`}
      aria-labelledby={ariaLabelledBy}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
});
Progress.displayName = 'Progress';

Progress.propTypes = {
  className: PropTypes.string,
  value: PropTypes.number,
  max: PropTypes.number,
  'aria-label': PropTypes.string,
  'aria-labelledby': PropTypes.string
};

export { Progress };
