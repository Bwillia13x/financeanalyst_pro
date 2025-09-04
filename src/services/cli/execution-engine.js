/**
 * Command Execution Engine
 * Handles command execution with performance optimization, caching, and background processing
 */

export class CommandExecutionEngine {
  constructor(cli) {
    this.cli = cli;
    this.executionQueue = new Map();
    this.resultCache = new Map();
    this.activeExecutions = new Set();
    this.executionHistory = [];
    this.workerPool = null;

    // Performance tracking
    this.metrics = {
      totalExecutions: 0,
      averageExecutionTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };

    // Configuration
    this.config = {
      enableCaching: true,
      cacheSize: 100,
      maxConcurrentExecutions: 5,
      executionTimeout: 30000, // 30 seconds
      enableBackgroundExecution: true
    };
  }

  /**
   * Initialize the execution engine
   */
  async initialize() {
    console.log('⚙️ Command Execution Engine initializing...');

    // Initialize worker pool if supported
    if (this.config.enableBackgroundExecution && typeof Worker !== 'undefined') {
      this.initializeWorkerPool();
    }

    // Load cached results
    await this.loadResultCache();

    console.log('✅ Command Execution Engine initialized');
  }

  /**
   * Execute a command with optimization
   */
  async execute(command, args, context) {
    const executionId = crypto.randomUUID();
    const startTime = performance.now();

    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cached = await this.checkCache(command, args, context);
        if (cached) {
          this.metrics.cacheHits++;
          return this.createExecutionResult(executionId, cached, startTime);
        }
        this.metrics.cacheMisses++;
      }

      // Check concurrent execution limits
      if (this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
        return await this.queueExecution(command, args, context, executionId);
      }

      // Execute command
      this.activeExecutions.add(executionId);

      const result = await this.executeCommand(command, args, context);

      // Cache successful results
      if (this.config.enableCaching && result.success) {
        await this.cacheResult(command, args, context, result);
      }

      this.activeExecutions.delete(executionId);
      this.metrics.totalExecutions++;

      return this.createExecutionResult(executionId, result, startTime);
    } catch (error) {
      this.activeExecutions.delete(executionId);
      this.metrics.errors++;

      console.error(`Command execution error [${executionId}]:`, error);
      return this.createExecutionResult(
        executionId,
        {
          success: false,
          error: error.message,
          stack: error.stack
        },
        startTime
      );
    }
  }

  /**
   * Execute command with timeout and error handling
   */
  async executeCommand(command, args, context) {
    // Create execution promise with timeout
    const executionPromise = this.runCommandHandler(command, args, context);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Command execution timeout')),
        this.config.executionTimeout
      );
    });

    return await Promise.race([executionPromise, timeoutPromise]);
  }

  /**
   * Run the actual command handler
   */
  async runCommandHandler(command, args, context) {
    try {
      // Validate command before execution
      const validation = this.cli.registry.validateParameters(command, args);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          validationErrors: validation.errors
        };
      }

      // Execute command handler
      const result = await command.handler(args, {
        ...context,
        executionId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      });

      // Normalize result format
      if (result && typeof result === 'object' && 'success' in result) {
        return result;
      }

      // Assume success if no explicit success field
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Queue execution when at concurrency limit
   */
  async queueExecution(command, args, context, executionId) {
    return new Promise((resolve, reject) => {
      const queuedExecution = {
        id: executionId,
        command,
        args,
        context,
        resolve,
        reject,
        queuedAt: Date.now()
      };

      this.executionQueue.set(executionId, queuedExecution);

      // Set timeout for queued execution
      setTimeout(() => {
        if (this.executionQueue.has(executionId)) {
          this.executionQueue.delete(executionId);
          reject(new Error('Queued execution timeout'));
        }
      }, this.config.executionTimeout);
    });
  }

  /**
   * Process queued executions
   */
  async processQueue() {
    const availableSlots = this.config.maxConcurrentExecutions - this.activeExecutions.size;

    if (availableSlots <= 0 || this.executionQueue.size === 0) {
      return;
    }

    const executionsToProcess = Array.from(this.executionQueue.values())
      .sort((a, b) => a.queuedAt - b.queuedAt)
      .slice(0, availableSlots);

    for (const queued of executionsToProcess) {
      this.executionQueue.delete(queued.id);

      try {
        const result = await this.execute(queued.command, queued.args, queued.context);
        queued.resolve(result);
      } catch (error) {
        queued.reject(error);
      }
    }
  }

  /**
   * Check result cache
   */
  async checkCache(command, args, context) {
    if (!this.config.enableCaching) return null;

    const cacheKey = this.generateCacheKey(command, args, context);
    const cached = this.resultCache.get(cacheKey);

    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.getCacheTTL(command)) {
      this.resultCache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * Cache execution result
   */
  async cacheResult(command, args, context, result) {
    if (!this.config.enableCaching || !result.success) return;

    const cacheKey = this.generateCacheKey(command, args, context);

    // Maintain cache size limit
    if (this.resultCache.size >= this.config.cacheSize) {
      this.evictOldestCacheEntry();
    }

    this.resultCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      commandName: command.name,
      args: JSON.stringify(args),
      context: JSON.stringify(context)
    });
  }

  /**
   * Generate cache key for command execution
   */
  generateCacheKey(command, args, context) {
    const keyData = {
      command: command.name,
      args: JSON.stringify(args),
      context: {
        userId: context.userId,
        sessionId: context.sessionId,
        // Include relevant context but exclude timestamps
        ...Object.fromEntries(
          Object.entries(context).filter(
            ([key]) => !['timestamp', 'executionId', 'random'].includes(key)
          )
        )
      }
    };

    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Get cache TTL for command type
   */
  getCacheTTL(command) {
    const cacheTTLs = {
      quote: 30000, // 30 seconds for quotes
      chart: 60000, // 1 minute for charts
      dcf: 3600000, // 1 hour for DCF (expensive calculation)
      comps: 1800000, // 30 minutes for comps
      analyze: 1800000, // 30 minutes for analysis
      default: 300000 // 5 minutes default
    };

    return cacheTTLs[command.name.toLowerCase()] || cacheTTLs.default;
  }

  /**
   * Evict oldest cache entry
   */
  evictOldestCacheEntry() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.resultCache) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.resultCache.delete(oldestKey);
    }
  }

  /**
   * Create execution result with metadata
   */
  createExecutionResult(executionId, result, startTime) {
    const executionTime = performance.now() - startTime;

    // Update metrics
    this.updateMetrics(executionTime, result.success);

    const executionResult = {
      ...result,
      executionId,
      executionTime,
      timestamp: new Date().toISOString(),
      cached: result.cached || false
    };

    // Add to execution history
    this.executionHistory.push({
      id: executionId,
      command: result.command || 'unknown',
      success: result.success,
      executionTime,
      timestamp: executionResult.timestamp,
      error: result.error || null
    });

    // Maintain history size
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }

    return executionResult;
  }

  /**
   * Update performance metrics
   */
  updateMetrics(executionTime, success) {
    // Update average execution time
    const totalTime =
      this.metrics.averageExecutionTime * this.metrics.totalExecutions + executionTime;
    this.metrics.totalExecutions++;
    this.metrics.averageExecutionTime = totalTime / this.metrics.totalExecutions;

    if (!success) {
      this.metrics.errors++;
    }
  }

  /**
   * Initialize worker pool for background execution
   */
  initializeWorkerPool() {
    try {
      // Create worker pool for CPU-intensive tasks
      this.workerPool = {
        workers: [],
        maxWorkers: 2,
        availableWorkers: [],
        taskQueue: []
      };

      // Initialize workers
      for (let i = 0; i < this.workerPool.maxWorkers; i++) {
        this.createWorker();
      }

      console.log('👷 Worker pool initialized');
    } catch (error) {
      console.warn('Failed to initialize worker pool:', error.message);
    }
  }

  /**
   * Create a web worker for background tasks
   */
  createWorker() {
    // In a real implementation, this would create actual Web Workers
    // For now, we'll simulate with setTimeout
    const worker = {
      busy: false,
      execute: task => {
        return new Promise(resolve => {
          worker.busy = true;
          setTimeout(
            () => {
              worker.busy = false;
              resolve(task.result);
            },
            Math.random() * 1000 + 500
          ); // Simulate 0.5-1.5s execution
        });
      }
    };

    this.workerPool.workers.push(worker);
    this.workerPool.availableWorkers.push(worker);
  }

  /**
   * Execute task in background using worker pool
   */
  async executeInBackground(command, args, context) {
    if (!this.workerPool || this.workerPool.availableWorkers.length === 0) {
      // Fall back to main thread execution
      return await this.executeCommand(command, args, context);
    }

    const worker = this.workerPool.availableWorkers.pop();

    try {
      const result = await worker.execute({
        command: command.name,
        args,
        context,
        result: await this.executeCommand(command, args, context)
      });

      // Return worker to pool
      this.workerPool.availableWorkers.push(worker);

      return result;
    } catch (error) {
      // Return worker to pool even on error
      this.workerPool.availableWorkers.push(worker);
      throw error;
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStats() {
    const cacheHitRate =
      this.metrics.cacheHits + this.metrics.cacheMisses > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
        : 0;

    const errorRate =
      this.metrics.totalExecutions > 0
        ? (this.metrics.errors / this.metrics.totalExecutions) * 100
        : 0;

    return {
      ...this.metrics,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      activeExecutions: this.activeExecutions.size,
      queuedExecutions: this.executionQueue.size,
      cacheSize: this.resultCache.size,
      historySize: this.executionHistory.size
    };
  }

  /**
   * Clear execution cache
   */
  clearCache() {
    this.resultCache.clear();
    console.log('🧹 Execution cache cleared');
  }

  /**
   * Load cached results from storage
   */
  async loadResultCache() {
    try {
      const saved = localStorage.getItem('cli-execution-cache');
      if (saved) {
        const cache = JSON.parse(saved);
        // Restore valid cache entries
        Object.entries(cache).forEach(([key, value]) => {
          if (Date.now() - value.timestamp < this.getCacheTTL({ name: value.commandName })) {
            this.resultCache.set(key, value);
          }
        });
        console.log(`📋 Loaded ${this.resultCache.size} cached results`);
      }
    } catch (error) {
      console.warn('Failed to load execution cache:', error.message);
    }
  }

  /**
   * Save execution cache to storage
   */
  async saveResultCache() {
    try {
      const cacheToSave = {};
      for (const [key, value] of this.resultCache) {
        cacheToSave[key] = value;
      }
      localStorage.setItem('cli-execution-cache', JSON.stringify(cacheToSave));
    } catch (error) {
      console.warn('Failed to save execution cache:', error.message);
    }
  }

  /**
   * Cancel execution by ID
   */
  cancelExecution(executionId) {
    // Remove from active executions
    this.activeExecutions.delete(executionId);

    // Remove from queue if pending
    if (this.executionQueue.has(executionId)) {
      const queued = this.executionQueue.get(executionId);
      queued.reject(new Error('Execution cancelled'));
      this.executionQueue.delete(executionId);
    }
  }

  /**
   * Destroy execution engine
   */
  async destroy() {
    // Save cache before destroying
    await this.saveResultCache();

    // Cancel all active executions
    for (const executionId of this.activeExecutions) {
      this.cancelExecution(executionId);
    }

    // Clear all queues and caches
    this.executionQueue.clear();
    this.resultCache.clear();
    this.activeExecutions.clear();

    console.log('🧹 Command Execution Engine destroyed');
  }
}

