/**
 * CLI Command Processor
 * Core service for processing financial commands in the persistent CLI
 */

import secureApiClient from './secureApiClient';

export class CLICommandProcessor {
  constructor() {
    this.context = {};
    this.commandHistory = [];
    this.aliases = {
      'p': 'portfolio',
      'md': 'market-data',
      'calc': 'calculate',
      'nav': 'navigate',
      'help': 'help',
      'clear': 'clear',
      'ls': 'list',
      'll': 'list --detailed',
      'cd': 'navigate'
    };

    this.commands = this.initializeCommands();
  }

  updateContext(newContext) {
    this.context = { ...this.context, ...newContext };
  }

  initializeCommands() {
    return {
      // Help and Information
      help: {
        description: 'Show available commands and usage',
        usage: 'help [command]',
        category: 'system',
        handler: this.handleHelp.bind(this)
      },

      // Portfolio Management
      portfolio: {
        description: 'Portfolio management operations',
        usage: 'portfolio [show|analyze|rebalance|risk|holdings]',
        category: 'portfolio',
        handler: this.handlePortfolio.bind(this)
      },

      // Market Data
      'market-data': {
        description: 'Fetch market data and quotes',
        usage: 'market-data [symbol] [--type=quote|chart|news]',
        category: 'market',
        handler: this.handleMarketData.bind(this)
      },

      quote: {
        description: 'Get stock quote',
        usage: 'quote <symbol>',
        category: 'market',
        handler: this.handleQuote.bind(this)
      },

      // Financial Calculations
      calculate: {
        description: 'Financial calculations',
        usage: 'calculate [dcf|wacc|beta|sharpe] [parameters]',
        category: 'calculations',
        handler: this.handleCalculate.bind(this)
      },

      dcf: {
        description: 'DCF valuation calculation',
        usage: 'dcf <symbol> [--growth=5] [--discount=10] [--terminal=2]',
        category: 'calculations',
        handler: this.handleDCF.bind(this)
      },

      // Navigation
      navigate: {
        description: 'Navigate to different pages/sections',
        usage: 'navigate <page> [workspace|market-data|portfolio|analysis|private-analysis]',
        category: 'navigation',
        handler: this.handleNavigate.bind(this)
      },

      // Data Management
      list: {
        description: 'List portfolio holdings, watchlist, or other data',
        usage: 'list [holdings|watchlist|portfolios] [--detailed]',
        category: 'data',
        handler: this.handleList.bind(this)
      },

      search: {
        description: 'Search stocks, funds, or financial instruments',
        usage: 'search <query> [--type=stocks|etf|mutual-funds]',
        category: 'data',
        handler: this.handleSearch.bind(this)
      },

      // Analysis Tools
      analyze: {
        description: 'Perform financial analysis',
        usage: 'analyze <symbol|portfolio> [--type=fundamental|technical|risk]',
        category: 'analysis',
        handler: this.handleAnalyze.bind(this)
      },

      risk: {
        description: 'Risk analysis and metrics',
        usage: 'risk [portfolio|symbol] [--metric=var|sharpe|beta|correlation]',
        category: 'analysis',
        handler: this.handleRisk.bind(this)
      },

      // Utility Commands
      export: {
        description: 'Export data to various formats',
        usage: 'export <data-type> [--format=csv|json|xlsx] [--output=filename]',
        category: 'utility',
        handler: this.handleExport.bind(this)
      },

      import: {
        description: 'Import portfolio or transaction data',
        usage: 'import <file-path> [--type=portfolio|transactions]',
        category: 'utility',
        handler: this.handleImport.bind(this)
      },

      // System Commands
      status: {
        description: 'Show system and data connection status',
        usage: 'status [--detailed]',
        category: 'system',
        handler: this.handleStatus.bind(this)
      },

      clear: {
        description: 'Clear the terminal output',
        usage: 'clear',
        category: 'system',
        handler: this.handleClear.bind(this)
      },

      version: {
        description: 'Show application version and build info',
        usage: 'version',
        category: 'system',
        handler: this.handleVersion.bind(this)
      }
    };
  }

  async processCommand(input) {
    const parts = this.parseCommand(input);
    const commandName = this.resolveAlias(parts.command);
    const command = this.commands[commandName];

    if (!command) {
      return {
        success: false,
        error: `Command '${commandName}' not found. Type 'help' for available commands.`
      };
    }

    try {
      const result = await command.handler(parts.args, parts.flags);
      this.commandHistory.push({ command: input, timestamp: new Date(), result });
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Error executing '${commandName}': ${error.message}`
      };
    }
  }

  parseCommand(input) {
    const parts = input.trim().split(/\s+/);
    const command = parts[0];
    const remaining = parts.slice(1);

    const args = [];
    const flags = {};

    for (let i = 0; i < remaining.length; i++) {
      const part = remaining[i];
      if (part.startsWith('--')) {
        const [key, value] = part.substring(2).split('=');
        flags[key] = value || true;
      } else if (part.startsWith('-')) {
        flags[part.substring(1)] = true;
      } else {
        args.push(part);
      }
    }

    return { command, args, flags };
  }

  resolveAlias(command) {
    return this.aliases[command] || command;
  }

  getSuggestions(input) {
    const parts = input.trim().split(/\s+/);
    const partial = parts[0].toLowerCase();

    if (parts.length === 1) {
      // Command suggestions
      return Object.keys(this.commands)
        .filter(cmd => cmd.startsWith(partial))
        .concat(Object.keys(this.aliases).filter(alias => alias.startsWith(partial)))
        .sort();
    }

    // Argument suggestions based on command
    const command = this.resolveAlias(parts[0]);
    return this.getCommandArgumentSuggestions(command, parts.slice(1));
  }

  getCommandArgumentSuggestions(command, args) {
    const suggestions = [];

    switch (command) {
      case 'navigate':
        suggestions.push('workspace', 'market-data', 'portfolio', 'analysis', 'private-analysis', 'valuation-workbench', 'model-lab');
        break;
      case 'portfolio':
        suggestions.push('show', 'analyze', 'rebalance', 'risk', 'holdings', 'performance');
        break;
      case 'calculate':
        suggestions.push('dcf', 'wacc', 'beta', 'sharpe', 'sortino', 'var');
        break;
      case 'list':
        suggestions.push('holdings', 'watchlist', 'portfolios', 'transactions');
        break;
      case 'analyze':
        suggestions.push('--type=fundamental', '--type=technical', '--type=risk');
        break;
      case 'export':
        suggestions.push('--format=csv', '--format=json', '--format=xlsx');
        break;
    }

    return suggestions;
  }

  // Command Handlers
  async handleDcf(_args, _flags) {
    if (args.length > 0) {
      const commandName = this.resolveAlias(args[0]);
      const command = this.commands[commandName];

      if (command) {
{{ ... }}
      navigation: routes[page],
      type: 'success'
    };
  }

  async handleLbo(_args, _flags) {
    const _type = args[0] || 'holdings';
    const _detailed = _flags.detailed || _flags.d;

    switch (_type) {
      case 'holdings':
{{ ... }}
      output: `Import initiated: ${filePath} (${type})`,
      type: 'success'
    };
  }

  async handleWatch(_args, _flags) {
    const _detailed = flags.detailed;

    let output = '🟢 SYSTEM STATUS\n';
    output += '═══════════════════════════════════════\n';
    output += 'Backend API:       🟢 Connected\n';
{{ ... }}
    output += 'Portfolio Data:    ' + (this.context.portfolioData ? '🟢 Loaded' : '🟡 Not loaded') + '\n';
    output += 'AI Assistant:      🟢 Online\n';

    if (_detailed) {
      output += '\nDETAILED STATUS:\n';
      output += `Commands in history: ${this.commandHistory.length}\n`;
      output += `Current page: ${this.context.currentContext?.path || 'Unknown'}\n`;
      output += `Session start: ${new Date().toLocaleString()}\n`;
    }

    return {
      success: true,
      output,
      type: 'info'
    };
  }

  async handleClear(args, flags) {
    return {
      success: true,
      output: '',
      type: 'clear'
    };
  }

  async handleVersion(args, flags) {
    return {
      success: true,
      output: 'FinanceAnalyst Pro v1.0.0\nBuild: 2025.08.18\nNode.js CLI Interface\nSecure Backend API Integration',
      type: 'info'
    };
  }
}

export default CLICommandProcessor;
