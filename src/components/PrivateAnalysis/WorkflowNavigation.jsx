import { motion } from 'framer-motion';
import {
  Database,
  Calculator,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import React, { useState } from 'react';

const WorkflowNavigation = ({
  activeStep,
  onStepChange,
  dataCompleteness,
  modelingProgress,
  analysisProgress,
  validationErrors = {}
}) => {
  const [showHelpFor, setShowHelpFor] = useState(null);

  // Calculate step statuses based on progress
  const getStepStatus = (stepId) => {
    switch (stepId) {
      case 'data':
        if (dataCompleteness >= 80) return 'completed';
        if (dataCompleteness > 0) return 'in-progress';
        return 'pending';

      case 'modeling':
        if (dataCompleteness < 50) return 'disabled';
        if (modelingProgress >= 80) return 'completed';
        if (modelingProgress > 0) return 'in-progress';
        return 'available';

      case 'analysis':
        if (dataCompleteness < 80 || modelingProgress < 50) return 'disabled';
        if (analysisProgress >= 80) return 'completed';
        if (analysisProgress > 0) return 'in-progress';
        return 'available';

      default:
        return 'pending';
    }
  };

  const steps = [
    {
      id: 'data',
      title: 'Data Entry',
      subtitle: 'Financial statements & inputs',
      icon: Database,
      progress: dataCompleteness,
      description: 'Import or manually input your company\'s financial statements including income statement, balance sheet, and cash flow data.',
      validationFields: ['revenue', 'expenses', 'assets'],
      helpContent: {
        title: 'Data Entry Guidelines',
        items: [
          'Ensure all financial figures are in the same currency',
          'Use consistent time periods across all statements',
          'Review data for obvious errors or inconsistencies',
          'Include at least 3 years of historical data for better analysis'
        ]
      }
    },
    {
      id: 'modeling',
      title: 'Financial Modeling',
      subtitle: 'DCF, LBO & scenario analysis',
      icon: Calculator,
      progress: modelingProgress,
      description: 'Configure valuation parameters, build financial models, and run scenario analyses to understand value drivers.',
      validationFields: ['discountRate', 'growthAssumptions', 'margins'],
      helpContent: {
        title: 'Modeling Best Practices',
        items: [
          'Set realistic discount rates based on industry benchmarks',
          'Use conservative growth assumptions for terminal value',
          'Consider multiple scenarios (base, bull, bear cases)',
          'Validate model outputs against comparable companies'
        ]
      }
    },
    {
      id: 'analysis',
      title: 'Analysis & Results',
      subtitle: 'Insights, reports & recommendations',
      icon: BarChart3,
      progress: analysisProgress,
      description: 'Review valuation results, sensitivity analysis, and generate comprehensive reports with actionable insights.',
      validationFields: ['valuation', 'sensitivity', 'recommendations'],
      helpContent: {
        title: 'Analysis Interpretation',
        items: [
          'Compare results across different valuation methods',
          'Pay attention to key value drivers in sensitivity analysis',
          'Consider qualitative factors not captured in models',
          'Document assumptions and limitations in your analysis'
        ]
      }
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-400';
      case 'in-progress': return 'text-blue-400';
      case 'available': return 'text-slate-300';
      case 'disabled': return 'text-slate-500';
      default: return 'text-slate-400';
    }
  };

  const getStatusBg = (status, isActive) => {
    if (isActive) return 'bg-blue-600';
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 border-emerald-400/20';
      case 'in-progress': return 'bg-blue-500/10 border-blue-400/20';
      case 'available': return 'bg-slate-700/30 border-slate-600/20';
      case 'disabled': return 'bg-slate-800/30 border-slate-700/10';
      default: return 'bg-slate-700/20 border-slate-600/10';
    }
  };

  const renderStatusIcon = (step, status, isActive) => {
    const Icon = step.icon;

    if (status === 'completed') {
      return <CheckCircle size={20} className="text-emerald-400" />;
    }

    if (status === 'disabled') {
      return <Icon size={20} className="text-slate-500" />;
    }

    if (validationErrors[step.id]?.length > 0) {
      return <AlertTriangle size={20} className="text-amber-400" />;
    }

    if (status === 'in-progress') {
      return <Clock size={20} className="text-blue-400" />;
    }

    return <Icon size={20} className={isActive ? 'text-white' : getStatusColor(status)} />;
  };

  const renderProgressRing = (progress, status) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getProgressColor = () => {
      if (progress >= 80) return '#10b981'; // emerald-500
      if (progress >= 50) return '#3b82f6'; // blue-500
      if (progress > 0) return '#f59e0b'; // amber-500
      return '#64748b'; // slate-500
    };

    return (
      <div className="relative">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={getProgressColor()}
            strokeWidth="2"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-in-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-slate-300">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  };

  const HelpTooltip = ({ step, isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute top-full left-0 mt-2 w-80 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl z-50"
      >
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle size={16} className="text-blue-400" />
          <h4 className="font-medium text-white">{step.helpContent.title}</h4>
        </div>
        <p className="text-sm text-slate-300 mb-3">{step.description}</p>
        <ul className="space-y-2">
          {step.helpContent.items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
              <ChevronRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </motion.div>
    );
  };

  return (
    <div className="relative">
      {/* Progress Overview */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <TrendingUp size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Analysis Workflow</h3>
            <p className="text-sm text-slate-400">Follow these steps to complete your analysis</p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-300">Overall Progress</div>
            <div className="text-xs text-slate-400">
              {Math.round((dataCompleteness + modelingProgress + analysisProgress) / 3)}% Complete
            </div>
          </div>
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{
                width: `${(dataCompleteness + modelingProgress + analysisProgress) / 3}%`
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="grid grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isActive = activeStep === step.id;
          const isDisabled = status === 'disabled';
          const hasErrors = validationErrors[step.id]?.length > 0;

          return (
            <div key={step.id} className="relative">
              <motion.button
                onClick={() => !isDisabled && onStepChange(step.id)}
                disabled={isDisabled}
                className={`
                  w-full p-4 rounded-xl border transition-all duration-200 text-left relative overflow-hidden
                  ${isActive
              ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20'
              : getStatusBg(status, false)
            }
                  ${!isDisabled && !isActive ? 'hover:border-slate-500 hover:bg-slate-700/40' : ''}
                  ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  ${hasErrors ? 'border-amber-400/40' : 'border-slate-600/30'}
                `}
                whileHover={!isDisabled && !isActive ? { scale: 1.02 } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
              >
                {/* Step Number & Icon */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                      flex items-center justify-center w-10 h-10 rounded-lg transition-all
                      ${isActive
              ? 'bg-white/20'
              : status === 'completed'
                ? 'bg-emerald-500/20'
                : 'bg-slate-600/30'
            }
                    `}
                    >
                      {renderStatusIcon(step, status, isActive)}
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                      Step {index + 1}
                    </div>
                  </div>

                  {step.progress > 0 && (
                    <div className="flex-shrink-0">
                      {renderProgressRing(step.progress, status)}
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="space-y-1">
                  <h4
                    className={`font-semibold ${
                      isActive ? 'text-white' : getStatusColor(status)
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p
                    className={`text-sm ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </div>

                {/* Validation Errors */}
                {hasErrors && (
                  <div className="mt-2 text-xs text-amber-400">
                    {validationErrors[step.id].length} validation issue(s)
                  </div>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.button>

              {/* Help Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHelpFor(showHelpFor === step.id ? null : step.id);
                }}
                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              >
                <HelpCircle size={14} />
              </button>

              {/* Help Tooltip */}
              <HelpTooltip
                step={step}
                isVisible={showHelpFor === step.id}
                onClose={() => setShowHelpFor(null)}
              />

              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <ChevronRight
                    size={16}
                    className={`
                      ${getStepStatus(steps[index + 1].id) !== 'disabled'
                  ? 'text-slate-400'
                  : 'text-slate-600'
                }
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Data Quality</span>
          </div>
          <div className="text-lg font-semibold text-white">{dataCompleteness}%</div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Models Built</span>
          </div>
          <div className="text-lg font-semibold text-white">{Math.round(modelingProgress)}%</div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Analysis Done</span>
          </div>
          <div className="text-lg font-semibold text-white">{Math.round(analysisProgress)}%</div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowNavigation;
