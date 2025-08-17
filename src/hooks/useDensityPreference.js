import { useCallback, useEffect, useState } from 'react';

import { persistenceManager } from '../services/persistence/PersistenceManager';

// Manages a persisted UI density preference across the app
// Values: 'comfortable' | 'compact'
export function useDensityPreference(defaultValue = 'comfortable') {
  const [density, setDensity] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  // Load from persistence
  useEffect(() => {
    let mounted = true;
    async function loadPrefs() {
      try {
        const prefs = await persistenceManager.retrieve('user_preferences');
        if (mounted && prefs && prefs.ui?.density) {
          setDensity(prefs.ui.density);
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
  }, []);

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
            density
          }
        };
        await persistenceManager.store('user_preferences', next, { storage: 'localStorage' });
      } catch {
        // ignore persistence errors
      }
    }
    persistPrefs();
  }, [density, loaded]);

  const toggleDensity = useCallback(() => {
    setDensity(prev => (prev === 'compact' ? 'comfortable' : 'compact'));
  }, []);

  return { density, setDensity, toggleDensity, loaded };
}
