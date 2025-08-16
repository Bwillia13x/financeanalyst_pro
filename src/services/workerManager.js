/**
 * Web Worker Manager for Financial Calculations
 * Manages a pool of web workers for high-performance financial computations
 */

class WorkerManager {
  constructor(options = {}) {
    this.workerPool = [];
    this.maxWorkers = options.maxWorkers || navigator.hardwareConcurrency || 4;
    this.pendingTasks = new Map();
    this.requestId = 0;
    this.initialized = false;
    
    // Performance monitoring
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      averageExecutionTime: 0,
      cacheHitRatio: 0
    };
  }

  /**
   * Initialize worker pool
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create worker pool
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = new Worker(
          new URL('../workers/financialCalculationWorker.js', import.meta.url),
          { type: 'module' }
        );
        
        worker.onmessage = this.handleWorkerMessage.bind(this);
        worker.onerror = this.handleWorkerError.bind(this);
        
        this.workerPool.push({
          worker,
          busy: false,
          taskCount: 0
        });
      }

      this.initialized = true;
      console.log(`Financial calculation worker pool initialized with ${this.maxWorkers} workers`);
      
    } catch (error) {
      console.error('Failed to initialize worker pool:', error);
      // Fallback to main thread calculations
      this.fallbackMode = true;
    }
  }

  /**
   * Execute financial calculation with automatic worker selection
   */
  async calculate(type, payload, options = {}) {
    if (!this.initialized && !this.fallbackMode) {
      await this.initialize();
    }

    // If workers failed to initialize, use main thread
    if (this.fallbackMode) {
      return this.executeOnMainThread(type, payload);
    }

    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      const timeoutMs = options.timeout || 30000; // 30 second default timeout
      
      // Store the pending request
      this.pendingTasks.set(requestId, {
        resolve,
        reject,
        startTime: Date.now(),
        type,
        timeout: setTimeout(() => {
          this.pendingTasks.delete(requestId);
          reject(new Error(`Calculation timeout after ${timeoutMs}ms`));
        }, timeoutMs)
      });

      // Find available worker or queue the task
      const availableWorker = this.getAvailableWorker();
      
      if (availableWorker) {
        this.assignTask(availableWorker, type, payload, requestId);
      } else {
        // All workers busy, queue the task
        this.queueTask(type, payload, requestId);
      }

      this.metrics.totalTasks++;
    });
  }

  /**
   * Get an available worker from the pool
   */
  getAvailableWorker() {
    return this.workerPool.find(workerInfo => !workerInfo.busy);
  }

  /**
   * Assign task to a specific worker
   */
  assignTask(workerInfo, type, payload, requestId) {
    workerInfo.busy = true;
    workerInfo.taskCount++;
    
    workerInfo.worker.postMessage({
      type,
      payload,
      requestId
    });
  }

  /**
   * Queue task when all workers are busy
   */
  queueTask(type, payload, requestId) {
    // For simplicity, we'll wait for next available worker
    // In production, you might want a more sophisticated queue
    setTimeout(() => {
      if (this.pendingTasks.has(requestId)) {
        const availableWorker = this.getAvailableWorker();
        if (availableWorker) {
          this.assignTask(availableWorker, type, payload, requestId);
        } else {
          this.queueTask(type, payload, requestId); // Retry
        }
      }
    }, 10);
  }

  /**
   * Handle messages from workers
   */
  handleWorkerMessage(event) {
    const { type, requestId, result, error, progress, cached } = event.data;
    
    switch (type) {
      case 'CALCULATION_COMPLETE':
        this.handleCalculationComplete(requestId, result, cached);
        break;
        
      case 'CALCULATION_ERROR':
        this.handleCalculationError(requestId, error);
        break;
        
      case 'SIMULATION_PROGRESS':
        this.handleProgressUpdate(requestId, progress);
        break;
    }
  }

  /**
   * Handle successful calculation completion
   */
  handleCalculationComplete(requestId, result, cached) {
    const pendingTask = this.pendingTasks.get(requestId);
    if (!pendingTask) return;

    // Clear timeout and resolve promise
    clearTimeout(pendingTask.timeout);
    this.pendingTasks.delete(requestId);
    
    // Update metrics
    this.metrics.completedTasks++;
    const executionTime = Date.now() - pendingTask.startTime;
    this.updateAverageExecutionTime(executionTime);
    
    if (cached) {
      this.metrics.cacheHitRatio = 
        (this.metrics.cacheHitRatio * (this.metrics.completedTasks - 1) + 1) / this.metrics.completedTasks;
    }

    // Free up the worker
    const worker = this.findWorkerByMessage(event);
    if (worker) {
      worker.busy = false;
    }

    pendingTask.resolve(result);
  }

  /**
   * Handle calculation errors
   */
  handleCalculationError(requestId, error) {
    const pendingTask = this.pendingTasks.get(requestId);
    if (!pendingTask) return;

    clearTimeout(pendingTask.timeout);
    this.pendingTasks.delete(requestId);
    
    // Free up the worker
    const worker = this.findWorkerByMessage(event);
    if (worker) {
      worker.busy = false;
    }

    pendingTask.reject(new Error(error.message));
  }

  /**
   * Handle progress updates for long-running calculations
   */
  handleProgressUpdate(requestId, progress) {
    const pendingTask = this.pendingTasks.get(requestId);
    if (pendingTask && pendingTask.onProgress) {
      pendingTask.onProgress(progress);
    }
  }

  /**
   * Find worker that sent the message
   */
  findWorkerByMessage(event) {
    return this.workerPool.find(workerInfo => workerInfo.worker === event.target);
  }

  /**
   * Update average execution time metric
   */
  updateAverageExecutionTime(newTime) {
    const n = this.metrics.completedTasks;
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (n - 1) + newTime) / n;
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(error) {
    console.error('Worker error:', error);
    // Could implement worker recovery here
  }

  /**
   * Fallback to main thread execution
   */
  async executeOnMainThread(type, payload) {
    // Import the calculation engines dynamically to avoid loading them unless needed
    const { FinancialModelingEngine } = await import('./financialModelingEngine.js');
    const { MonteCarloEngine } = await import('./monteCarloEngine.js');
    
    const financialEngine = new FinancialModelingEngine();
    const monteCarloEngine = new MonteCarloEngine();
    
    switch (type) {
      case 'DCF_CALCULATION':
        return financialEngine.buildDCFModel(payload.inputs, payload.scenarios);
        
      case 'MONTE_CARLO_SIMULATION':
        return await monteCarloEngine.runDCFSimulation(
          payload.baseInputs, 
          payload.distributions, 
          payload.options
        );
        
      // Add other calculation types as needed
      default:
        throw new Error(`Unsupported calculation type in fallback mode: ${type}`);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeWorkers: this.workerPool.filter(w => w.busy).length,
      totalWorkers: this.workerPool.length,
      pendingTasks: this.pendingTasks.size,
      taskDistribution: this.workerPool.map(w => w.taskCount)
    };
  }

  /**
   * Clear all worker caches
   */
  clearCaches() {
    this.workerPool.forEach(workerInfo => {
      workerInfo.worker.postMessage({ type: 'CLEAR_CACHE' });
    });
  }

  /**
   * Terminate all workers and cleanup
   */
  terminate() {
    this.workerPool.forEach(workerInfo => {
      workerInfo.worker.terminate();
    });
    
    this.workerPool = [];
    this.pendingTasks.clear();
    this.initialized = false;
  }

  // Convenience methods for specific calculation types
  
  /**
   * Calculate DCF valuation
   */
  async calculateDCF(inputs, scenarios = {}, options = {}) {
    return this.calculate('DCF_CALCULATION', { inputs, scenarios }, options);
  }

  /**
   * Run Monte Carlo simulation
   */
  async runMonteCarloSimulation(baseInputs, distributions, options = {}) {
    return this.calculate('MONTE_CARLO_SIMULATION', { 
      baseInputs, 
      distributions, 
      options 
    }, { timeout: 60000 }); // Longer timeout for simulations
  }

  /**
   * Calculate LBO analysis
   */
  async calculateLBO(inputs, scenarios = {}, options = {}) {
    return this.calculate('LBO_ANALYSIS', { inputs, scenarios }, options);
  }

  /**
   * Run sensitivity analysis
   */
  async runSensitivityAnalysis(baseCase, variables, ranges, options = {}) {
    return this.calculate('SENSITIVITY_ANALYSIS', { 
      baseCase, 
      variables, 
      ranges 
    }, options);
  }

  /**
   * Calculate financial ratios
   */
  async calculateFinancialRatios(financialData, marketData = null, options = {}) {
    return this.calculate('FINANCIAL_RATIOS', { 
      financialData, 
      marketData 
    }, options);
  }
}

// Create singleton instance
export const workerManager = new WorkerManager();

// Initialize on module load
workerManager.initialize().catch(console.error);

export default WorkerManager;