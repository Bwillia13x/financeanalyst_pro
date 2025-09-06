import React, { useState, useEffect } from 'react';

import Header from '../components/ui/Header';
import {
  PulseDot,
  LoadingSpinner,
  SuccessCheckmark,
  HoverCard,
  RippleButton,
  StatusIndicator,
  ProgressRing,
  ToastNotification,
  AnimatedNumber,
  SkeletonText,
  SkeletonCard
} from '../components/ui/MicroInteractions';

const MicroInteractionsDemo = () => {
  const [showToast, setShowToast] = useState(false);
  const [progress, setProgress] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Animate progress ring
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 2));
    }, 100);

    // Animate number
    setTimeout(() => setAnimatedValue(1234567), 1000);

    return () => clearInterval(interval);
  }, []);

  const showNotification = type => {
    setShowToast(type);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16 p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Micro-interactions Showcase</h1>
          <p className="text-foreground-secondary">
            Subtle animations and interactions that enhance the user experience with visual feedback
            and polish.
          </p>
        </div>

        {/* Pulse Dots */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Status Indicators</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            <div className="text-center space-y-3">
              <PulseDot active color="blue" size="lg" />
              <p className="text-sm text-foreground-secondary">Active Blue</p>
            </div>
            <div className="text-center space-y-3">
              <PulseDot active={false} color="green" size="lg" />
              <p className="text-sm text-foreground-secondary">Static Green</p>
            </div>
            <div className="text-center space-y-3">
              <PulseDot active color="red" size="lg" />
              <p className="text-sm text-foreground-secondary">Active Red</p>
            </div>
            <div className="text-center space-y-3">
              <PulseDot active color="yellow" size="lg" />
              <p className="text-sm text-foreground-secondary">Active Yellow</p>
            </div>
            <div className="text-center space-y-3">
              <PulseDot active color="purple" size="lg" />
              <p className="text-sm text-foreground-secondary">Active Purple</p>
            </div>
            <div className="text-center space-y-3">
              <PulseDot active color="gray" size="lg" />
              <p className="text-sm text-foreground-secondary">Active Gray</p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Complex Status Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatusIndicator status="loading" showLabel />
            <StatusIndicator status="success" showLabel />
            <StatusIndicator status="error" showLabel />
            <StatusIndicator status="warning" showLabel />
            <StatusIndicator status="active" showLabel />
            <StatusIndicator status="idle" showLabel />
          </div>
        </div>

        {/* Loading Spinners */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Loading Spinners</h2>
          <div className="flex flex-wrap gap-8">
            <div className="text-center space-y-3">
              <LoadingSpinner size="xs" />
              <p className="text-sm text-foreground-secondary">Extra Small</p>
            </div>
            <div className="text-center space-y-3">
              <LoadingSpinner size="sm" />
              <p className="text-sm text-foreground-secondary">Small</p>
            </div>
            <div className="text-center space-y-3">
              <LoadingSpinner size="md" />
              <p className="text-sm text-foreground-secondary">Medium</p>
            </div>
            <div className="text-center space-y-3">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-foreground-secondary">Large</p>
            </div>
            <div className="text-center space-y-3">
              <LoadingSpinner size="xl" />
              <p className="text-sm text-foreground-secondary">Extra Large</p>
            </div>
          </div>
        </div>

        {/* Success Checkmarks */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Success Checkmarks</h2>
          <div className="flex gap-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <SuccessCheckmark size="lg" className="text-green-600" />
              </div>
              <p className="text-sm text-foreground-secondary">Large</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <SuccessCheckmark size="md" className="text-green-600" delay={500} />
              </div>
              <p className="text-sm text-foreground-secondary">Medium (Delayed)</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <SuccessCheckmark size="sm" className="text-green-600" delay={1000} />
              </div>
              <p className="text-sm text-foreground-secondary">Small (Delayed)</p>
            </div>
          </div>
        </div>

        {/* Hover Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Interactive Hover Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HoverCard scale glow className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-medium text-foreground mb-2">Scale + Glow</h3>
              <p className="text-foreground-secondary">Hover to see the scale and glow effect</p>
            </HoverCard>

            <HoverCard lift className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-medium text-foreground mb-2">Lift Effect</h3>
              <p className="text-foreground-secondary">Hover to see the lift animation</p>
            </HoverCard>

            <HoverCard
              scale={false}
              lift={false}
              glow
              className="p-6 bg-card border border-border rounded-lg"
            >
              <h3 className="text-lg font-medium text-foreground mb-2">Glow Only</h3>
              <p className="text-foreground-secondary">Hover for glow effect only</p>
            </HoverCard>
          </div>
        </div>

        {/* Ripple Buttons */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Ripple Effects</h2>
          <div className="flex flex-wrap gap-4">
            <RippleButton
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-smooth"
              rippleColor="rgba(255, 255, 255, 0.3)"
            >
              Click for Ripple
            </RippleButton>
            <RippleButton
              className="px-6 py-3 bg-success text-success-foreground rounded-lg hover:opacity-90 transition-smooth"
              rippleColor="rgba(255, 255, 255, 0.4)"
            >
              Green Ripple
            </RippleButton>
            <RippleButton
              className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-smooth"
              rippleColor="rgba(255, 255, 255, 0.3)"
            >
              Purple Ripple
            </RippleButton>
          </div>
        </div>

        {/* Progress Rings */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Progress Rings</h2>
          <div className="flex flex-wrap gap-8 justify-center">
            <div className="text-center space-y-3">
              <ProgressRing progress={progress} color="blue" />
              <p className="text-sm text-foreground-secondary">Animated Blue</p>
            </div>
            <div className="text-center space-y-3">
              <ProgressRing progress={75} color="green" />
              <p className="text-sm text-foreground-secondary">Static Green</p>
            </div>
            <div className="text-center space-y-3">
              <ProgressRing progress={45} color="red" />
              <p className="text-sm text-foreground-secondary">Static Red</p>
            </div>
            <div className="text-center space-y-3">
              <ProgressRing progress={90} color="yellow" />
              <p className="text-sm text-foreground-secondary">Static Yellow</p>
            </div>
          </div>
        </div>

        {/* Animated Numbers */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Animated Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-card border border-border rounded-lg text-center">
              <AnimatedNumber value={animatedValue} className="text-3xl font-bold text-primary" />
              <p className="text-sm text-foreground-secondary mt-2">Formatted Number</p>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg text-center">
              <AnimatedNumber
                value={animatedValue}
                duration={2000}
                format={n => `$${n.toLocaleString()}`}
                className="text-3xl font-bold text-success"
              />
              <p className="text-sm text-foreground-secondary mt-2">Currency Format</p>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg text-center">
              <AnimatedNumber
                value={animatedValue}
                duration={500}
                format={n => `${(n / 1000).toFixed(1)}K`}
                className="text-3xl font-bold text-accent"
              />
              <p className="text-sm text-foreground-secondary mt-2">Compact Format</p>
            </div>
          </div>
        </div>

        {/* Toast Notifications */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Toast Notifications</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => showNotification('success')}
              className="px-4 py-2 bg-success text-success-foreground rounded-lg hover:opacity-90 transition-smooth"
            >
              Show Success Toast
            </button>
            <button
              onClick={() => showNotification('error')}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-smooth"
            >
              Show Error Toast
            </button>
            <button
              onClick={() => showNotification('warning')}
              className="px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:opacity-90 transition-smooth"
            >
              Show Warning Toast
            </button>
            <button
              onClick={() => showNotification('info')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-smooth"
            >
              Show Info Toast
            </button>
          </div>
        </div>

        {/* Skeleton Components */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Skeleton Loaders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Text Skeletons</h3>
              <SkeletonText lines={1} width="full" />
              <SkeletonText lines={2} width="long" />
              <SkeletonText lines={3} width="medium" />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Card Skeletons</h3>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Practical Usage Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-background text-foreground p-6 rounded-lg border border-border">
              <h3 className="text-lg font-medium mb-4">Loading States</h3>
              <pre className="text-sm overflow-x-auto">{`// Use with existing components
<LoadingWrapper isLoading={loading}>
  <DataTable data={data} />
</LoadingWrapper>

// Or use skeletons directly
{loading ? (
  <FinancialTableSkeleton rows={10} />
) : (
  <DataTable data={data} />
)}`}
              </pre>
            </div>

            <div className="bg-background text-foreground p-6 rounded-lg border border-border">
              <h3 className="text-lg font-medium mb-4">Interactive Feedback</h3>
              <pre className="text-sm overflow-x-auto">{`// Enhanced button with ripple
<RippleButton
  className="btn-primary"
  onClick={handleAction}
>
  Save Changes
</RippleButton>

// Status indicator
<StatusIndicator
  status={connectionStatus}
  showLabel
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {showToast && (
        <ToastNotification
          type={showToast}
          message={`This is a ${showToast} notification!`}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default MicroInteractionsDemo;
