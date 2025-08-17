/**
 * Progressive Calculation Loader
 * Implements progressive loading for heavy financial calculations
 */

import React from 'react';

class ProgressiveCalculationLoader {
  constructor() {
    this.calculationQueue = [];
    this.activeCalculations = new Map();
    this.maxConcurrentCalculations = 2;
    this.calculationCache = new Map();
  }

  /**
   * Add calculation to progressive loading queue
   */
  async loadCalculation(calculationId, calculationFn, dependencies = [], priority = 'normal') {
    // Check cache first
    const cacheKey = this.generateCacheKey(calculationId, dependencies);
    if (this.calculationCache.has(cacheKey)) {
      return this.calculationCache.get(cacheKey);
    }

    // Create calculation promise
    const calculationPromise = new Promise((resolve, reject) => {
      const calculation = {
        id: calculationId,
        fn: calculationFn,
        dependencies,
        priority,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.calculationQueue.push(calculation);
      this.processQueue();
    });

    return calculationPromise;
  }

  /**
   * Process calculation queue with concurrency control
   */
  async processQueue() {
    // Sort queue by priority and dependencies
    this.calculationQueue.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    while (this.calculationQueue.length > 0 && this.activeCalculations.size < this.maxConcurrentCalculations) {
      const calculation = this.findReadyCalculation();
      if (!calculation) break;

      const index = this.calculationQueue.indexOf(calculation);
      this.calculationQueue.splice(index, 1);

      this.executeCalculation(calculation);
    }
  }

  /**
   * Find calculation ready to execute (dependencies met)
   */
  findReadyCalculation() {
    return this.calculationQueue.find(calc => {
      return calc.dependencies.every(dep =>
        this.calculationCache.has(dep) || !this.activeCalculations.has(dep)
      );
    });
  }

  /**
   * Execute individual calculation
   */
  async executeCalculation(calculation) {
    this.activeCalculations.set(calculation.id, calculation);

    try {
      // Add small delay for UI responsiveness
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await calculation.fn();
      const cacheKey = this.generateCacheKey(calculation.id, calculation.dependencies);

      this.calculationCache.set(cacheKey, result);
      this.activeCalculations.delete(calculation.id);

      calculation.resolve(result);

      // Process next in queue
      this.processQueue();

    } catch (error) {
      this.activeCalculations.delete(calculation.id);
      calculation.reject(error);

      // Continue processing queue even if one calculation fails
      this.processQueue();
    }
  }

  /**
   * Generate cache key for calculation
   */
  generateCacheKey(calculationId, dependencies) {
    const depString = dependencies.sort().join(',');
    return `${calculationId}_${depString}`;
  }

  /**
   * Clear calculation cache
   */
  clearCache() {
    this.calculationCache.clear();
  }

  /**
   * Get calculation status
   */
  getCalculationStatus(calculationId) {
    if (this.activeCalculations.has(calculationId)) {
      return 'running';
    }

    const inQueue = this.calculationQueue.some(calc => calc.id === calculationId);
    if (inQueue) {
      return 'queued';
    }

    const cached = Array.from(this.calculationCache.keys()).some(key =>
      key.startsWith(calculationId)
    );
    if (cached) {
      return 'completed';
    }

    return 'not_started';
  }

  /**
   * Cancel calculation
   */
  cancelCalculation(calculationId) {
    // Remove from queue
    const queueIndex = this.calculationQueue.findIndex(calc => calc.id === calculationId);
    if (queueIndex !== -1) {
      const calculation = this.calculationQueue[queueIndex];
      this.calculationQueue.splice(queueIndex, 1);
      calculation.reject(new Error('Calculation cancelled'));
    }

    // Note: Active calculations continue to completion to avoid inconsistent state
  }
}

// Create global instance
const progressiveLoader = new ProgressiveCalculationLoader();

export default progressiveLoader;

/**
 * Hook for using progressive calculation loading in React components
 */
export const useProgressiveCalculation = (calculationId, calculationFn, dependencies = [], priority = 'normal') => {
  const [status, setStatus] = React.useState('not_started');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadCalculation = async() => {
      setStatus('queued');
      setError(null);

      try {
        const result = await progressiveLoader.loadCalculation(
          calculationId,
          calculationFn,
          dependencies,
          priority
        );

        if (isMounted) {
          setResult(result);
          setStatus('completed');
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setStatus('error');
        }
      }
    };

    loadCalculation();

    return () => {
      isMounted = false;
    };
  }, [calculationId, ...dependencies]);

  return { status, result, error };
};
