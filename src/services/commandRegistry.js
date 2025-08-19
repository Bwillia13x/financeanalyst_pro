/**
 * Command Registry for FinanceAnalyst Pro Terminal
 * Manages all available commands with categorization and metadata
 */

export class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.categories = new Map();
    this.aliases = new Map();
    this.initializeCategories();
  }

  /**
   * Initialize command categories
   */
  initializeCategories() {
    this.categories.set('CORE', {
      name: 'Core Analysis',
      description: 'Fundamental financial analysis commands',
      icon: '📊',
      commands: []
    });

    this.categories.set('PORTFOLIO', {
      name: 'Portfolio & Risk',
      description: 'Portfolio analysis and risk management',
      icon: '🎯',
      commands: []
    });

    this.categories.set('VALUATION', {
      name: 'Advanced Valuation',
      description: 'Sophisticated valuation models',
      icon: '📈',
      commands: []
    });

    this.categories.set('TECHNICAL', {
      name: 'Technical Analysis',
      description: 'Technical analysis and market intelligence',
      icon: '📊',
      commands: []
    });

    this.categories.set('FIXED_INCOME', {
      name: 'Fixed Income & Derivatives',
      description: 'Bond analysis and derivatives pricing',
      icon: '🏦',
      commands: []
    });

    this.categories.set('ESG', {
      name: 'ESG & Alternative Data',
      description: 'Environmental, social, governance metrics',
      icon: '🌱',
      commands: []
    });

    this.categories.set('AUTOMATION', {
      name: 'Automation & Workflows',
      description: 'Automated analysis and workflows',
      icon: '🤖',
      commands: []
    });

    this.categories.set('DATA', {
      name: 'Data Management',
      description: 'Data import, export, and management',
      icon: '💾',
      commands: []
    });

    this.categories.set('REPORTING', {
      name: 'Reporting & Visualization',
      description: 'Reports, charts, and visualizations',
      icon: '📋',
      commands: []
    });

    this.categories.set('SYSTEM', {
      name: 'System & Performance',
      description: 'System monitoring and configuration',
      icon: '🔧',
      commands: []
    });

    this.categories.set('ANALYTICS', {
      name: 'Advanced Analytics',
      description: 'Machine learning and advanced analytics',
      icon: '💡',
      commands: []
    });

    this.categories.set('MARKET_DATA', {
      name: 'Market Data Extensions',
      description: 'Extended market data and economic indicators',
      icon: '🌐',
      commands: []
    });

    this.categories.set('UTILITY', {
      name: 'Utility Commands',
      description: 'General utility and helper commands',
      icon: '🛠️',
      commands: []
    });
  }

  /**
   * Register a command
   * @param {string} name - Command name
   * @param {Object} handler - Command handler
   * @param {Object} metadata - Command metadata
   */
  register(name, handler, metadata = {}) {
    const commandName = name.toUpperCase();

    const commandInfo = {
      name: commandName,
      handler,
      category: metadata.category || 'UTILITY',
      description: metadata.description || 'No description available',
      usage: metadata.usage || `${commandName}()`,
      examples: metadata.examples || [],
      parameterSchema: metadata.parameterSchema || null,
      aliases: metadata.aliases || [],
      tags: metadata.tags || [],
      version: metadata.version || '1.0.0',
      deprecated: metadata.deprecated || false,
      experimental: metadata.experimental || false
    };

    // Register main command
    this.commands.set(commandName, commandInfo);

    // Register aliases
    if (metadata.aliases) {
      metadata.aliases.forEach(alias => {
        this.aliases.set(alias.toUpperCase(), commandName);
      });
    }

    // Add to category
    const category = this.categories.get(commandInfo.category);
    if (category) {
      category.commands.push(commandName);
    }

    return this;
  }

  /**
   * Get command handler
   * @param {string} name - Command name or alias
   * @returns {Object|null} Command handler
   */
  getHandler(name) {
    const commandName = name.toUpperCase();

    // Check direct command
    const command = this.commands.get(commandName);
    if (command) {
      return command.handler;
    }

    // Check aliases
    const aliasTarget = this.aliases.get(commandName);
    if (aliasTarget) {
      const aliasCommand = this.commands.get(aliasTarget);
      return aliasCommand ? aliasCommand.handler : null;
    }

    return null;
  }

  /**
   * Get command info
   * @param {string} name - Command name
   * @returns {Object|null} Command information
   */
  getCommandInfo(name) {
    const commandName = name.toUpperCase();

    // Check direct command
    const command = this.commands.get(commandName);
    if (command) {
      return command;
    }

    // Check aliases
    const aliasTarget = this.aliases.get(commandName);
    if (aliasTarget) {
      return this.commands.get(aliasTarget);
    }

    return null;
  }

  /**
   * Get all commands in a category
   * @param {string} category - Category name
   * @returns {Array} Commands in category
   */
  getCommandsByCategory(category) {
    const categoryInfo = this.categories.get(category.toUpperCase());
    if (!categoryInfo) return [];

    return categoryInfo.commands.map(cmdName => this.commands.get(cmdName));
  }

  /**
   * Get all command names
   * @returns {Array} All command names
   */
  getAllCommands() {
    return Array.from(this.commands.keys());
  }

  /**
   * Get all categories
   * @returns {Array} All categories
   */
  getAllCategories() {
    return Array.from(this.categories.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  }

  /**
   * Search commands
   * @param {string} query - Search query
   * @returns {Array} Matching commands
   */
  searchCommands(query) {
    const searchTerm = query.toLowerCase();
    const results = [];

    for (const [name, command] of this.commands) {
      const score = this.calculateSearchScore(command, searchTerm);
      if (score > 0) {
        results.push({ ...command, score });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate search relevance score
   * @param {Object} command - Command object
   * @param {string} searchTerm - Search term
   * @returns {number} Relevance score
   */
  calculateSearchScore(command, searchTerm) {
    let score = 0;

    // Exact name match
    if (command.name.toLowerCase() === searchTerm) {
      score += 100;
    }

    // Name contains search term
    if (command.name.toLowerCase().includes(searchTerm)) {
      score += 50;
    }

    // Description contains search term
    if (command.description.toLowerCase().includes(searchTerm)) {
      score += 25;
    }

    // Tags contain search term
    if (command.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
      score += 15;
    }

    // Aliases contain search term
    if (command.aliases.some(alias => alias.toLowerCase().includes(searchTerm))) {
      score += 10;
    }

    return score;
  }

  /**
   * Get command suggestions based on partial input
   * @param {string} partial - Partial command input
   * @returns {Array} Suggested commands
   */
  getSuggestions(partial) {
    const partialLower = partial.toLowerCase();
    const suggestions = [];

    for (const [name, command] of this.commands) {
      if (name.toLowerCase().startsWith(partialLower)) {
        const _name = command.name;
        suggestions.push({
          name: _name,
          description: command.description,
          usage: command.usage,
          category: command.category
        });
      }
    }

    return suggestions.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Validate command exists
   * @param {string} name - Command name
   * @returns {boolean} Whether command exists
   */
  hasCommand(name) {
    const commandName = name.toUpperCase();
    return this.commands.has(commandName) || this.aliases.has(commandName);
  }

  /**
   * Get command count by category
   * @returns {Object} Command counts by category
   */
  getCommandStats() {
    const stats = {};

    for (const [categoryKey, category] of this.categories) {
      stats[categoryKey] = {
        name: category.name,
        count: category.commands.length,
        icon: category.icon
      };
    }

    return stats;
  }
}

// Export singleton instance
export const commandRegistry = new CommandRegistry();
