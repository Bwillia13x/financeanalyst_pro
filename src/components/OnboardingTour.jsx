import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Icon from './AppIcon';
import Button from './ui/Button';

const OnboardingTour = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to FinanceAnalyst Pro',
      description:
        "Your comprehensive financial modeling and analysis platform. Let's take a quick tour to get you started.",
      icon: 'Sparkles',
      target: null,
      position: 'center'
    },
    {
      id: 'navigation',
      title: 'Navigation Menu',
      description:
        'Access our three main workspaces: Financial Modeling, Real-time Data, and Scenario Analysis.',
      icon: 'Menu',
      target: '[data-tour="navigation"]',
      position: 'bottom'
    },
    {
      id: 'terminal',
      title: 'Terminal Interface',
      description:
        'Use our powerful command-line interface for quick analysis. Press Ctrl+/ to open it anytime.',
      icon: 'Terminal',
      target: '[data-tour="terminal-button"]',
      position: 'top'
    },
    {
      id: 'data-sources',
      title: 'Data Sources',
      description:
        'We integrate with multiple financial data providers. You can use demo mode or configure your own API keys.',
      icon: 'Database',
      target: '[data-tour="data-toggle"]',
      position: 'left'
    },
    {
      id: 'workspace',
      title: 'Financial Modeling Workspace',
      description:
        'Build DCF models, LBO analysis, and comparable company valuations with our advanced tools.',
      icon: 'Calculator',
      target: '[data-tour="financial-workspace"]',
      position: 'right'
    },
    {
      id: 'complete',
      title: "You're All Set!",
      description:
        'Start exploring FinanceAnalyst Pro. Check out our User Guide for detailed instructions and best practices.',
      icon: 'CheckCircle',
      target: null,
      position: 'center'
    }
  ];

  useEffect(() => {
    // Check if user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('financeanalyst-onboarding-completed');
    if (!hasCompletedOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('financeanalyst-onboarding-completed', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('financeanalyst-onboarding-completed', 'true');
    setIsVisible(false);
    onSkip?.();
  };

  const getTooltipPosition = (target, position) => {
    if (!target) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const element = document.querySelector(target);
    if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (position) {
      case 'top':
        return {
          top: rect.top - tooltipHeight - 20,
          left: rect.left + rect.width / 2 - tooltipWidth / 2
        };
      case 'bottom':
        return {
          top: rect.bottom + 20,
          left: rect.left + rect.width / 2 - tooltipWidth / 2
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - 20
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + 20
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  const currentStepData = steps[currentStep];
  const tooltipStyle = getTooltipPosition(currentStepData.target, currentStepData.position);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Spotlight effect for targeted elements */}
      {currentStepData.target && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${tooltipStyle.left + 160}px ${tooltipStyle.top + 100}px, transparent 100px, rgba(0,0,0,0.7) 200px)`
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm"
          style={tooltipStyle}
        >
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name={currentStepData.icon} size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="flex items-center space-x-1"
                >
                  <Icon name="ChevronLeft" size={14} />
                  <span>Previous</span>
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                Skip Tour
              </Button>
              <Button size="sm" onClick={handleNext} className="flex items-center space-x-1">
                <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                {currentStep < steps.length - 1 && <Icon name="ChevronRight" size={14} />}
              </Button>
            </div>
          </div>

          {/* Special content for final step */}
          {currentStep === steps.length - 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Icon name="BookOpen" size={16} />
                <span>Check out the</span>
                <a
                  href="/user-guide"
                  className="text-primary hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  User Guide
                </a>
                <span>for detailed instructions</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Keyboard shortcuts hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg"
      >
        <div className="flex items-center space-x-2">
          <Icon name="Keyboard" size={14} />
          <span>Press ESC to skip tour</span>
        </div>
      </motion.div>
    </>
  );
};

OnboardingTour.propTypes = {
  onComplete: PropTypes.func,
  onSkip: PropTypes.func
};

// Hook to manage onboarding state
export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('financeanalyst-onboarding-completed');
    if (!hasCompleted) {
      // Delay showing onboarding to let the app load
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem('financeanalyst-onboarding-completed');
    setShowOnboarding(true);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    resetOnboarding,
    completeOnboarding
  };
};

export default OnboardingTour;
