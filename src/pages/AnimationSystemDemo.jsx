import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Eye,
  EyeOff,
  MousePointer,
  Focus,
  Smartphone,
  Monitor,
  Settings,
  CheckCircle,
  X,
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Target,
  Award,
  Star,
  Heart,
  ThumbsUp,
  AlertTriangle,
  Info,
  HelpCircle
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import Button from '../components/ui/Button';
import Header from '../components/ui/Header';

// UI Components

// Icons

// Animation trigger hook
const useAnimationTrigger = () => {
  const [triggered, setTriggered] = useState(false);

  const trigger = () => {
    setTriggered(false);
    setTimeout(() => setTriggered(true), 10);
  };

  return [triggered, trigger];
};

// Sample data for animations
const metricCards = [
  {
    id: 1,
    label: 'Portfolio Value',
    value: '$127,459',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign
  },
  { id: 2, label: 'Active Users', value: '2,847', change: '+8.2%', trend: 'up', icon: Users },
  {
    id: 3,
    label: 'Monthly Growth',
    value: '23.4%',
    change: '+5.1%',
    trend: 'up',
    icon: TrendingUp
  },
  { id: 4, label: 'Risk Score', value: 'Low', change: '-2.3%', trend: 'down', icon: Target }
];

const chartBars = [
  { label: 'Jan', value: 65, color: 'var(--color-chart-1)' },
  { label: 'Feb', value: 78, color: 'var(--color-chart-2)' },
  { label: 'Mar', value: 52, color: 'var(--color-chart-3)' },
  { label: 'Apr', value: 89, color: 'var(--color-chart-4)' },
  { label: 'May', value: 94, color: 'var(--color-chart-5)' }
];

const AnimationSystemDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVisualDebug, setShowVisualDebug] = useState(false);
  const [triggered, trigger] = useAnimationTrigger();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'entries', label: 'Entry Animations', icon: '🚀' },
    { id: 'interactions', label: 'Interactions', icon: '👆' },
    { id: 'components', label: 'Components', icon: '🧩' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' },
    { id: 'performance', label: 'Performance', icon: '⚡' }
  ];

  // Auto-trigger animations when playing
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        trigger();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, trigger]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16 p-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Animation System</h1>
              <p className="text-foreground-secondary">
                Comprehensive micro-interactions and transitions for enhanced user experience.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                iconComponent={isPlaying ? Pause : Play}
              >
                {isPlaying ? 'Pause' : 'Auto Play'}
              </Button>
              <Button variant="outline" size="sm" onClick={trigger} iconComponent={RotateCcw}>
                Trigger All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVisualDebug(!showVisualDebug)}
                iconComponent={showVisualDebug ? EyeOff : Eye}
              >
                {showVisualDebug ? 'Hide' : 'Show'} Debug
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
            `}
            </style>
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
                  Micro-Interactions That Matter
                </h2>
                <p className="text-foreground-secondary max-w-2xl mx-auto">
                  Our animation system provides subtle, meaningful feedback that makes interactions
                  feel natural and responsive while maintaining professional aesthetics.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Performance Optimized
                      </h3>
                      <p className="text-sm text-foreground-secondary">
                        GPU-accelerated animations
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    All animations use transform and opacity for smooth 60fps performance. We
                    respect user preferences and reduce motion for accessibility.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Purpose-Driven</h3>
                      <p className="text-sm text-foreground-secondary">Meaningful feedback</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Every animation serves a purpose - guiding attention, confirming actions, or
                    providing visual feedback to improve user understanding.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                      <Settings className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Highly Customizable</h3>
                      <p className="text-sm text-foreground-secondary">Flexible animation system</p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Extensive customization options with CSS custom properties, utility classes, and
                    JavaScript triggers for any use case.
                  </p>
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Cross-Platform</h3>
                      <p className="text-sm text-foreground-secondary">
                        Mobile and desktop optimized
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground-secondary">
                    Responsive animations that adapt to different screen sizes and device
                    capabilities for optimal performance everywhere.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg p-8">
                <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                  Animation System Benefits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="font-semibold text-foreground mb-1">
                      Faster Perceived Performance
                    </div>
                    <div className="text-sm text-foreground-secondary">
                      Visual feedback reduces wait times
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="font-semibold text-foreground mb-1">Better User Guidance</div>
                    <div className="text-sm text-foreground-secondary">
                      Clear interaction feedback
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">🏢</div>
                    <div className="font-semibold text-foreground mb-1">Professional Feel</div>
                    <div className="text-sm text-foreground-secondary">Enterprise-grade polish</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl mb-2">♿</div>
                    <div className="font-semibold text-foreground mb-1">Accessible Design</div>
                    <div className="text-sm text-foreground-secondary">
                      Respects user preferences
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'entries' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Entry Animations</h2>
                <p className="text-foreground-secondary">
                  Smooth entrance animations that make content appear naturally and engagingly.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Fade Animations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Fade Effects</h3>
                  <div className="space-y-4">
                    <div
                      className={`p-4 bg-card border border-border rounded-lg ${
                        triggered ? 'animate-fade-in' : 'opacity-0'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Fade In</div>
                      <div className="text-xs text-foreground-secondary">
                        Simple opacity transition
                      </div>
                    </div>

                    <div
                      className={`p-4 bg-card border border-border rounded-lg ${
                        triggered ? 'animate-fade-in-up' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Fade In Up</div>
                      <div className="text-xs text-foreground-secondary">Slide up with fade</div>
                    </div>

                    <div
                      className={`p-4 bg-card border border-border rounded-lg ${
                        triggered ? 'animate-fade-in-down' : 'opacity-0 -translate-y-4'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Fade In Down</div>
                      <div className="text-xs text-foreground-secondary">Slide down with fade</div>
                    </div>
                  </div>
                </div>

                {/* Scale Animations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Scale Effects</h3>
                  <div className="space-y-4">
                    <div
                      className={`p-4 bg-card border border-border rounded-lg ${
                        triggered ? 'animate-scale-in' : 'opacity-0 scale-95'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Scale In</div>
                      <div className="text-xs text-foreground-secondary">
                        Gentle scale with fade
                      </div>
                    </div>

                    <div
                      className={`p-4 bg-card border border-border rounded-lg ${
                        triggered ? 'animate-bounce-in' : 'opacity-0 scale-75'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Bounce In</div>
                      <div className="text-xs text-foreground-secondary">Playful bounce effect</div>
                    </div>

                    <div
                      className={`p-4 bg-card border border-border rounded-lg ${
                        triggered ? 'animate-rotate-in' : 'opacity-0 rotate-12 scale-90'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Rotate In</div>
                      <div className="text-xs text-foreground-secondary">Rotation with scale</div>
                    </div>
                  </div>
                </div>

                {/* Slide Animations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Slide Effects</h3>
                  <div className="space-y-4">
                    <div
                      className={`p-4 bg-card border border-border rounded-lg ${
                        triggered ? 'animate-slide-in-left' : 'opacity-0 -translate-x-8'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Slide Left</div>
                      <div className="text-xs text-foreground-secondary">Slide from left</div>
                    </div>

                    <div
                      className={`p-4 bg-card border border-border rounded-lg ${
                        triggered ? 'animate-slide-in-right' : 'opacity-0 translate-x-8'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Slide Right</div>
                      <div className="text-xs text-foreground-secondary">Slide from right</div>
                    </div>

                    <div
                      className={`p-4 bg-card border border-border rounded-lg ${
                        triggered ? 'animate-slide-in-up' : 'opacity-0 translate-y-8'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">Slide Up</div>
                      <div className="text-xs text-foreground-secondary">Slide from bottom</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Staggered Animations</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`p-4 bg-primary/10 border border-primary/20 rounded-lg animation-portfolio-card ${
                        triggered ? '' : 'opacity-0 translate-y-4'
                      }`}
                      style={{
                        animationDelay: triggered ? `${(i - 1) * 100}ms` : '0ms'
                      }}
                    >
                      <div className="text-sm font-medium text-primary mb-1">Card {i}</div>
                      <div className="text-xs text-primary/70">Staggered entry</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Interactive Animations</h2>
                <p className="text-foreground-secondary">
                  Hover, focus, and click animations that provide immediate visual feedback.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Hover Effects */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Hover Effects</h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-card border border-border rounded-lg animation-hover-lift cursor-pointer">
                      <div className="text-sm font-medium text-foreground mb-2">Lift Effect</div>
                      <div className="text-xs text-foreground-secondary">
                        Hover to see lift animation
                      </div>
                    </div>

                    <div className="p-6 bg-card border border-border rounded-lg animation-hover-scale cursor-pointer">
                      <div className="text-sm font-medium text-foreground mb-2">Scale Effect</div>
                      <div className="text-xs text-foreground-secondary">
                        Hover to see scale animation
                      </div>
                    </div>

                    <div className="p-6 bg-card border border-border rounded-lg animation-hover-glow cursor-pointer">
                      <div className="text-sm font-medium text-foreground mb-2">Glow Effect</div>
                      <div className="text-xs text-foreground-secondary">
                        Hover to see glow animation
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Effects */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Active Effects</h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-card border border-border rounded-lg animation-active-scale cursor-pointer">
                      <div className="text-sm font-medium text-foreground mb-2">Active Scale</div>
                      <div className="text-xs text-foreground-secondary">
                        Click to see scale down
                      </div>
                    </div>

                    <div className="p-6 bg-card border border-border rounded-lg animation-active-push cursor-pointer">
                      <div className="text-sm font-medium text-foreground mb-2">Active Push</div>
                      <div className="text-xs text-foreground-secondary">
                        Click to see push down
                      </div>
                    </div>
                  </div>
                </div>

                {/* Focus Effects */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Focus Effects</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Focus me for ring effect"
                      className="w-full p-4 bg-background border border-border rounded-lg animation-focus-ring"
                    />

                    <input
                      type="text"
                      placeholder="Focus me for lift effect"
                      className="w-full p-4 bg-background border border-border rounded-lg animation-focus-lift"
                    />

                    <input
                      type="text"
                      placeholder="Focus me for input effect"
                      className="w-full p-4 bg-background border border-border rounded-lg animation-input-focus"
                    />
                  </div>
                </div>

                {/* Button Effects */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Button Effects</h3>
                  <div className="space-y-4">
                    <Button variant="primary" className="animation-button-hover">
                      Hover Effect Button
                    </Button>

                    <Button variant="secondary" className="animation-button-active">
                      Active Effect Button
                    </Button>

                    <Button variant="outline" className="animation-focus-ring">
                      Focus Ring Button
                    </Button>
                  </div>
                </div>
              </div>

              {/* Ripple Effect Demo */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Ripple Effects</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <button
                      key={i}
                      className="p-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors relative overflow-hidden"
                      onClick={e => {
                        const button = e.currentTarget;
                        const ripple = document.createElement('div');
                        ripple.className =
                          'absolute inset-0 bg-primary/30 rounded-full animation-ripple pointer-events-none';
                        button.appendChild(ripple);
                        setTimeout(() => button.removeChild(ripple), 600);
                      }}
                    >
                      <div className="text-sm font-medium text-primary">Ripple {i}</div>
                      <div className="text-xs text-primary/70">Click for effect</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Component Animations</h2>
                <p className="text-foreground-secondary">
                  Specialized animations for common UI components and patterns.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Cards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Card Animations</h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-card border border-border rounded-lg animation-card-hover cursor-pointer">
                      <div className="text-sm font-medium text-foreground mb-2">Hover Card</div>
                      <div className="text-xs text-foreground-secondary">
                        Lift and glow on hover
                      </div>
                    </div>

                    <div className="p-6 bg-card border border-border rounded-lg animation-card-focus">
                      <input
                        type="text"
                        placeholder="Focus to animate card"
                        className="w-full bg-transparent border-none outline-none text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Loading States */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Loading Animations</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animation-loading-spin-fast" />
                        <div>
                          <div className="text-sm font-medium text-foreground">Fast Spinner</div>
                          <div className="text-xs text-foreground-secondary">Loading indicator</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animation-loading-spin-slow" />
                        <div>
                          <div className="text-sm font-medium text-foreground">Slow Spinner</div>
                          <div className="text-xs text-foreground-secondary">Gentle loading</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card border border-border rounded-lg animation-loading-pulse">
                      <div className="text-sm font-medium text-foreground">Pulse Effect</div>
                      <div className="text-xs text-foreground-secondary">
                        Subtle breathing effect
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Progress Animations</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="text-sm font-medium text-foreground mb-2">Progress Fill</div>
                      <div className="w-full bg-background-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary animation-progress-fill rounded-full"
                          style={{
                            '--progress-value': triggered ? '75%' : '0%',
                            animation: triggered ? 'progress-fill 1s ease-out' : 'none'
                          }}
                        />
                      </div>
                      <div className="text-xs text-foreground-secondary mt-1">75% Complete</div>
                    </div>

                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="text-sm font-medium text-foreground mb-2">Shimmer Effect</div>
                      <div className="h-8 bg-background-secondary rounded animation-loading-shimmer" />
                      <div className="text-xs text-foreground-secondary mt-1">Loading skeleton</div>
                    </div>
                  </div>
                </div>

                {/* Special Effects */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Special Effects</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-card border border-border rounded-lg animation-glow">
                      <div className="text-sm font-medium text-foreground">Glow Effect</div>
                      <div className="text-xs text-foreground-secondary">
                        Pulsing glow animation
                      </div>
                    </div>

                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="text-sm font-medium text-foreground mb-2">Success Check</div>
                      <div className={`inline-block ${triggered ? 'animate-checkmark' : ''}`}>
                        <CheckCircle className="w-6 h-6 text-success" />
                      </div>
                      <div className="text-xs text-foreground-secondary mt-1">
                        Animated checkmark
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Financial-Specific Animations
                </h2>
                <p className="text-foreground-secondary">
                  Specialized animations designed for financial data visualization and interactions.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Metric Cards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Metric Cards</h3>
                  <div className="grid gap-4">
                    {metricCards.map((metric, index) => {
                      const IconComponent = metric.icon;
                      return (
                        <div
                          key={metric.id}
                          className={`p-4 bg-card border border-border rounded-lg animation-metric-counter ${
                            triggered ? '' : 'opacity-0 translate-y-4'
                          }`}
                          style={{
                            animationDelay: triggered ? `${index * 150}ms` : '0ms'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {metric.label}
                                </div>
                                <div className="text-xs text-foreground-secondary">
                                  {metric.change}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-foreground">
                                {metric.value}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart Bars */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Chart Animations</h3>
                  <div className="p-6 bg-card border border-border rounded-lg">
                    <div className="flex items-end gap-2 h-32">
                      {chartBars.map((bar, index) => (
                        <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                          <div className="flex-1 w-full flex items-end justify-center">
                            <div
                              className={`w-full rounded-t animation-chart-bar ${
                                triggered ? '' : 'scale-y-0'
                              }`}
                              style={{
                                height: `${bar.value}%`,
                                backgroundColor: bar.color,
                                animationDelay: triggered ? `${index * 200}ms` : '0ms'
                              }}
                            />
                          </div>
                          <div className="text-xs font-medium text-foreground">{bar.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trading Indicators */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Trading Signals</h3>
                  <div className="space-y-3">
                    <div
                      className={`p-4 bg-success/10 border border-success/20 rounded-lg animation-trigger-enter ${
                        triggered ? 'animate' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-success" />
                        <div>
                          <div className="text-sm font-medium text-success">BUY Signal</div>
                          <div className="text-xs text-success/70">Strong upward momentum</div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 bg-destructive/10 border border-destructive/20 rounded-lg animation-trigger-scale ${
                        triggered ? 'animate' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-destructive rotate-180" />
                        <div>
                          <div className="text-sm font-medium text-destructive">SELL Signal</div>
                          <div className="text-xs text-destructive/70">
                            Bearish divergence detected
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 bg-warning/10 border border-warning/20 rounded-lg animation-trigger-slide-up ${
                        triggered ? 'animate' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        <div>
                          <div className="text-sm font-medium text-warning">HOLD Signal</div>
                          <div className="text-xs text-warning/70">Wait for clearer signals</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Portfolio Performance */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Portfolio Performance</h3>
                  <div className="p-6 bg-card border border-border rounded-lg">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-foreground">$127,459</div>
                      <div className="text-sm text-success">+12.5% this month</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground-secondary">Stocks</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-background-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full bg-success animation-progress-fill ${
                                triggered ? '' : 'w-0'
                              }`}
                              style={{
                                '--progress-value': '65%',
                                animation: triggered ? 'progress-fill 1.5s ease-out' : 'none'
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">65%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground-secondary">Bonds</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-background-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full bg-info animation-progress-fill ${
                                triggered ? '' : 'w-0'
                              }`}
                              style={{
                                '--progress-value': '25%',
                                animation: triggered ? 'progress-fill 1.5s ease-out 300ms' : 'none'
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">25%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground-secondary">Cash</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-background-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full bg-warning animation-progress-fill ${
                                triggered ? '' : 'w-0'
                              }`}
                              style={{
                                '--progress-value': '10%',
                                animation: triggered ? 'progress-fill 1.5s ease-out 600ms' : 'none'
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">10%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Accessibility Features</h2>
                <p className="text-foreground-secondary">
                  Animations that respect user preferences and enhance accessibility.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Reduced Motion Support
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        <div>
                          <div className="text-sm font-medium text-warning">
                            System Preference Detected
                          </div>
                          <div className="text-xs text-warning/70">
                            {window.matchMedia('(prefers-reduced-motion: reduce)').matches
                              ? 'Reduced motion is enabled'
                              : 'Reduced motion is disabled'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">
                        With Reduced Motion:
                      </div>
                      <ul className="text-xs text-foreground-secondary space-y-1">
                        <li>• All animations are disabled</li>
                        <li>• Transitions are set to 0.01ms</li>
                        <li>• Hover effects are removed</li>
                        <li>• Only essential visual feedback remains</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Focus Management</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Accessible Focus Effects:
                      </label>
                      <input
                        type="text"
                        placeholder="Tab to focus"
                        className="w-full p-3 bg-background border border-border rounded-lg animation-focus-ring focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Touch Target Sizes:
                      </label>
                      <button className="spacing-touch-target bg-primary text-primary-foreground rounded-lg">
                        Accessible Button
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Screen Reader Support
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                      <div className="text-sm font-medium text-info">Animation Announcements</div>
                      <div className="text-xs text-info/70 mt-1">
                        Screen readers can announce animation states and transitions
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">ARIA Live Regions:</div>
                      <div
                        role="status"
                        aria-live="polite"
                        className="text-xs text-foreground-secondary p-2 bg-background-secondary rounded"
                      >
                        Animation state changes will be announced here
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Performance Considerations
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">GPU Acceleration:</div>
                      <ul className="text-xs text-foreground-secondary space-y-1">
                        <li>• Transform and opacity properties</li>
                        <li>• Backface-visibility hidden</li>
                        <li>• Hardware acceleration enabled</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">
                        Mobile Optimization:
                      </div>
                      <ul className="text-xs text-foreground-secondary space-y-1">
                        <li>• Reduced animation durations on mobile</li>
                        <li>• Touch-friendly interaction areas</li>
                        <li>• Battery-conscious performance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-background-secondary to-background-tertiary rounded-lg p-8">
                <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                  Accessibility Standards
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary mb-2">WCAG AA</div>
                    <div className="text-sm text-foreground-secondary">
                      Compliant focus indicators
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success mb-2">44px</div>
                    <div className="text-sm text-foreground-secondary">Minimum touch targets</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-info mb-2">prefers-reduced-motion</div>
                    <div className="text-sm text-foreground-secondary">
                      System preference support
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Performance Optimizations
                </h2>
                <p className="text-foreground-secondary">
                  Animations optimized for smooth performance across all devices and browsers.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">GPU Acceleration</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-background-secondary rounded">
                      <code className="text-sm">will-change: transform, opacity</code>
                      <p className="text-xs text-foreground-secondary mt-1">
                        Hardware acceleration
                      </p>
                    </div>

                    <div className="p-3 bg-background-secondary rounded">
                      <code className="text-sm">backface-visibility: hidden</code>
                      <p className="text-xs text-foreground-secondary mt-1">Prevents flickering</p>
                    </div>

                    <div className="p-3 bg-background-secondary rounded">
                      <code className="text-sm">perspective: 1000px</code>
                      <p className="text-xs text-foreground-secondary mt-1">3D context for GPU</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Mobile Optimizations
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Faster Durations:</div>
                      <div className="text-xs text-foreground-secondary">
                        150ms instead of 250ms on mobile devices
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Reduced Complexity:</div>
                      <div className="text-xs text-foreground-secondary">
                        Simpler animations on low-performance devices
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Touch Optimization:</div>
                      <div className="text-xs text-foreground-secondary">
                        Larger touch targets with proper spacing
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Animation Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-background-secondary rounded">
                      <span className="text-sm text-foreground-secondary">60fps Target</span>
                      <span className="text-sm font-medium text-success">✓ Achieved</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-background-secondary rounded">
                      <span className="text-sm text-foreground-secondary">GPU Acceleration</span>
                      <span className="text-sm font-medium text-success">✓ Enabled</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-background-secondary rounded">
                      <span className="text-sm text-foreground-secondary">Memory Usage</span>
                      <span className="text-sm font-medium text-success">✓ Optimized</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-background-secondary rounded">
                      <span className="text-sm font-medium text-foreground-secondary">
                        Bundle Size Impact
                      </span>
                      <span className="text-sm font-medium text-info">~8KB</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Browser Support</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-success/10 rounded">
                        <div className="text-lg font-bold text-success">Chrome</div>
                        <div className="text-xs text-success/70">Full support</div>
                      </div>

                      <div className="text-center p-3 bg-success/10 rounded">
                        <div className="text-lg font-bold text-success">Firefox</div>
                        <div className="text-xs text-success/70">Full support</div>
                      </div>

                      <div className="text-center p-3 bg-success/10 rounded">
                        <div className="text-lg font-bold text-success">Safari</div>
                        <div className="text-xs text-success/70">Full support</div>
                      </div>

                      <div className="text-center p-3 bg-success/10 rounded">
                        <div className="text-lg font-bold text-success">Edge</div>
                        <div className="text-xs text-success/70">Full support</div>
                      </div>
                    </div>

                    <div className="text-xs text-foreground-secondary text-center">
                      Modern browser support with graceful degradation
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Performance Best Practices
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Do's ✅</h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Use transform and opacity for animations</li>
                      <li>• Limit animation duration to 500ms or less</li>
                      <li>• Use CSS custom properties for consistency</li>
                      <li>• Respect prefers-reduced-motion</li>
                      <li>• Test animations on target devices</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Don'ts ❌</h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Don't animate layout properties (width, height, etc.)</li>
                      <li>• Don't use infinite animations without purpose</li>
                      <li>• Don't ignore mobile performance</li>
                      <li>• Don't forget accessibility considerations</li>
                      <li>• Don't over-animate (keep it subtle)</li>
                    </ul>
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

export default AnimationSystemDemo;
