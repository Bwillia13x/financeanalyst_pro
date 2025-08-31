import { ChevronUp, ChevronDown, Calculator } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

const MobileFinancialInput = ({
  label,
  value,
  onChange,
  type = 'number',
  placeholder = '',
  unit = '',
  min,
  max,
  step = 1,
  className = '',
  required = false,
  disabled = false,
  helperText = '',
  error = false,
  errorMessage = '',
  showCalculator = true,
  onCalculatorClick
}) => {
  const [_isFocused, setIsFocused] = useState(false);
  const [showNumericPad, setShowNumericPad] = useState(false);
  const inputRef = useRef(null);

  // Detect if device supports touch
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Handle numeric input on mobile
  const handleNumericInput = digit => {
    if (disabled) return;

    const currentValue = inputRef.current?.value || '';
    const newValue = currentValue + digit;

    // Validate against min/max if provided
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && min !== undefined && numValue < min) return;
    if (!isNaN(numValue) && max !== undefined && numValue > max) return;

    onChange(newValue);
    inputRef.current?.focus();
  };

  // Handle backspace for numeric pad
  const handleBackspace = () => {
    if (disabled) return;
    const currentValue = inputRef.current?.value || '';
    onChange(currentValue.slice(0, -1));
  };

  // Handle increment/decrement for number inputs
  const handleIncrement = () => {
    if (disabled) return;
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue + (step || 1);
    if (max !== undefined && newValue > max) return;
    onChange(newValue.toString());
  };

  const handleDecrement = () => {
    if (disabled) return;
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue - (step || 1);
    if (min !== undefined && newValue < min) return;
    onChange(newValue.toString());
  };

  // Handle input focus for mobile
  const handleFocus = () => {
    setIsFocused(true);
    if (isTouchDevice && type === 'number') {
      setShowNumericPad(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding numeric pad to allow button clicks
    setTimeout(() => setShowNumericPad(false), 200);
  };

  const numericPadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫']
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Main Input */}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled}
          className={`
            w-full px-4 py-3 pr-12 bg-slate-800 border rounded-lg text-white placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500'}
            ${isTouchDevice ? 'text-lg' : 'text-base'}
          `}
          inputMode={type === 'number' ? 'numeric' : 'text'}
          pattern={type === 'number' ? '[0-9]*[.,]?[0-9]*' : undefined}
        />

        {/* Unit Display */}
        {unit && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
            {unit}
          </div>
        )}

        {/* Calculator Button */}
        {showCalculator && type === 'number' && (
          <button
            type="button"
            onClick={onCalculatorClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-400 transition-colors"
            aria-label="Open calculator"
          >
            <Calculator className="w-4 h-4" />
          </button>
        )}

        {/* Increment/Decrement Buttons for Number Inputs */}
        {type === 'number' && !isTouchDevice && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
            <button
              type="button"
              onClick={handleIncrement}
              disabled={disabled || (max !== undefined && parseFloat(value) >= max)}
              className="p-0.5 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Increase value"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleDecrement}
              disabled={disabled || (min !== undefined && parseFloat(value) <= min)}
              className="p-0.5 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decrease value"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Numeric Pad */}
      {showNumericPad && isTouchDevice && type === 'number' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800 border-t border-slate-700 p-4 md:hidden">
          <div className="max-w-sm mx-auto">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {numericPadButtons.map((row, rowIndex) =>
                row.map((button, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => {
                      if (button === '⌫') {
                        handleBackspace();
                      } else {
                        handleNumericInput(button);
                      }
                    }}
                    className="h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-lg font-semibold transition-colors active:bg-slate-500"
                  >
                    {button}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowNumericPad(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && <p className="mt-1 text-sm text-slate-400">{helperText}</p>}

      {/* Error Message */}
      {error && errorMessage && <p className="mt-1 text-sm text-red-400">{errorMessage}</p>}

      {/* Mobile Overlay for Numeric Pad */}
      {showNumericPad && isTouchDevice && (
        <div
          className="fixed inset-0 bg-black/50 -z-10 md:hidden"
          onClick={() => setShowNumericPad(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close numeric pad"
        />
      )}
    </div>
  );
};

export default MobileFinancialInput;
