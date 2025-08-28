/**
 * Reactive Calculation Engine for The Living Model
 * Provides instantaneous recalculation of financial models when inputs change
 */

import { calculateEnhancedDCF, calculateSensitivityAnalysis } from '../utils/dcfCalculations';

import realTimeDataService from './realTimeDataService';

class ReactiveCalculationEngine {
  constructor() {
    this.modelSubscriptions = new Map();
    this.calculationQueue = [];
    this.isProcessing = false;
    this.lastCalculationTime = 0;
    this.throttleDelay = 50; // 50ms throttle for smooth updates

    // Performance monitoring
    this.calculationTimes = [];
    this.maxCalculationHistory = 100;
  }

  /**
   * Create a reactive model that automatically recalculates when inputs change
   */
  createReactiveModel(modelId, modelType, initialInputs, callback) {
    const model = {
      id: modelId,
      type: modelType,
      inputs: { ...initialInputs },
      result: null,
      callback,
      realTimeFeeds: new Map(),
      lastUpdate: Date.now(),
      dependencies: new Set()
    };

    this.modelSubscriptions.set(modelId, model);

    // Initial calculation
    this.calculateModel(model);

    // Setup real-time data subscriptions if needed
    this.setupRealTimeFeeds(model);

    return {
      updateInput: (path, value) => this.updateModelInput(modelId, path, value),
      updateInputs: updates => this.updateModelInputs(modelId, updates),
      getResult: () => model.result,
      destroy: () => this.destroyModel(modelId),
      addDependency: (dataType, symbol) => this.addModelDependency(modelId, dataType, symbol)
    };
  }

  /**
   * Update a single input in the model
   */
  updateModelInput(modelId, path, value) {
    const model = this.modelSubscriptions.get(modelId);
    if (!model) return;

    // Update the input using path notation (e.g., 'yearlyData.1.revenueGrowth')
    this.setNestedValue(model.inputs, path, value);
    model.lastUpdate = Date.now();

    // Queue the calculation
    this.queueCalculation(model);
  }

  /**
   * Update multiple inputs at once
   */
  updateModelInputs(modelId, updates) {
    const model = this.modelSubscriptions.get(modelId);
    if (!model) return;

    Object.entries(updates).forEach(([path, value]) => {
      this.setNestedValue(model.inputs, path, value);
    });

    model.lastUpdate = Date.now();
    this.queueCalculation(model);
  }

  /**
   * Add real-time data dependency
   */
  addModelDependency(modelId, dataType, symbol) {
    const model = this.modelSubscriptions.get(modelId);
    if (!model) return;

    const dependencyKey = `${dataType}_${symbol}`;
    model.dependencies.add(dependencyKey);

    // Subscribe to real-time updates
    const unsubscribe = realTimeDataService.subscribe(dataType, symbol, data => {
      this.handleRealTimeUpdate(modelId, dataType, symbol, data);
    });

    model.realTimeFeeds.set(dependencyKey, unsubscribe);
  }

  /**
   * Handle real-time data updates
   */
  handleRealTimeUpdate(modelId, dataType, symbol, data) {
    const model = this.modelSubscriptions.get(modelId);
    if (!model) return;

    // Update the model inputs based on real-time data
    switch (dataType) {
      case 'stock_price':
        this.updateModelInput(modelId, 'currentStockPrice', data.price);
        break;
      case 'interest_rates':
        this.updateModelInput(modelId, 'discountRate', data.rate / 100);
        break;
      case 'bond_yields':
        this.updateModelInput(modelId, 'riskFreeRate', data.yield / 100);
        break;
      default:
        // Store in realTimeData section
        this.updateModelInput(modelId, `realTimeData.${dataType}.${symbol}`, data);
    }
  }

  /**
   * Queue a calculation with throttling
   */
  queueCalculation(model) {
    if (!this.calculationQueue.includes(model)) {
      this.calculationQueue.push(model);
    }

    if (!this.isProcessing) {
      this.processCalculationQueue();
    }
  }

  /**
   * Process the calculation queue with throttling
   */
  async processCalculationQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.calculationQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastCalculation = now - this.lastCalculationTime;

      if (timeSinceLastCalculation < this.throttleDelay) {
        await new Promise(resolve =>
          setTimeout(resolve, this.throttleDelay - timeSinceLastCalculation)
        );
      }

      const model = this.calculationQueue.shift();
      if (model) {
        await this.calculateModel(model);
        this.lastCalculationTime = Date.now();
      }
    }

    this.isProcessing = false;
  }

  /**
   * Calculate the model based on its type
   */
  async calculateModel(model) {
    const startTime = performance.now();

    try {
      let result = null;

      switch (model.type) {
        case 'dcf':
          result = calculateEnhancedDCF(model.inputs);
          break;
        case 'sensitivity':
          result = calculateSensitivityAnalysis(model.inputs);
          break;
        default:
          console.warn(`Unknown model type: ${model.type}`);
          return;
      }

      model.result = result;

      // Track performance
      const calculationTime = performance.now() - startTime;
      this.trackCalculationPerformance(calculationTime);

      // Notify callback
      if (model.callback && typeof model.callback === 'function') {
        model.callback(result, model.inputs);
      }
    } catch (error) {
      console.error(`Error calculating model ${model.id}:`, error);

      if (model.callback && typeof model.callback === 'function') {
        model.callback(null, model.inputs, error);
      }
    }
  }

  /**
   * Setup real-time data feeds for the model
   */
  setupRealTimeFeeds(model) {
    // Auto-detect dependencies based on model inputs
    if (model.inputs.symbol) {
      this.addModelDependency(model.id, 'stock_price', model.inputs.symbol);
    }

    if (model.inputs.trackInterestRates !== false) {
      this.addModelDependency(model.id, 'interest_rates', 'USD_10Y');
    }
  }

  /**
   * Destroy a model and clean up subscriptions
   */
  destroyModel(modelId) {
    const model = this.modelSubscriptions.get(modelId);
    if (!model) return;

    // Unsubscribe from real-time feeds
    model.realTimeFeeds.forEach(unsubscribe => unsubscribe());

    // Remove from subscriptions
    this.modelSubscriptions.delete(modelId);
  }

  /**
   * Set nested value using path notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Track calculation performance
   */
  trackCalculationPerformance(time) {
    this.calculationTimes.push(time);

    if (this.calculationTimes.length > this.maxCalculationHistory) {
      this.calculationTimes.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.calculationTimes.length === 0) {
      return { avgTime: 0, maxTime: 0, minTime: 0, totalCalculations: 0 };
    }

    const times = this.calculationTimes;
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    return {
      avgTime: Math.round(avgTime * 100) / 100,
      maxTime: Math.round(maxTime * 100) / 100,
      minTime: Math.round(minTime * 100) / 100,
      totalCalculations: times.length
    };
  }

  /**
   * Get all active models
   */
  getActiveModels() {
    return Array.from(this.modelSubscriptions.keys());
  }

  /**
   * Get model by ID
   */
  getModel(modelId) {
    return this.modelSubscriptions.get(modelId);
  }
}

const reactiveCalculationEngine = new ReactiveCalculationEngine();
export default reactiveCalculationEngine;
