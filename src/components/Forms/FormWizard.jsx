import React, { useState, useCallback, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

// ===== FORM WIZARD SYSTEM =====

/**
 * Multi-step form wizard with progress tracking, validation,
 * and state persistence for complex financial workflows
 */

// ===== WIZARD CONTEXT =====

const WizardContext = React.createContext({
  currentStep: 0,
  totalSteps: 0,
  goToStep: () => {},
  nextStep: () => {},
  prevStep: () => {},
  isFirstStep: true,
  isLastStep: false,
  wizardData: {},
  updateWizardData: () => {},
  isValid: false,
  isSubmitting: false
});

export const useWizard = () => {
  const context = React.useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
};

// ===== WIZARD PROVIDER =====

export const WizardProvider = ({
  children,
  steps,
  initialData = {},
  onComplete,
  onCancel,
  onStepChange,
  validateOnStepChange = true,
  allowBackNavigation = true,
  autoSave = true,
  autoSaveKey,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(initialData);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const currentStepData = steps[currentStep];

  // Form validation
  const validationSchema = currentStepData?.validationSchema;
  const methods = useForm({
    resolver: validationSchema ? yupResolver(validationSchema) : undefined,
    defaultValues: wizardData,
    mode: 'onChange'
  });

  // Update validation state
  useEffect(() => {
    const subscription = methods.watch(() => {
      setIsValid(methods.formState.isValid);
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  // Auto-save functionality
  const saveWizardData = useCallback(
    data => {
      if (autoSave && autoSaveKey) {
        try {
          localStorage.setItem(
            `wizard_${autoSaveKey}`,
            JSON.stringify({
              currentStep,
              wizardData: { ...wizardData, ...data },
              completedSteps: Array.from(completedSteps),
              timestamp: new Date().toISOString(),
              version: '1.0'
            })
          );
        } catch (error) {
          console.warn('Failed to auto-save wizard data:', error);
        }
      }
    },
    [autoSave, autoSaveKey, currentStep, wizardData, completedSteps]
  );

  // Load saved wizard data
  useEffect(() => {
    if (autoSave && autoSaveKey) {
      try {
        const saved = localStorage.getItem(`wizard_${autoSaveKey}`);
        if (saved) {
          const {
            currentStep: savedStep,
            wizardData: savedData,
            completedSteps: savedCompletedSteps,
            timestamp
          } = JSON.parse(saved);

          // Only restore if saved within last 24 hours
          const savedTime = new Date(timestamp);
          const now = new Date();
          const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            setCurrentStep(savedStep);
            setWizardData(savedData);
            setCompletedSteps(new Set(savedCompletedSteps));
            methods.reset(savedData);
          }
        }
      } catch (error) {
        console.warn('Failed to load saved wizard data:', error);
      }
    }
  }, [autoSave, autoSaveKey, methods]);

  // Navigation functions
  const goToStep = useCallback(
    stepIndex => {
      if (stepIndex >= 0 && stepIndex < totalSteps) {
        // Validate current step before navigation if required
        if (validateOnStepChange && !isFirstStep) {
          const isCurrentStepValid = methods.formState.isValid;
          if (!isCurrentStepValid) {
            return; // Don't allow navigation if current step is invalid
          }
        }

        const newData = methods.getValues();
        setWizardData(prev => ({ ...prev, ...newData }));
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        saveWizardData(newData);

        setCurrentStep(stepIndex);
        onStepChange?.(stepIndex, stepIndex > currentStep ? 'forward' : 'backward');
      }
    },
    [
      totalSteps,
      validateOnStepChange,
      isFirstStep,
      methods,
      currentStep,
      saveWizardData,
      onStepChange
    ]
  );

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      goToStep(currentStep + 1);
    }
  }, [isLastStep, goToStep, currentStep]);

  const prevStep = useCallback(() => {
    if (!isFirstStep && allowBackNavigation) {
      goToStep(currentStep - 1);
    }
  }, [isFirstStep, allowBackNavigation, goToStep, currentStep]);

  // Complete wizard
  const completeWizard = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const finalData = { ...wizardData, ...methods.getValues() };

      // Clear saved data
      if (autoSave && autoSaveKey) {
        localStorage.removeItem(`wizard_${autoSaveKey}`);
      }

      await onComplete(finalData);
    } catch (error) {
      console.error('Wizard completion error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [wizardData, methods, autoSave, autoSaveKey, onComplete]);

  // Handle form submission
  const handleSubmit = useCallback(
    data => {
      setWizardData(prev => ({ ...prev, ...data }));

      if (isLastStep) {
        completeWizard();
      } else {
        nextStep();
      }
    },
    [isLastStep, completeWizard, nextStep]
  );

  // Context value
  const contextValue = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    wizardData,
    updateWizardData: setWizardData,
    isValid,
    isSubmitting,
    completedSteps
  };

  return (
    <WizardContext.Provider value={contextValue}>
      <FormProvider {...methods}>
        <div className={cn('wizard-container', className)}>
          {/* Progress Indicator */}
          <WizardProgress
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />

          {/* Current Step Content */}
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="wizard-content">
            {React.cloneElement(children, {
              step: currentStepData,
              stepIndex: currentStep,
              methods
            })}
          </form>
        </div>
      </FormProvider>
    </WizardContext.Provider>
  );
};

// ===== WIZARD PROGRESS COMPONENT =====

const WizardProgress = ({ steps, currentStep, completedSteps, onStepClick }) => {
  return (
    <div className="wizard-progress mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep || isCompleted;

          return (
            <React.Fragment key={index}>
              {/* Step Circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium transition-all duration-200',
                  isCompleted && 'bg-brand-success border-brand-success text-white',
                  isCurrent && 'bg-brand-accent border-brand-accent text-white',
                  !isCompleted &&
                    !isCurrent &&
                    'bg-background border-border text-foreground-secondary',
                  isClickable && 'hover:border-brand-accent cursor-pointer',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>

              {/* Step Label */}
              <div className="flex flex-col items-center max-w-24">
                <span
                  className={cn(
                    'text-xs font-medium text-center leading-tight',
                    isCurrent ? 'text-brand-accent' : 'text-foreground-secondary'
                  )}
                >
                  {step.title}
                </span>
                {step.subtitle && (
                  <span className="text-xs text-foreground-muted text-center leading-tight mt-1">
                    {step.subtitle}
                  </span>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 transition-colors duration-200',
                    index < currentStep || isCompleted ? 'bg-brand-success' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ===== WIZARD STEP COMPONENT =====

export const WizardStep = ({
  title,
  subtitle,
  description,
  children,
  validationSchema,
  isOptional = false,
  className,
  ...props
}) => {
  return (
    <Card className={cn('wizard-step', className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {isOptional && (
            <span className="text-xs bg-background-secondary text-foreground-secondary px-2 py-1 rounded">
              Optional
            </span>
          )}
        </CardTitle>
        {subtitle && <p className="text-sm text-foreground-secondary">{subtitle}</p>}
        {description && <p className="text-xs text-foreground-muted mt-2">{description}</p>}
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
};

// ===== WIZARD NAVIGATION COMPONENT =====

export const WizardNavigation = ({
  nextLabel = 'Next',
  prevLabel = 'Previous',
  completeLabel = 'Complete',
  cancelLabel = 'Cancel',
  showCancel = true,
  className,
  ...props
}) => {
  const {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    isValid,
    isSubmitting
  } = useWizard();

  return (
    <div
      className={cn(
        'wizard-navigation flex items-center justify-between pt-6 border-t border-border',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {showCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              /* Handle cancel */
            }}
          >
            {cancelLabel}
          </Button>
        )}

        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={prevStep}>
            {prevLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground-secondary">
          Step {currentStep + 1} of {totalSteps}
        </span>

        {!isLastStep ? (
          <Button type="submit" disabled={!isValid} className="min-w-24">
            {nextLabel}
          </Button>
        ) : (
          <Button type="submit" disabled={!isValid || isSubmitting} className="min-w-24">
            {isSubmitting ? 'Completing...' : completeLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

// ===== FINANCIAL WIZARD TEMPLATES =====

// Portfolio Onboarding Wizard
export const PortfolioOnboardingWizard = ({
  onComplete,
  onCancel,
  initialData = {},
  className
}) => {
  const steps = [
    {
      id: 'personal-info',
      title: 'Personal Info',
      subtitle: 'Basic Information',
      description: 'Tell us about yourself to personalize your experience',
      validationSchema: yup.object().shape({
        firstName: yup.string().required('First name is required'),
        lastName: yup.string().required('Last name is required'),
        email: yup.string().email('Invalid email').required('Email is required'),
        phone: yup.string().optional()
      })
    },
    {
      id: 'investment-profile',
      title: 'Investment Profile',
      subtitle: 'Risk & Goals',
      description: 'Define your investment preferences and risk tolerance',
      validationSchema: yup.object().shape({
        riskTolerance: yup.string().required('Risk tolerance is required'),
        investmentHorizon: yup.string().required('Investment horizon is required'),
        annualIncome: yup
          .number()
          .positive('Income must be positive')
          .required('Annual income is required'),
        investmentGoal: yup.string().required('Investment goal is required')
      })
    },
    {
      id: 'current-holdings',
      title: 'Current Holdings',
      subtitle: 'Portfolio Assets',
      description: 'List your current investments and holdings',
      validationSchema: yup.object().shape({
        hasExistingPortfolio: yup.boolean(),
        totalValue: yup.number().when('hasExistingPortfolio', {
          is: true,
          then: yup
            .number()
            .positive('Total value must be positive')
            .required('Total portfolio value is required')
        })
      }),
      isOptional: true
    },
    {
      id: 'investment-amount',
      title: 'Investment Amount',
      subtitle: 'Starting Capital',
      description: 'How much would you like to invest?',
      validationSchema: yup.object().shape({
        initialInvestment: yup
          .number()
          .min(1000, 'Minimum investment is $1,000')
          .required('Initial investment is required'),
        monthlyContribution: yup.number().min(0, 'Monthly contribution cannot be negative'),
        investmentFrequency: yup.string().required('Investment frequency is required')
      })
    },
    {
      id: 'review-confirm',
      title: 'Review & Confirm',
      subtitle: 'Final Review',
      description: 'Review your information and create your portfolio',
      validationSchema: yup.object().shape({
        termsAccepted: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
        riskAcknowledgment: yup.boolean().oneOf([true], 'You must acknowledge the risks')
      })
    }
  ];

  return (
    <WizardProvider
      steps={steps}
      initialData={initialData}
      onComplete={onComplete}
      onCancel={onCancel}
      autoSaveKey="portfolio-onboarding"
      className={className}
    >
      {({ step, stepIndex, methods }) => (
        <WizardStep
          title={step.title}
          subtitle={step.subtitle}
          description={step.description}
          validationSchema={step.validationSchema}
          isOptional={step.isOptional}
        >
          <PortfolioOnboardingStep stepId={step.id} stepIndex={stepIndex} methods={methods} />

          <WizardNavigation
            nextLabel={stepIndex === steps.length - 1 ? 'Create Portfolio' : 'Next'}
            completeLabel="Create Portfolio"
          />
        </WizardStep>
      )}
    </WizardProvider>
  );
};

// Step content components would be implemented separately
const PortfolioOnboardingStep = ({ stepId, stepIndex, methods }) => {
  // Implementation for each step's form content
  return (
    <div className="step-content">
      {/* Step-specific form content goes here */}
      <p className="text-sm text-foreground-secondary">
        Content for step: {stepId} (Step {stepIndex + 1})
      </p>
    </div>
  );
};

// ===== EXPORT ALL COMPONENTS =====
export { WizardProgress, WizardStep, WizardNavigation, PortfolioOnboardingWizard };

export default WizardProvider;
