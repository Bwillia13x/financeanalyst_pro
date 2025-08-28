import {
  AlertTriangle,
  CheckCircle,
  Calculator,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import { cn } from '../../utils/cn';

/**
 * Real-time financial data validation and calculation feedback component
 * Provides instant validation and contextual insights for financial inputs
 */
const FinancialValidator = ({
  value,
  fieldType,
  context = {},
  onValidationChange,
  showSuggestions = true,
  showCalculations = true,
  className
}) => {
  const [validationResult, setValidationResult] = useState({});
  const [calculationFeedback, setCalculationFeedback] = useState({});

  // Financial validation rules
  const validationRules = useMemo(
    () => ({
      revenue: {
        min: 0,
        max: 1e12, // $1 trillion max
        required: true,
        format: 'currency',
        suggestions: [
          'Check if amount includes all revenue streams',
          'Verify currency units (thousands, millions)'
        ]
      },
      expense: {
        min: 0,
        max: 1e12,
        required: false,
        format: 'currency',
        suggestions: [
          'Ensure all related costs are included',
          'Consider depreciation and amortization'
        ]
      },
      percentage: {
        min: -100,
        max: 1000, // Allow for high growth rates
        required: false,
        format: 'percentage',
        suggestions: ['Typical ranges vary by industry', 'Consider seasonal fluctuations']
      },
      ratio: {
        min: 0,
        max: 100,
        required: false,
        format: 'decimal',
        suggestions: ['Compare against industry benchmarks', 'Review calculation methodology']
      },
      shares: {
        min: 1,
        max: 1e12,
        required: true,
        format: 'integer',
        suggestions: ['Verify share count is post-split adjusted', 'Check for treasury shares']
      },
      price: {
        min: 0.01,
        max: 10000,
        required: true,
        format: 'currency',
        suggestions: ['Ensure price is per share', 'Check for currency conversion']
      }
    }),
    []
  );

  // Perform validation
  useEffect(() => {
    const validateField = () => {
      const rules = validationRules[fieldType];
      if (!rules) return { isValid: true, errors: [], warnings: [] };

      const numValue = parseFloat(value) || 0;
      const errors = [];
      const warnings = [];
      const suggestions = [];

      // Required field validation
      if (rules.required && (!value || value === '')) {
        errors.push('This field is required');
      }

      // Range validation
      if (value && !isNaN(numValue)) {
        if (numValue < rules.min) {
          errors.push(`Value must be at least ${rules.min}`);
        }
        if (numValue > rules.max) {
          errors.push(`Value exceeds maximum of ${rules.max.toLocaleString()}`);
        }

        // Contextual warnings
        if (fieldType === 'revenue' && context.previousYear) {
          const growth = ((numValue - context.previousYear) / context.previousYear) * 100;
          if (Math.abs(growth) > 50) {
            warnings.push(
              `${growth > 0 ? 'Growth' : 'Decline'} of ${Math.abs(growth).toFixed(1)}% seems unusually high`
            );
            suggestions.push('Verify calculation and consider one-time events');
          }
        }

        if (fieldType === 'percentage' && Math.abs(numValue) > 100) {
          warnings.push('Percentage values over 100% are unusual');
          suggestions.push('Consider if this should be a decimal (e.g., 1.5 instead of 150%)');
        }

        if (fieldType === 'expense' && context.revenue) {
          const expenseRatio = (numValue / context.revenue) * 100;
          if (expenseRatio > 200) {
            warnings.push(`Expense is ${expenseRatio.toFixed(1)}% of revenue`);
            suggestions.push('Review if this expense category is correctly allocated');
          }
        }
      }

      // Format validation
      if (value && rules.format === 'integer' && numValue !== Math.floor(numValue)) {
        warnings.push('Value should be a whole number');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions: suggestions.concat(rules.suggestions || [])
      };
    };

    const result = validateField();
    setValidationResult(result);
    onValidationChange?.(result);
  }, [value, fieldType, context, validationRules, onValidationChange]);

  // Calculate derived metrics and feedback
  useEffect(() => {
    const calculateFeedback = () => {
      const numValue = parseFloat(value) || 0;
      const feedback = {};

      if (fieldType === 'revenue' && context.shares) {
        feedback.revenuePerShare = {
          value: numValue / context.shares,
          label: 'Revenue per Share',
          format: 'currency'
        };
      }

      if (fieldType === 'price' && context.earnings) {
        feedback.peRatio = {
          value: numValue / context.earnings,
          label: 'P/E Ratio',
          format: 'decimal'
        };

        if (feedback.peRatio.value > 30) {
          feedback.peRatio.warning = 'High P/E ratio may indicate overvaluation';
        } else if (feedback.peRatio.value < 10) {
          feedback.peRatio.warning = 'Low P/E ratio may indicate undervaluation or poor prospects';
        }
      }

      if (fieldType === 'expense' && context.revenue) {
        feedback.expenseMargin = {
          value: (numValue / context.revenue) * 100,
          label: 'Expense Margin',
          format: 'percentage'
        };
      }

      if (fieldType === 'percentage' && context.benchmarkRange) {
        const [min, max] = context.benchmarkRange;
        if (numValue < min) {
          feedback.benchmark = {
            message: `Below industry range (${min}%-${max}%)`,
            type: 'warning'
          };
        } else if (numValue > max) {
          feedback.benchmark = {
            message: `Above industry range (${min}%-${max}%)`,
            type: 'info'
          };
        } else {
          feedback.benchmark = {
            message: `Within industry range (${min}%-${max}%)`,
            type: 'success'
          };
        }
      }

      setCalculationFeedback(feedback);
    };

    if (value && !isNaN(parseFloat(value))) {
      calculateFeedback();
    } else {
      setCalculationFeedback({});
    }
  }, [value, fieldType, context]);

  // Format value for display
  const formatValue = (val, format) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(num);
      case 'percentage':
        return `${num.toFixed(2)}%`;
      case 'decimal':
        return num.toFixed(2);
      default:
        return num.toLocaleString();
    }
  };

  const hasErrors = validationResult.errors?.length > 0;
  const hasWarnings = validationResult.warnings?.length > 0;
  const hasFeedback = Object.keys(calculationFeedback).length > 0;

  if (!hasErrors && !hasWarnings && !hasFeedback && !showSuggestions) {
    return null;
  }

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      {/* Validation Errors */}
      {hasErrors && (
        <div className="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-800">Validation Error</div>
            <ul className="text-xs text-red-700 mt-1 space-y-1">
              {validationResult.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Validation Warnings */}
      {hasWarnings && (
        <div className="flex items-start space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-yellow-800">Review Needed</div>
            <ul className="text-xs text-yellow-700 mt-1 space-y-1">
              {validationResult.warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Calculation Feedback */}
      {showCalculations && hasFeedback && (
        <div className="space-y-2">
          {Object.entries(calculationFeedback).map(([key, feedback]) => {
            if (feedback.value !== undefined) {
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-3 h-3 text-blue-600" />
                    <span className="text-sm text-blue-800">{feedback.label}:</span>
                  </div>
                  <div className="text-sm font-medium text-blue-900">
                    {formatValue(feedback.value, feedback.format)}
                    {feedback.warning && (
                      <div className="text-xs text-yellow-600 mt-1">{feedback.warning}</div>
                    )}
                  </div>
                </div>
              );
            } else if (feedback.message) {
              const Icon =
                feedback.type === 'success'
                  ? CheckCircle
                  : feedback.type === 'warning'
                    ? AlertTriangle
                    : Info;
              const colorClass =
                feedback.type === 'success'
                  ? 'text-green-600'
                  : feedback.type === 'warning'
                    ? 'text-yellow-600'
                    : 'text-blue-600';

              return (
                <div
                  key={key}
                  className="flex items-center space-x-2 p-2 bg-slate-50 border border-slate-200 rounded-md"
                >
                  <Icon className={`w-3 h-3 ${colorClass}`} />
                  <span className="text-sm text-slate-700">{feedback.message}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && validationResult.suggestions?.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-800 flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>Show suggestions ({validationResult.suggestions.length})</span>
          </summary>
          <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
            <ul className="text-xs text-slate-600 space-y-1">
              {validationResult.suggestions.slice(0, 3).map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}

      {/* Real-time trend indicator */}
      {context.previousValue && value && !isNaN(parseFloat(value)) && (
        <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md">
          <span className="text-xs text-slate-600">Change from previous:</span>
          <div className="flex items-center space-x-1">
            {parseFloat(value) > context.previousValue ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : parseFloat(value) < context.previousValue ? (
              <TrendingDown className="w-3 h-3 text-red-600" />
            ) : null}
            <span
              className={`text-xs font-medium ${
                parseFloat(value) > context.previousValue
                  ? 'text-green-600'
                  : parseFloat(value) < context.previousValue
                    ? 'text-red-600'
                    : 'text-slate-600'
              }`}
            >
              {(
                ((parseFloat(value) - context.previousValue) / context.previousValue) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialValidator;
