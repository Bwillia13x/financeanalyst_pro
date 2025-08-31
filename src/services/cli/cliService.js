// Comprehensive CLI (Command Line Interface) Service
// Provides terminal-like command execution for the entire FinanceAnalyst Pro platform
class CLIService {
  constructor() {
    this.commands = new Map();
    this.commandHistory = [];
    this.historyIndex = -1;
    this.currentContext = {};
    this.aliases = new Map();
    this.variables = new Map();
    this.isInitialized = false;

    // CLI Configuration
    this.config = {
      maxHistorySize: 1000,
      maxOutputLines: 1000,
      enableAutoComplete: true,
      enableCommandSuggestions: true,
      enableKeyboardShortcuts: true,
      promptSymbol: '📊 $',
      welcomeMessage:
        'Welcome to FinanceAnalyst Pro CLI\nType "help" for available commands or "tutorial" for guided tour',
      errorPrefix: '❌ Error:',
      successPrefix: '✅',
      infoPrefix: 'ℹ️',
      warningPrefix: '⚠️'
    };

    // Initialize core commands
    this.initializeCoreCommands();

    // Setup integrations
    this.setupServiceIntegrations();

    console.log('💻 CLI Service initialized successfully');
  }

  // Initialize core CLI commands
  initializeCoreCommands() {
    // System commands
    this.registerCommand('help', this.handleHelp.bind(this), {
      description: 'Show available commands or help for specific command',
      usage: 'help [command]',
      category: 'system',
      aliases: ['h', '?']
    });

    this.registerCommand('clear', this.handleClear.bind(this), {
      description: 'Clear the terminal output',
      usage: 'clear',
      category: 'system',
      aliases: ['cls', 'c']
    });

    this.registerCommand('history', this.handleHistory.bind(this), {
      description: 'Show command history',
      usage: 'history [count]',
      category: 'system',
      aliases: ['hist']
    });

    this.registerCommand('exit', this.handleExit.bind(this), {
      description: 'Exit the CLI or close current session',
      usage: 'exit',
      category: 'system',
      aliases: ['quit', 'q']
    });

    // Financial Analysis commands
    this.registerCommand('analyze', this.handleAnalyze.bind(this), {
      description: 'Perform financial analysis on stocks, portfolios, or models',
      usage: 'analyze <type> [options]',
      category: 'analysis',
      examples: [
        'analyze stock AAPL',
        'analyze portfolio --risk',
        'analyze dcf --symbol MSFT --growth 0.05'
      ]
    });

    this.registerCommand('portfolio', this.handlePortfolio.bind(this), {
      description: 'Portfolio management and analysis commands',
      usage: 'portfolio <action> [options]',
      category: 'portfolio',
      examples: [
        'portfolio create my_portfolio',
        'portfolio add AAPL 100',
        'portfolio analyze --var',
        'portfolio optimize --target-return 0.08'
      ]
    });

    // Market Data commands
    this.registerCommand('quote', this.handleQuote.bind(this), {
      description: 'Get real-time stock quotes and market data',
      usage: 'quote <symbol> [options]',
      category: 'market',
      examples: ['quote AAPL', 'quote MSFT --detailed', 'quote SPY --historical --period 1mo']
    });

    this.registerCommand('chart', this.handleChart.bind(this), {
      description: 'Display interactive charts and technical analysis',
      usage: 'chart <symbol> [options]',
      category: 'market',
      examples: [
        'chart AAPL',
        'chart MSFT --indicators rsi,macd',
        'chart SPY --timeframe 1d --period 3mo'
      ]
    });

    // ESG commands
    this.registerCommand('esg', this.handleESG.bind(this), {
      description: 'ESG analysis and scoring',
      usage: 'esg <action> [options]',
      category: 'esg',
      examples: ['esg score AAPL', 'esg portfolio analyze', 'esg report generate --format pdf']
    });

    // Options commands
    this.registerCommand('options', this.handleOptions.bind(this), {
      description: 'Options analysis and pricing',
      usage: 'options <action> [options]',
      category: 'derivatives',
      examples: [
        'options price --symbol AAPL --strike 150 --expiry 2024-12-31',
        'options greeks --symbol TSLA',
        'options strategy straddle --symbol MSFT --strike 300'
      ]
    });

    // Collaboration commands
    this.registerCommand('workspace', this.handleWorkspace.bind(this), {
      description: 'Workspace and collaboration management',
      usage: 'workspace <action> [options]',
      category: 'collaboration',
      examples: [
        'workspace create my_analysis',
        'workspace list',
        'workspace invite user@example.com',
        'workspace share --public'
      ]
    });

    // Utility commands
    this.registerCommand('calc', this.handleCalculator.bind(this), {
      description: 'Financial calculator for various computations',
      usage: 'calc <operation> [parameters]',
      category: 'utilities',
      examples: [
        'calc irr 1000 1200 1400',
        'calc npv 0.1 -1000 300 400 500',
        'calc compound 1000 0.05 10'
      ]
    });

    this.registerCommand('export', this.handleExport.bind(this), {
      description: 'Export data and results',
      usage: 'export <type> [options]',
      category: 'utilities',
      examples: [
        'export analysis --format csv',
        'export portfolio --format pdf',
        'export chart --symbol AAPL --format png'
      ]
    });

    // Tutorial and learning commands
    this.registerCommand('tutorial', this.handleTutorial.bind(this), {
      description: 'Interactive tutorial for learning the platform',
      usage: 'tutorial [topic]',
      category: 'learning',
      examples: ['tutorial', 'tutorial analysis', 'tutorial portfolio', 'tutorial options']
    });

    this.registerCommand('docs', this.handleDocs.bind(this), {
      description: 'Access documentation and reference materials',
      usage: 'docs [topic]',
      category: 'learning',
      examples: ['docs commands', 'docs analysis', 'docs api']
    });
  }

  // Register a new command
  registerCommand(name, handler, metadata = {}) {
    this.commands.set(name, {
      name,
      handler,
      ...metadata,
      registeredAt: new Date().toISOString()
    });

    // Register aliases
    if (metadata.aliases) {
      metadata.aliases.forEach(alias => {
        this.aliases.set(alias, name);
      });
    }
  }

  // Execute a command
  async executeCommand(input, context = {}) {
    try {
      // Parse the command
      const parsedCommand = this.parseCommand(input);

      if (!parsedCommand) {
        return this.createOutput('error', 'Invalid command format');
      }

      // Add to history
      this.addToHistory(input);

      // Resolve aliases
      const commandName = this.aliases.get(parsedCommand.name) || parsedCommand.name;

      // Find command
      const command = this.commands.get(commandName);

      if (!command) {
        const suggestions = this.getCommandSuggestions(commandName);
        return this.createOutput(
          'error',
          `Command '${commandName}' not found. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(', ')}` : ''}`
        );
      }

      // Execute command with context
      const result = await command.handler(parsedCommand.args, {
        ...this.currentContext,
        ...context,
        cli: this
      });

      return this.createOutput('success', result);
    } catch (error) {
      console.error('CLI Command execution error:', error);
      return this.createOutput('error', error.message || 'Command execution failed');
    }
  }

  // Parse command input
  parseCommand(input) {
    if (!input || typeof input !== 'string') {
      return null;
    }

    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return null;
    }

    // Handle piping and redirection (advanced feature)
    if (trimmedInput.includes('|') || trimmedInput.includes('>')) {
      return this.parseComplexCommand(trimmedInput);
    }

    // Simple command parsing
    const parts = trimmedInput.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = this.parseArguments(parts.slice(1));

    return { name, args, original: trimmedInput };
  }

  // Parse command arguments with support for flags and values
  parseArguments(args) {
    const parsed = {
      positional: [],
      flags: {},
      options: {}
    };

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      if (arg.startsWith('--')) {
        // Long option
        const optionName = arg.slice(2);
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          parsed.options[optionName] = args[i + 1];
          i += 2;
        } else {
          parsed.flags[optionName] = true;
          i++;
        }
      } else if (arg.startsWith('-')) {
        // Short option or flag
        const optionName = arg.slice(1);
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          parsed.options[optionName] = args[i + 1];
          i += 2;
        } else {
          parsed.flags[optionName] = true;
          i++;
        }
      } else {
        // Positional argument
        parsed.positional.push(arg);
        i++;
      }
    }

    return parsed;
  }

  // Parse complex commands with piping
  parseComplexCommand(input) {
    // For now, just handle simple piping
    const parts = input.split('|').map(part => part.trim());
    if (parts.length === 2) {
      const [cmd1, cmd2] = parts;
      return {
        name: 'pipe',
        args: {
          command1: this.parseCommand(cmd1),
          command2: this.parseCommand(cmd2)
        },
        original: input
      };
    }

    return this.parseCommand(parts[0]);
  }

  // Command handlers
  async handleHelp(args, context) {
    const { positional } = args;

    if (positional.length > 0) {
      // Help for specific command
      const commandName = positional[0];
      const command =
        this.commands.get(commandName) || this.commands.get(this.aliases.get(commandName));

      if (command) {
        let help = `${command.name.toUpperCase()}\n`;
        help += `Description: ${command.description}\n`;
        help += `Usage: ${command.usage}\n`;

        if (command.aliases && command.aliases.length > 0) {
          help += `Aliases: ${command.aliases.join(', ')}\n`;
        }

        if (command.examples && command.examples.length > 0) {
          help += `Examples:\n${command.examples.map(ex => `  ${ex}`).join('\n')}\n`;
        }

        return help;
      } else {
        return `Command '${commandName}' not found`;
      }
    } else {
      // General help
      const categories = {};
      this.commands.forEach(cmd => {
        if (!categories[cmd.category]) {
          categories[cmd.category] = [];
        }
        categories[cmd.category].push(cmd.name);
      });

      let help = 'Available Commands:\n\n';

      Object.entries(categories).forEach(([category, commands]) => {
        help += `${category.toUpperCase()}:\n`;
        help += `  ${commands.join(', ')}\n\n`;
      });

      help += 'Type "help <command>" for detailed help on a specific command.\n';
      help += 'Use Tab for auto-completion and ↑/↓ for command history.';

      return help;
    }
  }

  async handleClear(args, context) {
    // This will be handled by the CLI component to clear the output
    return { action: 'clear_output' };
  }

  async handleHistory(args, context) {
    const { positional } = args;
    const count = parseInt(positional[0]) || 20;

    const recentHistory = this.commandHistory.slice(-count);
    let output = 'Command History:\n';

    recentHistory.forEach((cmd, index) => {
      const actualIndex = this.commandHistory.length - count + index;
      output += `${actualIndex + 1}. ${cmd}\n`;
    });

    return output;
  }

  async handleExit(args, context) {
    // This will be handled by the CLI component to close/hide the terminal
    return { action: 'exit_cli' };
  }

  async handleAnalyze(args, context) {
    const { positional, options } = args;
    const analysisType = positional[0];

    if (!analysisType) {
      return 'Usage: analyze <type> [options]\nTypes: stock, portfolio, dcf, comparables, sensitivity';
    }

    switch (analysisType) {
      case 'stock':
        return await this.analyzeStock(positional[1], options);
      case 'portfolio':
        return await this.analyzePortfolio(options);
      case 'dcf':
        return await this.analyzeDCF(options);
      default:
        return `Unknown analysis type: ${analysisType}`;
    }
  }

  async handlePortfolio(args, context) {
    const { positional, options } = args;
    const action = positional[0];

    if (!action) {
      return 'Usage: portfolio <action> [options]\nActions: create, list, add, remove, analyze, optimize';
    }

    switch (action) {
      case 'create':
        return await this.createPortfolio(positional[1], options);
      case 'list':
        return await this.listPortfolios();
      case 'add':
        return await this.addToPortfolio(positional[1], positional[2], options);
      case 'analyze':
        return await this.analyzePortfolio(options);
      default:
        return `Unknown portfolio action: ${action}`;
    }
  }

  async handleQuote(args, context) {
    const { positional, options } = args;
    const symbol = positional[0];

    if (!symbol) {
      return 'Usage: quote <symbol> [options]';
    }

    try {
      // This would integrate with your market data service
      const quote = await this.getMarketQuote(symbol, options);

      let output = `${symbol.toUpperCase()} Quote:\n`;
      output += `Price: $${quote.price}\n`;
      output += `Change: ${quote.change > 0 ? '+' : ''}${quote.change} (${quote.changePercent}%)\n`;

      if (options.detailed) {
        output += `Volume: ${quote.volume?.toLocaleString()}\n`;
        output += `Market Cap: $${quote.marketCap?.toLocaleString()}\n`;
        output += `52W High: $${quote.fiftyTwoWeekHigh}\n`;
        output += `52W Low: $${quote.fiftyTwoWeekLow}\n`;
      }

      return output;
    } catch (error) {
      return `Failed to get quote for ${symbol}: ${error.message}`;
    }
  }

  async handleESG(args, context) {
    const { positional, options } = args;
    const action = positional[0];

    if (!action) {
      return 'Usage: esg <action> [options]\nActions: score, portfolio, report';
    }

    switch (action) {
      case 'score':
        return await this.getESGScore(positional[1], options);
      case 'portfolio':
        return await this.analyzeESGPortfolio(options);
      case 'report':
        return await this.generateESGReport(options);
      default:
        return `Unknown ESG action: ${action}`;
    }
  }

  // Integration with platform services
  setupServiceIntegrations() {
    // This will be called when the services are available
    this.integrations = {
      marketData: null,
      portfolio: null,
      analysis: null,
      esg: null,
      options: null,
      collaboration: null
    };
  }

  // Set service integrations
  setService(serviceName, service) {
    this.integrations[serviceName] = service;
  }

  // Get command suggestions for auto-completion
  getCommandSuggestions(partial) {
    const suggestions = [];
    const partialLower = partial.toLowerCase();

    this.commands.forEach(cmd => {
      if (cmd.name.toLowerCase().startsWith(partialLower)) {
        suggestions.push(cmd.name);
      }
    });

    return suggestions.slice(0, 5);
  }

  // Auto-complete command
  autoComplete(input) {
    if (!input) return '';

    const parts = input.split(' ');
    const currentWord = parts[parts.length - 1];

    if (parts.length === 1) {
      // Complete command name
      const suggestions = this.getCommandSuggestions(currentWord);
      return suggestions.length === 1 ? suggestions[0] + ' ' : input;
    } else {
      // Complete arguments/options (simplified)
      return input;
    }
  }

  // History management
  addToHistory(command) {
    this.commandHistory.push(command);

    // Limit history size
    if (this.commandHistory.length > this.config.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(-this.config.maxHistorySize);
    }

    this.historyIndex = -1;
  }

  getHistoryItem(direction) {
    if (this.commandHistory.length === 0) return '';

    if (direction === 'up') {
      this.historyIndex = Math.max(0, this.historyIndex + 1);
    } else if (direction === 'down') {
      this.historyIndex = Math.max(-1, this.historyIndex - 1);
    }

    if (this.historyIndex === -1) return '';

    const index = this.commandHistory.length - 1 - this.historyIndex;
    return this.commandHistory[index] || '';
  }

  // Create output object
  createOutput(type, content) {
    return {
      type,
      content,
      timestamp: new Date().toISOString(),
      commandId: crypto.randomUUID()
    };
  }

  // Utility methods for service integrations
  async analyzeStock(symbol, options) {
    // Mock implementation - would integrate with analysis service
    return `Analyzing ${symbol}...\nPerforming fundamental analysis...\nGenerating report...`;
  }

  async createPortfolio(name, options) {
    // Mock implementation
    return `Created portfolio: ${name}`;
  }

  async getMarketQuote(symbol, options) {
    // Mock implementation
    return {
      price: 150.25,
      change: 2.5,
      changePercent: 1.69,
      volume: 45000000,
      marketCap: 2500000000000,
      fiftyTwoWeekHigh: 198.23,
      fiftyTwoWeekLow: 124.17
    };
  }

  async getESGScore(symbol, options) {
    // Mock implementation
    return `${symbol} ESG Score: 78/100 (Good)`;
  }

  // CLI state management
  setContext(key, value) {
    this.currentContext[key] = value;
  }

  getContext(key) {
    return this.currentContext[key];
  }

  clearContext() {
    this.currentContext = {};
  }

  // Variable management
  setVariable(name, value) {
    this.variables.set(name, value);
  }

  getVariable(name) {
    return this.variables.get(name);
  }

  // Export/Import CLI state
  exportState() {
    return {
      history: this.commandHistory,
      variables: Object.fromEntries(this.variables),
      context: this.currentContext,
      aliases: Object.fromEntries(this.aliases)
    };
  }

  importState(state) {
    if (state.history) {
      this.commandHistory = state.history;
    }
    if (state.variables) {
      this.variables = new Map(Object.entries(state.variables));
    }
    if (state.context) {
      this.currentContext = state.context;
    }
    if (state.aliases) {
      this.aliases = new Map(Object.entries(state.aliases));
    }
  }
}

// Create singleton instance
const cliService = new CLIService();

// Export for use in components
export default cliService;

// Export class for testing
export { CLIService };

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  window.cliService = cliService;
}
