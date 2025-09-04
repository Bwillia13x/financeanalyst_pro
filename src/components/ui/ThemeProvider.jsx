import React, { createContext, useContext, useEffect, useState } from 'react';

import { cn } from '../../utils/cn';

/**
 * Theme Provider System
 * Comprehensive dark mode support with system preference detection and smooth transitions
 */

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  systemTheme: 'light',
  isSystemTheme: false
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const THEME_STORAGE_KEY = 'financeanalyst-theme';
const THEME_TRANSITION_DURATION = 300;

export const ThemeProvider = ({
  children,
  defaultTheme = 'system',
  enableTransitions = true,
  ...props
}) => {
  const [theme, setThemeState] = useState(defaultTheme);
  const [systemTheme, setSystemTheme] = useState('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);

    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme) {
      setThemeState(storedTheme);
    }
  }, []);

  // Calculate effective theme
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const isSystemTheme = theme === 'system';

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (enableTransitions && !isTransitioning) {
      setIsTransitioning(true);
      root.style.setProperty('--theme-transition-duration', `${THEME_TRANSITION_DURATION}ms`);

      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        root.style.removeProperty('--theme-transition-duration');
      }, THEME_TRANSITION_DURATION);

      return () => clearTimeout(timeout);
    }

    // Apply theme class
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, [effectiveTheme, enableTransitions, isTransitioning]);

  const setTheme = newTheme => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    effectiveTheme,
    systemTheme,
    isSystemTheme,
    isTransitioning
  };

  return (
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Theme Toggle Button Component
 */
export const ThemeToggle = ({
  size = 'default',
  variant = 'default',
  showLabel = false,
  className = '',
  ...props
}) => {
  const { theme, toggleTheme, effectiveTheme, isSystemTheme } = useTheme();

  const handleToggle = () => {
    toggleTheme();
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    default: 'bg-background border border-border hover:bg-background-secondary',
    ghost: 'bg-transparent hover:bg-background-secondary',
    outline: 'bg-background border-2 border-border hover:bg-background-secondary'
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'touch-manipulation active:scale-95',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Current theme: ${isSystemTheme ? 'System' : theme} (${effectiveTheme})`}
      {...props}
    >
      {/* Sun Icon for Light Mode */}
      <svg
        className={cn(
          'w-5 h-5 transition-all duration-300',
          effectiveTheme === 'dark'
            ? 'opacity-0 rotate-90 scale-0'
            : 'opacity-100 rotate-0 scale-100'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>

      {/* Moon Icon for Dark Mode */}
      <svg
        className={cn(
          'absolute w-5 h-5 transition-all duration-300',
          effectiveTheme === 'dark'
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-0'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>

      {showLabel && (
        <span className="sr-only">
          {isSystemTheme ? 'System' : theme} theme ({effectiveTheme === 'dark' ? 'Dark' : 'Light'})
        </span>
      )}
    </button>
  );
};

/**
 * Theme Indicator Component
 */
export const ThemeIndicator = ({ className = '', ...props }) => {
  const { theme, effectiveTheme, isSystemTheme } = useTheme();

  return (
    <div
      className={cn('flex items-center gap-2 text-sm text-foreground-secondary', className)}
      {...props}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full transition-colors duration-200',
          effectiveTheme === 'dark' ? 'bg-slate-400' : 'bg-yellow-400'
        )}
      />
      <span>
        {isSystemTheme ? 'System' : theme} ({effectiveTheme})
      </span>
    </div>
  );
};

/**
 * Theme Wrapper for smooth transitions
 */
export const ThemeWrapper = ({ children, className = '', ...props }) => {
  const { isTransitioning } = useTheme();

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        isTransitioning && 'transition-colors',
        className
      )}
      style={{
        transitionDuration: isTransitioning ? `${THEME_TRANSITION_DURATION}ms` : undefined
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * High Contrast Mode Toggle (for accessibility)
 */
export const HighContrastToggle = ({ className = '', ...props }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return (
    <button
      onClick={() => setIsHighContrast(!isHighContrast)}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg',
        'bg-background border border-border hover:bg-background-secondary',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isHighContrast && 'bg-primary text-primary-foreground',
        className
      )}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
      {...props}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <span>High Contrast</span>
    </button>
  );
};

/**
 * Theme Settings Panel
 */
export const ThemeSettings = ({ className = '', ...props }) => {
  const { theme, setTheme, systemTheme, isSystemTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' }
  ];

  return (
    <div className={cn('space-y-4', className)} {...props}>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Theme Settings</h3>
        <p className="text-sm text-foreground-secondary mb-4">
          Choose your preferred theme or let the system decide.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {themeOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border transition-all duration-200',
              'hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary',
              theme === option.value
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-foreground'
            )}
          >
            <span className="text-2xl">{option.icon}</span>
            <div className="text-left">
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-foreground-secondary">
                {option.value === 'system'
                  ? `Follows system (${systemTheme})`
                  : option.value === 'light'
                    ? 'Always light theme'
                    : 'Always dark theme'}
              </div>
            </div>
            {theme === option.value && (
              <div className="ml-auto">
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <ThemeIndicator />
      </div>
    </div>
  );
};

// Export all components individually
export default ThemeProvider;
