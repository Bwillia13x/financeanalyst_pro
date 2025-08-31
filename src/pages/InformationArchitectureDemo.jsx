import React, { useState } from 'react';
import Header from '../components/ui/Header';

// Breadcrumb Components
import {
  Breadcrumb,
  BreadcrumbCompact,
  BreadcrumbWithSearch,
  BreadcrumbWithActions,
  NavigationProvider,
  useBreadcrumbs,
  pageIcons,
  breadcrumbLabels
} from '../components/ui/Breadcrumb';

// Search and Discovery Components
import {
  SearchComponent,
  SearchCommandPalette,
  DiscoveryPanel,
  NavigationHierarchy
} from '../components/ui/SearchAndDiscovery';

// UI Components
import Button from '../components/ui/Button';

// Icons
import {
  Home,
  Search,
  Filter,
  Users,
  Settings,
  BarChart3,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Star,
  Command,
  Keyboard,
  Navigation,
  MapPin,
  Target,
  Zap,
  BookOpen,
  HelpCircle,
  ChevronDown,
  Plus,
  Download,
  Share,
  Edit
} from 'lucide-react';

// Sample data for demonstrations
const breadcrumbExamples = [
  {
    id: 'simple',
    title: 'Simple Breadcrumb',
    items: [
      { path: '/', label: 'Home' },
      { path: '/portfolio', label: 'Portfolio' },
      { path: '/portfolio/analysis', label: 'Analysis' }
    ]
  },
  {
    id: 'with-icons',
    title: 'With Icons',
    items: [
      { path: '/', label: 'Home', icon: 'dashboard' },
      { path: '/portfolio', label: 'Portfolio', icon: 'folder' },
      { path: '/portfolio/analysis', label: 'Analysis', icon: 'bar-chart' },
      { path: '/portfolio/analysis/performance', label: 'Performance', icon: 'trending-up' }
    ]
  },
  {
    id: 'long-path',
    title: 'Long Navigation Path',
    items: [
      { path: '/', label: 'Home', icon: 'dashboard' },
      { path: '/portfolio', label: 'Portfolio', icon: 'folder' },
      { path: '/portfolio/analysis', label: 'Analysis', icon: 'bar-chart' },
      { path: '/portfolio/analysis/scenario', label: 'Scenario Analysis', icon: 'calculator' },
      {
        path: '/portfolio/analysis/scenario/sensitivity',
        label: 'Sensitivity Tools',
        icon: 'settings'
      },
      {
        path: '/portfolio/analysis/scenario/sensitivity/monte-carlo',
        label: 'Monte Carlo Simulation',
        icon: 'trending-up'
      }
    ]
  }
];

const recentItems = [
  { id: '1', title: 'Q4 Portfolio Review', lastAccessed: '2 hours ago', type: 'report' },
  { id: '2', title: 'Risk Assessment Model', lastAccessed: '1 day ago', type: 'model' },
  { id: '3', title: 'Market Analysis Dashboard', lastAccessed: '3 days ago', type: 'dashboard' },
  { id: '4', title: 'Client Investment Strategy', lastAccessed: '1 week ago', type: 'strategy' }
];

const trendingItems = [
  {
    id: '1',
    title: 'AI-Powered Insights',
    description: 'Get intelligent recommendations for your portfolio',
    category: 'Featured'
  },
  {
    id: '2',
    title: 'Real-time Alerts',
    description: 'Instant notifications for market movements',
    category: 'Popular'
  },
  {
    id: '3',
    title: 'Advanced Analytics',
    description: 'Deep dive into performance metrics',
    category: 'Trending'
  },
  {
    id: '4',
    title: 'Risk Management Tools',
    description: 'Comprehensive risk assessment framework',
    category: 'Essential'
  }
];

const suggestedActions = [
  {
    id: '1',
    title: 'Create New Portfolio',
    description: 'Set up a new investment portfolio from scratch',
    action: 'create-portfolio'
  },
  {
    id: '2',
    title: 'Import Market Data',
    description: 'Upload CSV files with market data',
    action: 'import-data'
  },
  {
    id: '3',
    title: 'Generate Report',
    description: 'Create a comprehensive financial report',
    action: 'generate-report'
  },
  {
    id: '4',
    title: 'Schedule Analysis',
    description: 'Set up automated analysis schedules',
    action: 'schedule-analysis'
  }
];

const navigationHierarchy = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Overview and key metrics',
    level: 1
  },
  {
    id: 'portfolio',
    title: 'Portfolio Management',
    description: 'Investment portfolio tools',
    level: 2
  },
  {
    id: 'analysis',
    title: 'Financial Analysis',
    description: 'Valuation and modeling tools',
    level: 3
  },
  {
    id: 'valuation',
    title: 'Valuation Workbench',
    description: 'Advanced valuation techniques',
    level: 4
  },
  {
    id: 'scenario',
    title: 'Scenario Analysis',
    description: 'Sensitivity and scenario tools',
    level: 5
  }
];

const pageActions = [
  { label: 'Edit', icon: Edit, action: 'edit' },
  { label: 'Share', icon: Share, action: 'share' },
  { label: 'Download', icon: Download, action: 'download' },
  { label: 'Settings', icon: Settings, action: 'settings' }
];

const InformationArchitectureDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'breadcrumbs', label: 'Breadcrumbs', icon: '🧭' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'discovery', label: 'Discovery', icon: '💡' },
    { id: 'hierarchy', label: 'Hierarchy', icon: '📊' },
    { id: 'integration', label: 'Integration', icon: '🔗' }
  ];

  const handleSearch = query => {
    setSearchQuery(query);
  };

  const handleCommandPalette = () => {
    setIsCommandPaletteOpen(true);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleCommandPalette();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <NavigationProvider>
      <div className="min-h-screen bg-background">
        <Header />

        {/* Command Palette */}
        <SearchCommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSearch={handleSearch}
          onResultSelect={result => {
            console.log('Selected result:', result);
          }}
        />

        <div className="pt-16 p-4 max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Information Architecture
                </h1>
                <p className="text-foreground-secondary">
                  Comprehensive navigation, search, and discovery system for seamless user
                  experience.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCommandPalette}
                  iconComponent={Command}
                >
                  Command Palette
                </Button>
                <div className="hidden md:flex items-center gap-2 text-sm text-foreground-secondary">
                  <Keyboard className="w-4 h-4" />
                  <kbd className="px-2 py-1 bg-background-secondary rounded text-xs">⌘K</kbd>
                </div>
              </div>
            </div>
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
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Seamless Information Architecture
                  </h2>
                  <p className="text-foreground-secondary max-w-2xl mx-auto">
                    Our information architecture provides clear navigation paths, intelligent
                    search, and contextual discovery to help users find what they need quickly and
                    efficiently.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-6 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Navigation className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Clear Navigation</h3>
                        <p className="text-sm text-foreground-secondary">
                          Intuitive breadcrumb trails
                        </p>
                      </div>
                    </div>
                    <p className="text-foreground-secondary">
                      Breadcrumbs provide clear context about the user's current location and enable
                      easy navigation back to parent pages.
                    </p>
                  </div>

                  <div className="p-6 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                        <Search className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Intelligent Search
                        </h3>
                        <p className="text-sm text-foreground-secondary">Find anything instantly</p>
                      </div>
                    </div>
                    <p className="text-foreground-secondary">
                      Powerful search functionality with filtering, keyboard shortcuts, and smart
                      result ranking for rapid content discovery.
                    </p>
                  </div>

                  <div className="p-6 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-info" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Contextual Discovery
                        </h3>
                        <p className="text-sm text-foreground-secondary">Smart recommendations</p>
                      </div>
                    </div>
                    <p className="text-foreground-secondary">
                      Discovery panels show recently accessed items, trending features, and
                      suggested actions based on user behavior and context.
                    </p>
                  </div>

                  <div className="p-6 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Navigation Hierarchy
                        </h3>
                        <p className="text-sm text-foreground-secondary">
                          Clear information structure
                        </p>
                      </div>
                    </div>
                    <p className="text-foreground-secondary">
                      Visual hierarchy shows the current page's position in the information
                      architecture and provides navigation to related sections.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg p-8">
                  <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                    Information Architecture Benefits
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="font-semibold text-foreground mb-1">
                        Reduced Cognitive Load
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        Clear navigation paths
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl mb-2">⚡</div>
                      <div className="font-semibold text-foreground mb-1">
                        Faster Task Completion
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        Quick content discovery
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl mb-2">😊</div>
                      <div className="font-semibold text-foreground mb-1">
                        Improved Satisfaction
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        Intuitive user experience
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl mb-2">📈</div>
                      <div className="font-semibold text-foreground mb-1">Higher Engagement</div>
                      <div className="text-sm text-foreground-secondary">
                        Better feature discovery
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'breadcrumbs' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-4">Breadcrumb Navigation</h2>
                  <p className="text-foreground-secondary">
                    Clear navigation trails that show users their current location and provide easy
                    navigation.
                  </p>
                </div>

                {/* Desktop Breadcrumb Examples */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">Desktop Breadcrumbs</h3>
                  {breadcrumbExamples.map(example => (
                    <div key={example.id} className="bg-card border border-border rounded-lg p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <h4 className="font-medium text-foreground">{example.title}</h4>
                        <div className="text-xs text-foreground-secondary bg-background-secondary px-2 py-1 rounded">
                          {example.items.length} levels
                        </div>
                      </div>
                      <div className="bg-background-secondary p-4 rounded-lg">
                        <Breadcrumb items={example.items} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Breadcrumb with Search */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Breadcrumb with Search
                  </h3>
                  <BreadcrumbWithSearch
                    items={breadcrumbExamples[1].items}
                    searchPlaceholder="Search within this section..."
                    onSearch={handleSearch}
                  />
                </div>

                {/* Breadcrumb with Actions */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Breadcrumb with Actions
                  </h3>
                  <BreadcrumbWithActions
                    items={breadcrumbExamples[1].items}
                    actions={pageActions.map(action => ({
                      label: action.label,
                      icon: action.icon,
                      onClick: () => console.log(`Action: ${action.action}`)
                    }))}
                  />
                </div>

                {/* Mobile Breadcrumb */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Mobile Breadcrumbs</h3>
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <BreadcrumbCompact
                      items={breadcrumbExamples[2].items}
                      currentLabel="Monte Carlo Simulation"
                      onBack={() => console.log('Navigate back')}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-4">Intelligent Search</h2>
                  <p className="text-foreground-secondary">
                    Powerful search functionality with filtering, keyboard navigation, and smart
                    results.
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Search Component */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Search Component</h3>
                    <div className="bg-card border border-border rounded-lg p-6">
                      <SearchComponent
                        placeholder="Search for pages, features, or actions..."
                        onSearch={handleSearch}
                        onResultSelect={result => console.log('Selected:', result)}
                        showFilters={true}
                      />
                    </div>
                  </div>

                  {/* Search Tips */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Search Features</h3>
                    <div className="space-y-4">
                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Keyboard className="w-5 h-5 text-primary" />
                          <div className="font-medium text-foreground">Keyboard Navigation</div>
                        </div>
                        <ul className="text-sm text-foreground-secondary space-y-1">
                          <li>
                            •{' '}
                            <kbd className="px-1 py-0.5 bg-background-secondary rounded text-xs">
                              ↑↓
                            </kbd>{' '}
                            Navigate results
                          </li>
                          <li>
                            •{' '}
                            <kbd className="px-1 py-0.5 bg-background-secondary rounded text-xs">
                              Enter
                            </kbd>{' '}
                            Select result
                          </li>
                          <li>
                            •{' '}
                            <kbd className="px-1 py-0.5 bg-background-secondary rounded text-xs">
                              Esc
                            </kbd>{' '}
                            Close search
                          </li>
                        </ul>
                      </div>

                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Filter className="w-5 h-5 text-success" />
                          <div className="font-medium text-foreground">Smart Filtering</div>
                        </div>
                        <ul className="text-sm text-foreground-secondary space-y-1">
                          <li>• Filter by content type</li>
                          <li>• Recent items prioritized</li>
                          <li>• Fuzzy matching</li>
                        </ul>
                      </div>

                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Zap className="w-5 h-5 text-warning" />
                          <div className="font-medium text-foreground">Quick Actions</div>
                        </div>
                        <ul className="text-sm text-foreground-secondary space-y-1">
                          <li>• Create new items</li>
                          <li>• Import data</li>
                          <li>• Access settings</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Command Palette Demo */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Command Palette</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCommandPalette}
                      iconComponent={Command}
                    >
                      Open Command Palette
                    </Button>
                  </div>
                  <p className="text-foreground-secondary mb-4">
                    Access everything with keyboard shortcuts. Press{' '}
                    <kbd className="px-2 py-1 bg-background-secondary rounded text-xs">⌘K</kbd> to
                    open.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 bg-background-secondary rounded-lg text-center">
                      <div className="text-sm font-medium text-foreground mb-1">Search</div>
                      <div className="text-xs text-foreground-secondary">Find any feature</div>
                    </div>
                    <div className="p-3 bg-background-secondary rounded-lg text-center">
                      <div className="text-sm font-medium text-foreground mb-1">Navigate</div>
                      <div className="text-xs text-foreground-secondary">Jump to sections</div>
                    </div>
                    <div className="p-3 bg-background-secondary rounded-lg text-center">
                      <div className="text-sm font-medium text-foreground mb-1">Actions</div>
                      <div className="text-xs text-foreground-secondary">Execute commands</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'discovery' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-4">Contextual Discovery</h2>
                  <p className="text-foreground-secondary">
                    Smart recommendations and recently accessed items to help users discover
                    relevant content.
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <DiscoveryPanel
                    recentItems={recentItems}
                    trendingItems={trendingItems}
                    suggestedActions={suggestedActions}
                    onItemClick={item => console.log('Clicked item:', item)}
                  />

                  <div className="space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Discovery Features
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <div className="font-medium text-foreground">Recently Accessed</div>
                            <div className="text-sm text-foreground-secondary">
                              Quick access to frequently used items
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-5 h-5 text-success mt-0.5" />
                          <div>
                            <div className="font-medium text-foreground">Trending Features</div>
                            <div className="text-sm text-foreground-secondary">
                              Popular and newly released features
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Star className="w-5 h-5 text-warning mt-0.5" />
                          <div>
                            <div className="font-medium text-foreground">Suggested Actions</div>
                            <div className="text-sm text-foreground-secondary">
                              Contextual next steps and recommendations
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Target className="w-5 h-5 text-info mt-0.5" />
                          <div>
                            <div className="font-medium text-foreground">Personalized Content</div>
                            <div className="text-sm text-foreground-secondary">
                              Tailored suggestions based on usage patterns
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-info/5 border border-info/20 rounded-lg p-4">
                      <h4 className="font-medium text-info mb-2">Smart Discovery Algorithm</h4>
                      <ul className="text-sm text-info/70 space-y-1">
                        <li>• Usage frequency analysis</li>
                        <li>• Time-based relevance</li>
                        <li>• Feature popularity metrics</li>
                        <li>• User role and permissions</li>
                        <li>• Contextual recommendations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hierarchy' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-4">Navigation Hierarchy</h2>
                  <p className="text-foreground-secondary">
                    Clear information structure that shows the current page's position and provides
                    navigation to related sections.
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <NavigationHierarchy
                    hierarchy={navigationHierarchy}
                    currentPage="valuation"
                    onNavigate={level => console.log('Navigate to:', level)}
                  />

                  <div className="space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Hierarchy Benefits
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <div className="font-medium text-foreground">Clear Context</div>
                            <div className="text-sm text-foreground-secondary">
                              Users always know where they are
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Navigation className="w-5 h-5 text-success mt-0.5" />
                          <div>
                            <div className="font-medium text-foreground">Easy Navigation</div>
                            <div className="text-sm text-foreground-secondary">
                              Jump to any level in the hierarchy
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Target className="w-5 h-5 text-warning mt-0.5" />
                          <div>
                            <div className="font-medium text-foreground">Logical Structure</div>
                            <div className="text-sm text-foreground-secondary">
                              Information organized by importance
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <BookOpen className="w-5 h-5 text-info mt-0.5" />
                          <div>
                            <div className="font-medium text-foreground">Discoverability</div>
                            <div className="text-sm text-foreground-secondary">
                              Related content easily accessible
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                      <h4 className="font-medium text-warning mb-2">
                        Information Architecture Principles
                      </h4>
                      <ul className="text-sm text-warning/70 space-y-1">
                        <li>• Progressive disclosure of information</li>
                        <li>• Consistent navigation patterns</li>
                        <li>• Clear visual hierarchy</li>
                        <li>• Intuitive information grouping</li>
                        <li>• Minimal cognitive load</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integration' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-4">Complete Integration</h2>
                  <p className="text-foreground-secondary">
                    All information architecture components working together for the ultimate user
                    experience.
                  </p>
                </div>

                {/* Full Integration Example */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* Breadcrumb with Search */}
                  <BreadcrumbWithSearch
                    items={breadcrumbExamples[1].items}
                    searchPlaceholder="Search portfolios, models, reports..."
                    onSearch={handleSearch}
                  />

                  <div className="p-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Main Content Area */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-background-secondary rounded-lg p-6">
                          <h3 className="text-xl font-semibold text-foreground mb-4">
                            Portfolio Performance
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-background rounded-lg">
                              <div className="text-2xl font-bold text-foreground">$127,459</div>
                              <div className="text-sm text-foreground-secondary">Total Value</div>
                            </div>
                            <div className="p-4 bg-background rounded-lg">
                              <div className="text-2xl font-bold text-success">+12.5%</div>
                              <div className="text-sm text-foreground-secondary">This Month</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-background-secondary rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-foreground mb-4">
                            Recent Activity
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-foreground">AAPL Purchase</div>
                                <div className="text-sm text-foreground-secondary">2 hours ago</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-foreground">+$2,450</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar with Discovery */}
                      <div className="space-y-6">
                        <DiscoveryPanel
                          recentItems={recentItems.slice(0, 3)}
                          trendingItems={trendingItems.slice(0, 2)}
                          suggestedActions={suggestedActions.slice(0, 2)}
                          onItemClick={item => console.log('Clicked:', item)}
                        />

                        <NavigationHierarchy
                          hierarchy={navigationHierarchy.slice(0, 3)}
                          currentPage="portfolio"
                          onNavigate={level => console.log('Navigate to:', level)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integration Benefits */}
                <div className="bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg p-8">
                  <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                    Integrated Information Architecture Benefits
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="font-semibold text-foreground mb-1">Unified Experience</div>
                      <div className="text-sm text-foreground-secondary">
                        Consistent navigation everywhere
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl mb-2">⚡</div>
                      <div className="font-semibold text-foreground mb-1">Rapid Discovery</div>
                      <div className="text-sm text-foreground-secondary">
                        Find anything in seconds
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl mb-2">🧠</div>
                      <div className="font-semibold text-foreground mb-1">
                        Reduced Cognitive Load
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        Clear information structure
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl mb-2">🚀</div>
                      <div className="font-semibold text-foreground mb-1">
                        Enhanced Productivity
                      </div>
                      <div className="text-sm text-foreground-secondary">Streamlined workflows</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </NavigationProvider>
  );
};

export default InformationArchitectureDemo;
