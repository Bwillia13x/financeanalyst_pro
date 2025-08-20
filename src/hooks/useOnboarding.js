import { useState, useEffect } from 'react';
import { ONBOARDING_TOURS, FEATURE_INTRODUCTIONS, shouldShowIntroduction, markIntroductionSeen } from '../config/onboardingTours';

/**
 * Custom hook for managing onboarding state and user preferences
 */

const STORAGE_KEY = 'financeanalyst-onboarding-state';

export const useOnboarding = () => {
  const [onboardingState, setOnboardingState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
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

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingState));
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
  }, [onboardingState]);

  const startTour = (tourId) => {
    const tour = ONBOARDING_TOURS[tourId];
    if (!tour) {
      console.warn(`Tour ${tourId} not found`);
      return false;
    }

    setOnboardingState(prev => ({
      ...prev,
      currentTour: {
        id: tourId,
        ...tour,
        startedAt: Date.now()
      }
    }));

    return true;
  };

  const completeTour = (tourId) => {
    setOnboardingState(prev => ({
      ...prev,
      currentTour: null,
      completedTours: [...new Set([...prev.completedTours, tourId])]
    }));
  };

  const skipTour = () => {
    setOnboardingState(prev => ({
      ...prev,
      currentTour: null
    }));
  };

  const dismissIntroduction = (featureId) => {
    setOnboardingState(prev => ({
      ...prev,
      dismissedIntroductions: [...new Set([...prev.dismissedIntroductions, featureId])]
    }));
  };

  const shouldShowFeatureIntroduction = (featureId) => {
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

  const updatePreferences = (newPreferences) => {
    setOnboardingState(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        ...newPreferences
      }
    }));
  };

  const hasTourBeenCompleted = (tourId) => {
    return onboardingState.completedTours.includes(tourId);
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
