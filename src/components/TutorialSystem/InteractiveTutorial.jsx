/**
 * Interactive Tutorial System for Financial Modeling
 * Provides step-by-step guidance for complex financial analysis workflows
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Calculator,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Maximize,
  Minimize
} from 'lucide-react';

/**
 * Tutorial Step Component
 */
const TutorialStep = ({ 
  step, 
  isActive, 
  onNext, 
  onPrev, 
  onComplete, 
  onSkip,
  targetElement 
}) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [userInput, setUserInput] = useState('');
  const overlayRef = useRef(null);

  // Calculate position for the tutorial overlay
  const getOverlayPosition = useCallback(() => {
    if (!targetElement) return { top: '50%', left: '50%' };
    
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      top: rect.top + scrollTop - 60,
      left: rect.left + scrollLeft + rect.width + 20
    };
  }, [targetElement]);

  const handleStepComplete = useCallback(() => {
    setIsCompleted(true);
    setTimeout(() => {
      onComplete(step.id);
    }, 500);
  }, [step.id, onComplete]);

  const validateUserAction = useCallback(() => {
    if (!step.validation) return true;
    
    // Custom validation based on step requirements
    switch (step.validation.type) {
      case 'input':
        return step.validation.validator(userInput);
      case 'click':
        return step.validation.elementClicked;
      case 'value':
        return step.validation.expectedValue === step.validation.actualValue;
      default:
        return true;
    }
  }, [step, userInput]);

  useEffect(() => {
    if (step.autoAdvance && isActive) {
      const timer = setTimeout(handleStepComplete, step.autoAdvance);
      return () => clearTimeout(timer);
    }
  }, [step, isActive, handleStepComplete]);

  if (!isActive) return null;

  const position = getOverlayPosition();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-50 bg-white rounded-lg shadow-2xl border border-slate-200 max-w-md"
        style={{
          top: position.top,
          left: position.left,
          maxHeight: '400px'
        }}
        ref={overlayRef}
      >
        {/* Step Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step.icon && <step.icon size={20} className="text-blue-600" />}
              <h3 className="font-semibold text-slate-900">
                Step {step.stepNumber}: {step.title}
              </h3>
            </div>
            <button
              onClick={onSkip}
              className="p-1 hover:bg-slate-100 rounded text-slate-400"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4">
          <div className="space-y-3">
            <p className="text-slate-700">{step.description}</p>
            
            {/* Interactive Elements */}
            {step.type === 'input' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  {step.inputLabel}
                </label>
                <input
                  type={step.inputType || 'text'}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={step.placeholder}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {step.hint && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Lightbulb size={12} />
                    {step.hint}
                  </p>
                )}
              </div>
            )}

            {step.type === 'calculation' && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator size={16} className="text-blue-600" />
                  <span className="font-medium text-slate-700">Try this calculation:</span>
                </div>
                <code className="text-sm font-mono text-slate-600">
                  {step.formula}
                </code>
              </div>
            )}

            {step.type === 'highlight' && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-yellow-600" />
                  <span className="text-sm text-yellow-800">{step.highlightText}</span>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            {step.progress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{Math.round(step.progress * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${step.progress * 100}%` }}
                    className="bg-blue-600 h-2 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Validation Feedback */}
            {step.validation && userInput && (
              <div className={`flex items-center gap-2 text-sm ${
                validateUserAction() ? 'text-green-600' : 'text-red-600'
              }`}>
                {validateUserAction() ? (
                  <CheckCircle size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>
                  {validateUserAction() ? 'Correct!' : step.validation.errorMessage}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onPrev}
              disabled={step.stepNumber === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={14} />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {step.type !== 'auto' && (
                <button
                  onClick={handleStepComplete}
                  disabled={step.validation && !validateUserAction()}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompleted ? (
                    <CheckCircle size={14} />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                  {isCompleted ? 'Completed' : 'Next'}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backdrop and Highlight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onSkip}
      />
      
      {targetElement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed z-45 border-2 border-blue-400 rounded-lg shadow-lg"
          style={{
            top: targetElement.getBoundingClientRect().top + window.pageYOffset - 4,
            left: targetElement.getBoundingClientRect().left + window.pageXOffset - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
            pointerEvents: 'none'
          }}
        />
      )}
    </AnimatePresence>
  );
};

/**
 * Tutorial Progress Component
 */
const TutorialProgress = ({ currentStep, totalSteps, onStepClick }) => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => (
        <button
          key={index}
          onClick={() => onStepClick(index + 1)}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
            index + 1 < currentStep
              ? 'bg-green-600 text-white'
              : index + 1 === currentStep
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
          }`}
        >
          {index + 1 < currentStep ? <CheckCircle size={12} /> : index + 1}
        </button>
      ))}
    </div>
  );
};

/**
 * Main Interactive Tutorial Component
 */
const InteractiveTutorial = ({
  tutorial,
  isActive = false,
  onComplete = () => {},
  onExit = () => {},
  autoStart = false
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isMinimized, setIsMinimized] = useState(false);

  const currentStep = tutorial.steps[currentStepIndex];
  const progress = (currentStepIndex + 1) / tutorial.steps.length;

  // Find target element for current step
  const getTargetElement = useCallback(() => {
    if (!currentStep?.target) return null;
    return document.querySelector(currentStep.target);
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < tutorial.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
    } else {
      // Tutorial completed
      onComplete(tutorial.id);
    }
  }, [currentStepIndex, tutorial, currentStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const handleStepComplete = useCallback((stepId) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    handleNext();
  }, [handleNext]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleJumpToStep = useCallback((stepNumber) => {
    setCurrentStepIndex(stepNumber - 1);
  }, []);

  const handleSkip = useCallback(() => {
    onExit();
  }, [onExit]);

  if (!isActive || !tutorial) return null;

  return (
    <div>
      {/* Tutorial Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border border-slate-200 ${
          isMinimized ? 'p-2' : 'p-4'
        }`}
      >
        {isMinimized ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <Maximize size={16} />
            </button>
            <span className="text-sm font-medium">{tutorial.title}</span>
            <span className="text-xs text-slate-500">
              {currentStepIndex + 1}/{tutorial.steps.length}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-blue-600" />
                <div>
                  <h2 className="font-semibold text-slate-900">{tutorial.title}</h2>
                  <p className="text-sm text-slate-600">{tutorial.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <Minimize size={16} />
                </button>
                <button
                  onClick={handleSkip}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <TutorialProgress
                currentStep={currentStepIndex + 1}
                totalSteps={tutorial.steps.length}
                onStepClick={handleJumpToStep}
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="p-2 hover:bg-slate-100 rounded disabled:opacity-50"
                >
                  <SkipBack size={16} />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="p-2 hover:bg-slate-100 rounded"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentStepIndex === tutorial.steps.length - 1}
                  className="p-2 hover:bg-slate-100 rounded disabled:opacity-50"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Step {currentStepIndex + 1} of {tutorial.steps.length}</span>
              <span>{Math.round(progress * 100)}% Complete</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tutorial Step */}
      {!isMinimized && (
        <TutorialStep
          step={currentStep}
          isActive={isPlaying}
          onNext={handleNext}
          onPrev={handlePrev}
          onComplete={handleStepComplete}
          onSkip={handleSkip}
          targetElement={getTargetElement()}
        />
      )}
    </div>
  );
};

export default InteractiveTutorial;