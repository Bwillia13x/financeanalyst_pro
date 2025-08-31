import React, { useState, useRef } from 'react';
import Header from '../components/ui/Header';
import {
  MobileContainer,
  MobileCard,
  MobileActionSheet,
  MobileSwipeContainer,
  MobileTabBar,
  MobilePullToRefresh,
  MobileGrid,
  MobileInput,
  MobileSelect
} from '../components/ui/MobileLayout';

// Enhanced Button with mobile variants
import Button from '../components/ui/Button';

// Icons
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Settings,
  Home,
  Search,
  User,
  Menu,
  X,
  RefreshCw,
  Heart,
  Share2,
  Download,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';

// Sample data for demonstrations
const sampleData = [
  { id: 1, title: 'Portfolio Analysis', value: '+12.5%', status: 'positive' },
  { id: 2, title: 'Risk Assessment', value: 'Low', status: 'neutral' },
  { id: 3, title: 'Market Trends', value: '+8.2%', status: 'positive' },
  { id: 4, title: 'Cash Flow', value: '-3.1%', status: 'negative' },
  { id: 5, title: 'Asset Allocation', value: 'Balanced', status: 'neutral' },
  { id: 6, title: 'Performance', value: '+15.7%', status: 'positive' }
];

const MobileOptimizationDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    analysis: ''
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📱' },
    { id: 'buttons', label: 'Buttons', icon: '🔘' },
    { id: 'cards', label: 'Cards', icon: '📋' },
    { id: 'forms', label: 'Forms', icon: '📝' },
    { id: 'interactions', label: 'Interactions', icon: '✋' }
  ];

  const mobileTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const handleSwipeLeft = () => {
    setSwipeDirection('← Swipe Left');
    setTimeout(() => setSwipeDirection(''), 1000);
  };

  const handleSwipeRight = () => {
    setSwipeDirection('→ Swipe Right');
    setTimeout(() => setSwipeDirection(''), 1000);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const actionSheetActions = [
    { label: 'Edit Analysis', onClick: () => console.log('Edit clicked') },
    { label: 'Share Report', onClick: () => console.log('Share clicked') },
    { label: 'Download PDF', onClick: () => console.log('Download clicked') },
    { label: 'Delete', onClick: () => console.log('Delete clicked'), destructive: true }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <MobileContainer className="pt-16">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Mobile Optimization Showcase</h1>
          <p className="text-foreground-secondary">
            Touch-optimized components and mobile-first design patterns for enhanced mobile
            experience.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-background-secondary p-1 rounded-lg overflow-x-auto">
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
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Mobile-First Design Principles
                </h2>
                <p className="text-foreground-secondary max-w-2xl mx-auto">
                  Our mobile optimization focuses on touch-friendly interactions, proper safe areas,
                  and native mobile patterns for an exceptional mobile experience.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MobileCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Touch Optimization</h3>
                      <p className="text-sm text-foreground-secondary">
                        44px minimum touch targets
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    All interactive elements meet iOS and Android touch target guidelines for
                    optimal usability on mobile devices.
                  </p>
                </MobileCard>

                <MobileCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Native Patterns</h3>
                      <p className="text-sm text-foreground-secondary">
                        Pull-to-refresh, swipe gestures
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Familiar mobile interactions like pull-to-refresh and swipe gestures for
                    intuitive navigation and data loading.
                  </p>
                </MobileCard>

                <MobileCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Responsive Layouts</h3>
                      <p className="text-sm text-foreground-secondary">Adaptive grid systems</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Flexible grid systems that adapt to different screen sizes and orientations for
                    optimal content presentation.
                  </p>
                </MobileCard>

                <MobileCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Settings className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Safe Areas</h3>
                      <p className="text-sm text-foreground-secondary">Notch and gesture support</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Proper handling of device notches, home indicators, and gesture areas for modern
                    mobile devices.
                  </p>
                </MobileCard>
              </div>

              <div className="bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Mobile Enhancement Highlights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">44px+</div>
                    <div className="text-sm text-foreground-secondary">Min Touch Targets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success mb-1">300ms</div>
                    <div className="text-sm text-foreground-secondary">Faster Interactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-info mb-1">100%</div>
                    <div className="text-sm text-foreground-secondary">Responsive Design</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning mb-1">5</div>
                    <div className="text-sm text-foreground-secondary">Gesture Types</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'buttons' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Mobile-Optimized Buttons</h2>
                <p className="text-foreground-secondary">
                  Touch-friendly button variants with proper sizing and visual feedback.
                </p>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Mobile Button Variants
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <Button variant="mobilePrimary" className="w-full">
                        Primary Action
                      </Button>
                      <Button variant="mobileSecondary" className="w-full">
                        Secondary Action
                      </Button>
                      <Button variant="mobileAction" className="w-full">
                        <TrendingUp className="w-5 h-5" />
                        Main Call-to-Action
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <Button variant="mobileGhost" className="w-full">
                        Ghost Button
                      </Button>
                      <Button variant="mobileDanger" className="w-full">
                        <Trash2 className="w-5 h-5" />
                        Delete Item
                      </Button>
                      <Button variant="mobilePrimary" size="mobileIcon" className="w-full">
                        <Plus className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Mobile Button Sizes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Button variant="mobilePrimary" size="mobileXs" className="w-full">
                        Extra Small (44px min)
                      </Button>
                      <Button variant="mobilePrimary" size="mobileSm" className="w-full">
                        Small (44px min)
                      </Button>
                      <Button variant="mobilePrimary" size="mobile" className="w-full">
                        Medium (48px min)
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Button variant="mobilePrimary" size="mobileLg" className="w-full">
                        Large (52px min)
                      </Button>
                      <Button variant="mobilePrimary" size="mobileXl" className="w-full">
                        Extra Large (56px min)
                      </Button>
                      <Button variant="mobilePrimary" size="mobileIcon" className="w-full">
                        Icon Only (44px min)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Mobile-Optimized Cards</h2>
                <p className="text-foreground-secondary">
                  Touch-friendly cards with interactive feedback and proper spacing.
                </p>
              </div>

              <MobileGrid columns={{ default: 1, sm: 2 }}>
                {sampleData.map(item => (
                  <MobileCard
                    key={item.id}
                    interactive
                    onClick={() => console.log(`Card ${item.id} clicked`)}
                    onLongPress={() => setIsActionSheetOpen(true)}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p
                          className={`text-sm font-medium ${
                            item.status === 'positive'
                              ? 'text-success'
                              : item.status === 'negative'
                                ? 'text-destructive'
                                : 'text-foreground-secondary'
                          }`}
                        >
                          {item.value}
                        </p>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          item.status === 'positive'
                            ? 'bg-success'
                            : item.status === 'negative'
                              ? 'bg-destructive'
                              : 'bg-muted-foreground'
                        }`}
                      />
                    </div>
                  </MobileCard>
                ))}
              </MobileGrid>

              <div className="text-center">
                <Button
                  variant="mobileAction"
                  onClick={() => setIsActionSheetOpen(true)}
                  className="w-full max-w-sm"
                >
                  Open Action Sheet
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'forms' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Mobile-Optimized Forms</h2>
                <p className="text-foreground-secondary">
                  Touch-friendly form controls with proper sizing and validation feedback.
                </p>
              </div>

              <MobileCard className="p-6 space-y-6">
                <MobileInput
                  label="Full Name"
                  value={formData.name}
                  onChange={e => handleFormChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />

                <MobileInput
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={e => handleFormChange('email', e.target.value)}
                  placeholder="Enter your email"
                />

                <MobileSelect
                  label="Analysis Type"
                  value={formData.analysis}
                  onChange={value => handleFormChange('analysis', value)}
                  options={[
                    { value: 'portfolio', label: 'Portfolio Analysis' },
                    { value: 'valuation', label: 'Valuation Model' },
                    { value: 'risk', label: 'Risk Assessment' },
                    { value: 'forecast', label: 'Financial Forecast' }
                  ]}
                  placeholder="Select analysis type"
                />

                <div className="flex gap-3 pt-4">
                  <Button variant="mobileSecondary" className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="mobilePrimary" className="flex-1">
                    Submit
                  </Button>
                </div>
              </MobileCard>
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Mobile Interactions</h2>
                <p className="text-foreground-secondary">
                  Swipe gestures, pull-to-refresh, and touch-optimized interactions.
                </p>
              </div>

              {/* Swipe Demo */}
              <MobileCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Swipe Gestures</h3>
                <p className="text-foreground-secondary mb-4">
                  Try swiping left or right on the card below
                </p>

                <MobileSwipeContainer
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  className="bg-background-secondary rounded-lg p-6 text-center"
                >
                  <div className="text-foreground-secondary mb-2">Swipe me horizontally</div>
                  <div className="text-sm font-medium text-primary">
                    {swipeDirection || '← Swipe Left or Right →'}
                  </div>
                </MobileSwipeContainer>
              </MobileCard>

              {/* Pull to Refresh Demo */}
              <MobileCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Pull to Refresh</h3>
                <p className="text-foreground-secondary mb-4">
                  Pull down to refresh the content below
                </p>

                <MobilePullToRefresh
                  onRefresh={handleRefresh}
                  refreshing={isRefreshing}
                  className="max-h-48 overflow-y-auto"
                >
                  <div className="space-y-4 p-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <span className="text-foreground">Item {i + 1}</span>
                        <span className="text-foreground-secondary">
                          {Math.floor(Math.random() * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </MobilePullToRefresh>
              </MobileCard>

              {/* Bottom Tab Bar Demo */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Bottom Tab Bar</h3>
                <p className="text-foreground-secondary mb-4">Native mobile navigation pattern</p>

                <div className="bg-card border border-border rounded-lg p-4 mb-16">
                  <div className="text-center text-foreground-secondary">
                    Content area - Tab bar is positioned at bottom
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Action Sheet */}
        <MobileActionSheet
          isOpen={isActionSheetOpen}
          onClose={() => setIsActionSheetOpen(false)}
          title="Actions"
          actions={actionSheetActions}
        >
          <div className="p-4 text-center">
            <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-foreground-secondary" />
            </div>
            <p className="text-foreground-secondary">Choose an action from the options below</p>
          </div>
        </MobileActionSheet>

        {/* Mobile Tab Bar */}
        <MobileTabBar
          tabs={mobileTabs}
          activeTab="home"
          onTabChange={tab => console.log(`Tab changed to: ${tab}`)}
          safeArea={true}
        />
      </MobileContainer>
    </div>
  );
};

export default MobileOptimizationDemo;
