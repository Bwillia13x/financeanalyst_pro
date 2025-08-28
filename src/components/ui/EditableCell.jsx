import { Check, X, Edit2, Calculator, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { cn } from '../../utils/cn';

const EditableCell = ({
  value,
  onChange,
  onSave,
  onCancel,
  className,
  type = 'currency', // 'currency', 'percentage', 'number', 'text'
  placeholder = '0.00',
  isFormula = false,
  isEditing = false,
  onEdit,
  disabled = false,
  loading = false,
  error,
  locale = 'en-US',
  currency = 'USD',
  decimals = 2,
  allowNegative = true,
  min,
  max,
  autoFocus = true,
  showEditIcon = true,
  variant = 'default', // 'default', 'adjusted', 'formula'
  ..._props
}) => {
  const [editingValue, setEditingValue] = useState('');
  const [localError, setLocalError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  // Format value for display
  const formatValue = val => {
    if (!val && val !== 0) return '—';

    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numValue)) return '—';

    switch (type) {
      case 'currency': {
        const formatted = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(numValue);

        // For large numbers, add suffix
        const absValue = Math.abs(numValue);
        if (absValue >= 1000000) {
          return (
            new Intl.NumberFormat(locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            }).format(numValue / 1000000) + 'M'
          );
        } else if (absValue >= 1000) {
          return new Intl.NumberFormat(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(numValue);
        }
        return formatted.replace(/\.00$/, '');
      }

      case 'percentage':
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(numValue / 100);

      case 'number':
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(numValue);

      default:
        return val?.toString() || '';
    }
  };

  // Parse display value to raw number
  const parseValue = val => {
    if (!val) return 0;

    // Remove currency symbols, commas, and spaces
    const cleanValue = val.replace(/[^\d.-]/g, '').replace(/,/g, '');

    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Validate input
  const validateInput = val => {
    const numValue = type === 'text' ? val : parseValue(val);

    if (type === 'text') return true;

    if (!allowNegative && numValue < 0) {
      setLocalError('Negative values are not allowed');
      return false;
    }

    if (min !== undefined && numValue < min) {
      setLocalError(`Value must be at least ${formatValue(min)}`);
      return false;
    }

    if (max !== undefined && numValue > max) {
      setLocalError(`Value must not exceed ${formatValue(max)}`);
      return false;
    }

    setLocalError('');
    return true;
  };

  // Handle edit start
  const handleEdit = () => {
    if (disabled || isFormula) return;

    setEditingValue(value ? value.toString() : '');
    setLocalError('');

    if (onEdit) {
      onEdit(true);
    }
  };

  // Handle save
  const handleSave = () => {
    const finalValue = type === 'text' ? editingValue : parseValue(editingValue);

    if (!validateInput(editingValue)) {
      return;
    }

    if (onChange) {
      onChange(finalValue);
    }

    if (onSave) {
      onSave(finalValue);
    }

    if (onEdit) {
      onEdit(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingValue('');
    setLocalError('');

    if (onCancel) {
      onCancel();
    }

    if (onEdit) {
      onEdit(false);
    }
  };

  // Handle input change
  const handleChange = e => {
    const newValue = e.target.value;

    if (type !== 'text') {
      const numericRegex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
      if (numericRegex.test(newValue) || newValue === '') {
        setEditingValue(newValue);
      }
    } else {
      setEditingValue(newValue);
    }
  };

  // Handle key press
  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
    }
  };

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current && autoFocus) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, autoFocus]);

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'adjusted':
        return {
          container: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200',
          text: isFormula ? 'text-amber-900' : 'text-slate-700',
          hover: 'hover:bg-amber-100 hover:border-amber-300',
          input: 'border-amber-400 focus:ring-amber-100 focus:border-amber-500',
          editIcon: 'text-amber-500'
        };
      case 'formula':
        return {
          container: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200',
          text: 'text-blue-900',
          hover: 'cursor-not-allowed',
          input: 'border-blue-400 focus:ring-blue-100 focus:border-blue-500',
          editIcon: 'text-blue-500'
        };
      default:
        return {
          container: 'bg-background border-transparent',
          text: isFormula ? 'text-blue-900' : 'text-slate-700',
          hover: 'hover:bg-slate-50 hover:border-slate-200',
          input: 'border-input focus:ring-ring focus:border-ring',
          editIcon: 'text-slate-400'
        };
    }
  };

  const styles = getVariantStyles();

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={editingValue}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={loading}
          className={cn(
            'w-full px-3 py-2.5 bg-white border-2 rounded-lg text-slate-900 text-right font-mono text-sm',
            'focus:outline-none focus:ring-4 shadow-lg transition-all duration-200',
            styles.input,
            loading && 'animate-pulse',
            localError && 'border-destructive focus:ring-destructive/20',
            className
          )}
        />

        {/* Action buttons */}
        <div className="absolute -top-2 -right-2 flex gap-1">
          <button
            onClick={handleSave}
            disabled={loading || !!localError}
            className={cn(
              'w-5 h-5 bg-success hover:bg-success/90 text-white rounded-full',
              'flex items-center justify-center text-xs transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Save changes"
          >
            <Check size={12} />
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className={cn(
              'w-5 h-5 bg-destructive hover:bg-destructive/90 text-white rounded-full',
              'flex items-center justify-center text-xs transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Cancel changes"
          >
            <X size={12} />
          </button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Local error */}
        {localError && (
          <div className="absolute -bottom-6 left-0 right-0 text-xs text-destructive flex items-center gap-1">
            <AlertCircle size={10} />
            {localError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleEdit}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleEdit();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'px-3 py-2.5 rounded-lg font-mono text-sm transition-all duration-200',
        'min-h-[40px] flex items-center justify-end relative group',
        styles.container,
        !disabled && !isFormula && styles.hover,
        !disabled && !isFormula && 'cursor-pointer',
        isFormula && 'font-semibold shadow-sm',
        disabled && 'opacity-50 cursor-not-allowed',
        error && 'border-destructive',
        className
      )}
    >
      <span className={styles.text}>{formatValue(value)}</span>

      {/* Formula indicator */}
      {isFormula && <Calculator size={12} className="ml-2 text-blue-500/80" />}

      {/* Edit icon */}
      {!isFormula && !disabled && showEditIcon && (
        <Edit2
          size={12}
          className={cn(
            'ml-2 transition-opacity',
            isHovered ? 'opacity-60' : 'opacity-0',
            styles.editIcon
          )}
        />
      )}

      {/* Error indicator */}
      {error && <AlertCircle size={12} className="ml-2 text-destructive" />}

      {/* Loading indicator */}
      {loading && (
        <div className="ml-2">
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
        </div>
      )}
    </div>
  );
};

export default EditableCell;
