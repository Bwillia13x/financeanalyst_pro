import {
  TrendingUp,
  BarChart3,
  PieChart,
  Settings,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff
} from 'lucide-react';
import React, { useState } from 'react';

import Button from '../components/ui/Button';
import Header from '../components/ui/Header';

// Theme Components
import { MobileCard, MobileGrid } from '../components/ui/MobileLayout';
import {
  ThemeToggle,
  ThemeIndicator,
  ThemeSettings,
  HighContrastToggle,
  useTheme
} from '../components/ui/ThemeProvider';

// UI Components

// Icons

// Sample data for demonstrations
const sampleMetrics = [
  { id: 1, label: 'Portfolio Value', value: '$2.4M', change: '+12.5%', trend: 'up' },
  { id: 2, label: 'Monthly Return', value: '$28.6K', change: '+8.2%', trend: 'up' },
  { id: 3, label: 'Risk Score', value: 'Low', change: '-2.1%', trend: 'down' },
  { id: 4, label: 'Diversification', value: '87%', change: '+3.4%', trend: 'up' }
];

const chartData = [
  { name: 'Jan', value: 400, color: 'var(--color-chart-1)' },
  { name: 'Feb', value: 300, color: 'var(--color-chart-2)' },
  { name: 'Mar', value: 600, color: 'var(--color-chart-3)' },
  { name: 'Apr', value: 800, color: 'var(--color-chart-4)' },
  { name: 'May', value: 500, color: 'var(--color-chart-5)' }
];

const ThemeStatusCard = () => {
  const { theme, effectiveTheme, isSystemTheme } = useTheme();

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          {effectiveTheme === 'dark' ? (
            <Moon className="w-6 h-6 text-primary" />
          ) : (
            <Sun className="w-6 h-6 text-primary" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Current Theme</h3>
          <p className="text-sm text-foreground-secondary">
            {isSystemTheme ? 'Following system preference' : 'Manually set'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-foreground-secondary">Theme Setting</span>
          <span className="font-medium text-foreground">{theme}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-foreground-secondary">Active Theme</span>
          <span className="font-medium text-foreground">{effectiveTheme}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-foreground-secondary">System Preference</span>
          <span className="font-medium text-foreground">
            {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'}
          </span>
        </div>
      </div>
    </div>
  );
};

const ColorPaletteDemo = () => {
  const colorCategories = [
    {
      name: 'Brand Colors',
      colors: [
        { name: 'Primary', value: 'var(--color-primary)' },
        { name: 'Secondary', value: 'var(--color-secondary)' },
        { name: 'Accent', value: 'var(--color-accent)' }
      ]
    },
    {
      name: 'Semantic Colors',
      colors: [
        { name: 'Success', value: 'var(--color-success)' },
        { name: 'Warning', value: 'var(--color-warning)' },
        { name: 'Error', value: 'var(--color-error)' },
        { name: 'Info', value: 'var(--color-info)' }
      ]
    },
    {
      name: 'Financial Domain',
      colors: [
        { name: 'Revenue', value: 'var(--color-financial-revenue)' },
        { name: 'Expense', value: 'var(--color-financial-expense)' },
        { name: 'Asset', value: 'var(--color-financial-asset)' },
        { name: 'Liability', value: 'var(--color-financial-liability)' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Color Palette</h3>
      <div className="grid gap-6">
        {colorCategories.map(category => (
          <div key={category.name} className="space-y-3">
            <h4 className="text-lg font-medium text-foreground">{category.name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {category.colors.map(color => (
                <div key={color.name} className="p-3 border border-border rounded-lg text-center">
                  <div
                    className="w-full h-12 rounded-md mb-2 border border-border/50"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="text-sm font-medium text-foreground">{color.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ComponentDemo = () => {
  const [showAlert, setShowAlert] = useState(false);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Component Examples</h3>

      {/* Buttons */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-foreground">Buttons</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="success">Success Button</Button>
          <Button variant="warning">Warning Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-foreground">Cards</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {sampleMetrics.map(metric => (
            <div key={metric.id} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-foreground">{metric.label}</h5>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    metric.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4 rotate-180" />
                  )}
                  {metric.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-foreground">Status Indicators</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-success font-medium">Success Message</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span className="text-warning font-medium">Warning Message</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="text-destructive font-medium">Error Message</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-info/10 border border-info/20 rounded-lg">
            <Info className="w-5 h-5 text-info" />
            <span className="text-info font-medium">Info Message</span>
          </div>
        </div>
      </div>

      {/* Interactive Elements */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-foreground">Interactive Elements</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setShowAlert(!showAlert)}>
            Toggle Alert
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <User className="w-4 h-4 mr-2" />
            Profile
          </Button>
        </div>

        {showAlert && (
          <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-info" />
              <div>
                <p className="font-medium text-info">Information Alert</p>
                <p className="text-sm text-foreground-secondary">
                  This is an example of how alerts and notifications appear in dark mode.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AccessibilityDemo = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Accessibility Features</h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-card border border-border rounded-lg">
          <h4 className="text-lg font-medium text-foreground mb-4">High Contrast Mode</h4>
          <p className="text-foreground-secondary mb-4">
            Enhanced contrast for users with visual impairments.
          </p>
          <HighContrastToggle />
        </div>

        <div className="p-6 bg-card border border-border rounded-lg">
          <h4 className="text-lg font-medium text-foreground mb-4">Focus Indicators</h4>
          <p className="text-foreground-secondary mb-4">
            Clear focus states for keyboard navigation.
          </p>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              Focusable Button
            </button>
            <input
              type="text"
              placeholder="Focusable input"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-lg">
          <h4 className="text-lg font-medium text-foreground mb-4">Screen Reader Support</h4>
          <p className="text-foreground-secondary mb-4">Proper ARIA labels and semantic markup.</p>
          <div className="space-y-3">
            <div role="status" aria-live="polite" className="text-sm text-foreground-secondary">
              Screen reader announcements work properly
            </div>
            <button
              aria-label="Close dialog"
              className="px-3 py-1 bg-muted text-muted-foreground rounded"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-lg">
          <h4 className="text-lg font-medium text-foreground mb-4">Reduced Motion</h4>
          <p className="text-foreground-secondary mb-4">Respects user's motion preferences.</p>
          <div className="space-y-2">
            <div className="w-8 h-8 bg-primary rounded-full animate-pulse" />
            <p className="text-xs text-foreground-secondary">
              Animations are disabled if user prefers reduced motion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DarkModeDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { effectiveTheme } = useTheme();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🎨' },
    { id: 'colors', label: 'Colors', icon: '🌈' },
    { id: 'components', label: 'Components', icon: '🧩' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16 p-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Dark Mode Showcase</h1>
              <p className="text-foreground-secondary">
                Comprehensive dark theme implementation with smooth transitions and accessibility
                features.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeIndicator />
              <ThemeToggle size="lg" />
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
                  Welcome to {effectiveTheme === 'dark' ? 'Dark' : 'Light'} Mode
                </h2>
                <p className="text-foreground-secondary max-w-2xl mx-auto">
                  Experience seamless theme switching with smooth transitions, system preference
                  detection, and comprehensive accessibility support.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <ThemeStatusCard />

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">System Integration</h3>
                      <p className="text-sm text-foreground-secondary">Follows OS preferences</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-foreground-secondary">Auto-detection</span>
                      <span className="font-medium text-foreground">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-foreground-secondary">Persistence</span>
                      <span className="font-medium text-foreground">✓ Saved</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-foreground-secondary">Transitions</span>
                      <span className="font-medium text-foreground">✓ Smooth</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg p-8">
                <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                  Theme Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{effectiveTheme === 'dark' ? '🌙' : '☀️'}</div>
                    <div className="font-semibold text-foreground mb-1">
                      {effectiveTheme === 'dark' ? 'Dark Theme' : 'Light Theme'}
                    </div>
                    <div className="text-sm text-foreground-secondary">Currently active</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="font-semibold text-foreground mb-1">Fast Switching</div>
                    <div className="text-sm text-foreground-secondary">Instant theme changes</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">🎨</div>
                    <div className="font-semibold text-foreground mb-1">Rich Palette</div>
                    <div className="text-sm text-foreground-secondary">Financial domain colors</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">♿</div>
                    <div className="font-semibold text-foreground mb-1">Accessible</div>
                    <div className="text-sm text-foreground-secondary">WCAG AA compliant</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'colors' && <ColorPaletteDemo />}
          {activeTab === 'components' && <ComponentDemo />}
          {activeTab === 'accessibility' && <AccessibilityDemo />}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Theme Settings</h2>
                <p className="text-foreground-secondary">
                  Customize your theme preferences and accessibility options.
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <ThemeSettings />
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="p-6 bg-card border border-border rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Additional Options</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">High Contrast Mode</div>
                        <div className="text-sm text-foreground-secondary">
                          Enhanced contrast for better visibility
                        </div>
                      </div>
                      <HighContrastToggle />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Reduced Motion</div>
                        <div className="text-sm text-foreground-secondary">
                          Minimize animations and transitions
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg">
                        System Setting
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DarkModeDemo;
