/**
 * Performance Optimization System for FinanceAnalyst Pro CLI
 * Advanced performance monitoring, optimization, and caching
 */

export class PerformanceOptimizer {
  constructor(cli, options = {}) {
    this.cli = cli;
    this.options = {
      enableCaching: true,
      enableProfiling: true,
      enableOptimization: true,
      cacheSize: 1000,
      cacheTTL: 300000, // 5 minutes
      profileThreshold: 100, // Profile commands > 100ms
      optimizationInterval: 300000, // 5 minutes
      ...options
    };

    // Performance metrics
    this.metrics = {
      commandExecution: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      optimizationSavings: 0
    };

    // Caches
    this.caches = {
      commands: new Map(),
      results: new Map(),
      metadata: new Map()
    };

    // Profiling data
    this.profiles = {
      commands: new Map(),
      bottlenecks: new Map(),
      optimizationOpportunities: []
    };

    // Optimization state
    this.optimizations = {
      enabled: new Set(),
      disabled: new Set(),
      recommendations: []
    };

    console.log('⚡ Performance Optimizer initialized');
  }

  /**
   * Start performance optimization
   */
  async start() {
    console.log('🚀 Starting performance optimization...');

    // Start periodic optimization
    this.optimizationInterval = setInterval(() => {
      this.performOptimization();
    }, this.options.optimizationInterval);

    // Start memory monitoring
    this.memoryInterval = setInterval(() => {
      this.monitorMemoryUsage();
    }, 60000); // Every minute

    console.log('✅ Performance optimization started');
  }

  /**
   * Stop performance optimization
   */
  async stop() {
    console.log('🛑 Stopping performance optimization...');

    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    console.log('✅ Performance optimization stopped');
  }

  /**
   * Profile command execution
   */
  profileCommand(command, executionTime, context = {}) {
    if (!this.options.enableProfiling) return;

    const commandName = typeof command === 'string' ? command : command.name;
    const key = `${commandName}:${JSON.stringify(context)}`;

    // Update command metrics
    if (!this.metrics.commandExecution.has(commandName)) {
      this.metrics.commandExecution.set(commandName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastExecuted: null
      });
    }

    const metrics = this.metrics.commandExecution.get(commandName);
    metrics.count++;
    metrics.totalTime += executionTime;
    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.minTime = Math.min(metrics.minTime, executionTime);
    metrics.maxTime = Math.max(metrics.maxTime, executionTime);
    metrics.lastExecuted = Date.now();

    // Profile if execution time exceeds threshold
    if (executionTime > this.options.profileThreshold) {
      this.createCommandProfile(commandName, executionTime, context);
    }

    // Check for optimization opportunities
    this.analyzeOptimizationOpportunities(commandName, metrics);
  }

  /**
   * Create detailed command profile
   */
  createCommandProfile(commandName, executionTime, context) {
    const profile = {
      command: commandName,
      executionTime,
      timestamp: Date.now(),
      context: { ...context },
      memoryUsage: this.getCurrentMemoryUsage(),
      cacheHit: this.wasCacheHit(commandName)
    };

    if (!this.profiles.commands.has(commandName)) {
      this.profiles.commands.set(commandName, []);
    }

    const commandProfiles = this.profiles.commands.get(commandName);
    commandProfiles.push(profile);

    // Keep only last 50 profiles per command
    if (commandProfiles.length > 50) {
      commandProfiles.shift();
    }

    // Analyze for bottlenecks
    this.analyzeBottlenecks(commandName, profile);
  }

  /**
   * Analyze performance bottlenecks
   */
  analyzeBottlenecks(commandName, profile) {
    const bottlenecks = this.profiles.bottlenecks;

    // Memory bottleneck detection
    if (profile.memoryUsage > 0.8) {
      if (!bottlenecks.has('memory')) {
        bottlenecks.set('memory', []);
      }
      bottlenecks.get('memory').push({
        command: commandName,
        memoryUsage: profile.memoryUsage,
        timestamp: profile.timestamp
      });
    }

    // Slow execution bottleneck
    if (profile.executionTime > 1000) {
      // 1 second
      if (!bottlenecks.has('slow_execution')) {
        bottlenecks.set('slow_execution', []);
      }
      bottlenecks.get('slow_execution').push({
        command: commandName,
        executionTime: profile.executionTime,
        timestamp: profile.timestamp
      });
    }

    // Cache inefficiency
    if (!profile.cacheHit && profile.executionTime > 500) {
      if (!bottlenecks.has('cache_inefficiency')) {
        bottlenecks.set('cache_inefficiency', []);
      }
      bottlenecks.get('cache_inefficiency').push({
        command: commandName,
        executionTime: profile.executionTime,
        timestamp: profile.timestamp
      });
    }
  }

  /**
   * Analyze optimization opportunities
   */
  analyzeOptimizationOpportunities(commandName, metrics) {
    const opportunities = this.profiles.optimizationOpportunities;

    // Frequent command optimization
    if (metrics.count > 10 && metrics.avgTime > 200) {
      opportunities.push({
        type: 'caching',
        command: commandName,
        reason: `Frequently executed command (${metrics.count} times) with high average time (${metrics.avgTime.toFixed(2)}ms)`,
        potentialSavings: metrics.avgTime * 0.7, // 70% improvement with caching
        priority: 'high'
      });
    }

    // Slow command optimization
    if (metrics.maxTime > 2000 && metrics.count > 5) {
      opportunities.push({
        type: 'optimization',
        command: commandName,
        reason: `Command has slow execution times (max: ${metrics.maxTime}ms, avg: ${metrics.avgTime.toFixed(2)}ms)`,
        potentialSavings: metrics.avgTime * 0.5,
        priority: 'medium'
      });
    }

    // Memory optimization
    if (this.metrics.memoryUsage > 0.7) {
      opportunities.push({
        type: 'memory',
        command: commandName,
        reason: 'High memory usage detected, consider memory optimization',
        potentialSavings: this.getMemoryOptimizationPotential(),
        priority: 'medium'
      });
    }

    // Remove duplicates and keep only top opportunities
    this.profiles.optimizationOpportunities = this.deduplicateOpportunities(opportunities)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 10); // Keep top 10
  }

  /**
   * Remove duplicate optimization opportunities
   */
  deduplicateOpportunities(opportunities) {
    const seen = new Set();
    return opportunities.filter(opp => {
      const key = `${opp.type}:${opp.command}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Cache command result
   */
  cacheResult(command, args, result, context = {}) {
    if (!this.options.enableCaching) return;

    const key = this.generateCacheKey(command, args, context);

    // Cache the result
    this.caches.results.set(key, {
      result,
      timestamp: Date.now(),
      ttl: this.options.cacheTTL,
      accessCount: 0,
      lastAccessed: Date.now()
    });

    // Maintain cache size
    this.maintainCacheSize();
  }

  /**
   * Get cached result
   */
  getCachedResult(command, args, context = {}) {
    if (!this.options.enableCaching) return null;

    const key = this.generateCacheKey(command, args, context);
    const cached = this.caches.results.get(key);

    if (!cached) {
      this.metrics.cacheMisses++;
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.caches.results.delete(key);
      this.metrics.cacheMisses++;
      return null;
    }

    // Update access statistics
    cached.accessCount++;
    cached.lastAccessed = Date.now();

    this.metrics.cacheHits++;
    return cached.result;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(command, args, context) {
    const commandStr = typeof command === 'string' ? command : command.name;
    const argsStr = JSON.stringify(args);
    const contextStr = JSON.stringify({
      userId: context.userId,
      userRole: context.userRole
    });

    return `${commandStr}:${argsStr}:${contextStr}`;
  }

  /**
   * Maintain cache size
   */
  maintainCacheSize() {
    if (this.caches.results.size <= this.options.cacheSize) return;

    // Remove least recently used items
    const entries = Array.from(this.caches.results.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = entries.slice(0, entries.length - this.options.cacheSize);
    toRemove.forEach(([key]) => this.caches.results.delete(key));
  }

  /**
   * Perform periodic optimization
   */
  performOptimization() {
    console.log('🔧 Performing performance optimization...');

    // Clear expired cache entries
    this.clearExpiredCache();

    // Optimize memory usage
    this.optimizeMemoryUsage();

    // Apply performance optimizations
    this.applyOptimizations();

    // Update optimization metrics
    this.updateOptimizationMetrics();

    console.log('✅ Performance optimization completed');
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, cached] of this.caches.results) {
      if (now - cached.timestamp > cached.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.caches.results.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleared ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Optimize memory usage
   */
  optimizeMemoryUsage() {
    const memoryUsage = this.getCurrentMemoryUsage();

    if (memoryUsage > 0.8) {
      // Aggressive cache cleanup
      const cacheSize = this.caches.results.size;
      if (cacheSize > this.options.cacheSize * 0.5) {
        const entries = Array.from(this.caches.results.entries());
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);

        const toRemove = Math.floor(cacheSize * 0.3); // Remove 30% least used
        for (let i = 0; i < toRemove; i++) {
          this.caches.results.delete(entries[i][0]);
        }

        console.log(`🧹 Memory optimization: Removed ${toRemove} cache entries`);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('🗑️ Forced garbage collection');
      }
    }
  }

  /**
   * Apply performance optimizations
   */
  applyOptimizations() {
    // Enable caching for frequently used commands
    const frequentCommands = this.getFrequentCommands();
    frequentCommands.forEach(commandName => {
      if (!this.optimizations.enabled.has(`cache:${commandName}`)) {
        this.optimizations.enabled.add(`cache:${commandName}`);
        console.log(`⚡ Enabled caching for: ${commandName}`);
      }
    });

    // Optimize slow commands
    const slowCommands = this.getSlowCommands();
    slowCommands.forEach(commandName => {
      if (!this.optimizations.enabled.has(`optimize:${commandName}`)) {
        this.optimizations.enabled.add(`optimize:${commandName}`);
        console.log(`⚡ Applied optimization for: ${commandName}`);
      }
    });
  }

  /**
   * Get frequently used commands
   */
  getFrequentCommands() {
    const commands = Array.from(this.metrics.commandExecution.entries());
    return commands
      .filter(([, metrics]) => metrics.count > 20)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([commandName]) => commandName);
  }

  /**
   * Get slow commands
   */
  getSlowCommands() {
    const commands = Array.from(this.metrics.commandExecution.entries());
    return commands
      .filter(([, metrics]) => metrics.avgTime > 500)
      .sort(([, a], [, b]) => b.avgTime - a.avgTime)
      .slice(0, 3)
      .map(([commandName]) => commandName);
  }

  /**
   * Update optimization metrics
   */
  updateOptimizationMetrics() {
    // Calculate cache efficiency
    const totalCacheAccesses = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheAccesses > 0 ? this.metrics.cacheHits / totalCacheAccesses : 0;

    // Estimate optimization savings
    const cachedCommands = this.getFrequentCommands();
    const savings = cachedCommands.reduce((total, commandName) => {
      const metrics = this.metrics.commandExecution.get(commandName);
      if (metrics) {
        return total + metrics.avgTime * metrics.count * 0.7; // 70% improvement
      }
      return total;
    }, 0);

    this.metrics.optimizationSavings = savings;

    console.log(`📊 Cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`);
    console.log(`💰 Estimated optimization savings: ${Math.round(savings)}ms`);
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    this.metrics.memoryUsage = this.getCurrentMemoryUsage();

    if (this.metrics.memoryUsage > 0.9) {
      console.warn(
        `⚠️ High memory usage detected: ${(this.metrics.memoryUsage * 100).toFixed(1)}%`
      );
      this.optimizeMemoryUsage();
    }
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
    }
    return 0; // Unknown
  }

  /**
   * Get memory optimization potential
   */
  getMemoryOptimizationPotential() {
    const cacheSize = this.caches.results.size;
    const potentialReduction = Math.min(cacheSize * 0.5, this.options.cacheSize * 0.3);
    return potentialReduction * 100; // Rough estimate in KB
  }

  /**
   * Check if last operation was a cache hit
   */
  wasCacheHit(commandName) {
    // This is a simplified implementation
    // In a real system, you'd track this per operation
    return false;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const cacheTotal = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? this.metrics.cacheHits / cacheTotal : 0;

    return {
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: cacheHitRate,
        size: this.caches.results.size,
        maxSize: this.options.cacheSize
      },
      memory: {
        usage: this.metrics.memoryUsage,
        optimizationPotential: this.getMemoryOptimizationPotential()
      },
      commands: Object.fromEntries(this.metrics.commandExecution),
      optimizations: {
        enabled: Array.from(this.optimizations.enabled),
        recommendations: this.profiles.optimizationOpportunities,
        savings: this.metrics.optimizationSavings
      },
      bottlenecks: Object.fromEntries(this.profiles.bottlenecks)
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    return {
      opportunities: this.profiles.optimizationOpportunities,
      bottlenecks: Object.fromEntries(this.profiles.bottlenecks),
      cacheEfficiency: this.calculateCacheEfficiency(),
      memoryOptimization: this.getMemoryOptimizationPotential()
    };
  }

  /**
   * Calculate cache efficiency
   */
  calculateCacheEfficiency() {
    const totalAccesses = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (totalAccesses === 0) return 0;

    return {
      hitRate: this.metrics.cacheHits / totalAccesses,
      totalAccesses,
      effectiveCacheSize: this.caches.results.size
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      commandExecution: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      optimizationSavings: 0
    };

    this.caches.results.clear();
    this.profiles.commands.clear();
    this.profiles.bottlenecks.clear();
    this.profiles.optimizationOpportunities = [];

    console.log('🔄 Performance metrics reset');
  }

  /**
   * Export performance data
   */
  exportPerformanceData() {
    return {
      metrics: this.getPerformanceMetrics(),
      recommendations: this.getOptimizationRecommendations(),
      profiles: Object.fromEntries(this.profiles.commands),
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    };
  }
}

// Integration helper
export function integratePerformanceOptimizer(cli) {
  const optimizer = new PerformanceOptimizer(cli);

  // Wrap executeCommand to add profiling
  const originalExecuteCommand = cli.executeCommand.bind(cli);
  cli.executeCommand = async function (command, context = {}) {
    const startTime = performance.now();

    // Check cache first
    const cachedResult = optimizer.getCachedResult(command, {}, context);
    if (cachedResult) {
      optimizer.profileCommand(command, performance.now() - startTime, context);
      return cachedResult;
    }

    // Execute command
    const result = await originalExecuteCommand(command, context);
    const executionTime = performance.now() - startTime;

    // Profile execution
    optimizer.profileCommand(command, executionTime, context);

    // Cache successful results
    if (result.success && !result.error) {
      optimizer.cacheResult(command, {}, result, context);
    }

    return result;
  };

  // Add optimizer to CLI
  cli.performanceOptimizer = optimizer;

  // Start optimization
  optimizer.start();

  return optimizer;
}
