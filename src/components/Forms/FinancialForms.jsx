import React, { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import * as yup from 'yup';

import AdvancedForm, {
  FINANCIAL_VALIDATION_SCHEMAS,
  CurrencyInput,
  PercentageInput,
  TickerInput,
  FormField,
  FormActions
} from './AdvancedForm';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import { cn } from '../../utils/cn';

// ===== FINANCIAL FORM COMPONENTS =====

/**
 * Specialized financial forms for investment analysis, portfolio management,
 * and financial modeling with professional validation and UX
 */

// ===== STOCK ANALYSIS FORM =====

export const StockAnalysisForm = ({
  onSubmit,
  onCancel,
  initialData = {},
  className,
  ...props
}) => {
  const [isAdvanced, setIsAdvanced] = useState(false);

  const stockAnalysisSchema = yup.object().shape({
    ticker: FINANCIAL_VALIDATION_SCHEMAS.ticker,
    analysisType: yup.string().required('Analysis type is required'),
    timeFrame: yup.string().required('Time frame is required'),
    startDate: FINANCIAL_VALIDATION_SCHEMAS.date,
    endDate: FINANCIAL_VALIDATION_SCHEMAS.date.when('startDate', (startDate, schema) =>
      startDate ? schema.min(startDate, 'End date must be after start date') : schema
    ),

    // Advanced analysis fields
    ...(isAdvanced && {
      movingAveragePeriod: yup.number().min(1).max(200),
      rsiPeriod: yup.number().min(1).max(50),
      bollingerBandsPeriod: yup.number().min(1).max(100),
      macdFast: yup.number().min(1).max(50),
      macdSlow: yup.number().min(1).max(50),
      macdSignal: yup.number().min(1).max(50),
      customIndicators: yup.array().of(yup.string())
    })
  });

  return (
    <AdvancedForm
      schema={stockAnalysisSchema}
      defaultValues={{
        ticker: '',
        analysisType: 'technical',
        timeFrame: '1M',
        startDate: '',
        endDate: '',
        movingAveragePeriod: 20,
        rsiPeriod: 14,
        bollingerBandsPeriod: 20,
        macdFast: 12,
        macdSlow: 26,
        macdSignal: 9,
        customIndicators: [],
        ...initialData
      }}
      onSubmit={onSubmit}
      className={className}
      {...props}
    >
      {({ formState, isSubmitting }) => (
        <Card>
          <CardHeader>
            <CardTitle>Stock Analysis</CardTitle>
            <p className="text-sm text-foreground-secondary">
              Configure technical analysis parameters for stock evaluation
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField name="ticker" label="Stock Ticker" required>
                <TickerInput name="ticker" placeholder="AAPL" />
              </FormField>

              <FormField name="analysisType" label="Analysis Type" required>
                <select
                  name="analysisType"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="technical">Technical Analysis</option>
                  <option value="fundamental">Fundamental Analysis</option>
                  <option value="quantitative">Quantitative Analysis</option>
                  <option value="sentiment">Sentiment Analysis</option>
                </select>
              </FormField>
            </div>

            {/* Time Frame */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField name="timeFrame" label="Time Frame" required>
                <select
                  name="timeFrame"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="1D">1 Day</option>
                  <option value="1W">1 Week</option>
                  <option value="1M">1 Month</option>
                  <option value="3M">3 Months</option>
                  <option value="6M">6 Months</option>
                  <option value="1Y">1 Year</option>
                  <option value="2Y">2 Years</option>
                  <option value="5Y">5 Years</option>
                </select>
              </FormField>

              <FormField name="startDate" label="Start Date">
                <input
                  type="date"
                  name="startDate"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </FormField>

              <FormField name="endDate" label="End Date">
                <input
                  type="date"
                  name="endDate"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </FormField>
            </div>

            {/* Advanced Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <h3 className="text-sm font-medium text-foreground">Advanced Settings</h3>
                <p className="text-xs text-foreground-secondary">
                  Configure custom indicators and parameters
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdvanced(!isAdvanced)}
              >
                {isAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            {/* Advanced Settings */}
            {isAdvanced && (
              <div className="space-y-6 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-foreground">Technical Indicators</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField name="movingAveragePeriod" label="Moving Average Period">
                    <input
                      type="number"
                      name="movingAveragePeriod"
                      min="1"
                      max="200"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </FormField>

                  <FormField name="rsiPeriod" label="RSI Period">
                    <input
                      type="number"
                      name="rsiPeriod"
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </FormField>

                  <FormField name="bollingerBandsPeriod" label="Bollinger Bands Period">
                    <input
                      type="number"
                      name="bollingerBandsPeriod"
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </FormField>
                </div>

                <h4 className="text-sm font-medium text-foreground">MACD Settings</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField name="macdFast" label="Fast EMA">
                    <input
                      type="number"
                      name="macdFast"
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </FormField>

                  <FormField name="macdSlow" label="Slow EMA">
                    <input
                      type="number"
                      name="macdSlow"
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </FormField>

                  <FormField name="macdSignal" label="Signal Line">
                    <input
                      type="number"
                      name="macdSignal"
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <FormActions
              onCancel={onCancel}
              submitLabel="Run Analysis"
              isSubmitting={isSubmitting}
              canSubmit={formState.isValid}
            />
          </CardContent>
        </Card>
      )}
    </AdvancedForm>
  );
};

// ===== PORTFOLIO CREATION FORM =====

export const PortfolioCreationForm = ({
  onSubmit,
  onCancel,
  initialData = {},
  className,
  ...props
}) => {
  const [allocations, setAllocations] = useState(
    initialData.allocations || [{ ticker: '', allocation: 0, quantity: 0 }]
  );

  const portfolioSchema = yup.object().shape({
    name: FINANCIAL_VALIDATION_SCHEMAS.financialText,
    description: yup.string().max(1000, 'Description is too long'),
    initialInvestment: FINANCIAL_VALIDATION_SCHEMAS.financialNumber.required(
      'Initial investment is required'
    ),
    currency: yup.string().required('Currency is required'),
    riskTolerance: yup.string().required('Risk tolerance is required'),
    investmentHorizon: yup.string().required('Investment horizon is required'),
    rebalanceFrequency: yup.string().required('Rebalance frequency is required'),
    taxOptimization: yup.boolean(),
    dividendReinvestment: yup.boolean()
  });

  const addAllocation = useCallback(() => {
    setAllocations(prev => [...prev, { ticker: '', allocation: 0, quantity: 0 }]);
  }, []);

  const removeAllocation = useCallback(index => {
    setAllocations(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateAllocation = useCallback((index, field, value) => {
    setAllocations(prev =>
      prev.map((allocation, i) => (i === index ? { ...allocation, [field]: value } : allocation))
    );
  }, []);

  return (
    <AdvancedForm
      schema={portfolioSchema}
      defaultValues={{
        name: '',
        description: '',
        initialInvestment: '',
        currency: 'USD',
        riskTolerance: 'moderate',
        investmentHorizon: '5-10',
        rebalanceFrequency: 'quarterly',
        taxOptimization: false,
        dividendReinvestment: true,
        ...initialData
      }}
      onSubmit={data => onSubmit({ ...data, allocations })}
      className={className}
      {...props}
    >
      {({ formState, isSubmitting }) => (
        <Card>
          <CardHeader>
            <CardTitle>Create Portfolio</CardTitle>
            <p className="text-sm text-foreground-secondary">
              Set up a new investment portfolio with asset allocations
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField name="name" label="Portfolio Name" required>
                <input
                  type="text"
                  name="name"
                  placeholder="Growth Portfolio"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </FormField>

              <FormField name="initialInvestment" label="Initial Investment" required>
                <CurrencyInput name="initialInvestment" placeholder="$10,000.00" />
              </FormField>
            </div>

            <FormField name="description" label="Description">
              <textarea
                name="description"
                rows={3}
                placeholder="Describe your investment strategy and goals..."
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
              />
            </FormField>

            {/* Investment Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField name="currency" label="Currency" required>
                <select
                  name="currency"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </FormField>

              <FormField name="riskTolerance" label="Risk Tolerance" required>
                <select
                  name="riskTolerance"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                  <option value="very-aggressive">Very Aggressive</option>
                </select>
              </FormField>

              <FormField name="investmentHorizon" label="Investment Horizon" required>
                <select
                  name="investmentHorizon"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="1-3">1-3 Years</option>
                  <option value="3-5">3-5 Years</option>
                  <option value="5-10">5-10 Years</option>
                  <option value="10+">10+ Years</option>
                </select>
              </FormField>

              <FormField name="rebalanceFrequency" label="Rebalance Frequency" required>
                <select
                  name="rebalanceFrequency"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semi-annual">Semi-Annual</option>
                  <option value="annual">Annual</option>
                </select>
              </FormField>
            </div>

            {/* Investment Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Investment Options</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="taxOptimization"
                    className="rounded border-border text-brand-accent focus:ring-brand-accent"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Tax Optimization</span>
                    <p className="text-xs text-foreground-secondary">Optimize for tax efficiency</p>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="dividendReinvestment"
                    defaultChecked={true}
                    className="rounded border-border text-brand-accent focus:ring-brand-accent"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      Dividend Reinvestment
                    </span>
                    <p className="text-xs text-foreground-secondary">
                      Automatically reinvest dividends
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Asset Allocations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Asset Allocations</h4>
                <Button type="button" variant="outline" size="sm" onClick={addAllocation}>
                  Add Asset
                </Button>
              </div>

              <div className="space-y-3">
                {allocations.map((allocation, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border border-border rounded-md"
                  >
                    <div className="flex-1">
                      <TickerInput
                        name={`allocations[${index}].ticker`}
                        placeholder="AAPL"
                        value={allocation.ticker}
                        onChange={value => updateAllocation(index, 'ticker', value)}
                      />
                    </div>

                    <div className="w-24">
                      <PercentageInput
                        name={`allocations[${index}].allocation`}
                        placeholder="0.00%"
                        value={allocation.allocation}
                        onChange={value => updateAllocation(index, 'allocation', value)}
                      />
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={allocation.quantity}
                        onChange={e =>
                          updateAllocation(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                    </div>

                    {allocations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconXs"
                        onClick={() => removeAllocation(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Allocation Summary */}
              <div className="text-sm text-foreground-secondary">
                Total Allocation:{' '}
                {allocations.reduce((sum, a) => sum + (a.allocation || 0), 0).toFixed(2)}%
              </div>
            </div>

            {/* Form Actions */}
            <FormActions
              onCancel={onCancel}
              submitLabel="Create Portfolio"
              isSubmitting={isSubmitting}
              canSubmit={formState.isValid}
            />
          </CardContent>
        </Card>
      )}
    </AdvancedForm>
  );
};

// ===== FINANCIAL MODELING FORM =====

export const FinancialModelingForm = ({
  onSubmit,
  onCancel,
  initialData = {},
  className,
  ...props
}) => {
  const modelingSchema = yup.object().shape({
    companyName: FINANCIAL_VALIDATION_SCHEMAS.financialText,
    ticker: FINANCIAL_VALIDATION_SCHEMAS.ticker,
    industry: yup.string().required('Industry is required'),
    modelType: yup.string().required('Model type is required'),

    // Financial projections
    revenueGrowth: yup.number().min(-50).max(200),
    costOfRevenueGrowth: yup.number().min(-50).max(200),
    operatingExpenseGrowth: yup.number().min(-50).max(200),
    taxRate: yup.number().min(0).max(50),
    discountRate: yup.number().min(0).max(50),

    // Assumptions
    marketSize: FINANCIAL_VALIDATION_SCHEMAS.financialNumber,
    marketShare: yup.number().min(0).max(100),
    competitiveAdvantage: yup.string().max(500),

    // Valuation
    comparableCompanies: yup.array().of(yup.string()),
    exitMultiple: yup.number().min(1).max(50)
  });

  return (
    <AdvancedForm
      schema={modelingSchema}
      defaultValues={{
        companyName: '',
        ticker: '',
        industry: '',
        modelType: 'dcf',
        revenueGrowth: 15,
        costOfRevenueGrowth: 10,
        operatingExpenseGrowth: 8,
        taxRate: 25,
        discountRate: 12,
        marketSize: '',
        marketShare: 5,
        competitiveAdvantage: '',
        comparableCompanies: [],
        exitMultiple: 15,
        ...initialData
      }}
      onSubmit={onSubmit}
      className={className}
      {...props}
    >
      {({ formState, isSubmitting }) => (
        <Card>
          <CardHeader>
            <CardTitle>Financial Modeling</CardTitle>
            <p className="text-sm text-foreground-secondary">
              Create comprehensive financial projections and valuation models
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField name="companyName" label="Company Name" required>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Apple Inc."
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </FormField>

              <FormField name="ticker" label="Ticker Symbol">
                <TickerInput name="ticker" placeholder="AAPL" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField name="industry" label="Industry" required>
                <select
                  name="industry"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="financial-services">Financial Services</option>
                  <option value="consumer-goods">Consumer Goods</option>
                  <option value="energy">Energy</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </FormField>

              <FormField name="modelType" label="Model Type" required>
                <select
                  name="modelType"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="dcf">Discounted Cash Flow (DCF)</option>
                  <option value="comparable">Comparable Company Analysis</option>
                  <option value="precedent">Precedent Transaction Analysis</option>
                  <option value="lbo">Leveraged Buyout (LBO)</option>
                  <option value="sum-of-parts">Sum-of-the-Parts</option>
                </select>
              </FormField>
            </div>

            {/* Financial Projections */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Financial Projections</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField name="revenueGrowth" label="Revenue Growth (%)">
                  <PercentageInput name="revenueGrowth" placeholder="15.00%" />
                </FormField>

                <FormField name="costOfRevenueGrowth" label="COGS Growth (%)">
                  <PercentageInput name="costOfRevenueGrowth" placeholder="10.00%" />
                </FormField>

                <FormField name="operatingExpenseGrowth" label="OpEx Growth (%)">
                  <PercentageInput name="operatingExpenseGrowth" placeholder="8.00%" />
                </FormField>

                <FormField name="taxRate" label="Tax Rate (%)">
                  <PercentageInput name="taxRate" placeholder="25.00%" />
                </FormField>

                <FormField name="discountRate" label="Discount Rate (%)">
                  <PercentageInput name="discountRate" placeholder="12.00%" />
                </FormField>

                <FormField name="exitMultiple" label="Exit Multiple">
                  <input
                    type="number"
                    name="exitMultiple"
                    step="0.1"
                    min="1"
                    max="50"
                    placeholder="15.0x"
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </FormField>
              </div>
            </div>

            {/* Market Analysis */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Market Analysis</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField name="marketSize" label="Total Addressable Market">
                  <CurrencyInput name="marketSize" placeholder="$1,000,000,000" />
                </FormField>

                <FormField name="marketShare" label="Target Market Share (%)">
                  <PercentageInput name="marketShare" placeholder="5.00%" />
                </FormField>
              </div>

              <FormField name="competitiveAdvantage" label="Competitive Advantage">
                <textarea
                  name="competitiveAdvantage"
                  rows={3}
                  placeholder="Describe the company's competitive advantages..."
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
                />
              </FormField>
            </div>

            {/* Form Actions */}
            <FormActions
              onCancel={onCancel}
              submitLabel="Create Model"
              isSubmitting={isSubmitting}
              canSubmit={formState.isValid}
            />
          </CardContent>
        </Card>
      )}
    </AdvancedForm>
  );
};

// ===== EXPORT ALL COMPONENTS =====
export { StockAnalysisForm, PortfolioCreationForm, FinancialModelingForm };
