import React from 'react';
import { cn } from '../../utils/cn';
import Button from './Button';

/**
 * Comprehensive Empty State Component System
 * Provides contextual guidance and actions when no data is available
 */

// ===== EMPTY STATE ICONS =====
const EmptyStateIcons = {
  // Financial & Portfolio
  portfolio: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 3H8a2 2 0 00-2 2v2h8V5a2 2 0 00-2-2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12v4M10 14h4" />
    </svg>
  ),

  analysis: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 2H9a2 2 0 00-2 2v2h8V4a2 2 0 00-2-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 17v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 9H3" />
    </svg>
  ),

  search: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11h6M12 8v6" />
    </svg>
  ),

  chart: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 17v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 11V7a2 2 0 012-2h2a2 2 0 012 2v4"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 9H3" />
    </svg>
  ),

  // Error & Status
  error: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4M12 16h.01" />
    </svg>
  ),

  warning: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  ),

  network: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M14.828 14.828a4 4 0 01-5.656 0l-4-4a4 4 0 115.656-5.656l1.102 1.101m-.758 4.899a4 4 0 005.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1"
      />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),

  // Content & Features
  file: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),

  folder: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
      />
    </svg>
  ),

  message: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),

  // Generic
  default: ({ className }) => (
    <svg
      className={cn('w-24 h-24', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4M12 16h.01" />
    </svg>
  )
};

/**
 * Main Empty State Component
 */
export const EmptyState = ({
  variant = 'default',
  size = 'default',
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className = '',
  ...props
}) => {
  const IconComponent =
    EmptyStateIcons[icon] || EmptyStateIcons[variant] || EmptyStateIcons.default;

  const sizeClasses = {
    sm: 'max-w-sm',
    default: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 space-y-6',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div className="text-muted-foreground/50">
        <IconComponent />
      </div>

      {/* Content */}
      <div className="space-y-3">
        {title && <h3 className="text-xl font-semibold text-foreground">{title}</h3>}

        {description && (
          <p className="text-muted-foreground max-w-sm leading-relaxed">{description}</p>
        )}
      </div>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          {primaryAction && <Button {...primaryAction} className="flex-1" />}
          {secondaryAction && <Button variant="outline" {...secondaryAction} className="flex-1" />}
        </div>
      )}
    </div>
  );
};

/**
 * Specialized Empty State Components
 */
export const PortfolioEmptyState = ({ onAddAsset, onImportData, className = '', ...props }) => (
  <EmptyState
    variant="portfolio"
    icon="portfolio"
    title="No Assets Yet"
    description="Start building your portfolio by adding your first asset or importing existing data. Track performance, analyze trends, and make informed investment decisions."
    primaryAction={{
      label: 'Add First Asset',
      onClick: onAddAsset,
      iconName: 'plus'
    }}
    secondaryAction={{
      label: 'Import Data',
      onClick: onImportData,
      iconName: 'upload'
    }}
    className={className}
    {...props}
  />
);

export const AnalysisEmptyState = ({ onStartAnalysis, onUploadFile, className = '', ...props }) => (
  <EmptyState
    variant="analysis"
    icon="analysis"
    title="No Analysis Available"
    description="Upload financial data or run an analysis to get started. Our AI-powered tools will help you uncover insights and make data-driven decisions."
    primaryAction={{
      label: 'Start New Analysis',
      onClick: onStartAnalysis,
      iconName: 'play'
    }}
    secondaryAction={{
      label: 'Upload File',
      onClick: onUploadFile,
      iconName: 'file'
    }}
    className={className}
    {...props}
  />
);

export const SearchEmptyState = ({
  query,
  onClearFilters,
  onBrowseAll,
  className = '',
  ...props
}) => (
  <EmptyState
    variant="search"
    icon="search"
    title="No Results Found"
    description={`We couldn't find any results for "${query}". Try adjusting your search terms or clearing filters to see more results.`}
    primaryAction={{
      label: 'Clear Filters',
      onClick: onClearFilters,
      iconName: 'x'
    }}
    secondaryAction={{
      label: 'Browse All',
      onClick: onBrowseAll,
      iconName: 'grid'
    }}
    className={className}
    {...props}
  />
);

export const ChartEmptyState = ({ onCreateChart, onImportData, className = '', ...props }) => (
  <EmptyState
    variant="chart"
    icon="chart"
    title="No Charts to Display"
    description="Create your first chart to visualize your financial data. Choose from various chart types including line, bar, pie, and candlestick charts."
    primaryAction={{
      label: 'Create Chart',
      onClick: onCreateChart,
      iconName: 'bar-chart'
    }}
    secondaryAction={{
      label: 'Import Data',
      onClick: onImportData,
      iconName: 'database'
    }}
    className={className}
    {...props}
  />
);

export const ErrorEmptyState = ({ error, onRetry, onContactSupport, className = '', ...props }) => (
  <EmptyState
    variant="error"
    icon="error"
    title="Something Went Wrong"
    description={`We're experiencing an issue: ${error || 'Unknown error occurred'}. Please try again or contact support if the problem persists.`}
    primaryAction={{
      label: 'Try Again',
      onClick: onRetry,
      iconName: 'refresh'
    }}
    secondaryAction={{
      label: 'Contact Support',
      onClick: onContactSupport,
      iconName: 'help-circle'
    }}
    className={className}
    {...props}
  />
);

export const NetworkEmptyState = ({ onRetry, onOfflineMode, className = '', ...props }) => (
  <EmptyState
    variant="network"
    icon="network"
    title="Connection Lost"
    description="Unable to connect to our servers. Check your internet connection and try again, or continue working offline with cached data."
    primaryAction={{
      label: 'Retry Connection',
      onClick: onRetry,
      iconName: 'refresh'
    }}
    secondaryAction={{
      label: 'Work Offline',
      onClick: onOfflineMode,
      iconName: 'wifi-off'
    }}
    className={className}
    {...props}
  />
);

export const FileEmptyState = ({ onUploadFile, onCreateNew, className = '', ...props }) => (
  <EmptyState
    variant="file"
    icon="file"
    title="No Files Found"
    description="Upload files to get started with your analysis. Supported formats include CSV, Excel, PDF, and more."
    primaryAction={{
      label: 'Upload File',
      onClick: onUploadFile,
      iconName: 'upload'
    }}
    secondaryAction={{
      label: 'Create New',
      onClick: onCreateNew,
      iconName: 'plus'
    }}
    className={className}
    {...props}
  />
);

export const FolderEmptyState = ({ onCreateFolder, onBrowseFiles, className = '', ...props }) => (
  <EmptyState
    variant="folder"
    icon="folder"
    title="Folder is Empty"
    description="This folder doesn't contain any files yet. Create subfolders to organize your work or browse existing files."
    primaryAction={{
      label: 'Create Folder',
      onClick: onCreateFolder,
      iconName: 'folder-plus'
    }}
    secondaryAction={{
      label: 'Browse Files',
      onClick: onBrowseFiles,
      iconName: 'folder'
    }}
    className={className}
    {...props}
  />
);

export const MessageEmptyState = ({
  onStartConversation,
  onViewHistory,
  className = '',
  ...props
}) => (
  <EmptyState
    variant="message"
    icon="message"
    title="No Messages Yet"
    description="Start a conversation with our AI assistant to get help with financial analysis, investment advice, or answer any questions."
    primaryAction={{
      label: 'Start Conversation',
      onClick: onStartConversation,
      iconName: 'message-circle'
    }}
    secondaryAction={{
      label: 'View History',
      onClick: onViewHistory,
      iconName: 'clock'
    }}
    className={className}
    {...props}
  />
);

/**
 * Compact Empty State for Inline Use
 */
export const CompactEmptyState = ({
  icon = 'default',
  message,
  action,
  className = '',
  ...props
}) => {
  const IconComponent = EmptyStateIcons[icon] || EmptyStateIcons.default;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 space-y-4',
        className
      )}
      {...props}
    >
      <div className="text-muted-foreground/30">
        <IconComponent className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{message}</p>
        {action && <Button variant="ghost" size="sm" {...action} />}
      </div>
    </div>
  );
};

/**
 * Empty State with Illustration
 */
export const IllustratedEmptyState = ({
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
  ...props
}) => (
  <div
    className={cn('flex flex-col items-center justify-center text-center p-8 space-y-6', className)}
    {...props}
  >
    {/* Illustration */}
    <div className="w-64 h-48 flex items-center justify-center">{illustration}</div>

    {/* Content */}
    <div className="space-y-3 max-w-md">
      {title && <h3 className="text-xl font-semibold text-foreground">{title}</h3>}

      {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}
    </div>

    {/* Actions */}
    {(primaryAction || secondaryAction) && (
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        {primaryAction && <Button {...primaryAction} className="flex-1" />}
        {secondaryAction && <Button variant="outline" {...secondaryAction} className="flex-1" />}
      </div>
    )}
  </div>
);

export default EmptyState;
