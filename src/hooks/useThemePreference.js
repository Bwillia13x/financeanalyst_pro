import { useCallback, useEffect, useState } from 'react';

import { persistenceManager } from '../services/persistence/PersistenceManager';

// Manages a persisted UI theme preference across the app
// Values: 'light' | 'dark'
export function useThemePreference(defaultValue = 'light') {
  const isValidTheme = (v) => v === 'light' || v === 'dark';
  const [theme, setTheme] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  // Load from persistence (with system preference fallback)
  useEffect(() => {
    let mounted = true;
    async function loadPrefs() {
      try {
        const prefs = await persistenceManager.retrieve('user_preferences');
        const storedTheme = prefs?.ui?.theme;
        if (mounted && storedTheme && isValidTheme(storedTheme)) {
          setTheme(storedTheme);
        } else if (mounted) {
          // Fallback to system preference on first load
          const prefersDark = typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme = prefersDark ? 'dark' : 'light';
          setTheme(isValidTheme(systemTheme) ? systemTheme : defaultValue);
        }
      } catch {
        // noop, fall back to default
      } finally {
        if (mounted) setLoaded(true);
      }
    }
    loadPrefs();
    return () => {
      mounted = false;
    };
  }, [defaultValue]);

  // Persist on change (after first load)
  useEffect(() => {
    if (!loaded) return;
    async function persistPrefs() {
      try {
        const prefs = (await persistenceManager.retrieve('user_preferences')) || {};
        const next = {
          ...prefs,
          ui: {
            ...(prefs.ui || {}),
            theme
          }
        };
        await persistenceManager.store('user_preferences', next, { storage: 'localStorage' });
      } catch {
        // ignore persistence errors
      }
    }
    persistPrefs();
  }, [theme, loaded]);

  // Sync theme across browser tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e) => {
      if (e.key !== 'user_preferences') return;
      try {
        const prefs = JSON.parse(e.newValue || 'null');
        const nextTheme = prefs?.ui?.theme;
        if (isValidTheme(nextTheme)) {
          setTheme(nextTheme);
        }
      } catch {
        // ignore JSON parse errors
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Reflect theme on the root element for Tailwind's class strategy
  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    // Also set data attribute for additional CSS hooks
    root.setAttribute('data-theme', theme);
  }, [theme, loaded]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme, loaded };
}
