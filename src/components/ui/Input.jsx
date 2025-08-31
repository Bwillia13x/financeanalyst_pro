import { forwardRef, useState } from 'react';

import { cn } from '../../utils/cn';

// ===== INSTITUTIONAL INPUT COMPONENT =====

const Input = forwardRef(
  (
    {
      className,
      type = 'text',
      label,
      description,
      error,
      success,
      warning,
      required = false,
      disabled = false,
      readOnly = false,
      id,
      size = 'default',
      variant = 'default',
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      fullWidth = false,
      showCount = false,
      maxLength,
      autoComplete,
      'aria-describedby': ariaDescribedBy,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // State management
    const [isFocused, setIsFocused] = useState(false);
    const [characterCount, setCharacterCount] = useState(
      props.value?.toString().length || props.defaultValue?.toString().length || 0
    );

    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;

    // Determine input state
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const hasWarning = !!warning && !hasError && !hasSuccess;
    const isDisabled = disabled || props.disabled;
    const isReadOnly = readOnly || props.readOnly;

    // ===== INSTITUTIONAL SIZE SYSTEM =====
    const sizeClasses = {
      xs: 'h-8 px-2 py-1 text-xs',
      sm: 'h-9 px-3 py-1.5 text-sm',
      default: 'h-10 px-3 py-2 text-sm',
      lg: 'h-11 px-4 py-2.5 text-base',
      xl: 'h-12 px-4 py-3 text-lg'
    };

    // ===== INSTITUTIONAL VARIANT SYSTEM =====
    const getVariantClasses = () => {
      const baseClasses = [
        'flex w-full rounded-lg border bg-background text-foreground',
        'placeholder:text-foreground-muted',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium'
      ];

      if (hasError) {
        baseClasses.push(
          'border-brand-error focus-visible:ring-brand-error',
          'hover:border-brand-error focus:border-brand-error'
        );
      } else if (hasSuccess) {
        baseClasses.push(
          'border-brand-success focus-visible:ring-brand-success',
          'hover:border-brand-success focus:border-brand-success'
        );
      } else if (hasWarning) {
        baseClasses.push(
          'border-brand-warning focus-visible:ring-brand-warning',
          'hover:border-brand-warning focus:border-brand-warning'
        );
      } else {
        baseClasses.push(
          'border-border focus-visible:ring-brand-accent',
          'hover:border-border-secondary focus:border-border-secondary'
        );
      }

      // Financial variant for monetary inputs
      if (variant === 'financial') {
        baseClasses.push('font-mono tabular-nums text-right');
      }

      return baseClasses.join(' ');
    };

    // Handle input changes for character count
    const handleInputChange = e => {
      if (showCount || maxLength) {
        setCharacterCount(e.target.value.length);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    // Handle focus/blur for enhanced UX
    const handleFocus = e => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = e => {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    // ===== CHECKBOX & RADIO VARIANTS =====
    if (type === 'checkbox') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            className={cn(
              'h-4 w-4 rounded border-2 bg-background text-brand-primary',
              'focus:ring-2 focus:ring-brand-accent focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              hasError && 'border-brand-error',
              className
            )}
            ref={ref}
            id={inputId}
            disabled={isDisabled}
            aria-describedby={
              ariaDescribedBy || (description && descriptionId) || (error && errorId)
            }
            aria-invalid={hasError ? 'true' : undefined}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'text-sm font-medium leading-none cursor-pointer',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                hasError ? 'text-brand-error' : 'text-foreground',
                isDisabled && 'cursor-not-allowed opacity-70'
              )}
            >
              {label}
              {required && (
                <span className="text-brand-error ml-1" aria-label="required">
                  *
                </span>
              )}
            </label>
          )}
        </div>
      );
    }

    if (type === 'radio') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            className={cn(
              'h-4 w-4 rounded-full border-2 bg-background text-brand-primary',
              'focus:ring-2 focus:ring-brand-accent focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              hasError && 'border-brand-error',
              className
            )}
            ref={ref}
            id={inputId}
            disabled={isDisabled}
            aria-describedby={
              ariaDescribedBy || (description && descriptionId) || (error && errorId)
            }
            aria-invalid={hasError ? 'true' : undefined}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'text-sm font-medium leading-none cursor-pointer',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                hasError ? 'text-brand-error' : 'text-foreground',
                isDisabled && 'cursor-not-allowed opacity-70'
              )}
            >
              {label}
              {required && (
                <span className="text-brand-error ml-1" aria-label="required">
                  *
                </span>
              )}
            </label>
          )}
        </div>
      );
    }

    // ===== ENHANCED INPUT WITH WRAPPER =====
    const inputElement = (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
            {leftIcon}
          </div>
        )}

        {/* Left Addon */}
        {leftAddon && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center px-3 bg-background-secondary border-r border-border rounded-l-lg">
            {leftAddon}
          </div>
        )}

        {/* Input Element */}
        <input
          type={type}
          className={cn(
            getVariantClasses(),
            sizeClasses[size],
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            leftAddon && 'pl-12',
            rightAddon && 'pr-12',
            isReadOnly && 'bg-background-secondary cursor-not-allowed',
            isFocused && 'ring-2 ring-brand-accent/20',
            className
          )}
          ref={ref}
          id={inputId}
          disabled={isDisabled}
          readOnly={isReadOnly}
          maxLength={maxLength}
          autoComplete={autoComplete}
          aria-label={ariaLabel}
          aria-describedby={
            ariaDescribedBy ||
            [
              description && descriptionId,
              error && errorId,
              success && `${inputId}-success`,
              warning && `${inputId}-warning`
            ]
              .filter(Boolean)
              .join(' ') ||
            undefined
          }
          aria-invalid={hasError ? 'true' : undefined}
          aria-required={required ? 'true' : undefined}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
            {rightIcon}
          </div>
        )}

        {/* Right Addon */}
        {rightAddon && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center px-3 bg-background-secondary border-l border-border rounded-r-lg">
            {rightAddon}
          </div>
        )}
      </div>
    );

    // ===== WRAPPER WITH LABEL AND MESSAGES =====
    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-label leading-none block',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              hasError ? 'text-brand-error' : 'text-foreground'
            )}
          >
            {label}
            {required && (
              <span className="text-brand-error ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input with Icons/Addons */}
        {inputElement}

        {/* Character Count */}
        {showCount && maxLength && (
          <div className="flex justify-end">
            <span
              className={cn(
                'text-xs',
                characterCount > maxLength * 0.9 ? 'text-brand-warning' : 'text-foreground-muted'
              )}
            >
              {characterCount}/{maxLength}
            </span>
          </div>
        )}

        {/* Description */}
        {description && !hasError && !hasWarning && (
          <p id={descriptionId} className="text-caption text-foreground-secondary">
            {description}
          </p>
        )}

        {/* Success Message */}
        {success && (
          <p
            id={`${inputId}-success`}
            className="text-caption text-brand-success flex items-center gap-1"
            role="status"
            aria-live="polite"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </p>
        )}

        {/* Warning Message */}
        {warning && !hasError && (
          <p
            id={`${inputId}-warning`}
            className="text-caption text-brand-warning flex items-center gap-1"
            role="status"
            aria-live="polite"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {warning}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            className="text-caption text-brand-error flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
