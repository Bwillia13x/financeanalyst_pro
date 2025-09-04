import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

// Import all form components
import AdvancedForm, {
  FINANCIAL_VALIDATION_SCHEMAS,
  CurrencyInput,
  PercentageInput,
  TickerInput,
  FormField,
  FormActions
} from '../components/Forms/AdvancedForm';
import {
  StockAnalysisForm,
  PortfolioCreationForm,
  FinancialModelingForm
} from '../components/Forms/FinancialForms';
import FormStateManager, {
  ManagedFormField,
  FormValidationSummary
} from '../components/Forms/FormStateManager';
import {
  WizardProvider,
  WizardStep,
  WizardNavigation,
  PortfolioOnboardingWizard
} from '../components/Forms/FormWizard';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

// ===== ADVANCED FORMS DEMO PAGE =====

const AdvancedFormsDemo = () => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState('overview');
  const [formResults, setFormResults] = useState({});

  const demos = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'basic', label: 'Basic Forms', icon: '📝' },
    { id: 'financial', label: 'Financial Forms', icon: '💰' },
    { id: 'wizard', label: 'Form Wizards', icon: '🧙‍♂️' },
    { id: 'state', label: 'State Management', icon: '💾' },
    { id: 'validation', label: 'Validation Demo', icon: '✅' }
  ];

  // ===== FORM HANDLERS =====
  const handleFormSubmit = (formType, data) => {
    console.log(`${formType} form submitted:`, data);
    setFormResults(prev => ({
      ...prev,
      [formType]: {
        success: true,
        data,
        timestamp: new Date().toISOString()
      }
    }));

    // Show success message
    alert(`${formType} form submitted successfully! Check console for details.`);
  };

  const handleFormError = (formType, error) => {
    console.error(`${formType} form error:`, error);
    setFormResults(prev => ({
      ...prev,
      [formType]: {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Advanced Forms Demo</h1>
            <p className="text-foreground-secondary mt-1">
              Institutional-grade form system with validation, wizards, and state management
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Back to Home
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              🔄 Reset Demo
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 mt-6">
          {demos.map(demo => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeDemo === demo.id
                  ? 'bg-brand-accent text-foreground-inverse'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
              }`}
            >
              <span>{demo.icon}</span>
              {demo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview */}
        {activeDemo === 'overview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Form System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">🔧 Advanced Validation</h3>
                    <p className="text-sm text-foreground-secondary">
                      Yup schema validation with financial-specific rules and real-time feedback
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">💰 Financial Inputs</h3>
                    <p className="text-sm text-foreground-secondary">
                      Currency, percentage, and ticker inputs with automatic formatting
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">🧙‍♂️ Form Wizards</h3>
                    <p className="text-sm text-foreground-secondary">
                      Multi-step forms with progress tracking and state persistence
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">💾 State Management</h3>
                    <p className="text-sm text-foreground-secondary">
                      Auto-save, undo/redo, and collaborative editing capabilities
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">📊 Specialized Forms</h3>
                    <p className="text-sm text-foreground-secondary">
                      Stock analysis, portfolio creation, and financial modeling forms
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">♿ Accessibility</h3>
                    <p className="text-sm text-foreground-secondary">
                      WCAG 2.1 AA compliant with screen reader support and keyboard navigation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-foreground-secondary">
                    Click on any demo section above to explore the advanced form features:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-foreground-secondary">
                    <li>
                      <strong>Basic Forms:</strong> Core form components with validation
                    </li>
                    <li>
                      <strong>Financial Forms:</strong> Specialized forms for investment analysis
                    </li>
                    <li>
                      <strong>Form Wizards:</strong> Multi-step guided experiences
                    </li>
                    <li>
                      <strong>State Management:</strong> Persistence and collaborative features
                    </li>
                    <li>
                      <strong>Validation Demo:</strong> Advanced validation scenarios
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Basic Forms Demo */}
        {activeDemo === 'basic' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Form Components</CardTitle>
                <p className="text-sm text-foreground-secondary">
                  Core form components with advanced validation and professional styling
                </p>
              </CardHeader>
              <CardContent>
                <AdvancedForm
                  schema={yup.object().shape({
                    email: FINANCIAL_VALIDATION_SCHEMAS.financialEmail,
                    amount: FINANCIAL_VALIDATION_SCHEMAS.currency,
                    percentage: FINANCIAL_VALIDATION_SCHEMAS.percentage,
                    ticker: FINANCIAL_VALIDATION_SCHEMAS.ticker,
                    description: FINANCIAL_VALIDATION_SCHEMAS.financialText
                  })}
                  onSubmit={data => handleFormSubmit('basic', data)}
                  onError={error => handleFormError('basic', error)}
                  autoSave={true}
                  autoSaveKey="basic-form-demo"
                >
                  {({ formState, isSubmitting }) => (
                    <div className="space-y-6">
                      <FormValidationSummary />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="email" label="Email Address" required>
                          <input
                            type="email"
                            placeholder="user@company.com"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                          />
                        </FormField>

                        <FormField name="ticker" label="Stock Ticker">
                          <TickerInput placeholder="AAPL" />
                        </FormField>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="amount" label="Investment Amount" required>
                          <CurrencyInput placeholder="$10,000.00" />
                        </FormField>

                        <FormField name="percentage" label="Target Return (%)">
                          <PercentageInput placeholder="15.00%" />
                        </FormField>
                      </div>

                      <FormField name="description" label="Investment Strategy">
                        <textarea
                          rows={4}
                          placeholder="Describe your investment approach and goals..."
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
                        />
                      </FormField>

                      <FormActions
                        submitLabel="Submit Form"
                        isSubmitting={isSubmitting}
                        canSubmit={formState.isValid}
                      />
                    </div>
                  )}
                </AdvancedForm>
              </CardContent>
            </Card>

            {/* Results */}
            {formResults.basic && (
              <Card>
                <CardHeader>
                  <CardTitle>Form Submission Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-background-secondary p-4 rounded-md overflow-auto">
                    {JSON.stringify(formResults.basic, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Financial Forms Demo */}
        {activeDemo === 'financial' && (
          <div className="space-y-6">
            {/* Stock Analysis Form */}
            <StockAnalysisForm
              onSubmit={data => handleFormSubmit('stock-analysis', data)}
              onCancel={() => setActiveDemo('overview')}
            />

            {/* Portfolio Creation Form */}
            <PortfolioCreationForm
              onSubmit={data => handleFormSubmit('portfolio-creation', data)}
              onCancel={() => setActiveDemo('overview')}
            />

            {/* Financial Modeling Form */}
            <FinancialModelingForm
              onSubmit={data => handleFormSubmit('financial-modeling', data)}
              onCancel={() => setActiveDemo('overview')}
            />

            {/* Results Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Form Results Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(formResults).map(([formType, result]) => (
                    <div
                      key={formType}
                      className="flex items-center justify-between p-3 bg-background-secondary rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                        <span className="font-medium capitalize">{formType.replace('-', ' ')}</span>
                      </div>
                      <span className="text-sm text-foreground-secondary">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form Wizards Demo */}
        {activeDemo === 'wizard' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Onboarding Wizard</CardTitle>
                <p className="text-sm text-foreground-secondary">
                  Complete multi-step form with progress tracking and validation
                </p>
              </CardHeader>
              <CardContent>
                <PortfolioOnboardingWizard
                  onComplete={data => handleFormSubmit('portfolio-wizard', data)}
                  onCancel={() => setActiveDemo('overview')}
                  autoSaveKey="portfolio-wizard-demo"
                />
              </CardContent>
            </Card>

            {/* Custom Wizard Example */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Investment Strategy Wizard</CardTitle>
              </CardHeader>
              <CardContent>
                <WizardProvider
                  steps={[
                    {
                      id: 'strategy-basics',
                      title: 'Strategy Basics',
                      subtitle: 'Core Approach',
                      validationSchema: yup.object().shape({
                        strategyName: yup.string().required('Strategy name is required'),
                        strategyType: yup.string().required('Strategy type is required'),
                        riskLevel: yup.string().required('Risk level is required')
                      })
                    },
                    {
                      id: 'asset-allocation',
                      title: 'Asset Allocation',
                      subtitle: 'Portfolio Mix',
                      validationSchema: yup.object().shape({
                        stocksPercentage: yup
                          .number()
                          .min(0)
                          .max(100)
                          .required('Stocks percentage is required'),
                        bondsPercentage: yup
                          .number()
                          .min(0)
                          .max(100)
                          .required('Bonds percentage is required'),
                        cashPercentage: yup
                          .number()
                          .min(0)
                          .max(100)
                          .required('Cash percentage is required')
                      })
                    },
                    {
                      id: 'review-confirm',
                      title: 'Review & Confirm',
                      subtitle: 'Final Review',
                      validationSchema: yup.object().shape({
                        termsAccepted: yup.boolean().oneOf([true], 'Terms must be accepted')
                      })
                    }
                  ]}
                  onComplete={data => handleFormSubmit('strategy-wizard', data)}
                  autoSaveKey="strategy-wizard-demo"
                >
                  {({ step, stepIndex }) => (
                    <WizardStep
                      title={step.title}
                      subtitle={step.subtitle}
                      validationSchema={step.validationSchema}
                    >
                      {step.id === 'strategy-basics' && (
                        <div className="space-y-4">
                          <FormField name="strategyName" label="Strategy Name" required>
                            <input
                              type="text"
                              placeholder="Growth Portfolio Strategy"
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                          </FormField>

                          <FormField name="strategyType" label="Strategy Type" required>
                            <select className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent">
                              <option value="">Select Strategy Type</option>
                              <option value="growth">Growth</option>
                              <option value="value">Value</option>
                              <option value="income">Income</option>
                              <option value="balanced">Balanced</option>
                            </select>
                          </FormField>

                          <FormField name="riskLevel" label="Risk Level" required>
                            <select className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent">
                              <option value="">Select Risk Level</option>
                              <option value="conservative">Conservative</option>
                              <option value="moderate">Moderate</option>
                              <option value="aggressive">Aggressive</option>
                            </select>
                          </FormField>
                        </div>
                      )}

                      {step.id === 'asset-allocation' && (
                        <div className="space-y-4">
                          <FormField name="stocksPercentage" label="Stocks Allocation (%)" required>
                            <PercentageInput placeholder="60.00%" />
                          </FormField>

                          <FormField name="bondsPercentage" label="Bonds Allocation (%)" required>
                            <PercentageInput placeholder="30.00%" />
                          </FormField>

                          <FormField name="cashPercentage" label="Cash Allocation (%)" required>
                            <PercentageInput placeholder="10.00%" />
                          </FormField>

                          <div className="p-3 bg-background-secondary rounded-md">
                            <p className="text-sm text-foreground-secondary">
                              Total Allocation:{' '}
                              {
                                // This would be calculated from form values
                                '100%'
                              }
                            </p>
                          </div>
                        </div>
                      )}

                      {step.id === 'review-confirm' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-background-secondary rounded-md">
                            <h4 className="font-medium text-foreground mb-2">Strategy Summary</h4>
                            <p className="text-sm text-foreground-secondary">
                              Review your investment strategy configuration before confirming.
                            </p>
                          </div>

                          <FormField name="termsAccepted" required>
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                name="termsAccepted"
                                className="rounded border-border text-brand-accent"
                              />
                              <span className="text-sm">I agree to the terms and conditions</span>
                            </label>
                          </FormField>
                        </div>
                      )}

                      <WizardNavigation
                        nextLabel={stepIndex === 2 ? 'Create Strategy' : 'Next'}
                        completeLabel="Create Strategy"
                      />
                    </WizardStep>
                  )}
                </WizardProvider>
              </CardContent>
            </Card>
          </div>
        )}

        {/* State Management Demo */}
        {activeDemo === 'state' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced State Management</CardTitle>
                <p className="text-sm text-foreground-secondary">
                  Auto-save, undo/redo, and collaborative editing features
                </p>
              </CardHeader>
              <CardContent>
                <FormStateManager
                  schema={yup.object().shape({
                    projectName: yup.string().required('Project name is required'),
                    budget: yup.number().positive('Budget must be positive'),
                    timeline: yup.string().required('Timeline is required'),
                    priority: yup.string().required('Priority is required')
                  })}
                  defaultValues={{
                    projectName: '',
                    budget: '',
                    timeline: '3-6 months',
                    priority: 'medium',
                    description: ''
                  }}
                  onSubmit={data => handleFormSubmit('state-managed', data)}
                  autoSave={true}
                  autoSaveKey="state-management-demo"
                  enableHistory={true}
                  enableCollaboration={false}
                >
                  {({ isSubmitting, canUndo, canRedo, undo, redo }) => (
                    <div className="space-y-6">
                      <FormValidationSummary />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ManagedFormField name="projectName" label="Project Name" required>
                          <input
                            type="text"
                            placeholder="Financial Analysis Project"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                          />
                        </ManagedFormField>

                        <ManagedFormField name="budget" label="Budget">
                          <CurrencyInput placeholder="$50,000.00" />
                        </ManagedFormField>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ManagedFormField name="timeline" label="Timeline" required>
                          <select className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option value="">Select Timeline</option>
                            <option value="1-3 months">1-3 months</option>
                            <option value="3-6 months">3-6 months</option>
                            <option value="6-12 months">6-12 months</option>
                            <option value="1+ years">1+ years</option>
                          </select>
                        </ManagedFormField>

                        <ManagedFormField name="priority" label="Priority" required>
                          <select className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option value="">Select Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </ManagedFormField>
                      </div>

                      <ManagedFormField name="description" label="Description">
                        <textarea
                          rows={4}
                          placeholder="Describe the project objectives and scope..."
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
                        />
                      </ManagedFormField>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={undo}
                            disabled={!canUndo}
                          >
                            ↶ Undo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={redo}
                            disabled={!canRedo}
                          >
                            ↷ Redo
                          </Button>
                        </div>

                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Save Project'}
                        </Button>
                      </div>
                    </div>
                  )}
                </FormStateManager>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Validation Demo */}
        {activeDemo === 'validation' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Validation Demo</CardTitle>
                <p className="text-sm text-foreground-secondary">
                  Comprehensive validation scenarios with real-time feedback
                </p>
              </CardHeader>
              <CardContent>
                <AdvancedForm
                  schema={yup.object().shape({
                    email: FINANCIAL_VALIDATION_SCHEMAS.financialEmail,
                    phone: FINANCIAL_VALIDATION_SCHEMAS.phone,
                    website: FINANCIAL_VALIDATION_SCHEMAS.financialUrl,
                    investment: yup
                      .number()
                      .min(1000, 'Minimum investment is $1,000')
                      .max(1000000, 'Maximum investment is $1,000,000'),
                    riskScore: yup.number().min(1).max(10).required('Risk score is required'),
                    agreeToTerms: yup.boolean().oneOf([true], 'You must agree to the terms'),
                    password: yup
                      .string()
                      .min(8, 'Password must be at least 8 characters')
                      .matches(
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        'Password must contain uppercase, lowercase, and number'
                      ),
                    confirmPassword: yup
                      .string()
                      .oneOf([yup.ref('password')], 'Passwords must match')
                  })}
                  onSubmit={data => handleFormSubmit('validation', data)}
                  validateOnChange={true}
                  validateOnBlur={true}
                >
                  {({ formState, isSubmitting }) => (
                    <div className="space-y-6">
                      <FormValidationSummary />

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Contact Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="email" label="Professional Email" required>
                            <input
                              type="email"
                              placeholder="analyst@company.com"
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                          </FormField>

                          <FormField name="phone" label="Phone Number">
                            <input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                          </FormField>
                        </div>

                        <FormField name="website" label="Company Website">
                          <input
                            type="url"
                            placeholder="https://company.com"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                          />
                        </FormField>
                      </div>

                      {/* Investment Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Investment Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="investment" label="Investment Amount" required>
                            <CurrencyInput placeholder="$10,000.00" />
                          </FormField>

                          <FormField name="riskScore" label="Risk Tolerance (1-10)" required>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              placeholder="5"
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                          </FormField>
                        </div>
                      </div>

                      {/* Security */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Security</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="password" label="Password" required>
                            <input
                              type="password"
                              placeholder="Enter secure password"
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                          </FormField>

                          <FormField name="confirmPassword" label="Confirm Password" required>
                            <input
                              type="password"
                              placeholder="Confirm password"
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                          </FormField>
                        </div>

                        <FormField name="agreeToTerms" required>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              name="agreeToTerms"
                              className="rounded border-border text-brand-accent"
                            />
                            <span className="text-sm">
                              I agree to the terms and conditions and privacy policy
                            </span>
                          </label>
                        </FormField>
                      </div>

                      <FormActions
                        submitLabel="Complete Registration"
                        isSubmitting={isSubmitting}
                        canSubmit={formState.isValid}
                      />
                    </div>
                  )}
                </AdvancedForm>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFormsDemo;
