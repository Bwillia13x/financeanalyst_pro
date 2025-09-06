import React from 'react';
import { cn } from '../../utils/cn';

const Toolbar = ({ children, className }) => (
  <div className={cn('w-full flex items-center justify-between gap-4', className)}>{children}</div>
);

const ToolbarLeft = ({ children, className }) => (
  <div className={cn('flex items-center gap-3', className)}>{children}</div>
);

const ToolbarRight = ({ children, className }) => (
  <div className={cn('flex items-center gap-3', className)}>{children}</div>
);

export { Toolbar as default, ToolbarLeft, ToolbarRight };

