/**
 * CLI Context Manager
 * Manages context state, user sessions, and contextual intelligence
 */

export class ContextManager {
  constructor(cli) {
    this.cli = cli;

    // Context storage
    this.globalContext = {};
    this.userContexts = new Map();
    this.sessionContexts = new Map();

    // Context history for learning
    this.contextHistory = [];
    this.maxHistorySize = 1000;

    // Context patterns for intelligence
    this.patterns = {
      commandSequences: new Map(),
      contextTransitions: new Map(),
      userBehaviors: new Map()
    };

    // Configuration
    this.config = {
      enableContextPersistence: true,
      enablePatternLearning: true,
      contextTimeout: 3600000, // 1 hour
      maxContextsPerUser: 10
    };
  }

  /**
   * Initialize context manager
   */
  async initialize() {
    console.log('🧠 Context Manager initializing...');

    // Load persisted contexts
    await this.loadPersistedContexts();

    // Initialize global context
    this.initializeGlobalContext();

    console.log('✅ Context Manager initialized');
  }

  /**
   * Initialize global context
   */
  initializeGlobalContext() {
    const isBrowser = typeof window !== 'undefined';
    const navigator = isBrowser ? window.navigator : null;

    this.globalContext = {
      initializedAt: new Date().toISOString(),
      version: '1.0.0',
      environment: isBrowser ? 'browser' : 'server',
      features: {
        webgl: isBrowser ? this.detectWebGL() : false,
        localStorage: isBrowser ? this.detectLocalStorage() : false,
        indexedDB: isBrowser ? this.detectIndexedDB() : false,
        serviceWorker: isBrowser ? this.detectServiceWorker() : false
      },
      capabilities: {
        maxConcurrentExecutions: navigator?.hardwareConcurrency || 4,
        memoryLimit: navigator?.deviceMemory || 4,
        touchEnabled: isBrowser ? 'ontouchstart' in window : false,
        online: navigator?.onLine ?? true
      }
    };
  }

  /**
   * Detect WebGL support
   */
  detectWebGL() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect localStorage support
   */
  detectLocalStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }

    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect IndexedDB support
   */
  detectIndexedDB() {
    if (typeof window === 'undefined') {
      return false;
    }

    return !!(
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB
    );
  }

  /**
   * Detect Service Worker support
   */
  detectServiceWorker() {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return 'serviceWorker' in navigator;
  }

  /**
   * Get or create user context
   */
  getUserContext(userId) {
    if (!userId) return this.createAnonymousContext();

    if (!this.userContexts.has(userId)) {
      this.userContexts.set(userId, this.createUserContext(userId));
    }

    return this.userContexts.get(userId);
  }

  /**
   * Get current context (for compatibility)
   */
  getCurrentContext() {
    // Return global context as current context
    return {
      ...this.globalContext,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Set user context data
   */
  setUserContext(userId, contextData) {
    if (!userId) return false;

    if (!this.userContexts.has(userId)) {
      this.userContexts.set(userId, this.createUserContext(userId));
    }

    const existingContext = this.userContexts.get(userId);

    // Merge the new data with existing context
    const updatedContext = {
      ...existingContext,
      ...contextData,
      lastActive: new Date().toISOString()
    };

    this.userContexts.set(userId, updatedContext);

    // Save to persistence if enabled
    if (this.config.enableContextPersistence) {
      this.savePersistedContexts();
    }

    return true;
  }

  /**
   * Create user context
   */
  createUserContext(userId) {
    const context = {
      userId,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: true
      },
      history: {
        commands: [],
        searches: [],
        favorites: []
      },
      state: {
        currentPage: null,
        lastPortfolio: null,
        favoriteSymbols: [],
        recentSymbols: []
      },
      analytics: {
        totalCommands: 0,
        averageSessionTime: 0,
        preferredCommands: [],
        usagePatterns: {}
      }
    };

    // Maintain context limit per user
    this.enforceContextLimit(userId);

    return context;
  }

  /**
   * Create anonymous context
   */
  createAnonymousContext() {
    return {
      userId: null,
      anonymous: true,
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        language: 'en'
      },
      state: {},
      analytics: {}
    };
  }

  /**
   * Get session context
   */
  getSessionContext(sessionId) {
    if (!sessionId) return null;

    if (!this.sessionContexts.has(sessionId)) {
      this.sessionContexts.set(sessionId, this.createSessionContext(sessionId));
    }

    return this.sessionContexts.get(sessionId);
  }

  /**
   * Create session context
   */
  createSessionContext(sessionId) {
    return {
      sessionId,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      commands: [],
      variables: {},
      context: {},
      metadata: {
        userAgent: navigator?.userAgent,
        referrer: document?.referrer,
        screenSize: {
          width: window?.innerWidth,
          height: window?.innerHeight
        }
      }
    };
  }

  /**
   * Update context with command execution
   */
  updateContext(command, args, result, userId, sessionId) {
    const timestamp = new Date().toISOString();

    // Update user context
    if (userId) {
      const userContext = this.getUserContext(userId);
      this.updateUserContext(userContext, command, args, result, timestamp);
    }

    // Update session context
    if (sessionId) {
      const sessionContext = this.getSessionContext(sessionId);
      this.updateSessionContext(sessionContext, command, args, result, timestamp);
    }

    // Update global context
    this.updateGlobalContext(command, timestamp);

    // Learn from context patterns
    if (this.config.enablePatternLearning) {
      this.learnFromContext(command, args, userId, sessionId);
    }

    // Add to context history
    this.addToContextHistory({
      command,
      args,
      result: result.success,
      userId,
      sessionId,
      timestamp
    });
  }

  /**
   * Update user context
   */
  updateUserContext(userContext, command, args, result, timestamp) {
    userContext.lastActive = timestamp;
    userContext.analytics.totalCommands++;

    // Update command history
    userContext.history.commands.unshift({
      command,
      args,
      result: result.success,
      timestamp
    });

    // Maintain history size
    if (userContext.history.commands.length > 100) {
      userContext.history.commands = userContext.history.commands.slice(0, 100);
    }

    // Update preferred commands
    this.updatePreferredCommands(userContext, command);

    // Extract context from command
    this.extractContextFromCommand(userContext, command, args);
  }

  /**
   * Update session context
   */
  updateSessionContext(sessionContext, command, args, result, timestamp) {
    sessionContext.lastActivity = timestamp;

    sessionContext.commands.push({
      command,
      args,
      result: result.success,
      timestamp
    });

    // Update session variables if command sets them
    if (result.variables) {
      sessionContext.variables = { ...sessionContext.variables, ...result.variables };
    }
  }

  /**
   * Update global context
   */
  updateGlobalContext(command, timestamp) {
    this.globalContext.lastActivity = timestamp;

    // Track global command usage
    if (!this.globalContext.commandUsage) {
      this.globalContext.commandUsage = {};
    }

    this.globalContext.commandUsage[command] = (this.globalContext.commandUsage[command] || 0) + 1;
  }

  /**
   * Update preferred commands for user
   */
  updatePreferredCommands(userContext, command) {
    const preferred = userContext.analytics.preferredCommands;
    const existingIndex = preferred.findIndex(cmd => cmd.command === command);

    if (existingIndex >= 0) {
      preferred[existingIndex].count++;
    } else {
      preferred.push({ command, count: 1 });
    }

    // Sort by usage
    preferred.sort((a, b) => b.count - a.count);

    // Keep top 10
    userContext.analytics.preferredCommands = preferred.slice(0, 10);
  }

  /**
   * Extract context from command
   */
  extractContextFromCommand(userContext, command, args) {
    // Extract symbols from commands
    if (command === 'quote' || command === 'chart' || command === 'analyze') {
      const symbol = args.positional[0];
      if (symbol) {
        this.addRecentSymbol(userContext, symbol);
      }
    }

    // Extract portfolio context
    if (command === 'portfolio') {
      const action = args.positional[0];
      if (action === 'analyze' || action === 'show') {
        userContext.state.lastPortfolioAction = action;
      }
    }

    // Extract page context
    if (command === 'navigate') {
      const page = args.positional[0];
      if (page) {
        userContext.state.currentPage = page;
      }
    }
  }

  /**
   * Add recent symbol to user context
   */
  addRecentSymbol(userContext, symbol) {
    const recent = userContext.state.recentSymbols;
    const existingIndex = recent.indexOf(symbol);

    // Move to front if already exists
    if (existingIndex >= 0) {
      recent.splice(existingIndex, 1);
    }

    // Add to front
    recent.unshift(symbol);

    // Keep only recent 20
    userContext.state.recentSymbols = recent.slice(0, 20);

    // Update favorites if used frequently
    this.updateFavoriteSymbols(userContext);
  }

  /**
   * Update favorite symbols based on usage
   */
  updateFavoriteSymbols(userContext) {
    const recent = userContext.state.recentSymbols;
    const usageCount = {};

    // Count usage in recent history
    recent.forEach(symbol => {
      usageCount[symbol] = (usageCount[symbol] || 0) + 1;
    });

    // Find symbols used more than 3 times
    const favorites = Object.entries(usageCount)
      .filter(([_, count]) => count > 3)
      .map(([symbol, _]) => symbol);

    userContext.state.favoriteSymbols = favorites.slice(0, 10);
  }

  /**
   * Learn from context patterns
   */
  learnFromContext(command, args, userId, sessionId) {
    if (!userId) return;

    const userContext = this.getUserContext(userId);
    const lastCommands = userContext.history.commands.slice(0, 5);

    if (lastCommands.length >= 2) {
      const previousCommand = lastCommands[1].command;
      const sequenceKey = `${previousCommand}->${command}`;

      // Track command sequences
      const sequences = this.patterns.commandSequences;
      sequences.set(sequenceKey, (sequences.get(sequenceKey) || 0) + 1);
    }
  }

  /**
   * Get contextual suggestions
   */
  getContextualSuggestions(userId, sessionId, currentInput = '') {
    const suggestions = [];

    if (!userId) return suggestions;

    const userContext = this.getUserContext(userId);

    // Suggest favorite symbols
    if (currentInput.includes('quote') || currentInput.includes('chart')) {
      userContext.state.favoriteSymbols.forEach(symbol => {
        suggestions.push({
          type: 'symbol',
          value: symbol,
          reason: 'Frequently used'
        });
      });
    }

    // Suggest recent symbols
    if (currentInput.includes('quote') || currentInput.includes('chart')) {
      userContext.state.recentSymbols.slice(0, 3).forEach(symbol => {
        if (!userContext.state.favoriteSymbols.includes(symbol)) {
          suggestions.push({
            type: 'symbol',
            value: symbol,
            reason: 'Recently used'
          });
        }
      });
    }

    // Suggest preferred commands
    userContext.analytics.preferredCommands.slice(0, 3).forEach(pref => {
      if (pref.command.toLowerCase().startsWith(currentInput.toLowerCase())) {
        suggestions.push({
          type: 'command',
          value: pref.command,
          reason: `Used ${pref.count} times`
        });
      }
    });

    return suggestions;
  }

  /**
   * Get intelligent context for command
   */
  getIntelligentContext(userId, sessionId) {
    const context = {
      user: {},
      session: {},
      global: this.globalContext,
      suggestions: [],
      predictions: []
    };

    if (userId) {
      context.user = this.getUserContext(userId);
      context.suggestions = this.getContextualSuggestions(userId, sessionId);
      context.predictions = this.getCommandPredictions(userId);
    }

    if (sessionId) {
      context.session = this.getSessionContext(sessionId);
    }

    return context;
  }

  /**
   * Get command predictions based on patterns
   */
  getCommandPredictions(userId) {
    if (!userId) return [];

    const userContext = this.getUserContext(userId);
    const lastCommand = userContext.history.commands[0]?.command;

    if (!lastCommand) return [];

    const predictions = [];
    const sequences = this.patterns.commandSequences;

    // Find commands that often follow the last command
    for (const [sequence, count] of sequences) {
      if (sequence.startsWith(`${lastCommand}->`)) {
        const nextCommand = sequence.split('->')[1];
        predictions.push({
          command: nextCommand,
          confidence: count,
          reason: `Often follows ${lastCommand}`
        });
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Enforce context limit per user
   */
  enforceContextLimit(userId) {
    if (this.userContexts.size > this.config.maxContextsPerUser) {
      // Remove oldest contexts
      const entries = Array.from(this.userContexts.entries());
      entries.sort((a, b) => new Date(a[1].createdAt) - new Date(b[1].createdAt));

      const toRemove = entries.slice(0, entries.length - this.config.maxContextsPerUser);
      toRemove.forEach(([userId]) => {
        this.userContexts.delete(userId);
      });
    }
  }

  /**
   * Add to context history
   */
  addToContextHistory(entry) {
    this.contextHistory.push(entry);

    if (this.contextHistory.length > this.maxHistorySize) {
      this.contextHistory = this.contextHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get context statistics
   */
  getContextStats() {
    const stats = {
      users: this.userContexts.size,
      sessions: this.sessionContexts.size,
      historySize: this.contextHistory.size,
      patternsLearned: {
        commandSequences: this.patterns.commandSequences.size,
        contextTransitions: this.patterns.contextTransitions.size,
        userBehaviors: this.patterns.userBehaviors.size
      }
    };

    // Calculate user engagement metrics
    const userEngagement = Array.from(this.userContexts.values()).map(user => ({
      totalCommands: user.analytics.totalCommands,
      sessionCount: user.history.commands.length,
      lastActive: user.lastActive
    }));

    if (userEngagement.length > 0) {
      stats.averageCommandsPerUser =
        userEngagement.reduce((sum, u) => sum + u.totalCommands, 0) / userEngagement.length;
      stats.totalUserCommands = userEngagement.reduce((sum, u) => sum + u.totalCommands, 0);
    }

    return stats;
  }

  /**
   * Load persisted contexts
   */
  async loadPersistedContexts() {
    if (!this.config.enableContextPersistence) return;

    // Skip persistence in Node.js environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log('🧠 Context persistence not available in current environment');
      return;
    }

    try {
      const saved = localStorage.getItem('cli-context-data');
      if (saved) {
        const data = JSON.parse(saved);

        if (data.userContexts) {
          data.userContexts.forEach(([userId, context]) => {
            this.userContexts.set(userId, context);
          });
        }

        if (data.patterns) {
          this.patterns = { ...this.patterns, ...data.patterns };
        }

        console.log('🧠 Restored context data');
      }
    } catch (error) {
      console.warn('Failed to load persisted contexts:', error.message);
    }
  }

  /**
   * Save contexts to storage
   */
  async savePersistedContexts() {
    if (!this.config.enableContextPersistence) return;

    // Skip persistence in Node.js environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const data = {
        userContexts: Array.from(this.userContexts.entries()),
        patterns: this.patterns,
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem('cli-context-data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save contexts:', error.message);
    }
  }

  /**
   * Get session ID
   */
  getSessionId() {
    // In a real implementation, this would generate or retrieve a proper session ID
    return `session_${Date.now()}`;
  }

  /**
   * Clean up expired contexts
   */
  cleanupExpiredContexts() {
    const now = Date.now();
    const timeout = this.config.contextTimeout;

    // Clean up old user contexts
    for (const [userId, context] of this.userContexts) {
      if (now - new Date(context.lastActive).getTime() > timeout) {
        this.userContexts.delete(userId);
      }
    }

    // Clean up old session contexts
    for (const [sessionId, context] of this.sessionContexts) {
      if (now - new Date(context.lastActivity).getTime() > timeout) {
        this.sessionContexts.delete(sessionId);
      }
    }
  }

  /**
   * Destroy context manager
   */
  async destroy() {
    // Save contexts before destroying
    await this.savePersistedContexts();

    // Clear all contexts
    this.userContexts.clear();
    this.sessionContexts.clear();
    this.contextHistory = [];

    console.log('🧹 Context Manager destroyed');
  }
}
