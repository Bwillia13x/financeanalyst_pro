/**
 * Enhanced Command Registry
 * Manages command registration, validation, and intelligent discovery
 */

import { safeGetItem, safeSetItem, isLocalStorageAvailable } from '../../utils/storageUtils.js';

export class CommandRegistry {
  constructor(cli) {
    this.cli = cli;
    this.commands = new Map();
    this.categories = new Map();
    this.aliases = new Map();
    this.validators = new Map();
    this.metadata = new Map();

    this.initializeCategories();
    this.initializeValidators();
  }

  /**
   * Initialize command categories
   */
  initializeCategories() {
    const categories = {
      system: {
        name: 'System',
        description: 'System management and utilities',
        icon: '🔧',
        priority: 1
      },
      financial: {
        name: 'Financial Analysis',
        description: 'Valuation and financial modeling',
        icon: '📊',
        priority: 2
      },
      market: {
        name: 'Market Data',
        description: 'Real-time market data and quotes',
        icon: '📈',
        priority: 3
      },
      portfolio: {
        name: 'Portfolio',
        description: 'Portfolio management and analysis',
        icon: '🎯',
        priority: 4
      },
      esg: {
        name: 'ESG',
        description: 'Environmental, Social, Governance analysis',
        icon: '🌱',
        priority: 5
      },
      derivatives: {
        name: 'Derivatives',
        description: 'Options and derivatives analysis',
        icon: '📉',
        priority: 6
      },
      automation: {
        name: 'Automation',
        description: 'Workflow automation and scripting',
        icon: '🤖',
        priority: 7
      },
      data: {
        name: 'Data Management',
        description: 'Import, export, and data management',
        icon: '💾',
        priority: 8
      },
      utility: {
        name: 'Utilities',
        description: 'General utility commands',
        icon: '🛠️',
        priority: 9
      },
      learning: {
        name: 'Learning',
        description: 'Tutorials and educational content',
        icon: '📚',
        priority: 10
      }
    };

    Object.entries(categories).forEach(([key, config]) => {
      this.categories.set(key, {
        ...config,
        commands: []
      });
    });
  }

  /**
   * Initialize input validators
   */
  initializeValidators() {
    this.validators.set('symbol', {
      pattern: /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/,
      message: 'Must be a valid stock symbol (1-5 uppercase letters, optional .class)',
      examples: ['AAPL', 'MSFT', 'TSLA', 'BRK.A']
    });

    this.validators.set('number', {
      pattern: /^-?\d+(\.\d+)?$/,
      message: 'Must be a valid number',
      examples: ['100', '123.45', '-50']
    });

    this.validators.set('percentage', {
      pattern: /^(100|\d{1,2}(\.\d{1,2})?)%?$/,
      message: 'Must be a percentage (0-100)',
      examples: ['5.5', '25%', '100']
    });

    this.validators.set('email', {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Must be a valid email address',
      examples: ['user@domain.com', 'name@company.org']
    });

    this.validators.set('date', {
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      message: 'Must be in YYYY-MM-DD format',
      examples: ['2024-01-15', '2023-12-31']
    });

    this.validators.set('currency', {
      pattern: /^\$?[\d,]+(\.\d{2})?$/,
      message: 'Must be a valid currency amount',
      examples: ['$1,000,000', '500000', '123.45']
    });

    this.validators.set('boolean', {
      pattern: /^(true|false|yes|no|1|0)$/i,
      message: 'Must be a boolean value',
      examples: ['true', 'false', 'yes', 'no']
    });
  }

  /**
   * Initialize the registry
   */
  async initialize() {
    console.log('📋 Command Registry initializing...');

    // Load any persisted registry data
    await this.loadPersistedRegistry();

    console.log('✅ Command Registry initialized');
  }

  /**
   * Register a command
   */
  async register(name, handler, metadata = {}) {
    const commandName = name.toUpperCase();

    // Validate command name
    if (!this.isValidCommandName(commandName)) {
      throw new Error(`Invalid command name: ${name}`);
    }

    // Check for conflicts
    if (this.commands.has(commandName)) {
      console.warn(`Command '${commandName}' already registered, overwriting`);
    }

    // Create command definition
    const command = {
      name: commandName,
      handler,
      category: metadata.category || 'utility',
      description: metadata.description || 'No description available',
      usage: metadata.usage || `${commandName}`,
      examples: metadata.examples || [],
      aliases: metadata.aliases || [],
      parameters: metadata.parameters || {},
      validation: metadata.validation || {},
      permissions: metadata.permissions || [],
      tags: metadata.tags || [],
      version: metadata.version || '1.0.0',
      deprecated: metadata.deprecated || false,
      experimental: metadata.experimental || false,
      author: metadata.author || 'system',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    // Register main command
    this.commands.set(commandName, command);

    // Register aliases
    if (command.aliases.length > 0) {
      command.aliases.forEach(alias => {
        const aliasName = alias.toUpperCase();
        this.aliases.set(aliasName, commandName);
      });
    }

    // Add to category
    const category = this.categories.get(command.category);
    if (category) {
      category.commands.push(commandName);
    }

    // Store metadata
    this.metadata.set(commandName, command);

    // Persist registry
    await this.persistRegistry();

    console.log(`📝 Registered command: ${commandName}`);
    return command;
  }

  /**
   * Unregister a command
   */
  async unregister(name) {
    const commandName = name.toUpperCase();

    if (!this.commands.has(commandName)) {
      return false;
    }

    const command = this.commands.get(commandName);

    // Remove from category
    const category = this.categories.get(command.category);
    if (category) {
      const index = category.commands.indexOf(commandName);
      if (index > -1) {
        category.commands.splice(index, 1);
      }
    }

    // Remove aliases
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.aliases.delete(alias.toUpperCase());
      });
    }

    // Remove from registry
    this.commands.delete(commandName);
    this.metadata.delete(commandName);

    // Persist changes
    await this.persistRegistry();

    console.log(`🗑️ Unregistered command: ${commandName}`);
    return true;
  }

  /**
   * Get command by name or alias
   */
  getCommand(name) {
    const commandName = name.toUpperCase();

    // Direct command lookup
    if (this.commands.has(commandName)) {
      return this.commands.get(commandName);
    }

    // Alias lookup
    if (this.aliases.has(commandName)) {
      const realName = this.aliases.get(commandName);
      return this.commands.get(realName);
    }

    return null;
  }

  /**
   * Get command metadata
   */
  getCommandInfo(name) {
    return this.metadata.get(name.toUpperCase()) || null;
  }

  /**
   * Get all commands in a category
   */
  getCommandsByCategory(category) {
    const categoryInfo = this.categories.get(category.toLowerCase());
    if (!categoryInfo) return [];

    return categoryInfo.commands.map(cmdName => this.commands.get(cmdName)).filter(Boolean);
  }

  /**
   * Get all registered commands
   */
  getAllCommands() {
    return Array.from(this.commands.values());
  }

  /**
   * Get command count
   */
  getCommandCount() {
    return this.commands.size;
  }

  /**
   * Get all categories
   */
  getAllCategories() {
    return Array.from(this.categories.entries()).map(([key, value]) => ({
      key,
      ...value,
      commandCount: value.commands.length
    }));
  }

  /**
   * Validate command name
   */
  isValidCommandName(name) {
    // Basic validation rules
    if (!name || typeof name !== 'string') return false;
    if (name.length < 1 || name.length > 50) return false;
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) return false;

    // Reserved words - these are actually allowed for commands
    // const reservedWords = ['help', 'exit', 'quit', 'clear', 'history', 'alias'];
    // if (reservedWords.includes(name.toLowerCase())) return false;

    return true;
  }

  /**
   * Validate command parameters
   */
  validateParameters(command, args) {
    const validation = command.validation || {};
    const errors = [];

    // Validate positional arguments
    if (validation.positional) {
      validation.positional.forEach((rule, index) => {
        const value = args.positional[index];
        if (rule.required && (value === undefined || value === null)) {
          errors.push(`Missing required argument: ${rule.name}`);
        } else if (value !== undefined && rule.type) {
          const validator = this.validators.get(rule.type);
          if (validator && !validator.pattern.test(value)) {
            errors.push(`Invalid ${rule.name}: ${validator.message}`);
          }
        }
      });
    }

    // Validate options
    if (validation.options) {
      Object.entries(validation.options).forEach(([key, rule]) => {
        const value = args.options[key];
        if (rule.required && value === undefined) {
          errors.push(`Missing required option: --${key}`);
        } else if (value !== undefined && rule.type) {
          const validator = this.validators.get(rule.type);
          if (validator && !validator.pattern.test(value)) {
            errors.push(`Invalid option --${key}: ${validator.message}`);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get intelligent command suggestions
   */
  getSuggestions(input, context = {}) {
    const suggestions = [];
    const inputLower = input.toLowerCase();

    // Exact matches first
    for (const [name, command] of this.commands) {
      if (name.toLowerCase() === inputLower) {
        suggestions.unshift({
          name,
          description: command.description,
          category: command.category,
          exact: true
        });
      }
    }

    // Prefix matches
    for (const [name, command] of this.commands) {
      if (name.toLowerCase().startsWith(inputLower) && name.toLowerCase() !== inputLower) {
        suggestions.push({
          name,
          description: command.description,
          category: command.category,
          prefix: true
        });
      }
    }

    // Fuzzy matches for longer inputs
    if (input.length > 2) {
      for (const [name, command] of this.commands) {
        if (name.toLowerCase().includes(inputLower) && !name.toLowerCase().startsWith(inputLower)) {
          suggestions.push({
            name,
            description: command.description,
            category: command.category,
            fuzzy: true
          });
        }
      }
    }

    // Alias matches
    for (const [alias, commandName] of this.aliases) {
      if (alias.toLowerCase().startsWith(inputLower)) {
        const command = this.commands.get(commandName);
        suggestions.push({
          name: alias,
          description: `Alias for ${commandName}`,
          category: command.category,
          alias: true,
          target: commandName
        });
      }
    }

    // Context-aware suggestions
    if (context.lastCommand) {
      suggestions.push(...this.getContextualSuggestions(input, context));
    }

    // Sort by relevance
    return suggestions
      .sort((a, b) => {
        // Exact matches first
        if (a.exact && !b.exact) return -1;
        if (!a.exact && b.exact) return 1;

        // Then prefix matches
        if (a.prefix && !b.prefix) return -1;
        if (!a.prefix && b.prefix) return 1;

        // Then by category priority
        const aCategory = this.categories.get(a.category);
        const bCategory = this.categories.get(b.category);
        const aPriority = aCategory ? aCategory.priority : 999;
        const bPriority = bCategory ? bCategory.priority : 999;

        return aPriority - bPriority;
      })
      .slice(0, 10); // Limit to top 10
  }

  /**
   * Get contextual suggestions based on usage patterns
   */
  getContextualSuggestions(input, context) {
    const suggestions = [];

    // Suggest related commands based on last command
    const lastCommand = context.lastCommand;
    if (lastCommand) {
      const relatedCommands = this.getRelatedCommands(lastCommand);
      relatedCommands.forEach(cmdName => {
        const command = this.commands.get(cmdName);
        if (command && cmdName.toLowerCase().startsWith(input.toLowerCase())) {
          suggestions.push({
            name: cmdName,
            description: command.description,
            category: command.category,
            contextual: true,
            reason: `Often used after ${lastCommand}`
          });
        }
      });
    }

    // Suggest commands based on current context (e.g., if analyzing a stock)
    if (context.currentSymbol) {
      const contextCommands = ['quote', 'chart', 'analyze', 'dcf', 'comps'];
      contextCommands.forEach(cmdName => {
        const command = this.commands.get(cmdName.toUpperCase());
        if (command && cmdName.toLowerCase().startsWith(input.toLowerCase())) {
          suggestions.push({
            name: cmdName,
            description: command.description,
            category: command.category,
            contextual: true,
            reason: `Available for ${context.currentSymbol}`
          });
        }
      });
    }

    return suggestions;
  }

  /**
   * Get commands related to a given command
   */
  getRelatedCommands(commandName) {
    const related = {
      quote: ['chart', 'analyze', 'dcf', 'comps'],
      chart: ['quote', 'analyze', 'export'],
      dcf: ['comps', 'lbo', 'sensitivity', 'export'],
      comps: ['dcf', 'lbo', 'export'],
      analyze: ['dcf', 'comps', 'export', 'chart'],
      portfolio: ['analyze', 'rebalance', 'export']
    };

    return related[commandName.toLowerCase()] || [];
  }

  /**
   * Search commands by various criteria
   */
  search(query, filters = {}) {
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const [name, command] of this.commands) {
      let score = 0;

      // Name matching
      if (name.toLowerCase().includes(searchTerm)) {
        score += name.toLowerCase() === searchTerm ? 100 : 50;
      }

      // Description matching
      if (command.description.toLowerCase().includes(searchTerm)) {
        score += 30;
      }

      // Tag matching
      if (command.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
        score += 20;
      }

      // Alias matching
      if (command.aliases.some(alias => alias.toLowerCase().includes(searchTerm))) {
        score += 15;
      }

      if (score > 0) {
        // Apply filters
        let include = true;

        if (filters.category && command.category !== filters.category) {
          include = false;
        }

        if (filters.experimental !== undefined && command.experimental !== filters.experimental) {
          include = false;
        }

        if (filters.deprecated !== undefined && command.deprecated !== filters.deprecated) {
          include = false;
        }

        if (include) {
          results.push({ ...command, score });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get command usage statistics
   */
  getUsageStats() {
    // This would integrate with the CLI's usage tracking
    // For now, return basic stats
    return {
      totalCommands: this.commands.size,
      totalAliases: this.aliases.size,
      categoriesUsed: this.categories.size,
      mostUsedCategory: this.getMostUsedCategory()
    };
  }

  /**
   * Get most used category (placeholder)
   */
  getMostUsedCategory() {
    let maxCount = 0;
    let mostUsed = null;

    for (const [key, category] of this.categories) {
      if (category.commands.length > maxCount) {
        maxCount = category.commands.length;
        mostUsed = key;
      }
    }

    return mostUsed;
  }

  /**
   * Load persisted registry data
   */
  async loadPersistedRegistry() {
    try {
      const saved = safeGetItem('cli-command-registry');
      if (saved) {
        const _data = JSON.parse(saved);
        // Restore any custom commands or settings
        console.log('📋 Restored command registry from storage');
      }
    } catch (error) {
      console.warn('Failed to load persisted registry:', error.message);
    }
  }

  /**
   * Persist registry data
   */
  async persistRegistry() {
    if (!isLocalStorageAvailable()) {
      console.log('📋 Skipping registry persistence - localStorage not available');
      return;
    }

    try {
      const data = {
        timestamp: new Date().toISOString(),
        commandCount: this.commands.size,
        categories: Array.from(this.categories.keys())
      };
      safeSetItem('cli-command-registry', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist registry:', error.message);
    }
  }
}
