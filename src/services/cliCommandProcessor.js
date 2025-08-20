/**
 * CLI Command Processor
 * Core service for processing financial commands in the persistent CLI
 */

import _secureApiClient from './secureApiClient';

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
        handler: this.handleDcf.bind(this)
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

  getCommandArgumentSuggestions(command, _args) {
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
  async handleHelp(args, _flags) {
    if (args.length > 0) {
      const commandName = this.resolveAlias(args[0]);
      const command = this.commands[commandName];
      if (command) {
        return {
          success: true,
          output: `${commandName}: ${command.description}\nUsage: ${command.usage}\nCategory: ${command.category}`,
          type: 'info'
        };
      } else {
        return {
          success: false,
          output: `Command '${commandName}' not found.`,
          type: 'error'
        };
      }
    }

    let output = '🔧 AVAILABLE COMMANDS\n';
    output += '═══════════════════════════════════════\n\n';

    const categories = {};
    Object.entries(this.commands).forEach(([name, cmd]) => {
      if (!categories[cmd.category]) categories[cmd.category] = [];
      categories[cmd.category].push({ name, ...cmd });
    });

    Object.entries(categories).forEach(([category, commands]) => {
      output += `${category.toUpperCase()}\n`;
      commands.forEach(cmd => {
        output += `  ${cmd.name.padEnd(15)} ${cmd.description}\n`;
      });
      output += '\n';
    });

    return { success: true, output, type: 'info' };
  }

  async handlePortfolio(args, _flags) {
    const action = args[0] || 'show';
    return {
      success: true,
      output: `Portfolio ${action} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleMarketData(args, _flags) {
    const symbol = args[0] || 'SPY';
    return {
      success: true,
      output: `Market data for ${symbol} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleQuote(args, _flags) {
    const symbol = args[0];
    if (!symbol) {
      return {
        success: false,
        output: 'Usage: quote <symbol>',
        type: 'error'
      };
    }
    return {
      success: true,
      output: `Quote for ${symbol} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleCalculate(args, _flags) {
    const calcType = args[0] || 'dcf';
    return {
      success: true,
      output: `Calculate ${calcType} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleDcf(_args, _flags) {
    return {
      success: true,
      output: 'DCF calculation command is not implemented yet.',
      type: 'info'
    };
  }

  async handleNavigate(args, _flags) {
    const page = args[0];
    if (!page) {
      return {
        success: false,
        output: 'Usage: navigate <page>',
        type: 'error'
      };
    }
    return {
      success: true,
      output: `Navigate to ${page} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleList(args, _flags) {
    const listType = args[0] || 'holdings';
    return {
      success: true,
      output: `List ${listType} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleSearch(args, _flags) {
    const query = args.join(' ');
    if (!query) {
      return {
        success: false,
        output: 'Usage: search <query>',
        type: 'error'
      };
    }
    return {
      success: true,
      output: `Search for "${query}" command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleAnalyze(args, _flags) {
    const target = args[0];
    if (!target) {
      return {
        success: false,
        output: 'Usage: analyze <symbol|portfolio>',
        type: 'error'
      };
    }
    return {
      success: true,
      output: `Analyze ${target} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleRisk(args, _flags) {
    const target = args[0] || 'portfolio';
    return {
      success: true,
      output: `Risk analysis for ${target} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleExport(args, _flags) {
    const dataType = args[0];
    if (!dataType) {
      return {
        success: false,
        output: 'Usage: export <data-type>',
        type: 'error'
      };
    }
    return {
      success: true,
      output: `Export ${dataType} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleImport(args, _flags) {
    const filePath = args[0];
    if (!filePath) {
      return {
        success: false,
        output: 'Usage: import <file-path>',
        type: 'error'
      };
    }
    return {
      success: true,
      output: `Import from ${filePath} command is not implemented yet.`,
      type: 'info'
    };
  }

  async handleStatus(_args, flags) {
    const detailed = flags?.detailed || flags?.d;

    let output = '🟢 SYSTEM STATUS\n';
    output += '═══════════════════════════════════════\n';
    output += 'Backend API:       🟡 Unknown\n';
    output += 'Cache:             🟡 Unknown\n';
    output += 'Watchlists:        ' + (this.context.watchlists ? '🟢 Available' : '🟡 Not available') + '\n';
    output += 'Portfolio Data:    ' + (this.context.portfolioData ? '🟢 Loaded' : '🟡 Not loaded') + '\n';
    output += 'AI Assistant:      🟢 Online\n';

    if (detailed) {
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

  async handleLbo(_args, _flags) {
    return {
      success: true,
      output: 'LBO analysis command is not implemented yet.',
      type: 'info'
    };
  }

  async handleWatch(_args, _flags) {
    const _detailed = _flags?.detailed || _flags?.d;

    let output = '🟢 SYSTEM STATUS\n';
    output += '═══════════════════════════════════════\n';
    output += 'Backend API:       🟡 Unknown\n';
    output += 'Cache:             🟡 Unknown\n';
    output += 'Watchlists:        ' + (this.context.watchlists ? '🟢 Available' : '🟡 Not available') + '\n';
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

  async handleClear(_args, _flags) {
    return {
      success: true,
      output: '',
      type: 'clear'
    };
  }

  async handleVersion(_args, _flags) {
    return {
      success: true,
      output: 'FinanceAnalyst Pro v1.0.0\nBuild: 2025.08.18\nNode.js CLI Interface\nSecure Backend API Integration',
      type: 'info'
    };
  }
}

export default CLICommandProcessor;
