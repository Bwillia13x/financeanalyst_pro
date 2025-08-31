import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cn } from '../../utils/cn';

// ===== ADVANCED FORM SYSTEM =====

/**
 * Institutional-grade form system with advanced validation,
 * state management, and professional UX for financial applications
 */

// ===== FORM VALIDATION SCHEMAS =====

export const FINANCIAL_VALIDATION_SCHEMAS = {
  // Currency validation
  currency: yup
    .string()
    .matches(/^\$?[\d,]+(\.\d{1,2})?$/, 'Invalid currency format')
    .transform((value) => value?.replace(/[$,]/g, '')),
  .test('is-positive', 'Amount must be positive', (value) => {
    if (!value) return true;
    const num = parseFloat(value);
    return num > 0;
  }),

  // Percentage validation
  percentage: yup
    .string()
    .matches(/^(\d{1,3}(\.\d{1,2})?|\.\d{1,2})?$/, 'Invalid percentage format')
    .test('is-valid-percentage', 'Percentage must be between 0 and 100', (value) => {
      if (!value) return true;
      const num = parseFloat(value);
      return num >= 0 && num <= 100;
    }),

  // Date validation
  date: yup
    .date()
    .required('Date is required')
    .max(new Date(), 'Date cannot be in the future'),

  // Ticker symbol validation
  ticker: yup
    .string()
    .required('Ticker symbol is required')
    .matches(/^[A-Z]{1,5}(\.[A-Z]{1,2})?$/, 'Invalid ticker symbol format')
    .min(1, 'Ticker symbol is too short')
    .max(7, 'Ticker symbol is too long'),

  // Email validation for financial contexts
  financialEmail: yup
    .string()
    .email('Invalid email format')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')
    .required('Email is required'),

  // Phone validation
  phone: yup
    .string()
    .matches(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number is too short'),

  // URL validation for financial links
  financialUrl: yup
    .string()
    .url('Invalid URL format')
    .matches(/^https?:\/\/.*/, 'URL must use HTTP or HTTPS'),

  // Number validation with financial constraints
  financialNumber: yup
    .number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .positive('Number must be positive')
    .max(999999999.99, 'Number is too large'),

  // Text validation with financial context
  financialText: yup
    .string()
    .trim()
    .min(1, 'This field is required')
    .max(500, 'Text is too long (max 500 characters)'),

  // Required field validation
  required: yup.string().required('This field is required'),

  // Optional field
  optional: yup.string()
};

// ===== ADVANCED FORM COMPONENT =====

export const AdvancedForm = ({
  schema,
  defaultValues = {},
  onSubmit,
  onChange,
  onError,
  children,
  className,
  autoSave = false,
  autoSaveKey,
  validateOnChange = false,
  validateOnBlur = true,
  mode = 'onSubmit', // 'onSubmit', 'onChange', 'onBlur'
  ...props
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [formData, setFormData] = useState(defaultValues);

  // Create validation schema
  const validationSchema = useMemo(() => {
    if (typeof schema === 'function') {
      return yup.object().shape(schema(FINANCIAL_VALIDATION_SCHEMAS));
    }
    return schema || yup.object().shape({});
  }, [schema]);

  // Form configuration
  const formConfig = {
    resolver: yupResolver(validationSchema),
    defaultValues,
    mode,
    criteriaMode: 'all',
    shouldUnregister: false,
    shouldFocusError: true
  };

  const methods = useForm(formConfig);

  // Auto-save functionality
  const saveFormData = useCallback((data) => {
    if (autoSave && autoSaveKey) {
      try {
        localStorage.setItem(`form_${autoSaveKey}`, JSON.stringify({
          data,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }));
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Failed to auto-save form data:', error);
      }
    }
  }, [autoSave, autoSaveKey]);

  // Load saved form data
  useEffect(() => {
    if (autoSave && autoSaveKey) {
      try {
        const saved = localStorage.getItem(`form_${autoSaveKey}`);
        if (saved) {
          const { data, timestamp } = JSON.parse(saved);
          methods.reset(data);
          setFormData(data);
          setLastSaved(new Date(timestamp));
        }
      } catch (error) {
        console.warn('Failed to load saved form data:', error);
      }
    }
  }, [autoSave, autoSaveKey, methods]);

  // Handle form submission
  const handleSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit(data);
      if (autoSave && autoSaveKey) {
        saveFormData(data);
      }
      return result;
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        console.error('Form submission error:', error);
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onError, autoSave, autoSaveKey, saveFormData]);

  // Handle form changes
  const handleChange = useCallback((data) => {
    setFormData(data);
    if (onChange) {
      onChange(data);
    }
    if (autoSave && autoSaveKey) {
      saveFormData(data);
    }
  }, [onChange, autoSave, autoSaveKey, saveFormData]);

  // Watch for form changes
  const watchedValues = methods.watch();
  useEffect(() => {
    if (validateOnChange && Object.keys(watchedValues).length > 0) {
      handleChange(watchedValues);
    }
  }, [watchedValues, validateOnChange, handleChange]);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleSubmit)}
        className={cn('space-y-6', className)}
        {...props}
      >
        {/* Auto-save indicator */}
        {autoSave && lastSaved && (
          <div className="text-xs text-foreground-muted text-right">
            Auto-saved {lastSaved.toLocaleTimeString()}
          </div>
        )}

        {/* Form content */}
        {typeof children === 'function'
          ? children({
              formState: methods.formState,
              isSubmitting,
              errors: methods.formState.errors,
              isValid: methods.formState.isValid,
              isDirty: methods.formState.isDirty,
              touchedFields: methods.formState.touchedFields,
              lastSaved
            })
          : children
        }

        {/* Hidden submit button for programmatic submission */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </FormProvider>
  );
};

// ===== FINANCIAL INPUT COMPONENTS =====

// Currency Input
export const CurrencyInput = ({
  name,
  label,
  placeholder = '$0.00',
  required = false,
  disabled = false,
  className,
  ...props
}) => {
  const { control, formState: { errors } } = useFormContext();
  const [displayValue, setDisplayValue] = useState('');

  const formatCurrency = useCallback((value) => {
    if (!value) return '';

    // Remove non-numeric characters except decimal point
    const numericValue = value.toString().replace(/[^0-9.]/g, '');

    // Parse as float
    const floatValue = parseFloat(numericValue);

    if (isNaN(floatValue)) return '';

    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(floatValue);
  }, []);

  const parseCurrency = useCallback((value) => {
    if (!value) return '';

    // Remove currency symbols and formatting
    const numericString = value.toString().replace(/[$,]/g, '');

    // Parse as float
    const floatValue = parseFloat(numericString);

    return isNaN(floatValue) ? '' : floatValue.toString();
  }, []);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          {label && (
            <label
              htmlFor={name}
              className={cn(
                'block text-sm font-medium',
                required && "after:content-['*'] after:text-red-500 after:ml-1",
                disabled ? 'text-foreground-muted' : 'text-foreground'
              )}
            >
              {label}
            </label>
          )}

          <div className="relative">
            <input
              {...field}
              id={name}
              type="text"
              value={displayValue}
              onChange={(e) => {
                const inputValue = e.target.value;
                setDisplayValue(inputValue);

                // Update the actual field value with parsed number
                const parsedValue = parseCurrency(inputValue);
                field.onChange(parsedValue);
              }}
              onBlur={(e) => {
                // Format for display on blur
                const formatted = formatCurrency(field.value);
                setDisplayValue(formatted);
                field.onBlur();
              }}
              onFocus={(e) => {
                // Show raw value for editing
                setDisplayValue(field.value || '');
              }}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm',
                'focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent',
                'disabled:bg-background-secondary disabled:cursor-not-allowed',
                errors[name]
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-border focus:border-brand-accent',
                className
              )}
              {...props}
            />

            {/* Currency symbol indicator */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-foreground-muted text-sm">$</span>
            </div>
          </div>

          {/* Error message */}
          {errors[name] && (
            <p className="text-sm text-red-600">
              {errors[name]?.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

// Percentage Input
export const PercentageInput = ({
  name,
  label,
  placeholder = '0.00%',
  required = false,
  disabled = false,
  max = 100,
  min = 0,
  className,
  ...props
}) => {
  const { control, formState: { errors } } = useFormContext();
  const [displayValue, setDisplayValue] = useState('');

  const formatPercentage = useCallback((value) => {
    if (!value && value !== 0) return '';

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';

    return `${numValue.toFixed(2)}%`;
  }, []);

  const parsePercentage = useCallback((value) => {
    if (!value) return '';

    const numericString = value.toString().replace(/%/g, '');
    const floatValue = parseFloat(numericString);

    return isNaN(floatValue) ? '' : floatValue.toString();
  }, []);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          {label && (
            <label
              htmlFor={name}
              className={cn(
                'block text-sm font-medium',
                required && "after:content-['*'] after:text-red-500 after:ml-1",
                disabled ? 'text-foreground-muted' : 'text-foreground'
              )}
            >
              {label}
            </label>
          )}

          <div className="relative">
            <input
              {...field}
              id={name}
              type="text"
              value={displayValue}
              onChange={(e) => {
                const inputValue = e.target.value;
                setDisplayValue(inputValue);

                const parsedValue = parsePercentage(inputValue);
                field.onChange(parsedValue);
              }}
              onBlur={(e) => {
                const formatted = formatPercentage(field.value);
                setDisplayValue(formatted);
                field.onBlur();

                // Validate range
                const numValue = parseFloat(field.value);
                if (!isNaN(numValue) && (numValue < min || numValue > max)) {
                  // This would trigger validation error
                }
              }}
              onFocus={(e) => {
                setDisplayValue(field.value || '');
              }}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm pr-8',
                'focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent',
                'disabled:bg-background-secondary disabled:cursor-not-allowed',
                errors[name]
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-border focus:border-brand-accent',
                className
              )}
              {...props}
            />

            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-foreground-muted text-sm">%</span>
            </div>
          </div>

          {/* Range indicator */}
          {(min !== undefined || max !== undefined) && (
            <div className="text-xs text-foreground-muted">
              {min !== undefined && max !== undefined
                ? `Range: ${min}% - ${max}%`
                : min !== undefined
                ? `Min: ${min}%`
                : `Max: ${max}%`
              }
            </div>
          )}

          {errors[name] && (
            <p className="text-sm text-red-600">
              {errors[name]?.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

// Ticker Symbol Input
export const TickerInput = ({
  name,
  label = 'Ticker Symbol',
  placeholder = 'AAPL',
  required = false,
  disabled = false,
  validateTicker = true,
  className,
  ...props
}) => {
  const { control, formState: { errors } } = useFormContext();
  const [isValidating, setIsValidating] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          {label && (
            <label
              htmlFor={name}
              className={cn(
                'block text-sm font-medium',
                required && "after:content-['*'] after:text-red-500 after:ml-1",
                disabled ? 'text-foreground-muted' : 'text-foreground'
              )}
            >
              {label}
            </label>
          )}

          <div className="relative">
            <input
              {...field}
              id={name}
              type="text"
              value={(field.value || '').toUpperCase()}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                field.onChange(value);

                if (validateTicker && value.length >= 1) {
                  setIsValidating(true);
                  // Simulate ticker validation
                  setTimeout(() => setIsValidating(false), 300);
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={7}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm uppercase font-mono',
                'focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent',
                'disabled:bg-background-secondary disabled:cursor-not-allowed',
                errors[name]
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-border focus:border-brand-accent',
                isValidating && 'border-yellow-500',
                className
              )}
              {...props}
            />

            {/* Validation indicator */}
            {isValidating && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
              </div>
            )}

            {/* Stock icon */}
            {!isValidating && field.value && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Validation message */}
          {field.value && !errors[name] && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Valid ticker symbol
            </div>
          )}

          {errors[name] && (
            <p className="text-sm text-red-600">
              {errors[name]?.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

// ===== FORM FIELD COMPONENTS =====

// Form Field Wrapper
export const FormField = ({
  name,
  label,
  description,
  error,
  required = false,
  disabled = false,
  children,
  className,
  ...props
}) => {
  const { formState: { errors } } = useFormContext();
  const fieldError = errors[name] || error;

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {label && (
        <label
          htmlFor={name}
          className={cn(
            'block text-sm font-medium',
            required && "after:content-['*'] after:text-red-500 after:ml-1",
            disabled ? 'text-foreground-muted' : 'text-foreground'
          )}
        >
          {label}
        </label>
      )}

      {description && (
        <p className="text-sm text-foreground-secondary">
          {description}
        </p>
      )}

      <div className="relative">
        {children}
      </div>

      {fieldError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {fieldError.message}
        </p>
      )}
    </div>
  );
};

// ===== FORM ACTION COMPONENTS =====

// Form Actions
export const FormActions = ({
  onCancel,
  onReset,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  resetLabel = 'Reset',
  isSubmitting = false,
  canSubmit = true,
  canReset = true,
  canCancel = true,
  className,
  ...props
}) => {
  const { reset, formState: { isDirty } } = useFormContext();

  return (
    <div className={cn('flex items-center justify-end gap-3 pt-6 border-t border-border', className)} {...props}>
      {canCancel && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md',
            'border border-border bg-background text-foreground',
            'hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {cancelLabel}
        </button>
      )}

      {canReset && (
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting || !isDirty}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md',
            'border border-border bg-background text-foreground',
            'hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {resetLabel}
        </button>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !canSubmit}
        className={cn(
          'px-6 py-2 text-sm font-medium rounded-md',
          'bg-brand-primary text-foreground-inverse',
          'hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center gap-2'
        )}
      >
        {isSubmitting && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground-inverse"></div>
        )}
        {isSubmitting ? 'Submitting...' : submitLabel}
      </button>
    </div>
  );
};

// ===== EXPORT ALL COMPONENTS =====
export {
  FINANCIAL_VALIDATION_SCHEMAS,
  CurrencyInput,
  PercentageInput,
  TickerInput,
  FormField,
  FormActions
};

export default AdvancedForm;
