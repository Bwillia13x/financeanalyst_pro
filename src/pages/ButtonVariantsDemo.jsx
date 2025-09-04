import React from 'react';

import Button from '../components/ui/Button';
import Header from '../components/ui/Header';

const ButtonVariantsDemo = () => {
  const buttonVariants = [
    { variant: 'primary', label: 'Primary' },
    { variant: 'secondary', label: 'Secondary' },
    { variant: 'gradient', label: 'Gradient' },
    { variant: 'gradientPrimary', label: 'Gradient Primary' },
    { variant: 'gradientSuccess', label: 'Gradient Success' },
    { variant: 'success', label: 'Success' },
    { variant: 'warning', label: 'Warning' },
    { variant: 'danger', label: 'Danger' },
    { variant: 'info', label: 'Info' },
    { variant: 'outline', label: 'Outline' },
    { variant: 'ghost', label: 'Ghost' },
    { variant: 'subtle', label: 'Subtle' },
    { variant: 'glass', label: 'Glass' },
    { variant: 'glow', label: 'Glow' },
    { variant: 'elevated', label: 'Elevated' },
    { variant: 'link', label: 'Link' }
  ];

  const buttonSizes = [
    { size: 'xs', label: 'Extra Small' },
    { size: 'sm', label: 'Small' },
    { size: 'default', label: 'Default' },
    { size: 'lg', label: 'Large' },
    { size: 'xl', label: 'Extra Large' },
    { size: '2xl', label: '2X Large' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16 p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Button Variants Showcase</h1>
          <p className="text-foreground-secondary">
            Explore all available button variants, sizes, and states with enhanced visual effects.
          </p>
        </div>

        {/* Variants Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Button Variants</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {buttonVariants.map(({ variant, label }) => (
              <div key={variant} className="space-y-3">
                <h3 className="text-sm font-medium text-foreground-secondary text-center">
                  {label}
                </h3>
                <Button variant={variant} className="w-full">
                  {label}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Sizes Demonstration */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Button Sizes</h2>
          <div className="space-y-4">
            {buttonSizes.map(({ size, label }) => (
              <div key={size} className="flex items-center space-x-4">
                <span className="text-sm font-medium text-foreground-secondary w-24">{label}</span>
                <Button variant="gradientPrimary" size={size}>
                  {label} Button
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive States */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Interactive States</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Hover Effects</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="gradientPrimary" iconName="Star">
                  With Icon
                </Button>
                <Button variant="elevated" iconName="Heart" iconPosition="right">
                  Icon Right
                </Button>
                <Button variant="glow">Glow Effect</Button>
                <Button variant="glass">Glass Morphism</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Loading States</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="gradientPrimary" loading>
                  Loading...
                </Button>
                <Button variant="outline" loading size="sm">
                  Small Loading
                </Button>
                <Button variant="success" loading>
                  Success Loading
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Disabled States</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="gradientPrimary" disabled>
                  Disabled
                </Button>
                <Button variant="outline" disabled>
                  Disabled Outline
                </Button>
                <Button variant="ghost" disabled>
                  Disabled Ghost
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Real-world Usage Examples</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background-secondary p-6 rounded-lg border border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">Primary Actions</h3>
              <div className="space-y-3">
                <Button variant="gradientPrimary" fullWidth>
                  Get Started Free
                </Button>
                <Button variant="gradient" fullWidth>
                  Start Analysis
                </Button>
                <Button variant="elevated" fullWidth>
                  Learn More
                </Button>
              </div>
            </div>

            <div className="bg-background-secondary p-6 rounded-lg border border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">Secondary Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" fullWidth>
                  View Details
                </Button>
                <Button variant="ghost" fullWidth>
                  Edit Settings
                </Button>
                <Button variant="subtle" fullWidth>
                  Export Data
                </Button>
              </div>
            </div>

            <div className="bg-background-secondary p-6 rounded-lg border border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">Status Actions</h3>
              <div className="space-y-3">
                <Button variant="success" fullWidth>
                  ✓ Analysis Complete
                </Button>
                <Button variant="warning" fullWidth>
                  ⚠ Review Required
                </Button>
                <Button variant="danger" fullWidth>
                  ✗ Error Detected
                </Button>
              </div>
            </div>

            <div className="bg-background-secondary p-6 rounded-lg border border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">Special Effects</h3>
              <div className="space-y-3">
                <Button variant="glow" fullWidth>
                  ✨ Premium Feature
                </Button>
                <Button variant="glass" fullWidth>
                  🔮 Advanced Tools
                </Button>
                <Button variant="link" fullWidth>
                  View Documentation →
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Code Examples</h2>
          <div className="bg-slate-900 text-slate-100 p-6 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`// Gradient button with enhanced effects
<Button variant="gradientPrimary" size="lg">
  Get Started
</Button>

// Button with icon and loading state
<Button
  variant="elevated"
  iconName="Download"
  loading={isDownloading}
>
  Export Report
</Button>

// Glass morphism effect
<Button variant="glass">
  Advanced Settings
</Button>

// Glow effect for premium features
<Button variant="glow" size="lg">
  Upgrade to Pro
</Button>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonVariantsDemo;
