import { Eye, EyeOff, Type, Contrast, Volume2, VolumeX } from 'lucide-react';
import React, { useState, useEffect, createContext, useContext } from 'react';

// Accessibility Context
const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Accessibility Provider Component
export const AccessibilityWrapper = ({ children, onError: _onError, error: _error }) => {
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    audioFeedback: false,
    colorBlindFriendly: false
  });

  const [announcement, setAnnouncement] = useState('');

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    }

    // Detect system preferences
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');

      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion.matches,
        highContrast: prefersHighContrast.matches
      }));

      // Listen for changes
      const handleReducedMotionChange = e => {
        updateSetting('reducedMotion', e.matches);
      };

      const handleHighContrastChange = e => {
        updateSetting('highContrast', e.matches);
      };

      prefersReducedMotion.addListener?.(handleReducedMotionChange);
      prefersHighContrast.addListener?.(handleHighContrastChange);

      return () => {
        prefersReducedMotion.removeListener?.(handleReducedMotionChange);
        prefersHighContrast.removeListener?.(handleHighContrastChange);
      };
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text mode
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Color blind friendly
    if (settings.colorBlindFriendly) {
      root.classList.add('color-blind-friendly');
    } else {
      root.classList.remove('color-blind-friendly');
    }

    // Save settings
    localStorage.setItem('accessibility_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const announce = (message, priority = 'polite') => {
    setAnnouncement(''); // Clear first to ensure re-announcement
    setTimeout(() => setAnnouncement(message), 10);

    // Audio feedback if enabled
    if (settings.audioFeedback) {
      // Simple beep for important announcements
      if (priority === 'assertive') {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.setValueAtTime(800, context.currentTime);
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.1);
      }
    }
  };

  const value = {
    settings,
    updateSetting,
    announce
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <div className="accessibility-wrapper">
        {children}

        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
      </div>
    </AccessibilityContext.Provider>
  );
};

// Accessibility Control Panel Component
export const AccessibilityControls = ({ className = '' }) => {
  const { settings, updateSetting } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const controls = [
    {
      key: 'highContrast',
      label: 'High Contrast',
      description: 'Increase contrast for better visibility',
      icon: Contrast
    },
    {
      key: 'largeText',
      label: 'Large Text',
      description: 'Increase font size throughout the app',
      icon: Type
    },
    {
      key: 'reducedMotion',
      label: 'Reduced Motion',
      description: 'Minimize animations and transitions',
      icon: EyeOff
    },
    {
      key: 'audioFeedback',
      label: 'Audio Feedback',
      description: 'Play sounds for important actions',
      icon: settings.audioFeedback ? Volume2 : VolumeX
    },
    {
      key: 'colorBlindFriendly',
      label: 'Color Blind Friendly',
      description: 'Use patterns and symbols in addition to color',
      icon: Eye
    }
  ];

  return (
    <div className={`accessibility-controls ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="accessibility-toggle p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Eye className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="accessibility-panel absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
          role="dialog"
          aria-label="Accessibility Settings"
        >
          <div className="p-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Accessibility</h3>
          </div>

          <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
            {controls.map(({ key, label, description, icon: Icon }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer" aria-label={label}>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={e => updateSetting(key, e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-800">{label}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
            Settings are automatically saved and will persist between sessions.
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Button Component with Accessibility
export const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
  className = '',
  ...props
}) => {
  const { announce } = useAccessibility();

  const handleClick = e => {
    if (loading || disabled) return;

    if (onClick) {
      onClick(e);

      // Announce action completion
      if (ariaLabel) {
        announce(`${ariaLabel} completed`);
      }
    }
  };

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`
        inline-flex items-center justify-center rounded-md font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">Loading...</span>
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
        </>
      ) : null}
      {children}
    </button>
  );
};

// Skip Navigation Component
export const SkipNavigation = () => {
  const skipLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#model-library', label: 'Skip to model library' },
    { href: '#assumptions-form', label: 'Skip to assumptions form' },
    { href: '#results-panel', label: 'Skip to results panel' }
  ];

  return (
    <nav className="skip-nav" aria-label="Skip navigation">
      {skipLinks.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 text-sm font-medium"
        >
          {label}
        </a>
      ))}
    </nav>
  );
};

// Keyboard Navigation Hook
export const useKeyboardNavigation = (items = [], onSelect) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { announce } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = e => {
      if (!items.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => {
            const next = prev < items.length - 1 ? prev + 1 : 0;
            announce(`${items[next]?.name || `Item ${next + 1}`} focused`);
            return next;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => {
            const next = prev > 0 ? prev - 1 : items.length - 1;
            announce(`${items[next]?.name || `Item ${next + 1}`} focused`);
            return next;
          });
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && onSelect) {
            onSelect(items[focusedIndex]);
            announce(`${items[focusedIndex]?.name || 'Item'} selected`);
          }
          break;

        case 'Escape':
          setFocusedIndex(-1);
          announce('Navigation cleared');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, onSelect, announce]);

  return { focusedIndex, setFocusedIndex };
};

// Focus Management Hook
export const useFocusManagement = () => {
  const trapFocus = element => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = e => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  };

  const restoreFocus = previousElement => {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  };

  return { trapFocus, restoreFocus };
};

export default AccessibilityWrapper;
