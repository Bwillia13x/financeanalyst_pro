import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import React, { useState } from 'react';

import {
  FinancialInput,
  EditableCell,
  CurrencyInput,
  LoadingState,
  LoadingSkeleton,
  LoadingDots,
  ValidationFeedback,
  FieldValidation,
  ValidationSummary
} from './ui';
import { Card } from './ui/Card';

const FinancialInputsDemo = () => {
  const [values, setValues] = useState({
    revenue: 1250000,
    expenses: 850000,
    growth: 12.5,
    margin: 32.1,
    editableValue: 450000,
    currency: 2400000
  });

  const [isLoading, setIsLoading] = useState({
    calculation: false,
    validation: false
  });

  const [errors, setErrors] = useState([]);
  const [isEditingCell, setIsEditingCell] = useState(false);

  // Simulate calculation loading
  const simulateCalculation = () => {
    setIsLoading(prev => ({ ...prev, calculation: true }));
    setTimeout(() => {
      setIsLoading(prev => ({ ...prev, calculation: false }));
    }, 2000);
  };

  const handleValueChange = key => newValue => {
    setValues(prev => ({ ...prev, [key]: newValue }));
  };

  const validateInput = (value, min, max) => {
    const newErrors = [];
    if (value < min) newErrors.push(`Value must be at least ${min}`);
    if (value > max) newErrors.push(`Value must not exceed ${max}`);
    setErrors(newErrors);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Enhanced Financial Input Components
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Professional financial input components with smart formatting, validation, and seamless
            user experience
          </p>
        </div>

        {/* Main Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Input Component */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-900">FinancialInput Component</h2>
            </div>

            <div className="space-y-4">
              <FinancialInput
                label="Annual Revenue"
                value={values.revenue}
                onChange={handleValueChange('revenue')}
                type="currency"
                currency="USD"
                description="Enter the company's annual revenue"
                required
                onValidation={(isValid, message) => console.log('Validation:', isValid, message)}
              />

              <FinancialInput
                label="Operating Expenses"
                value={values.expenses}
                onChange={handleValueChange('expenses')}
                type="currency"
                currency="USD"
                error={values.expenses > values.revenue ? 'Expenses cannot exceed revenue' : null}
              />

              <FinancialInput
                label="Growth Rate"
                value={values.growth}
                onChange={handleValueChange('growth')}
                type="percentage"
                suffix="%"
                decimals={1}
                description="Year-over-year growth percentage"
              />

              <FinancialInput
                label="Profit Margin"
                value={values.margin}
                onChange={handleValueChange('margin')}
                type="number"
                suffix="%"
                decimals={2}
                min={0}
                max={100}
                loading={isLoading.validation}
              />
            </div>
          </Card>

          {/* Currency Input Component */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">CurrencyInput Component</h2>
            </div>

            <div className="space-y-4">
              <CurrencyInput
                label="Market Valuation"
                value={values.currency}
                onChange={handleValueChange('currency')}
                currency="USD"
                abbreviateDisplay={true}
                showTrend={true}
                previousValue={2100000}
                description="Company market valuation with trend indicator"
              />

              <CurrencyInput
                label="Investment Amount (EUR)"
                value={850000}
                onChange={val => console.log('EUR Value:', val)}
                currency="EUR"
                locale="de-DE"
                size="lg"
              />

              <CurrencyInput
                label="Small Investment"
                value={25000}
                onChange={val => console.log('Small Investment:', val)}
                currency="USD"
                size="sm"
                variant="filled"
              />

              <CurrencyInput
                label="Japanese Investment"
                value={15000000}
                onChange={val => console.log('JPY Value:', val)}
                currency="JPY"
                locale="ja-JP"
                abbreviateDisplay={true}
              />
            </div>
          </Card>

          {/* Editable Cells */}
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">EditableCell Component</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="text-sm font-medium text-slate-600">Account</div>
                <div className="text-sm font-medium text-slate-600">Current</div>
                <div className="text-sm font-medium text-slate-600">Adjusted</div>

                <div className="text-sm text-slate-700">Revenue</div>
                <EditableCell
                  value={values.editableValue}
                  onChange={handleValueChange('editableValue')}
                  type="currency"
                  isEditing={isEditingCell}
                  onEdit={setIsEditingCell}
                  variant="default"
                />
                <EditableCell
                  value={values.editableValue * 1.15}
                  onChange={val => console.log('Adjusted:', val)}
                  type="currency"
                  variant="adjusted"
                />

                <div className="text-sm text-slate-700">Growth Rate</div>
                <EditableCell
                  value={15.5}
                  onChange={val => console.log('Growth:', val)}
                  type="percentage"
                />
                <EditableCell
                  value={18.2}
                  onChange={val => console.log('Adj Growth:', val)}
                  type="percentage"
                  variant="adjusted"
                />

                <div className="text-sm text-slate-700">Calculated</div>
                <EditableCell
                  value={values.editableValue * 0.25}
                  isFormula={true}
                  variant="formula"
                />
                <EditableCell
                  value={values.editableValue * 1.15 * 0.25}
                  isFormula={true}
                  variant="formula"
                />
              </div>
            </div>
          </Card>

          {/* Loading States */}
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Loading States</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <LoadingState type="calculation" message="Calculating DCF..." size="default" />
                <LoadingState
                  type="financial"
                  message="Processing data..."
                  size="default"
                  variant="subtle"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">Inline Loading States</h4>
                <div className="flex items-center gap-4">
                  <LoadingState type="inline" message="Loading..." size="sm" />
                  <LoadingDots size="default" variant="primary" />
                  <LoadingSkeleton width="w-24" height="h-4" variant="currency" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">Interactive Loading Demo</h4>
                <button
                  onClick={simulateCalculation}
                  disabled={isLoading.calculation}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {isLoading.calculation ? 'Calculating...' : 'Run Calculation'}
                </button>
                {isLoading.calculation && (
                  <LoadingState
                    type="calculation"
                    message="Computing financial metrics..."
                    size="sm"
                    variant="pulsing"
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Validation Feedback */}
          <Card className="p-6 space-y-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-slate-900">Validation & Feedback</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-700">
                  Individual Validation Messages
                </h4>

                <ValidationFeedback
                  type="error"
                  message="Revenue cannot be negative"
                  size="default"
                />

                <ValidationFeedback
                  type="warning"
                  message="Growth rate seems unusually high"
                  size="default"
                />

                <ValidationFeedback
                  type="success"
                  message="All financial metrics are within expected ranges"
                  size="default"
                />

                <ValidationFeedback
                  type="info"
                  message="Consider adjusting the discount rate based on market conditions"
                  size="default"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-700">Field Validation</h4>

                <div className="space-y-2">
                  <label htmlFor="test-validation" className="text-sm font-medium text-slate-700">
                    Test Validation
                  </label>
                  <input
                    id="test-validation"
                    type="number"
                    value={-50}
                    onChange={e => validateInput(parseFloat(e.target.value), 0, 1000)}
                    className="w-full px-3 py-2 border border-input rounded-lg"
                  />
                  <FieldValidation
                    error={errors.length > 0 ? errors[0] : null}
                    info={errors.length === 0 ? 'Value is within acceptable range' : null}
                  />
                </div>

                <ValidationSummary
                  errors={[
                    'Operating expenses exceed revenue',
                    'Growth rate must be between 0% and 100%'
                  ]}
                  warnings={[
                    'Margin seems low for this industry',
                    'Consider reviewing the assumptions'
                  ]}
                  collapsible={true}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Usage Examples */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Usage Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-700 mb-2">Basic Currency Input</h4>
              <code className="text-xs text-slate-600 block whitespace-pre">
                {`<CurrencyInput
  value={1000000}
  onChange={setValue}
  currency="USD"
  label="Revenue"
/>`}
              </code>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-700 mb-2">Editable Table Cell</h4>
              <code className="text-xs text-slate-600 block whitespace-pre">
                {`<EditableCell
  value={value}
  onChange={onChange}
  type="currency"
  variant="adjusted"
/>`}
              </code>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-700 mb-2">Validation Feedback</h4>
              <code className="text-xs text-slate-600 block whitespace-pre">
                {`<FieldValidation
  error="Invalid input"
  warning="Check value"
  success="Valid input"
/>`}
              </code>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinancialInputsDemo;
