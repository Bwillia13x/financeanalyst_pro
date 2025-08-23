import { HelpCircle, X, BookOpen, Calculator, TrendingUp, AlertCircle, ChevronRight, ExternalLink } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils/cn';

/**
 * Comprehensive contextual help and onboarding system for financial features
 * Provides intelligent tooltips, guided tours, and contextual assistance
 */

// Help content database
const helpContent = {
  dcf: {
    title: 'Discounted Cash Flow (DCF) Analysis',
    description: 'Estimates company value by projecting future cash flows and discounting them to present value.',
    keyPoints: [
      'Projects free cash flows for 5-10 years',
      'Calculates terminal value for perpetual growth',
      'Uses weighted average cost of capital (WACC) as discount rate',
      'Highly sensitive to growth and discount rate assumptions'
    ],
    formulas: [
      'FCF = EBIT(1-Tax Rate) + Depreciation - CapEx - Working Capital Change',
      'Terminal Value = FCF × (1+g) / (WACC - g)',
      'Enterprise Value = Σ(FCF/(1+WACC)^t) + Terminal Value/(1+WACC)^n'
    ],
    tips: [
      'Use conservative growth rates for terminal value (2-4%)',
      'Validate WACC calculation with industry benchmarks',
      'Perform sensitivity analysis on key assumptions',
      'Cross-reference with comparable company multiples'
    ]
  },
  lbo: {
    title: 'Leveraged Buyout (LBO) Analysis',
    description: 'Models acquisition using significant debt financing to achieve target returns.',
    keyPoints: [
      'High debt-to-equity ratio (60-90% debt typical)',
      'Focus on debt paydown and equity value creation',
      'Requires strong, predictable cash flows',
      'Exit typically through sale or IPO after 3-7 years'
    ],
    formulas: [
      'Equity IRR = (Exit Equity Value / Initial Equity Investment)^(1/years) - 1',
      'Debt Service Coverage = EBITDA / (Interest + Principal Payments)',
      'Exit Multiple = Exit Enterprise Value / Exit EBITDA'
    ],
    tips: [
      'Model different debt structures and covenants',
      'Include management fees and transaction costs',
      'Test downside scenarios for covenant compliance',
      'Consider operational improvements in projections'
    ]
  },
  wacc: {
    title: 'Weighted Average Cost of Capital (WACC)',
    description: 'Blended cost of debt and equity financing used as discount rate in valuations.',
    keyPoints: [
      'Reflects risk and capital structure of the business',
      'Used as discount rate in DCF analysis',
      'Lower WACC increases company valuation',
      'Varies by industry and company size'
    ],
    formulas: [
      'WACC = (E/V × Re) + (D/V × Rd × (1-Tax Rate))',
      'Cost of Equity (Re) = Risk-free Rate + Beta × Market Risk Premium',
      'After-tax Cost of Debt = Pre-tax Rate × (1-Tax Rate)'
    ],
    tips: [
      'Use market values, not book values, for weights',
      'Consider company-specific risk factors',
      'Review beta calculation methodology',
      'Update regularly as market conditions change'
    ]
  },
  ratios: {
    title: 'Financial Ratio Analysis',
    description: 'Key metrics for evaluating financial performance, efficiency, and risk.',
    keyPoints: [
      'Liquidity ratios measure short-term obligations',
      'Leverage ratios assess debt and financial risk',
      'Profitability ratios evaluate operational efficiency',
      'Valuation ratios compare market vs. intrinsic value'
    ],
    formulas: [
      'Current Ratio = Current Assets / Current Liabilities',
      'Debt-to-Equity = Total Debt / Total Equity',
      'ROE = Net Income / Shareholders Equity',
      'P/E Ratio = Price per Share / Earnings per Share'
    ],
    tips: [
      'Compare ratios to industry benchmarks',
      'Look at trends over multiple periods',
      'Consider seasonal business variations',
      'Understand accounting policy impacts'
    ]
  },
  montecarlo: {
    title: 'Monte Carlo Simulation',
    description: 'Uses random sampling to model uncertainty in financial projections.',
    keyPoints: [
      'Tests thousands of scenarios with variable inputs',
      'Provides probability distributions of outcomes',
      'Helps quantify risks and uncertainties',
      'Useful for complex models with multiple variables'
    ],
    formulas: [
      'Confidence Interval = Percentile(results, confidence_level)',
      'Value at Risk = Percentile(results, risk_level)',
      'Expected Value = Mean(simulation_results)'
    ],
    tips: [
      'Define realistic ranges for input variables',
      'Use appropriate probability distributions',
      'Run sufficient iterations (10,000+) for stability',
      'Validate results against historical data'
    ]
  }
};

// Tooltip component
export const FinancialTooltip = ({
  content,
  position = 'top',
  trigger = 'hover',
  className,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      let top, left;

      switch (position) {
        case 'top':
          top = triggerRect.top + scrollTop - tooltipRect.height - 8;
          left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + scrollTop + 8;
          left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left + scrollLeft - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + scrollLeft + 8;
          break;
        default:
          top = triggerRect.top + scrollTop - tooltipRect.height - 8;
          left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
      }

      // Keep tooltip within viewport
      const padding = 16;
      if (left < padding) left = padding;
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }
      if (top < padding) top = triggerRect.bottom + scrollTop + 8;

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const triggerProps = trigger === 'hover'
    ? { onMouseEnter: showTooltip, onMouseLeave: hideTooltip }
    : { onClick: () => setIsVisible(!isVisible) };

  return (
    <>
      <span ref={triggerRef} className={className} {...triggerProps}>
        {children}
      </span>

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-50 max-w-sm p-3 bg-slate-900 text-white text-sm rounded-lg shadow-lg pointer-events-none"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          <div className="relative">
            {typeof content === 'string' ? (
              <p>{content}</p>
            ) : (
              <div className="space-y-2">
                {content.title && <div className="font-semibold">{content.title}</div>}
                {content.description && <p className="text-slate-300">{content.description}</p>}
                {content.formula && (
                  <div className="bg-slate-800 px-2 py-1 rounded text-xs font-mono">
                    {content.formula}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// Help icon with tooltip
export const HelpIcon = ({ helpKey, className }) => {
  const help = helpContent[helpKey];
  if (!help) return null;

  return (
    <FinancialTooltip
      content={{
        title: help.title,
        description: help.description,
        formula: help.formulas?.[0]
      }}
      className={cn('inline-flex items-center justify-center cursor-help', className)}
    >
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600" />
    </FinancialTooltip>
  );
};

// Comprehensive help panel
export const HelpPanel = ({ helpKey, isOpen, onClose }) => {
  const help = helpContent[helpKey];
  if (!help || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">{help.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <p className="text-slate-700 leading-relaxed">{help.description}</p>
            </div>

            {/* Key Points */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Key Points
              </h3>
              <ul className="space-y-2">
                {help.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Formulas */}
            {help.formulas && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-3 flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-purple-600" />
                  Key Formulas
                </h3>
                <div className="space-y-2">
                  {help.formulas.map((formula, index) => (
                    <div key={index} className="bg-slate-100 p-3 rounded-lg">
                      <code className="text-sm text-slate-800 font-mono">{formula}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                Best Practices
              </h3>
              <ul className="space-y-2">
                {help.tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-slate-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional Resources */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Need more help?</span>
                <a
                  href="mailto:support@financeanalystpro.com"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>Contact Support</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Onboarding tour component
export const OnboardingTour = ({ steps, isActive, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const element = document.querySelector(steps[currentStep].target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Highlight the target element
        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';

        // Position tooltip with strict viewport constraints
        const tooltipWidth = 320;
        const tooltipHeight = 250; // increased to account for buttons
        const padding = 20;

        let top = rect.bottom + scrollTop + 12;
        let left = rect.left + scrollLeft;

        // Ensure tooltip stays within horizontal bounds
        const maxLeft = window.innerWidth - tooltipWidth - padding;
        const minLeft = padding;
        left = Math.max(minLeft, Math.min(left, maxLeft));

        // Ensure tooltip stays within vertical bounds
        const maxTop = window.innerHeight + scrollTop - tooltipHeight - padding;
        const minTop = scrollTop + padding;

        if (top > maxTop) {
          // Position above target if no room below
          top = Math.max(rect.top + scrollTop - tooltipHeight - 12, minTop);
        }

        top = Math.max(minTop, Math.min(top, maxTop));

        setTooltipPosition({ top, left });
      }
    }

    return () => {
      // Clean up highlighting
      if (steps[currentStep]) {
        const element = document.querySelector(steps[currentStep].target);
        if (element) {
          element.style.position = '';
          element.style.zIndex = '';
          element.style.boxShadow = '';
        }
      }
    };
  }, [currentStep, isActive, steps]);

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const nextStep = () => {
    try {
      if (isLastStep) {
        // Delay completion to ensure UI is stable
        setTimeout(() => {
          try {
            onComplete();
          } catch (error) {
            console.error('Error in onComplete:', error);
          }
        }, 100);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error in nextStep:', error);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" style={{ zIndex: 1000 }} />

      {/* Tooltip */}
      <div
        className="fixed max-w-sm bg-white rounded-lg shadow-xl border border-slate-200"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          zIndex: 1002
        }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-slate-900">{step.title}</h3>
            <button
              onClick={onSkip}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-slate-700 mb-4">{step.content}</p>

          {step.tip && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">{step.tip}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full',
                    index === currentStep ? 'bg-blue-600' : 'bg-slate-300'
                  )}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                >
                  Back
                </button>
              )}
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                aria-label={isLastStep ? 'Finish' : 'Next'}
              >
                {isLastStep ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default {
  FinancialTooltip,
  HelpIcon,
  HelpPanel,
  OnboardingTour,
  helpContent
};
