/**
 * Advanced Auto-Completion System for Enhanced CLI
 * Provides intelligent suggestions, context awareness, and interactive completion
 */

export class AdvancedAutoCompletion {
  constructor(cli) {
    this.cli = cli;
    this.suggestionCache = new Map();
    this.contextHistory = [];
    this.learningEnabled = true;

    // Completion configuration
    this.config = {
      maxSuggestions: 10,
      enableFuzzyMatching: true,
      enableContextLearning: true,
      enableSmartSuggestions: true,
      completionTimeout: 100, // ms
      cacheSize: 1000
    };

    // Completion patterns and rules
    this.completionRules = {
      commands: {
        patterns: [
          { regex: /^q/, suggestions: ['quote'] },
          { regex: /^c/, suggestions: ['clear', 'calc', 'chart'] },
          { regex: /^a/, suggestions: ['analyze', 'alias'] },
          { regex: /^h/, suggestions: ['help', 'history'] },
          { regex: /^p/, suggestions: ['portfolio', 'portfolio'] }
        ]
      },

      arguments: {
        symbol: {
          patterns: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'],
          validation: /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/
        },

        percentage: {
          patterns: ['5', '10', '15', '20', '25'],
          validation: /^(100|\d{1,2}(\.\d{1,2})?)%?$/
        },

        timeframe: {
          patterns: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'],
          validation: /^\d+[dmoy]$/
        },

        analysis: {
          patterns: ['fundamental', 'technical', 'risk', 'valuation'],
          validation: /^[a-z]+$/
        }
      }
    };

    // Initialize learning system
    this.initializeLearningSystem();
  }

  /**
   * Initialize the auto-completion system
   */
  async initialize() {
    console.log('🎯 Auto-Completion System initializing...');

    // Already initialized in constructor
    console.log('✅ Auto-Completion System initialized');
  }

  /**
   * Get intelligent completions for input
   */
  async getCompletions(input, cursorPosition, context = {}) {
    const startTime = performance.now();

    try {
      // Parse current input state
      const inputState = this.parseInputState(input, cursorPosition);

      // Get base completions
      let completions = await this.getBaseCompletions(inputState, context);

      // Apply intelligent filtering and ranking
      completions = this.rankAndFilterCompletions(completions, inputState, context);

      // Add contextual suggestions
      completions = await this.addContextualSuggestions(completions, inputState, context);

      // Learn from this completion request
      if (this.learningEnabled) {
        this.learnFromCompletion(inputState, context);
      }

      // Cache results
      this.cacheCompletions(inputState, completions);

      const executionTime = performance.now() - startTime;

      return {
        completions: completions.slice(0, this.config.maxSuggestions),
        inputState,
        metadata: {
          executionTime,
          totalSuggestions: completions.length,
          cacheHit: false
        }
      };
    } catch (error) {
      console.warn('Auto-completion error:', error);
      return {
        completions: [],
        inputState: null,
        error: error.message
      };
    }
  }

  /**
   * Parse current input state
   */
  parseInputState(input, cursorPosition) {
    const beforeCursor = input.substring(0, cursorPosition);
    const afterCursor = input.substring(cursorPosition);

    // Split into parts
    const parts = beforeCursor.trim().split(/\s+/);
    const currentWord = parts[parts.length - 1] || '';
    const previousWords = parts.slice(0, -1);

    // Determine completion context
    let context = 'command';
    let command = null;
    let argumentIndex = 0;

    if (previousWords.length > 0) {
      command = previousWords[0];
      context = 'argument';
      argumentIndex = previousWords.length;
    }

    // Check for special characters
    const hasPipe = input.includes('|');
    const hasRedirect = input.includes('>') || input.includes('>>');
    const inQuotes = (beforeCursor.match(/"/g) || []).length % 2 === 1;

    return {
      fullInput: input,
      beforeCursor,
      afterCursor,
      currentWord,
      previousWords,
      command,
      context,
      argumentIndex,
      hasPipe,
      hasRedirect,
      inQuotes,
      cursorPosition
    };
  }

  /**
   * Get base completions based on input state
   */
  async getBaseCompletions(inputState, context) {
    const completions = [];

    if (inputState.context === 'command') {
      // Command name completion
      completions.push(...this.getCommandCompletions(inputState.currentWord));
    } else if (inputState.context === 'argument') {
      // Argument completion based on command
      completions.push(...(await this.getArgumentCompletions(inputState, context)));
    }

    // Special character completions
    if (inputState.hasPipe) {
      completions.push(...this.getPipeCompletions(inputState));
    }

    return completions;
  }

  /**
   * Get command name completions
   */
  getCommandCompletions(partial) {
    const completions = [];
    const partialLower = partial.toLowerCase();

    // Get all available commands
    const allCommands = this.cli.registry.getAllCommands();

    for (const command of allCommands) {
      if (command.name.toLowerCase().startsWith(partialLower)) {
        completions.push({
          text: command.name,
          displayText: command.name,
          description: command.description,
          category: command.category,
          type: 'command',
          score: this.calculateCommandScore(command, partial)
        });
      }
    }

    // Get aliases
    for (const [alias, commandName] of this.cli.registry.aliases) {
      if (alias.toLowerCase().startsWith(partialLower)) {
        const command = this.cli.registry.getCommand(commandName);
        completions.push({
          text: alias,
          displayText: `${alias} → ${commandName}`,
          description: `Alias for ${commandName}`,
          category: command.category,
          type: 'alias',
          score: this.calculateAliasScore(alias, partial)
        });
      }
    }

    return completions;
  }

  /**
   * Get argument completions based on command
   */
  async getArgumentCompletions(inputState, context) {
    const completions = [];
    const commandName = inputState.command;
    const argumentIndex = inputState.argumentIndex;
    const currentArg = inputState.currentWord;

    // Get command info
    const command = this.cli.registry.getCommand(commandName);
    if (!command) return completions;

    // Get completions based on argument position
    switch (commandName.toLowerCase()) {
      case 'quote':
        if (argumentIndex === 1) {
          completions.push(...this.getSymbolCompletions(currentArg, context));
        }
        break;

      case 'chart':
        if (argumentIndex === 1) {
          completions.push(...this.getSymbolCompletions(currentArg, context));
        } else if (argumentIndex === 2) {
          completions.push(...this.getTimeframeCompletions(currentArg));
        }
        break;

      case 'analyze':
        if (argumentIndex === 1) {
          completions.push(...this.getSymbolCompletions(currentArg, context));
        } else if (argumentIndex === 2) {
          completions.push(...this.getAnalysisTypeCompletions(currentArg));
        }
        break;

      case 'dcf':
        if (argumentIndex === 1) {
          completions.push(...this.getSymbolCompletions(currentArg, context));
        }
        break;

      case 'portfolio':
        if (argumentIndex === 1) {
          completions.push(...this.getPortfolioActionCompletions(currentArg));
        }
        break;

      default:
        // Generic argument completion
        completions.push(...this.getGenericCompletions(currentArg, command));
    }

    return completions;
  }

  /**
   * Get symbol completions
   */
  getSymbolCompletions(partial, context) {
    const completions = [];

    // Recent symbols from user context
    if (context.userId) {
      const userContext = this.cli.contextManager.getUserContext(context.userId);
      const recentSymbols = userContext.state?.recentSymbols || [];
      const favoriteSymbols = userContext.state?.favoriteSymbols || [];

      // Add favorite symbols first
      favoriteSymbols.forEach(symbol => {
        if (symbol.toUpperCase().startsWith(partial.toUpperCase())) {
          completions.push({
            text: symbol,
            displayText: `${symbol} ⭐`,
            description: 'Favorite symbol',
            type: 'symbol',
            category: 'favorite',
            score: 100
          });
        }
      });

      // Add recent symbols
      recentSymbols.slice(0, 5).forEach(symbol => {
        if (
          !favoriteSymbols.includes(symbol) &&
          symbol.toUpperCase().startsWith(partial.toUpperCase())
        ) {
          completions.push({
            text: symbol,
            displayText: `${symbol} 🕒`,
            description: 'Recent symbol',
            type: 'symbol',
            category: 'recent',
            score: 80
          });
        }
      });
    }

    // Add popular symbols
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    popularSymbols.forEach(symbol => {
      if (symbol.startsWith(partial.toUpperCase()) && !completions.some(c => c.text === symbol)) {
        completions.push({
          text: symbol,
          displayText: symbol,
          description: 'Popular symbol',
          type: 'symbol',
          category: 'popular',
          score: 50
        });
      }
    });

    return completions;
  }

  /**
   * Get timeframe completions
   */
  getTimeframeCompletions(partial) {
    const timeframes = [
      { value: '1d', description: '1 day' },
      { value: '5d', description: '5 days' },
      { value: '1mo', description: '1 month' },
      { value: '3mo', description: '3 months' },
      { value: '6mo', description: '6 months' },
      { value: '1y', description: '1 year' },
      { value: '2y', description: '2 years' },
      { value: '5y', description: '5 years' }
    ];

    return timeframes
      .filter(tf => tf.value.startsWith(partial.toLowerCase()))
      .map(tf => ({
        text: tf.value,
        displayText: `${tf.value} - ${tf.description}`,
        description: tf.description,
        type: 'timeframe',
        score: 90
      }));
  }

  /**
   * Get analysis type completions
   */
  getAnalysisTypeCompletions(partial) {
    const analysisTypes = [
      { value: 'fundamental', description: 'Fundamental analysis' },
      { value: 'technical', description: 'Technical analysis' },
      { value: 'risk', description: 'Risk analysis' },
      { value: 'valuation', description: 'Valuation analysis' },
      { value: 'comps', description: 'Comparable analysis' }
    ];

    return analysisTypes
      .filter(type => type.value.startsWith(partial.toLowerCase()))
      .map(type => ({
        text: type.value,
        displayText: `${type.value} - ${type.description}`,
        description: type.description,
        type: 'analysis_type',
        score: 85
      }));
  }

  /**
   * Get portfolio action completions
   */
  getPortfolioActionCompletions(partial) {
    const actions = [
      { value: 'show', description: 'Show portfolio holdings' },
      { value: 'analyze', description: 'Analyze portfolio' },
      { value: 'add', description: 'Add position to portfolio' },
      { value: 'remove', description: 'Remove position from portfolio' },
      { value: 'rebalance', description: 'Rebalance portfolio' },
      { value: 'optimize', description: 'Optimize portfolio' },
      { value: 'performance', description: 'Show performance metrics' }
    ];

    return actions
      .filter(action => action.value.startsWith(partial.toLowerCase()))
      .map(action => ({
        text: action.value,
        displayText: `${action.value} - ${action.description}`,
        description: action.description,
        type: 'portfolio_action',
        score: 80
      }));
  }

  /**
   * Get generic completions for unknown commands
   */
  getGenericCompletions(partial, command) {
    const completions = [];

    // File paths (simplified)
    if (partial.includes('/') || partial.includes('\\')) {
      // Could integrate with file system API
      return completions;
    }

    // Numbers
    if (/^\d/.test(partial)) {
      completions.push({
        text: partial,
        displayText: partial,
        description: 'Number',
        type: 'number',
        score: 40
      });
    }

    // Boolean values
    if (partial.toLowerCase().startsWith('t')) {
      completions.push({
        text: 'true',
        displayText: 'true',
        description: 'Boolean true',
        type: 'boolean',
        score: 70
      });
    }

    if (partial.toLowerCase().startsWith('f')) {
      completions.push({
        text: 'false',
        displayText: 'false',
        description: 'Boolean false',
        type: 'boolean',
        score: 70
      });
    }

    return completions;
  }

  /**
   * Get pipe completions
   */
  getPipeCompletions(inputState) {
    const completions = [];

    // Commands that work well with pipes
    const pipeCommands = ['grep', 'sort', 'head', 'tail', 'wc', 'uniq'];

    pipeCommands.forEach(cmd => {
      if (cmd.startsWith(inputState.currentWord)) {
        completions.push({
          text: cmd,
          displayText: `${cmd} (pipe command)`,
          description: `Pipe to ${cmd}`,
          type: 'pipe_command',
          score: 75
        });
      }
    });

    return completions;
  }

  /**
   * Rank and filter completions
   */
  rankAndFilterCompletions(completions, inputState, context) {
    return completions
      .sort((a, b) => {
        // Sort by score (higher is better)
        if (a.score !== b.score) {
          return b.score - a.score;
        }

        // Then by type priority
        const typePriority = {
          favorite: 10,
          recent: 9,
          command: 8,
          alias: 7,
          symbol: 6,
          timeframe: 5,
          analysis_type: 4,
          portfolio_action: 3,
          pipe_command: 2,
          generic: 1
        };

        const aPriority = typePriority[a.category] || typePriority[a.type] || 0;
        const bPriority = typePriority[b.category] || typePriority[b.type] || 0;

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        // Finally by alphabetical order
        return a.text.localeCompare(b.text);
      })
      .filter(completion => {
        // Filter out completions that don't match current input
        if (!inputState.currentWord) return true;

        return completion.text.toLowerCase().startsWith(inputState.currentWord.toLowerCase());
      });
  }

  /**
   * Add contextual suggestions
   */
  async addContextualSuggestions(completions, inputState, context) {
    const suggestions = [...completions];

    // Add suggestions based on user behavior
    if (context.userId && inputState.context === 'command') {
      const userContext = this.cli.contextManager.getUserContext(context.userId);
      const preferredCommands = userContext.analytics?.preferredCommands || [];

      preferredCommands.slice(0, 3).forEach(pref => {
        if (!suggestions.some(s => s.text === pref.command)) {
          suggestions.push({
            text: pref.command,
            displayText: `${pref.command} 🔥`,
            description: `Used ${pref.count} times`,
            type: 'preferred',
            category: 'behavior',
            score: 60
          });
        }
      });
    }

    // Add suggestions based on current context
    if (context.currentSymbol && inputState.context === 'command') {
      const symbolCommands = ['quote', 'chart', 'analyze', 'dcf'];
      symbolCommands.forEach(cmd => {
        if (!suggestions.some(s => s.text === cmd)) {
          suggestions.push({
            text: cmd,
            displayText: `${cmd} 📊`,
            description: `Available for ${context.currentSymbol}`,
            type: 'contextual',
            category: 'symbol_related',
            score: 65
          });
        }
      });
    }

    // Add smart suggestions based on patterns
    const patternSuggestions = await this.getPatternSuggestions(inputState, context);
    suggestions.push(...patternSuggestions);

    return suggestions;
  }

  /**
   * Get pattern-based suggestions
   */
  async getPatternSuggestions(inputState, context) {
    const suggestions = [];

    // Analyze command history for patterns
    const history = this.cli.commandHistory || [];
    const recentCommands = history.slice(-10);

    // Find common command sequences
    const sequences = new Map();
    for (let i = 0; i < recentCommands.length - 1; i++) {
      const current = recentCommands[i].command;
      const next = recentCommands[i + 1].command;

      if (current && next) {
        const key = `${current}->${next}`;
        sequences.set(key, (sequences.get(key) || 0) + 1);
      }
    }

    // Suggest next command in sequence
    if (inputState.command) {
      for (const [sequence, count] of sequences) {
        if (sequence.startsWith(`${inputState.command}->`) && count >= 2) {
          const nextCommand = sequence.split('->')[1];
          suggestions.push({
            text: nextCommand,
            displayText: `${nextCommand} 🔄`,
            description: `Often used after ${inputState.command}`,
            type: 'sequence',
            category: 'pattern',
            score: 55
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Calculate command completion score
   */
  calculateCommandScore(command, partial) {
    let score = 50;

    // Exact match gets highest score
    if (command.name.toLowerCase() === partial.toLowerCase()) {
      score += 50;
    }

    // Commands used more recently get higher scores
    const recentUsage = this.getRecentCommandUsage(command.name);
    score += recentUsage * 10;

    // Popular commands get higher scores
    if (this.isPopularCommand(command.name)) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate alias completion score
   */
  calculateAliasScore(alias, partial) {
    let score = 40;

    // Shorter aliases get higher scores
    score += Math.max(0, 10 - alias.length);

    // Exact match gets bonus
    if (alias.toLowerCase() === partial.toLowerCase()) {
      score += 30;
    }

    return Math.min(score, 90);
  }

  /**
   * Get recent command usage count
   */
  getRecentCommandUsage(commandName) {
    const history = this.cli.commandHistory || [];
    const recentHistory = history.slice(-20);
    return recentHistory.filter(entry => entry.command.startsWith(commandName)).length;
  }

  /**
   * Check if command is popular
   */
  isPopularCommand(commandName) {
    const popularCommands = ['help', 'quote', 'analyze', 'portfolio', 'clear', 'history'];
    return popularCommands.includes(commandName.toLowerCase());
  }

  /**
   * Initialize learning system
   */
  initializeLearningSystem() {
    this.userPatterns = new Map();
    this.commandSequences = new Map();
    this.contextPatterns = new Map();
  }

  /**
   * Learn from completion requests
   */
  learnFromCompletion(inputState, context) {
    if (!context.userId) return;

    // Track user completion patterns
    const userId = context.userId;
    if (!this.userPatterns.has(userId)) {
      this.userPatterns.set(userId, {
        commandPreferences: new Map(),
        completionPatterns: new Map(),
        lastActivity: Date.now()
      });
    }

    const userPattern = this.userPatterns.get(userId);
    userPattern.lastActivity = Date.now();

    // Track command completion patterns
    if (inputState.command) {
      const key = `${inputState.command}:${inputState.argumentIndex}`;
      userPattern.completionPatterns.set(key, (userPattern.completionPatterns.get(key) || 0) + 1);
    }
  }

  /**
   * Cache completions for performance
   */
  cacheCompletions(inputState, completions) {
    const cacheKey = this.generateCacheKey(inputState);

    // Maintain cache size
    if (this.suggestionCache.size >= this.config.cacheSize) {
      // Remove oldest entry (simple LRU)
      const firstKey = this.suggestionCache.keys().next().value;
      this.suggestionCache.delete(firstKey);
    }

    this.suggestionCache.set(cacheKey, {
      completions,
      timestamp: Date.now(),
      inputState
    });
  }

  /**
   * Generate cache key
   */
  generateCacheKey(inputState) {
    return btoa(
      JSON.stringify({
        command: inputState.command,
        argIndex: inputState.argumentIndex,
        currentWord: inputState.currentWord,
        context: inputState.context
      })
    ).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Get cached completions
   */
  getCachedCompletions(inputState) {
    const cacheKey = this.generateCacheKey(inputState);
    const cached = this.suggestionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 minutes
      return cached.completions;
    }

    return null;
  }

  /**
   * Get completion statistics
   */
  getCompletionStats() {
    return {
      cacheSize: this.suggestionCache.size,
      learnedPatterns: this.userPatterns.size,
      contextHistorySize: this.contextHistory.length,
      learningEnabled: this.learningEnabled
    };
  }

  /**
   * Clear completion cache
   */
  clearCache() {
    this.suggestionCache.clear();
    console.log('🧹 Auto-completion cache cleared');
  }

  /**
   * Enable/disable learning
   */
  setLearningEnabled(enabled) {
    this.learningEnabled = enabled;
    console.log(`🧠 Auto-completion learning ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Destroy auto-completion system
   */
  destroy() {
    this.suggestionCache.clear();
    this.userPatterns.clear();
    this.commandSequences.clear();
    this.contextPatterns.clear();
    this.contextHistory = [];

    console.log('🧹 Auto-completion system destroyed');
  }
}
