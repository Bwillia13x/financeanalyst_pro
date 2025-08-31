import React, { useState } from 'react';
import Header from '../components/ui/Header';

// UI Components
import Button from '../components/ui/Button';

// Icons
import {
  Move,
  Grid,
  Type,
  Layout,
  Smartphone,
  Monitor,
  Tablet,
  Eye,
  EyeOff,
  Settings,
  Zap,
  Target,
  Layers
} from 'lucide-react';

// Sample data for demonstrations
const spacingScale = [
  { name: '0', value: '0px', rem: '0' },
  { name: 'px', value: '1px', rem: '0.0625rem' },
  { name: '0.5', value: '2px', rem: '0.125rem' },
  { name: '1', value: '4px', rem: '0.25rem' },
  { name: '1.5', value: '6px', rem: '0.375rem' },
  { name: '2', value: '8px', rem: '0.5rem' },
  { name: '2.5', value: '10px', rem: '0.625rem' },
  { name: '3', value: '12px', rem: '0.75rem' },
  { name: '3.5', value: '14px', rem: '0.875rem' },
  { name: '4', value: '16px', rem: '1rem' },
  { name: '5', value: '20px', rem: '1.25rem' },
  { name: '6', value: '24px', rem: '1.5rem' },
  { name: '8', value: '32px', rem: '2rem' },
  { name: '10', value: '40px', rem: '2.5rem' },
  { name: '12', value: '48px', rem: '3rem' },
  { name: '16', value: '64px', rem: '4rem' },
  { name: '20', value: '80px', rem: '5rem' },
  { name: '24', value: '96px', rem: '6rem' }
];

const semanticCategories = [
  {
    name: 'Content Spacing',
    description: 'Spacing between content elements within components',
    items: [
      { name: 'content-xs', value: '8px', usage: 'Small gaps between related elements' },
      { name: 'content-sm', value: '12px', usage: 'Form elements and small components' },
      { name: 'content-md', value: '16px', usage: 'Standard component spacing' },
      { name: 'content-lg', value: '24px', usage: 'Section spacing within components' },
      { name: 'content-xl', value: '32px', usage: 'Major section spacing' },
      { name: 'content-2xl', value: '48px', usage: 'Page section spacing' }
    ]
  },
  {
    name: 'Layout Spacing',
    description: 'Spacing between major layout elements',
    items: [
      { name: 'layout-xs', value: '12px', usage: 'Tight layout spacing' },
      { name: 'layout-sm', value: '16px', usage: 'Card and panel spacing' },
      { name: 'layout-md', value: '24px', usage: 'Component layout spacing' },
      { name: 'layout-lg', value: '32px', usage: 'Section layout spacing' },
      { name: 'layout-xl', value: '48px', usage: 'Page layout spacing' },
      { name: 'layout-2xl', value: '64px', usage: 'Major page layout spacing' }
    ]
  },
  {
    name: 'Component Spacing',
    description: 'Padding and margins within components',
    items: [
      { name: 'component-padding-xs', value: '8px', usage: 'Small component padding' },
      { name: 'component-padding-sm', value: '12px', usage: 'Button and input padding' },
      { name: 'component-padding-md', value: '16px', usage: 'Card and modal padding' },
      { name: 'component-padding-lg', value: '24px', usage: 'Large component padding' },
      { name: 'component-padding-xl', value: '32px', usage: 'Extra large component padding' },
      { name: 'component-margin-xs', value: '4px', usage: 'Micro spacing' },
      { name: 'component-margin-sm', value: '8px', usage: 'Small gaps' },
      { name: 'component-margin-md', value: '12px', usage: 'Standard gaps' },
      { name: 'component-margin-lg', value: '16px', usage: 'Large gaps' },
      { name: 'component-margin-xl', value: '24px', usage: 'Section gaps' }
    ]
  }
];

const SpacingSystemDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showVisualDebug, setShowVisualDebug] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'scale', label: 'Spacing Scale', icon: '📏' },
    { id: 'semantic', label: 'Semantic', icon: '🏷️' },
    { id: 'components', label: 'Components', icon: '🧩' },
    { id: 'responsive', label: 'Responsive', icon: '📱' },
    { id: 'examples', label: 'Examples', icon: '💡' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16 p-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Spacing System</h1>
              <p className="text-foreground-secondary">
                Comprehensive spacing system for consistent visual hierarchy and breathing room.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVisualDebug(!showVisualDebug)}
                iconComponent={showVisualDebug ? EyeOff : Eye}
              >
                {showVisualDebug ? 'Hide' : 'Show'} Visual Debug
              </Button>
            </div>
          </div>
        </div>

        {/* Visual Debug Overlay */}
        {showVisualDebug && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <style jsx>{`
              * {
                background: rgba(255, 0, 0, 0.05) !important;
                border: 1px solid rgba(255, 0, 0, 0.1) !important;
              }
            `}</style>
          </div>
        )}

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
                  Visual Hierarchy Through Spacing
                </h2>
                <p className="text-foreground-secondary max-w-2xl mx-auto">
                  Our spacing system creates clear visual hierarchy and breathing room throughout
                  the platform, making content easier to scan and interact with.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Consistent Scale</h3>
                      <p className="text-sm text-foreground-secondary">4px increment system</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Every spacing value is a multiple of 4px, creating visual harmony and ensuring
                    consistent proportions across all elements.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <Layers className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Semantic Naming</h3>
                      <p className="text-sm text-foreground-secondary">Purpose-driven spacing</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Spacing tokens are named by their purpose (content, layout, component) rather
                    than arbitrary values, making them intuitive to use.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Responsive Design</h3>
                      <p className="text-sm text-foreground-secondary">Adaptive spacing</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Spacing automatically adjusts for different screen sizes, optimizing space
                    utilization on mobile and providing generous spacing on desktop.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Settings className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Developer Experience
                      </h3>
                      <p className="text-sm text-foreground-secondary">Easy to maintain</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    CSS custom properties and utility classes make spacing consistent and easy to
                    maintain across the entire codebase.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg p-8">
                <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                  Spacing System Benefits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="font-semibold text-foreground mb-1">Visual Harmony</div>
                    <div className="text-sm text-foreground-secondary">Consistent proportions</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">📱</div>
                    <div className="font-semibold text-foreground mb-1">Mobile Optimized</div>
                    <div className="text-sm text-foreground-secondary">Adaptive spacing</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="font-semibold text-foreground mb-1">Faster Development</div>
                    <div className="text-sm text-foreground-secondary">Pre-built utilities</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">♿</div>
                    <div className="font-semibold text-foreground mb-1">Accessible</div>
                    <div className="text-sm text-foreground-secondary">Touch-friendly targets</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scale' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Spacing Scale</h2>
                <p className="text-foreground-secondary">
                  Our comprehensive spacing scale based on 4px increments ensures visual harmony.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Base Spacing Scale</h3>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Every spacing value is a multiple of 4px for consistent visual rhythm
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {spacingScale.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-4 hover:bg-background-secondary transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 text-center">
                          <code className="text-sm font-mono text-primary">{item.name}</code>
                        </div>
                        <div className="text-sm text-foreground-secondary">
                          {item.value} ({item.rem})
                        </div>
                      </div>

                      {/* Visual representation */}
                      <div className="flex items-center gap-2">
                        <div
                          className="bg-primary rounded-sm transition-all duration-200"
                          style={{
                            width: `${Math.max(8, Math.min(64, parseInt(item.value)))}px`,
                            height: '8px'
                          }}
                        />
                        <code className="text-xs font-mono text-foreground-secondary">
                          w-{item.name}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">How to Use</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-background-secondary rounded">
                      <code className="text-sm">padding: var(--spacing-4)</code>
                      <p className="text-xs text-foreground-secondary mt-1">
                        Direct spacing value (16px)
                      </p>
                    </div>
                    <div className="p-3 bg-background-secondary rounded">
                      <code className="text-sm">className="p-4"</code>
                      <p className="text-xs text-foreground-secondary mt-1">
                        Tailwind utility (16px)
                      </p>
                    </div>
                    <div className="p-3 bg-background-secondary rounded">
                      <code className="text-sm">className="spacing-card"</code>
                      <p className="text-xs text-foreground-secondary mt-1">Semantic utility</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Best Practices</h3>
                  <ul className="space-y-2 text-sm text-foreground-secondary">
                    <li>• Use semantic spacing over arbitrary values</li>
                    <li>• Maintain spacing hierarchy (larger for higher levels)</li>
                    <li>• Consider responsive behavior</li>
                    <li>• Ensure accessibility (44px+ touch targets)</li>
                    <li>• Test spacing across different screen sizes</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'semantic' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Semantic Spacing</h2>
                <p className="text-foreground-secondary">
                  Purpose-driven spacing tokens that make design decisions intuitive.
                </p>
              </div>

              {semanticCategories.map(category => (
                <div
                  key={category.name}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                    <p className="text-sm text-foreground-secondary mt-1">{category.description}</p>
                  </div>

                  <div className="divide-y divide-border">
                    {category.items.map(item => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-4 hover:bg-background-secondary transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <code className="text-sm font-mono text-primary">{item.name}</code>
                            <span className="text-sm font-medium text-foreground">
                              {item.value}
                            </span>
                          </div>
                          <p className="text-sm text-foreground-secondary mt-1">{item.usage}</p>
                        </div>

                        {/* Visual representation */}
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-primary rounded-sm transition-all duration-200"
                            style={{
                              width: `${Math.max(8, Math.min(48, parseInt(item.value)))}px`,
                              height: '8px'
                            }}
                          />
                          <code className="text-xs font-mono text-foreground-secondary">
                            {item.value}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-info/5 border border-info/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  CSS Custom Properties
                </h3>
                <p className="text-foreground-secondary mb-4">
                  All semantic spacing is available as CSS custom properties for maximum
                  flexibility:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <code className="block text-sm p-2 bg-background-secondary rounded">
                      --component-padding-md: 16px
                    </code>
                    <code className="block text-sm p-2 bg-background-secondary rounded">
                      --layout-spacing-lg: 32px
                    </code>
                  </div>
                  <div className="space-y-2">
                    <code className="block text-sm p-2 bg-background-secondary rounded">
                      --content-spacing-sm: 12px
                    </code>
                    <code className="block text-sm p-2 bg-background-secondary rounded">
                      --text-spacing-md: 6px
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Component Spacing</h2>
                <p className="text-foreground-secondary">
                  Pre-built spacing utilities for common component patterns.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Stack Spacing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Stack Spacing</h3>
                  <div className="space-y-4">
                    {['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map(size => (
                      <div key={size} className="bg-card border border-border rounded-lg p-4">
                        <div className="text-sm font-medium text-foreground mb-2">
                          spacing-stack-{size}
                        </div>
                        <div className={`spacing-stack-${size}`}>
                          <div className="h-8 bg-primary/20 rounded flex items-center justify-center">
                            <span className="text-xs font-medium">Item 1</span>
                          </div>
                          <div className="h-8 bg-primary/20 rounded flex items-center justify-center">
                            <span className="text-xs font-medium">Item 2</span>
                          </div>
                          <div className="h-8 bg-primary/20 rounded flex items-center justify-center">
                            <span className="text-xs font-medium">Item 3</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inline Spacing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Inline Spacing</h3>
                  <div className="space-y-4">
                    {['xs', 'sm', 'md', 'lg', 'xl'].map(size => (
                      <div key={size} className="bg-card border border-border rounded-lg p-4">
                        <div className="text-sm font-medium text-foreground mb-2">
                          spacing-inline-{size}
                        </div>
                        <div className={`spacing-inline-${size}`}>
                          <div className="h-8 w-16 bg-primary/20 rounded flex items-center justify-center">
                            <span className="text-xs font-medium">A</span>
                          </div>
                          <div className="h-8 w-16 bg-primary/20 rounded flex items-center justify-center">
                            <span className="text-xs font-medium">B</span>
                          </div>
                          <div className="h-8 w-16 bg-primary/20 rounded flex items-center justify-center">
                            <span className="text-xs font-medium">C</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Component Patterns */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Component Patterns</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-sm font-medium text-foreground mb-2">spacing-card</div>
                    <div className="spacing-card bg-background-secondary rounded">
                      <h4 className="font-medium">Card Title</h4>
                      <p className="text-sm text-foreground-secondary">
                        Card content with proper padding.
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-sm font-medium text-foreground mb-2">spacing-section</div>
                    <div className="spacing-section bg-background-secondary rounded">
                      <h4 className="font-medium">Section Title</h4>
                      <p className="text-sm text-foreground-secondary">
                        Section content with vertical spacing.
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-sm font-medium text-foreground mb-2">
                      spacing-button-group
                    </div>
                    <div className="spacing-button-group">
                      <Button variant="outline" size="sm">
                        Button 1
                      </Button>
                      <Button variant="outline" size="sm">
                        Button 2
                      </Button>
                      <Button variant="outline" size="sm">
                        Button 3
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'responsive' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Responsive Spacing</h2>
                <p className="text-foreground-secondary">
                  Spacing that adapts to different screen sizes for optimal user experience.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Smartphone className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Mobile</h3>
                  <p className="text-sm text-foreground-secondary mb-4">
                    Compact spacing for better space utilization
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-foreground-secondary">Content spacing: 12px</div>
                    <div className="text-xs text-foreground-secondary">Layout spacing: 16px</div>
                    <div className="text-xs text-foreground-secondary">Component padding: 12px</div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Tablet className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Tablet</h3>
                  <p className="text-sm text-foreground-secondary mb-4">
                    Balanced spacing for comfortable reading
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-foreground-secondary">Content spacing: 16px</div>
                    <div className="text-xs text-foreground-secondary">Layout spacing: 24px</div>
                    <div className="text-xs text-foreground-secondary">Component padding: 16px</div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Monitor className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Desktop</h3>
                  <p className="text-sm text-foreground-secondary mb-4">
                    Generous spacing for visual hierarchy
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-foreground-secondary">Content spacing: 16px</div>
                    <div className="text-xs text-foreground-secondary">Layout spacing: 32px</div>
                    <div className="text-xs text-foreground-secondary">Component padding: 16px</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Responsive Utilities</h3>
                <p className="text-foreground-secondary mb-6">
                  These utilities automatically adjust spacing based on screen size:
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Spacing Classes</h4>
                    <div className="space-y-2">
                      <code className="block text-sm p-2 bg-background-secondary rounded">
                        spacing-responsive-xs
                      </code>
                      <code className="block text-sm p-2 bg-background-secondary rounded">
                        spacing-responsive-sm
                      </code>
                      <code className="block text-sm p-2 bg-background-secondary rounded">
                        spacing-responsive-md
                      </code>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Breakpoints</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Mobile (&lt; 640px)</span>
                        <span className="font-medium">Compact</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tablet (640px - 1024px)</span>
                        <span className="font-medium">Standard</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Desktop (&gt; 1024px)</span>
                        <span className="font-medium">Generous</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Real-World Examples</h2>
                <p className="text-foreground-secondary">
                  How our spacing system improves the visual hierarchy of actual components.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Card Example */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Card Component</h3>
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">
                          Portfolio Summary
                        </h4>
                        <p className="text-foreground-secondary">
                          Your investment performance overview
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-background-secondary rounded-lg">
                          <div className="text-2xl font-bold text-foreground">$127,459</div>
                          <div className="text-sm text-foreground-secondary">Total Value</div>
                        </div>
                        <div className="p-4 bg-background-secondary rounded-lg">
                          <div className="text-2xl font-bold text-success">+12.5%</div>
                          <div className="text-sm text-foreground-secondary">This Month</div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="primary" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Example */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Form Layout</h3>
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">
                          Contact Information
                        </h4>
                        <p className="text-foreground-secondary">
                          Please provide your contact details
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Full Name</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Email Address
                          </label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter your email"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Message</label>
                          <textarea
                            rows={4}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter your message"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="primary">Send Message</Button>
                        <Button variant="outline">Cancel</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Example */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Navigation</h3>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <nav className="space-y-2">
                      <a
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-background-secondary transition-colors"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-foreground">Dashboard</span>
                      </a>
                      <a
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-background-secondary transition-colors"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-foreground">Portfolio</span>
                      </a>
                      <a
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-background-secondary transition-colors"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-foreground">Analytics</span>
                      </a>
                      <a
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-background-secondary transition-colors"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-foreground">Reports</span>
                      </a>
                      <a
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-background-secondary transition-colors"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-foreground">Settings</span>
                      </a>
                    </nav>
                  </div>
                </div>

                {/* Grid Example */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Data Grid</h3>
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <h4 className="font-medium text-foreground">Recent Transactions</h4>
                    </div>

                    <div className="divide-y divide-border">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">AAPL Purchase</div>
                          <div className="text-sm text-foreground-secondary">2 hours ago</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">+$2,450</div>
                          <div className="text-sm text-success">+5.2%</div>
                        </div>
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">GOOGL Dividend</div>
                          <div className="text-sm text-foreground-secondary">1 day ago</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">+$127</div>
                          <div className="text-sm text-success">+2.1%</div>
                        </div>
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">TSLA Sale</div>
                          <div className="text-sm text-foreground-secondary">3 days ago</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">-$1,850</div>
                          <div className="text-sm text-destructive">-3.7%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg p-8">
                <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                  Spacing System Impact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary mb-2">+40%</div>
                    <div className="text-sm text-foreground-secondary">
                      Faster component development
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success mb-2">98%</div>
                    <div className="text-sm text-foreground-secondary">
                      Consistent spacing across platform
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-info mb-2">100%</div>
                    <div className="text-sm text-foreground-secondary">
                      Mobile accessibility compliance
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

export default SpacingSystemDemo;
