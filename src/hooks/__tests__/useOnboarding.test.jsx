/* @vitest-environment jsdom */

import React from 'react';
import { render, act, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useOnboarding } from '../useOnboarding';
import { ONBOARDING_TOURS } from '../../config/onboardingTours';

const STORAGE_KEY = 'financeanalyst-onboarding-state';

function HookWrapper({ onRender }) {
  const value = useOnboarding();
  onRender(value);
  return null;
}

describe('useOnboarding', () => {
  let hook;
  const setHook = (v) => {
    hook = v;
  };

  beforeEach(() => {
    cleanup();
    hook = undefined;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with defaults when no localStorage is present', () => {
    render(<HookWrapper onRender={setHook} />);
    expect(hook.currentTour).toBeNull();
    expect(hook.completedTours).toEqual([]);
    expect(hook.dismissedIntroductions).toEqual([]);
    expect(hook.userPreferences).toEqual({
      showTooltips: true,
      autoStartTours: true,
      tourSpeed: 'normal',
    });
  });

  it('loads persisted state from localStorage if present', async () => {
    const persisted = {
      completedTours: ['privateAnalysis'],
      dismissedIntroductions: ['financialValidator'],
      currentTour: null,
      userPreferences: { showTooltips: false, autoStartTours: true, tourSpeed: 'fast' },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    render(<HookWrapper onRender={setHook} />);

    expect(hook.completedTours).toContain('privateAnalysis');
    expect(hook.dismissedIntroductions).toContain('financialValidator');
    expect(hook.currentTour).toBeNull();
    expect(hook.userPreferences).toEqual({ showTooltips: false, autoStartTours: true, tourSpeed: 'fast' });
  });

  it('falls back to defaults if localStorage has malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{bad-json');
    render(<HookWrapper onRender={setHook} />);
    expect(hook.completedTours).toEqual([]);
    expect(hook.dismissedIntroductions).toEqual([]);
    expect(hook.currentTour).toBeNull();
  });

  it('persists state changes to localStorage', async () => {
    render(<HookWrapper onRender={setHook} />);

    await act(async () => {
      hook.updatePreferences({ showTooltips: false });
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.userPreferences.showTooltips).toBe(false);
  });

  it('startTour sets currentTour with canonical id and returns true', async () => {
    render(<HookWrapper onRender={setHook} />);

    const canonicalKey = 'privateAnalysis';
    const externalId = ONBOARDING_TOURS[canonicalKey].id; // e.g. 'private-analysis-tour'

    let started;
    await act(async () => {
      started = hook.startTour(externalId); // pass non-canonical id
    });

    expect(started).toBe(true);
    expect(hook.currentTour).not.toBeNull();
    expect(hook.currentTour.id).toBe(canonicalKey);
    expect(hook.currentTour.startedAt).toBeTruthy();
  });

  it('completeTour clears currentTour and adds normalized id to completedTours', async () => {
    render(<HookWrapper onRender={setHook} />);

    const canonicalKey = 'privateAnalysis';
    const externalId = ONBOARDING_TOURS[canonicalKey].id;

    await act(async () => {
      hook.startTour(externalId);
    });

    await act(async () => {
      hook.completeTour(); // no arg -> uses currentTour.id
    });

    expect(hook.currentTour).toBeNull();
    expect(hook.completedTours).toContain(canonicalKey);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.completedTours).toContain(canonicalKey);
  });

  it('hasTourBeenCompleted works with both canonical and external ids', async () => {
    render(<HookWrapper onRender={setHook} />);

    const canonicalKey = 'privateAnalysis';
    const externalId = ONBOARDING_TOURS[canonicalKey].id;

    await act(async () => {
      hook.startTour(canonicalKey);
      hook.completeTour(canonicalKey);
    });

    expect(hook.hasTourBeenCompleted(canonicalKey)).toBe(true);
    expect(hook.hasTourBeenCompleted(externalId)).toBe(true);
  });

  it('dismissIntroduction updates state and shouldShowFeatureIntroduction reflects it', async () => {
    render(<HookWrapper onRender={setHook} />);

    const featureId = 'financialValidator';
    expect(hook.shouldShowFeatureIntroduction(featureId)).toBe(true);

    await act(async () => {
      hook.dismissIntroduction(featureId);
    });

    expect(hook.dismissedIntroductions).toContain(featureId);
    expect(hook.shouldShowFeatureIntroduction(featureId)).toBe(false);
  });

  it('updatePreferences merges with existing preferences', async () => {
    render(<HookWrapper onRender={setHook} />);
    await act(async () => {
      hook.updatePreferences({ tourSpeed: 'fast', autoStartTours: false });
    });

    expect(hook.userPreferences).toEqual({
      showTooltips: true,
      tourSpeed: 'fast',
      autoStartTours: false,
    });
  });

  it('resetOnboarding restores defaults and clears currentTour/completedTours', async () => {
    render(<HookWrapper onRender={setHook} />);

    await act(async () => {
      hook.startTour('privateAnalysis');
      hook.completeTour('privateAnalysis');
    });

    await act(async () => {
      hook.resetOnboarding();
    });

    expect(hook.currentTour).toBeNull();
    expect(hook.completedTours).toEqual([]);
    expect(hook.dismissedIntroductions).toEqual([]);
    expect(hook.userPreferences).toEqual({
      showTooltips: true,
      autoStartTours: true,
      tourSpeed: 'normal',
    });
  });

  it('getAvailableTours returns tours with completion status', async () => {
    render(<HookWrapper onRender={setHook} />);

    await act(async () => {
      hook.completeTour('privateAnalysis');
    });

    const tours = hook.getAvailableTours();
    const expectedId = ONBOARDING_TOURS['privateAnalysis'].id;
    const privateAnalysis = tours.find((t) => t.id === expectedId || t.id === 'privateAnalysis');
    expect(privateAnalysis).toBeTruthy();
    expect(privateAnalysis.completed).toBe(true);
  });

  it('gracefully handles localStorage.setItem failures (does not throw)', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    render(<HookWrapper onRender={setHook} />);

    await act(async () => {
      hook.updatePreferences({ showTooltips: false });
    });

    // If it gets here without throwing, the hook handled the error.
    await waitFor(() => expect(spy).toHaveBeenCalled());
  });
});
