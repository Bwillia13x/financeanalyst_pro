import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DollarSign, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

// Currency configurations
const CURRENCY_CONFIG = {
  USD: { symbol: '$', code: 'USD', decimals: 2, name: 'US Dollar' },
  EUR: { symbol: '€', code: 'EUR', decimals: 2, name: 'Euro' },
  GBP: { symbol: '£', code: 'GBP', decimals: 2, name: 'British Pound' },
  JPY: { symbol: '¥', code: 'JPY', decimals: 0, name: 'Japanese Yen' },
  CAD: { symbol: 'C$', code: 'CAD', decimals: 2, name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', code: 'AUD', decimals: 2, name: 'Australian Dollar' },
  CHF: { symbol: 'CHF', code: 'CHF', decimals: 2, name: 'Swiss Franc' },
  CNY: { symbol: '¥', code: 'CNY', decimals: 2, name: 'Chinese Yuan' }
};

const CurrencyInput = React.forwardRef(({
  className,
  label,
  value = 0,
  onChange,
  onBlur,
  placeholder,
  currency = 'USD',
  locale = 'en-US',
  error,
  description,
  required = false,
  disabled = false,
  loading = false,
  allowNegative = true,
  showCurrency = true,
  showTrend = false,
  previousValue,
  size = 'default', // 'sm', 'default', 'lg'
  variant = 'default', // 'default', 'filled', 'minimal'
  id,
  autoFocus = false,
  onValidation,
  min,
  max,
  step = 0.01,
  abbreviateDisplay = false, // Show 1.2M instead of 1,200,000
  precision, // Override default currency precision
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');
  const inputRef = useRef(null);
  const componentRef = ref || inputRef;

  // Generate unique ID if not provided
  const inputId = id || `currency-input-${Math.random().toString(36).substr(2, 9)}`;

  // Get currency configuration
  const currencyConfig = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const effectiveDecimals = precision !== undefined ? precision : currencyConfig.decimals;

  // Memoized placeholder
  const effectivePlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    const sample = formatCurrency(0);
    return sample;
  }, [placeholder, currency, effectiveDecimals]);

  // Format currency value
  function formatCurrency(val, options = {}) {
    if (!val && val !== 0) return '';
    
    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numValue)) return '';

    const { forDisplay = false, abbreviated = false } = options;

    // Handle abbreviation for large numbers
    if (abbreviated && abbreviateDisplay && Math.abs(numValue) >= 1000) {
      const absValue = Math.abs(numValue);
      const sign = numValue < 0 ? '-' : '';
      
      if (absValue >= 1000000000) {
        return `${sign}${currencyConfig.symbol}${(absValue / 1000000000).toFixed(1)}B`;
      } else if (absValue >= 1000000) {
        return `${sign}${currencyConfig.symbol}${(absValue / 1000000).toFixed(1)}M`;
      } else if (absValue >= 1000) {
        return `${sign}${currencyConfig.symbol}${(absValue / 1000).toFixed(0)}K`;
      }
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: effectiveDecimals,
        maximumFractionDigits: effectiveDecimals,
      }).format(numValue);
    } catch (error) {
      // Fallback formatting
      const formatted = numValue.toFixed(effectiveDecimals);
      return `${currencyConfig.symbol}${formatted}`;
    }
  }

  // Parse display value to number
  function parseCurrency(val) {
    if (!val) return 0;
    
    // Handle abbreviated values
    const str = val.toString().toLowerCase();
    let multiplier = 1;
    
    if (str.endsWith('k')) {
      multiplier = 1000;
    } else if (str.endsWith('m')) {
      multiplier = 1000000;
    } else if (str.endsWith('b')) {
      multiplier = 1000000000;
    }
    
    // Remove currency symbols, commas, spaces, and multiplier suffixes
    const cleanValue = val
      .toString()
      .replace(/[^\d.-]/g, '')
      .replace(/,/g, '');
    
    const numValue = parseFloat(cleanValue) * multiplier;
    return isNaN(numValue) ? 0 : numValue;
  }

  // Validate input
  const validateInput = (val) => {
    const numValue = typeof val === 'string' ? parseCurrency(val) : val;
    
    let valid = true;
    let message = '';

    if (required && (!numValue && numValue !== 0)) {
      valid = false;
      message = 'This field is required';
    } else if (!allowNegative && numValue < 0) {
      valid = false;
      message = 'Negative values are not allowed';
    } else if (min !== undefined && numValue < min) {
      valid = false;
      message = `Value must be at least ${formatCurrency(min)}`;
    } else if (max !== undefined && numValue > max) {
      valid = false;
      message = `Value must not exceed ${formatCurrency(max)}`;
    }

    setIsValid(valid);
    setValidationMessage(message);
    
    if (onValidation) {
      onValidation(valid, message);
    }

    return valid;
  };

  // Calculate trend
  const getTrend = () => {
    if (!showTrend || previousValue === undefined) return null;
    
    const current = typeof value === 'string' ? parseCurrency(value) : (value || 0);
    const previous = typeof previousValue === 'string' ? parseCurrency(previousValue) : (previousValue || 0);
    
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const trend = getTrend();

  // Update display value when prop value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value, { abbreviated: abbreviateDisplay }));
    }
  }, [value, currency, locale, effectiveDecimals, isFocused, abbreviateDisplay]);

  // Handle focus
  const handleFocus = (e) => {
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
  const handleBlur = (e) => {
    setIsFocused(false);
    const rawValue = parseCurrency(displayValue);
    
    validateInput(rawValue);
    
    // Format for display
    setDisplayValue(formatCurrency(rawValue, { abbreviated: abbreviateDisplay }));
    
    // Call onChange with parsed value
    if (onChange) {
      onChange(rawValue);
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Allow numbers, decimals, negative signs, and K/M/B suffixes
    const regex = allowNegative 
      ? /^-?\d*\.?\d*[kmb]?$/i 
      : /^\d*\.?\d*[kmb]?$/i;
    
    if (regex.test(newValue) || newValue === '') {
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

  // Auto-focus if specified
  useEffect(() => {
    if (autoFocus && componentRef.current) {
      componentRef.current.focus();
    }
  }, [autoFocus]);

  // Size variants
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    default: 'h-11 px-4 text-sm',
    lg: 'h-12 px-4 text-base'
  };

  // Variant styles
  const variantClasses = {
    default: 'border-input bg-background hover:border-ring/50',
    filled: 'border-transparent bg-muted hover:bg-muted/80',
    minimal: 'border-transparent bg-transparent hover:bg-muted/50'
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error || !isValid ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Currency symbol */}
        {showCurrency && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10">
            <DollarSign size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">
              {currencyConfig.code}
            </span>
          </div>
        )}

        <input
          ref={componentRef}
          id={inputId}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder={effectivePlaceholder}
          disabled={disabled || loading}
          step={step}
          className={cn(
            // Base styles
            'flex w-full rounded-lg border ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            
            // Size
            sizeClasses[size],
            
            // Variant
            variantClasses[variant],
            
            // Financial styling
            'font-mono text-right',
            
            // Padding adjustments
            showCurrency ? 'pl-16' : 'pl-4',
            'pr-4',
            trend && 'pr-8',
            
            // States
            isFocused && 'ring-2 ring-ring ring-offset-2 border-ring',
            (error || !isValid) && 'border-destructive focus-visible:ring-destructive',
            loading && 'animate-pulse',
            
            className
          )}
          {...props}
        />

        {/* Trend indicator */}
        {trend && trend !== 'neutral' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {trend === 'up' ? (
              <TrendingUp size={16} className="text-success" />
            ) : (
              <TrendingDown size={16} className="text-destructive" />
            )}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error icon */}
        {(error || !isValid) && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle size={16} className="text-destructive" />
          </div>
        )}
      </div>

      {/* Description */}
      {description && !error && isValid && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Error message */}
      {(error || !isValid) && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle size={14} />
          {error || validationMessage}
        </p>
      )}

      {/* Trend information */}
      {showTrend && previousValue !== undefined && trend !== 'neutral' && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp size={12} className="text-success" />
          ) : (
            <TrendingDown size={12} className="text-destructive" />
          )}
          vs. previous: {formatCurrency(previousValue)}
        </p>
      )}
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput as default, CURRENCY_CONFIG };