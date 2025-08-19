import { AlertCircle, Calculator, DollarSign, Percent } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { cn } from '../../utils/cn';

const FinancialInput = React.forwardRef(({
  className,
  label,
  value,
  onChange,
  onBlur,
  placeholder = '0.00',
  type = 'currency', // 'currency', 'percentage', 'number'
  prefix,
  suffix,
  locale = 'en-US',
  currency = 'USD',
  error,
  description,
  required = false,
  disabled = false,
  loading = false,
  decimals = 2,
  allowNegative = true,
  id,
  autoFocus = false,
  onValidation,
  min,
  max,
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef(null);
  const componentRef = ref || inputRef;

  // Generate unique ID if not provided
  const inputId = id || `financial-input-${Math.random().toString(36).substr(2, 9)}`;

  // Format value for display
  const formatValue = (val) => {
    if (!val && val !== 0) return '';

    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numValue)) return '';

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(numValue);

      case 'percentage':
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(numValue / 100);

      default:
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(numValue);
    }
  };

  // Parse display value to raw number
  const parseValue = (val) => {
    if (!val) return 0;

    // Remove currency symbols, commas, and spaces
    const cleanValue = val
      .replace(/[^\d.-]/g, '')
      .replace(/,/g, '');

    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Validate input
  const validateInput = (val) => {
    const numValue = typeof val === 'string' ? parseValue(val) : val;

    let valid = true;
    let errorMessage = '';

    if (required && (!numValue && numValue !== 0)) {
      valid = false;
      errorMessage = 'This field is required';
    } else if (!allowNegative && numValue < 0) {
      valid = false;
      errorMessage = 'Negative values are not allowed';
    } else if (min !== undefined && numValue < min) {
      valid = false;
      errorMessage = `Value must be at least ${formatValue(min)}`;
    } else if (max !== undefined && numValue > max) {
      valid = false;
      errorMessage = `Value must not exceed ${formatValue(max)}`;
    }

    setIsValid(valid);

    if (onValidation) {
      onValidation(valid, errorMessage);
    }

    return valid;
  };

  // Update display value when prop value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatValue(value));
    }
  }, [value, type, currency, locale, decimals, isFocused]);

  // Handle focus
  const handleFocus = (_e) => {
    setIsFocused(true);
    // Show raw number for editing
    const rawValue = value ? value.toString() : '';
    setDisplayValue(rawValue);

    // Select all text for easy replacement
    setTimeout(() => {
      if (componentRef.current) {
        componentRef.current.select();
      }
    }, 0);
  };

  // Handle blur
  const handleBlur = (_e) => {
    setIsFocused(false);
    const rawValue = parseValue(displayValue);

    validateInput(rawValue);

    // Format for display
    setDisplayValue(formatValue(rawValue));

    // Call onChange with parsed value
    if (onChange) {
      onChange(rawValue);
    }

    if (onBlur) {
      onBlur(_e);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;

    // Basic validation for numeric input
    const numericRegex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;

    if (numericRegex.test(newValue) || newValue === '') {
      setDisplayValue(newValue);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      componentRef.current?.blur();
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'currency':
        return <DollarSign size={16} className="text-muted-foreground" />;
      case 'percentage':
        return <Percent size={16} className="text-muted-foreground" />;
      default:
        return <Calculator size={16} className="text-muted-foreground" />;
    }
  };

  // Auto-focus if specified
  useEffect(() => {
    if (autoFocus && componentRef.current) {
      componentRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error && !isValid ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Left icon/prefix */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
          {getIcon()}
          {prefix && (
            <span className="text-sm text-muted-foreground font-medium">
              {prefix}
            </span>
          )}
        </div>

        <input
          ref={componentRef}
          id={inputId}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={cn(
            // Base styles
            'flex h-11 w-full rounded-lg border bg-background text-sm ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',

            // Padding adjustments for icons
            'pl-10 pr-4',
            suffix && 'pr-16',

            // Financial styling
            'font-mono text-right',
            'border-input hover:border-ring/50',

            // States
            isFocused && 'ring-2 ring-ring ring-offset-2 border-ring',
            error && !isValid && 'border-destructive focus-visible:ring-destructive',
            loading && 'animate-pulse',

            className
          )}
          {...props}
        />

        {/* Right suffix */}
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-sm text-muted-foreground font-medium">
              {suffix}
            </span>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error icon */}
        {error && !isValid && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle size={16} className="text-destructive" />
          </div>
        )}
      </div>

      {/* Description */}
      {description && !error && !isValid && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Error message */}
      {(error || !isValid) && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle size={14} />
          {error || 'Invalid input'}
        </p>
      )}
    </div>
  );
});

FinancialInput.displayName = 'FinancialInput';

export default FinancialInput;
