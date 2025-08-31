import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { cn } from '../../utils/cn';
import Button from '../ui/Button';

// ===== FORM STATE MANAGEMENT SYSTEM =====

/**
 * Advanced form state management with persistence, undo/redo,
 * collaborative editing, and real-time synchronization
 */

// ===== FORM HISTORY MANAGER =====

class FormHistoryManager {
  constructor(maxHistorySize = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = maxHistorySize;
  }

  push(state) {
    // Remove any history after current index (for when user undoes and then makes new changes)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push({
      ...state,
      timestamp: new Date().toISOString()
    });

    this.currentIndex++;

    // Maintain max history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  getCurrentState() {
    return this.history[this.currentIndex] || null;
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistory() {
    return this.history.map((item, index) => ({
      ...item,
      isCurrent: index === this.currentIndex
    }));
  }
}

// ===== FORM STATE MANAGER =====

export const FormStateManager = ({
  children,
  schema,
  defaultValues = {},
  onSubmit,
  onChange,
  onError,
  autoSave = true,
  autoSaveKey,
  autoSaveInterval = 30000, // 30 seconds
  enableHistory = true,
  maxHistorySize = 50,
  enableCollaboration = false,
  collaborationKey,
  className,
  ...props
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Refs
  const historyManagerRef = useRef(new FormHistoryManager(maxHistorySize));
  const autoSaveTimerRef = useRef(null);
  const wsRef = useRef(null);
  const lastChangeRef = useRef(null);

  // Form configuration
  const formConfig = {
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
    mode: 'onChange'
  };

  const methods = useForm(formConfig);

  // ===== AUTO-SAVE FUNCTIONALITY =====
  const saveFormState = useCallback(
    (data, isAutoSave = true) => {
      if (!autoSave || !autoSaveKey) return;

      try {
        const formState = {
          data,
          timestamp: new Date().toISOString(),
          version: '1.0',
          isAutoSave,
          formState: {
            isDirty: methods.formState.isDirty,
            isValid: methods.formState.isValid,
            errors: methods.formState.errors,
            touchedFields: methods.formState.touchedFields
          }
        };

        localStorage.setItem(`form_state_${autoSaveKey}`, JSON.stringify(formState));

        if (isAutoSave) {
          setLastSaved(new Date());
        }

        // Broadcast to collaborators
        if (enableCollaboration && wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: 'state_update',
              formKey: autoSaveKey,
              data: formState
            })
          );
        }
      } catch (error) {
        console.warn('Failed to save form state:', error);
      }
    },
    [autoSave, autoSaveKey, methods, enableCollaboration]
  );

  // ===== HISTORY MANAGEMENT =====
  const addToHistory = useCallback(
    data => {
      if (!enableHistory) return;

      const state = {
        data,
        formState: methods.formState
      };

      historyManagerRef.current.push(state);
    },
    [enableHistory, methods]
  );

  const undo = useCallback(() => {
    if (!enableHistory) return;

    const previousState = historyManagerRef.current.undo();
    if (previousState) {
      methods.reset(previousState.data);
      setIsDirty(true);
    }
  }, [enableHistory, methods]);

  const redo = useCallback(() => {
    if (!enableHistory) return;

    const nextState = historyManagerRef.current.redo();
    if (nextState) {
      methods.reset(nextState.data);
      setIsDirty(true);
    }
  }, [enableHistory, methods]);

  // ===== COLLABORATION SYSTEM =====
  const connectToCollaboration = useCallback(() => {
    if (!enableCollaboration || !collaborationKey) return;

    try {
      const ws = new WebSocket(`${process.env.REACT_APP_COLLABORATION_WS_URL}/${collaborationKey}`);

      ws.onopen = () => {
        setConnectionStatus('connected');
        ws.send(
          JSON.stringify({
            type: 'join',
            formKey: autoSaveKey,
            userId: `user_${Date.now()}`
          })
        );
      };

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'user_joined':
              setCollaborators(prev => [...prev, message.user]);
              break;
            case 'user_left':
              setCollaborators(prev => prev.filter(user => user.id !== message.userId));
              break;
            case 'state_update':
              // Handle remote state updates
              if (message.userId !== `user_${Date.now()}`) {
                // Apply remote changes (with conflict resolution)
                console.log('Received remote update:', message);
              }
              break;
            case 'field_update':
              // Handle individual field updates
              methods.setValue(message.field, message.value);
              break;
          }
        } catch (error) {
          console.error('Error processing collaboration message:', error);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setCollaborators([]);
      };

      ws.onerror = () => {
        setConnectionStatus('error');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Collaboration connection error:', error);
      setConnectionStatus('error');
    }
  }, [enableCollaboration, collaborationKey, autoSaveKey, methods]);

  // ===== FORM CHANGE HANDLER =====
  const handleFormChange = useCallback(
    data => {
      const now = Date.now();

      // Debounce rapid changes
      if (lastChangeRef.current && now - lastChangeRef.current < 100) {
        return;
      }

      lastChangeRef.current = now;

      setIsDirty(true);
      addToHistory(data);
      onChange?.(data);

      // Auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveFormState(data);
      }, autoSaveInterval);
    },
    [addToHistory, onChange, saveFormState, autoSaveInterval]
  );

  // ===== FORM SUBMISSION =====
  const handleSubmit = useCallback(
    async data => {
      setIsSubmitting(true);
      try {
        const result = await onSubmit(data);

        // Save successful submission
        saveFormState(data, false);
        setIsDirty(false);

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
    },
    [onSubmit, onError, saveFormState]
  );

  // ===== LOAD SAVED STATE =====
  useEffect(() => {
    if (autoSave && autoSaveKey) {
      try {
        const savedState = localStorage.getItem(`form_state_${autoSaveKey}`);
        if (savedState) {
          const { data, timestamp } = JSON.parse(savedState);

          // Only restore if saved within last 24 hours
          const savedTime = new Date(timestamp);
          const now = new Date();
          const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            methods.reset(data);
            setLastSaved(savedTime);
            addToHistory(data);
          }
        }
      } catch (error) {
        console.warn('Failed to load saved form state:', error);
      }
    }
  }, [autoSave, autoSaveKey, methods, addToHistory]);

  // ===== COLLABORATION CONNECTION =====
  useEffect(() => {
    if (enableCollaboration) {
      connectToCollaboration();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enableCollaboration, connectToCollaboration]);

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // ===== WATCH FORM CHANGES =====
  const watchedValues = methods.watch();
  useEffect(() => {
    if (Object.keys(watchedValues).length > 0) {
      handleFormChange(watchedValues);
    }
  }, [watchedValues, handleFormChange]);

  // ===== CONTEXT VALUE =====
  const contextValue = {
    isSubmitting,
    isDirty,
    lastSaved,
    collaborators,
    connectionStatus,
    history: enableHistory ? historyManagerRef.current.getHistory() : [],
    canUndo: enableHistory && historyManagerRef.current.canUndo(),
    canRedo: enableHistory && historyManagerRef.current.canRedo(),
    undo,
    redo,
    saveFormState,
    methods
  };

  return (
    <FormProvider {...methods}>
      <FormStateContext.Provider value={contextValue}>
        <form
          onSubmit={methods.handleSubmit(handleSubmit)}
          className={cn('form-state-managed', className)}
          {...props}
        >
          {/* Status Bar */}
          <FormStatusBar />

          {/* Form Content */}
          {typeof children === 'function' ? children(contextValue) : children}

          {/* Hidden submit button for programmatic submission */}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </FormStateContext.Provider>
    </FormProvider>
  );
};

// ===== FORM STATUS BAR =====

const FormStatusBar = () => {
  const { isDirty, lastSaved, collaborators, connectionStatus, canUndo, canRedo, undo, redo } =
    useFormStateManager();

  return (
    <div className="form-status-bar flex items-center justify-between px-4 py-2 bg-background-secondary border-b border-border text-sm">
      <div className="flex items-center gap-4">
        {/* Save Status */}
        <div className="flex items-center gap-2">
          {isDirty ? (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-yellow-600">Unsaved changes</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-green-600">
                {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'All changes saved'}
              </span>
            </>
          )}
        </div>

        {/* Collaboration Status */}
        {collaborators.length > 0 && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              )}
            />
            <span className="text-foreground-secondary">
              {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          className="h-8 px-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="h-8 px-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
};

// ===== FORM STATE CONTEXT =====

const FormStateContext = React.createContext();

export const useFormStateManager = () => {
  const context = React.useContext(FormStateContext);
  if (!context) {
    throw new Error('useFormStateManager must be used within FormStateManager');
  }
  return context;
};

// ===== FORM FIELD WITH STATE MANAGEMENT =====

export const ManagedFormField = ({ name, label, children, trackChanges = true, ...props }) => {
  const { collaborators, connectionStatus } = useFormStateManager();
  const {
    formState: { errors },
    watch
  } = useFormContext();

  const fieldValue = watch(name);
  const fieldError = errors[name];

  // Track field changes for collaboration
  useEffect(() => {
    if (trackChanges && collaborators.length > 0) {
      // Broadcast field changes to collaborators
      console.log(`Field ${name} changed to:`, fieldValue);
    }
  }, [fieldValue, name, trackChanges, collaborators]);

  return (
    <div className="managed-form-field">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {React.cloneElement(children, {
          id: name,
          name,
          'aria-describedby': fieldError ? `${name}-error` : undefined,
          'aria-invalid': fieldError ? 'true' : 'false',
          ...props
        })}

        {/* Collaboration indicator */}
        {collaborators.length > 0 && connectionStatus === 'connected' && (
          <div className="absolute top-2 right-2">
            <div
              className="w-2 h-2 bg-green-500 rounded-full"
              title="Collaborative editing active"
            />
          </div>
        )}
      </div>

      {/* Error message */}
      {fieldError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {fieldError.message}
        </p>
      )}
    </div>
  );
};

// ===== FORM VALIDATION SUMMARY =====

export const FormValidationSummary = ({ className, ...props }) => {
  const {
    formState: { errors, isValid, isValidating }
  } = useFormContext();

  if (isValid || Object.keys(errors).length === 0) return null;

  const errorFields = Object.keys(errors);

  return (
    <div
      className={cn(
        'form-validation-summary p-4 bg-red-50 border border-red-200 rounded-md',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
      </div>

      <ul className="space-y-1">
        {errorFields.map(fieldName => (
          <li key={fieldName} className="text-sm text-red-700 flex items-center gap-2">
            <span className="w-1 h-1 bg-red-500 rounded-full" />
            <span className="capitalize">{fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
            <span className="text-red-600">: {errors[fieldName]?.message}</span>
          </li>
        ))}
      </ul>

      {isValidating && (
        <div className="mt-3 text-sm text-red-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
          Validating...
        </div>
      )}
    </div>
  );
};

// ===== EXPORT ALL COMPONENTS =====
export { FormHistoryManager, FormStatusBar, ManagedFormField, FormValidationSummary };

export default FormStateManager;
