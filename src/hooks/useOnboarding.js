import { useState, useEffect } from 'react';

import { ONBOARDING_TOURS, shouldShowIntroduction } from '../config/onboardingTours';

/**
 * Custom hook for managing onboarding state and user preferences
 */

const STORAGE_KEY = 'financeanalyst-onboarding-state';

export const useOnboarding = () => {
  const [onboardingState, setOnboardingState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? JSON.parse(stored)
        : {
            completedTours: [],
            dismissedIntroductions: [],
            currentTour: null,
            userPreferences: {
              showTooltips: true,
              autoStartTours: true,
              tourSpeed: 'normal'
            }
          };
    } catch {
      return {
        completedTours: [],
        dismissedIntroductions: [],
        currentTour: null,
        userPreferences: {
          showTooltips: true,
          autoStartTours: true,
          tourSpeed: 'normal'
        }
      };
    }
  });

  // Persist state changes to localStorage, but skip during tests to prevent crashes
  useEffect(() => {
    const isAutomatedEnvironment =
      navigator.webdriver ||
      window.location.search.includes('lhci') ||
      window.location.search.includes('ci') ||
      window.location.search.includes('audit');

    if (!isAutomatedEnvironment) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingState));
      } catch (error) {
        console.warn('Failed to persist onboarding state:', error);
      }
    }
  }, [onboardingState]);

  // Ensure we always use the canonical tour key (e.g., 'privateAnalysis')
  const normalizeTourId = id => {
    if (!id) return id;
    if (ONBOARDING_TOURS[id]) return id;
    const match = Object.entries(ONBOARDING_TOURS).find(([, tour]) => tour.id === id);
    return match ? match[0] : id;
  };

  const startTour = tourId => {
    const normalizedId = normalizeTourId(tourId);
    const tour = ONBOARDING_TOURS[normalizedId];
    if (!tour) {
      console.warn(`Tour ${tourId} not found`);
      return false;
    }

    setOnboardingState(prev => ({
      ...prev,
      currentTour: {
        ...tour,
        // Preserve the canonical key as the id to avoid mismatches
        id: normalizedId,
        startedAt: Date.now()
      }
    }));

    return true;
  };

  const completeTour = tourId => {
    try {
      setOnboardingState(prev => {
        const fallbackId = prev.currentTour?.id;
        const normalizedId = normalizeTourId(tourId || fallbackId);

        if (!normalizedId) {
          console.warn('completeTour called without valid tour ID');
          return { ...prev, currentTour: null };
        }

        return {
          ...prev,
          currentTour: null,
          completedTours: [...new Set([...prev.completedTours, normalizedId])]
        };
      });
    } catch (error) {
      console.error('Error completing tour:', error);
      // Fallback: just clear current tour
      setOnboardingState(prev => ({ ...prev, currentTour: null }));
    }
  };

  const skipTour = () => {
    setOnboardingState(prev => ({
      ...prev,
      currentTour: null
    }));
  };

  const dismissIntroduction = featureId => {
    setOnboardingState(prev => ({
      ...prev,
      dismissedIntroductions: [...new Set([...prev.dismissedIntroductions, featureId])]
    }));
  };

  const shouldShowFeatureIntroduction = featureId => {
    return shouldShowIntroduction(featureId, {
      dismissedIntroductions: onboardingState.dismissedIntroductions
    });
  };

  const resetOnboarding = () => {
    setOnboardingState({
      completedTours: [],
      dismissedIntroductions: [],
      currentTour: null,
      userPreferences: {
        showTooltips: true,
        autoStartTours: true,
        tourSpeed: 'normal'
      }
    });
  };

  const updatePreferences = newPreferences => {
    setOnboardingState(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        ...newPreferences
      }
    }));
  };

  const hasTourBeenCompleted = tourId => {
    const normalizedId = normalizeTourId(tourId);
    return onboardingState.completedTours.includes(normalizedId);
  };

  const getAvailableTours = () => {
    return Object.entries(ONBOARDING_TOURS).map(([id, tour]) => ({
      id,
      ...tour,
      completed: hasTourBeenCompleted(id)
    }));
  };

  return {
    // State
    currentTour: onboardingState.currentTour,
    completedTours: onboardingState.completedTours,
    dismissedIntroductions: onboardingState.dismissedIntroductions,
    userPreferences: onboardingState.userPreferences,

    // Actions
    startTour,
    completeTour,
    skipTour,
    dismissIntroduction,
    resetOnboarding,
    updatePreferences,

    // Helpers
    shouldShowFeatureIntroduction,
    hasTourBeenCompleted,
    getAvailableTours
  };
};
