import {
  TrendingUp,
  BarChart3,
  PieChart,
  FileText,
  Folder,
  MessageSquare,
  AlertCircle,
  Wifi,
  Search,
  RefreshCw,
  Plus,
  Upload,
  Play,
  Database,
  Grid,
  X,
  HelpCircle,
  FolderPlus,
  Clock,
  MessageCircle
} from 'lucide-react';
import React, { useState } from 'react';

import Button from '../components/ui/Button';
import {
  EmptyState,
  PortfolioEmptyState,
  AnalysisEmptyState,
  SearchEmptyState,
  ChartEmptyState,
  ErrorEmptyState,
  NetworkEmptyState,
  FileEmptyState,
  FolderEmptyState,
  MessageEmptyState,
  CompactEmptyState,
  IllustratedEmptyState,
  EmptyStateIcons
} from '../components/ui/EmptyState';
import Header from '../components/ui/Header';

// Empty State Components

// UI Components

// Icons

// Sample Illustrations
const PortfolioIllustration = () => (
  <svg
    className="w-full h-full"
    viewBox="0 0 200 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="40"
      y="60"
      width="120"
      height="60"
      rx="8"
      fill="currentColor"
      opacity="0.1"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect x="50" y="70" width="30" height="4" rx="2" fill="currentColor" opacity="0.6" />
    <rect x="50" y="80" width="20" height="4" rx="2" fill="currentColor" opacity="0.4" />
    <rect x="120" y="70" width="30" height="20" rx="4" fill="currentColor" opacity="0.8" />
    <circle cx="135" cy="80" r="3" fill="currentColor" />
    <path d="M130 85 L135 90 L140 85" stroke="currentColor" strokeWidth="2" fill="none" />
    <rect x="50" y="90" width="80" height="20" rx="4" fill="currentColor" opacity="0.2" />
    <text x="90" y="102" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.6">
      No Assets
    </text>
  </svg>
);

const EmptyStatesDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('AAPL');
  const [showError, setShowError] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'content', label: 'Content', icon: '📁' },
    { id: 'status', label: 'Status', icon: '⚠️' },
    { id: 'compact', label: 'Compact', icon: '🔍' },
    { id: 'custom', label: 'Custom', icon: '🎨' }
  ];

  // Mock handlers
  const mockHandlers = {
    onAddAsset: () => alert('Add Asset clicked'),
    onImportData: () => alert('Import Data clicked'),
    onStartAnalysis: () => alert('Start Analysis clicked'),
    onUploadFile: () => alert('Upload File clicked'),
    onClearFilters: () => {
      setSearchQuery('');
      alert('Filters cleared');
    },
    onBrowseAll: () => alert('Browse All clicked'),
    onCreateChart: () => alert('Create Chart clicked'),
    onRetry: () => {
      setShowError(false);
      setShowNetworkError(false);
      alert('Retrying...');
    },
    onContactSupport: () => alert('Contact Support clicked'),
    onOfflineMode: () => alert('Offline Mode clicked'),
    onCreateNew: () => alert('Create New clicked'),
    onCreateFolder: () => alert('Create Folder clicked'),
    onBrowseFiles: () => alert('Browse Files clicked'),
    onStartConversation: () => alert('Start Conversation clicked'),
    onViewHistory: () => alert('View History clicked')
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16 p-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Empty States Showcase</h1>
          <p className="text-foreground-secondary">
            Comprehensive empty state components with contextual guidance and actionable CTAs.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-background-secondary p-1 rounded-lg overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background/50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Empty State Design System
                </h2>
                <p className="text-foreground-secondary max-w-2xl mx-auto">
                  Our empty states provide clear guidance, actionable next steps, and maintain
                  visual consistency across the platform when no data is available.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Contextual Guidance</h3>
                      <p className="text-sm text-foreground-secondary">
                        Clear messaging for user understanding
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Each empty state provides specific context about what's missing and why, helping
                    users understand the current state of their data.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <Plus className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Actionable CTAs</h3>
                      <p className="text-sm text-foreground-secondary">
                        Clear next steps for users
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Every empty state includes relevant actions that help users move forward,
                    whether it's adding data, starting a process, or seeking help.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Visual Consistency</h3>
                      <p className="text-sm text-foreground-secondary">Unified design language</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Consistent iconography, spacing, and styling across all empty states maintains a
                    cohesive user experience throughout the platform.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Adaptive Design</h3>
                      <p className="text-sm text-foreground-secondary">Responsive across devices</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Empty states adapt to different screen sizes and contexts, providing optimal
                    user experience on all devices.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg p-8">
                <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                  Empty State Benefits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="font-semibold text-foreground mb-1">Clear Guidance</div>
                    <div className="text-sm text-foreground-secondary">
                      Users know what to do next
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="font-semibold text-foreground mb-1">Faster Onboarding</div>
                    <div className="text-sm text-foreground-secondary">Reduce user confusion</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">📱</div>
                    <div className="font-semibold text-foreground mb-1">Better UX</div>
                    <div className="text-sm text-foreground-secondary">Professional appearance</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">🔄</div>
                    <div className="font-semibold text-foreground mb-1">Higher Conversion</div>
                    <div className="text-sm text-foreground-secondary">Guide users to action</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Financial Empty States</h2>
                <p className="text-foreground-secondary">
                  Specialized empty states for financial analysis and portfolio management.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Portfolio Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Portfolio Management</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <PortfolioEmptyState
                      onAddAsset={mockHandlers.onAddAsset}
                      onImportData={mockHandlers.onImportData}
                    />
                  </div>
                </div>

                {/* Analysis Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Financial Analysis</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <AnalysisEmptyState
                      onStartAnalysis={mockHandlers.onStartAnalysis}
                      onUploadFile={mockHandlers.onUploadFile}
                    />
                  </div>
                </div>

                {/* Chart Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Data Visualization</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <ChartEmptyState
                      onCreateChart={mockHandlers.onCreateChart}
                      onImportData={mockHandlers.onImportData}
                    />
                  </div>
                </div>

                {/* Search Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Search Results</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <SearchEmptyState
                      query={searchQuery}
                      onClearFilters={mockHandlers.onClearFilters}
                      onBrowseAll={mockHandlers.onBrowseAll}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Content Empty States</h2>
                <p className="text-foreground-secondary">
                  Empty states for files, folders, and messaging scenarios.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* File Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">File Management</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <FileEmptyState
                      onUploadFile={mockHandlers.onUploadFile}
                      onCreateNew={mockHandlers.onCreateNew}
                    />
                  </div>
                </div>

                {/* Folder Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Folder Organization</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <FolderEmptyState
                      onCreateFolder={mockHandlers.onCreateFolder}
                      onBrowseFiles={mockHandlers.onBrowseFiles}
                    />
                  </div>
                </div>

                {/* Message Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">AI Assistant</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <MessageEmptyState
                      onStartConversation={mockHandlers.onStartConversation}
                      onViewHistory={mockHandlers.onViewHistory}
                    />
                  </div>
                </div>

                {/* Custom Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Custom Scenario</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <EmptyState
                      icon="default"
                      title="Custom Empty State"
                      description="This is a custom empty state that can be adapted for any specific use case with custom messaging and actions."
                      primaryAction={{
                        label: 'Custom Action',
                        onClick: () => alert('Custom action clicked'),
                        iconName: 'settings'
                      }}
                      secondaryAction={{
                        label: 'Learn More',
                        onClick: () => alert('Learn more clicked'),
                        iconName: 'help-circle'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Status Empty States</h2>
                <p className="text-foreground-secondary">
                  Error states and status messages with appropriate guidance.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Error State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Error Handling</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    {showError ? (
                      <ErrorEmptyState
                        error="Failed to load data"
                        onRetry={mockHandlers.onRetry}
                        onContactSupport={mockHandlers.onContactSupport}
                      />
                    ) : (
                      <div className="text-center">
                        <Button variant="outline" onClick={() => setShowError(true)}>
                          Show Error State
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Network Error State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Network Issues</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    {showNetworkError ? (
                      <NetworkEmptyState
                        onRetry={mockHandlers.onRetry}
                        onOfflineMode={mockHandlers.onOfflineMode}
                      />
                    ) : (
                      <div className="text-center">
                        <Button variant="outline" onClick={() => setShowNetworkError(true)}>
                          Show Network Error
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Warning State</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <EmptyState
                      variant="warning"
                      icon="warning"
                      title="Data Validation Warning"
                      description="Some of your data may be incomplete or outdated. Please review and update the information before proceeding with analysis."
                      primaryAction={{
                        label: 'Review Data',
                        onClick: () => alert('Review data clicked'),
                        iconName: 'alert-triangle'
                      }}
                      secondaryAction={{
                        label: 'Skip for Now',
                        onClick: () => alert('Skip clicked'),
                        iconName: 'skip-forward'
                      }}
                    />
                  </div>
                </div>

                {/* Success State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Success State</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <EmptyState
                      variant="success"
                      icon="default"
                      title="Analysis Complete"
                      description="Your financial analysis has been completed successfully. All data has been processed and is ready for review."
                      primaryAction={{
                        label: 'View Results',
                        onClick: () => alert('View results clicked'),
                        iconName: 'eye'
                      }}
                      secondaryAction={{
                        label: 'Download Report',
                        onClick: () => alert('Download clicked'),
                        iconName: 'download'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowError(false);
                    setShowNetworkError(false);
                  }}
                >
                  Reset All States
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'compact' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Compact Empty States</h2>
                <p className="text-foreground-secondary">
                  Smaller empty states for inline use in cards, tables, and smaller UI elements.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Compact Portfolio */}
                <div className="p-4 bg-card border border-border rounded-lg">
                  <CompactEmptyState
                    icon="portfolio"
                    message="No portfolio items"
                    action={{
                      label: 'Add Asset',
                      onClick: mockHandlers.onAddAsset,
                      iconName: 'plus'
                    }}
                  />
                </div>

                {/* Compact Search */}
                <div className="p-4 bg-card border border-border rounded-lg">
                  <CompactEmptyState
                    icon="search"
                    message="No search results found"
                    action={{
                      label: 'Clear Search',
                      onClick: mockHandlers.onClearFilters,
                      iconName: 'x'
                    }}
                  />
                </div>

                {/* Compact Chart */}
                <div className="p-4 bg-card border border-border rounded-lg">
                  <CompactEmptyState
                    icon="chart"
                    message="No data to visualize"
                    action={{
                      label: 'Create Chart',
                      onClick: mockHandlers.onCreateChart,
                      iconName: 'bar-chart'
                    }}
                  />
                </div>

                {/* Compact Files */}
                <div className="p-4 bg-card border border-border rounded-lg">
                  <CompactEmptyState
                    icon="file"
                    message="No files uploaded"
                    action={{
                      label: 'Upload',
                      onClick: mockHandlers.onUploadFile,
                      iconName: 'upload'
                    }}
                  />
                </div>

                {/* Compact Messages */}
                <div className="p-4 bg-card border border-border rounded-lg">
                  <CompactEmptyState
                    icon="message"
                    message="No conversations yet"
                    action={{
                      label: 'Start Chat',
                      onClick: mockHandlers.onStartConversation,
                      iconName: 'message-circle'
                    }}
                  />
                </div>

                {/* Compact Default */}
                <div className="p-4 bg-card border border-border rounded-lg">
                  <CompactEmptyState
                    message="Nothing to show here"
                    action={{
                      label: 'Learn More',
                      onClick: () => alert('Learn more clicked'),
                      iconName: 'help-circle'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Custom Empty States</h2>
                <p className="text-foreground-secondary">
                  Advanced empty states with custom illustrations and specialized layouts.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Illustrated Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Illustrated Empty State</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <IllustratedEmptyState
                      illustration={<PortfolioIllustration />}
                      title="Build Your Investment Portfolio"
                      description="Start your journey to financial success by adding your first investment. Track performance, analyze trends, and make informed decisions with our comprehensive portfolio management tools."
                      primaryAction={{
                        label: 'Get Started',
                        onClick: mockHandlers.onAddAsset,
                        iconName: 'rocket'
                      }}
                      secondaryAction={{
                        label: 'Learn More',
                        onClick: () => alert('Learn more clicked'),
                        iconName: 'book-open'
                      }}
                    />
                  </div>
                </div>

                {/* Large Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Large Empty State</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <EmptyState
                      size="xl"
                      icon="analysis"
                      title="Advanced Financial Analysis Platform"
                      description="Welcome to the most comprehensive financial analysis platform available. Our AI-powered tools provide deep insights into market trends, portfolio performance, and investment opportunities. Get started by uploading your financial data or connecting your brokerage accounts."
                      primaryAction={{
                        label: 'Start Free Trial',
                        onClick: () => alert('Start trial clicked'),
                        iconName: 'star'
                      }}
                      secondaryAction={{
                        label: 'Watch Demo',
                        onClick: () => alert('Watch demo clicked'),
                        iconName: 'play-circle'
                      }}
                    />
                  </div>
                </div>

                {/* Small Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Small Empty State</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <EmptyState
                      size="sm"
                      icon="chart"
                      title="No Charts"
                      description="Create your first chart to visualize data trends."
                      primaryAction={{
                        label: 'Add Chart',
                        onClick: mockHandlers.onCreateChart,
                        iconName: 'plus'
                      }}
                    />
                  </div>
                </div>

                {/* Minimal Empty State */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Minimal Empty State</h3>
                  <div className="p-8 bg-card border border-border rounded-lg">
                    <EmptyState
                      icon="default"
                      title="Nothing Here"
                      primaryAction={{
                        label: 'Continue',
                        onClick: () => alert('Continue clicked'),
                        iconName: 'arrow-right'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Icon Gallery */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Available Icons</h3>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-6 bg-card border border-border rounded-lg">
                  {Object.keys(EmptyStateIcons).map(iconName => {
                    const IconComponent = EmptyStateIcons[iconName];
                    return (
                      <div
                        key={iconName}
                        className="flex flex-col items-center gap-2 p-3 bg-background-secondary rounded-lg"
                      >
                        <IconComponent className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs text-foreground-secondary text-center">
                          {iconName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyStatesDemo;
