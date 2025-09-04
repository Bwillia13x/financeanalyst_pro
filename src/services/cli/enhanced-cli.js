/**
 * Enhanced CLI System for FinanceAnalyst Pro
 * Unified command architecture with plugin system, advanced features, and enterprise-grade capabilities
 */

import { ProductionMonitor } from '../monitoring/production-monitor.js';

import { AdvancedAutoCompletion } from './auto-completion.js';
import { CommandPipeline } from './command-pipeline.js';
import { CommandRegistry } from './command-registry.js';
import { ContextManager } from './context-manager.js';
import { CommandExecutionEngine } from './execution-engine.js';
import { IntelligentHelpSystem } from './help-system.js';
import { InteractiveCommandSystem } from './interactive-commands.js';
import { PluginManager } from './plugin-manager.js';
import { SecurityManager } from './security-manager.js';


/**
 * Main Enhanced CLI Controller
 * Provides unified interface for all CLI operations
 */
export class EnhancedCLI {
  constructor(options = {}) {
    this.options = {
      enablePlugins: true,
      enableSecurity: true,
      enableCaching: true,
      enableRealTime: false,
      maxHistorySize: 10000,
      ...options
    };

    // Core components
    this.registry = new CommandRegistry(this);
    this.executionEngine = new CommandExecutionEngine(this);
    this.pluginManager = new PluginManager(this);
    this.securityManager = new SecurityManager(this);
    this.contextManager = new ContextManager(this);
    this.helpSystem = new IntelligentHelpSystem(this);
    this.autoCompletion = new AdvancedAutoCompletion(this);
    this.interactiveSystem = new InteractiveCommandSystem(this);
    this.pipelineSystem = new CommandPipeline(this);

    // Production monitoring
    this.monitor = new ProductionMonitor({
      enableMetrics: true,
      enableLogging: true,
      enableAlerts: true,
      enableHealthChecks: true
    });

    // State management
    this.isInitialized = false;
    this.commandHistory = [];
    this.activeSessions = new Map();
    this.eventListeners = new Map();

    // Performance monitoring
    this.performanceMetrics = {
      commandsExecuted: 0,
      averageExecutionTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    };

    console.log('🚀 Enhanced CLI System initializing...');
  }

  /**
   * Initialize the CLI system
   */
  async initialize() {
    try {
      // Initialize core components
      await this.registry.initialize();
      await this.pluginManager.initialize();
      await this.securityManager.initialize();
      await this.contextManager.initialize();
      await this.helpSystem.initialize();
      await this.autoCompletion.initialize();
      await this.interactiveSystem.initialize();
      await this.pipelineSystem.initialize();

      // Load built-in commands
      await this.loadBuiltInCommands();

      // Load plugins if enabled
      if (this.options.enablePlugins) {
        await this.pluginManager.loadCorePlugins();
      }

      // Restore state if available
      await this.restoreState();

      // Start production monitoring
      await this.monitor.start();

      this.isInitialized = true;
      console.log('✅ Enhanced CLI System initialized successfully');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced CLI:', error);
      throw error;
    }
  }

  /**
   * Execute a command with full context and validation
   */
  async executeCommand(input, context = {}) {
    if (!this.isInitialized) {
      throw new Error('CLI system not initialized');
    }

    const startTime = performance.now();

    // Record user activity
    this.monitor.updateUserActivity(context.userId);

    try {
      // Check for pipeline syntax
      if (input.includes('|') || input.includes('&&') || input.includes('||')) {
        return await this.pipelineSystem.parseAndExecutePipeline(input, context);
      }

      // Parse and validate input
      const parsedCommand = this.parseCommand(input);
      if (!parsedCommand) {
        return this.createErrorResponse('Invalid command format');
      }

      // Security validation
      const securityCheck = await this.securityManager.validateCommand(parsedCommand, context);
      if (!securityCheck.valid) {
        // Record security event
        this.monitor.recordSecurityEvent('blocked_request', {
          reason: securityCheck.error,
          userId: context.userId,
          command: parsedCommand.name
        });

        return this.createErrorResponse(securityCheck.error, {
          warnings: securityCheck.warnings,
          securityContext: securityCheck.securityContext
        });
      }

      // Check rate limits
      const rateLimitCheck = await this.securityManager.checkRateLimit(
        context.userId,
        parsedCommand.name,
        context
      );

      if (!rateLimitCheck.allowed) {
        // Record rate limit event
        this.monitor.recordSecurityEvent('rate_limit_exceeded', {
          userId: context.userId,
          command: parsedCommand.name,
          violations: rateLimitCheck.violations
        });

        return this.createErrorResponse(rateLimitCheck.reason, {
          type: rateLimitCheck.type,
          blockDuration: rateLimitCheck.blockDuration,
          violations: rateLimitCheck.violations
        });
      }

      // Record successful rate limit check
      await this.securityManager.recordRateLimitRequest(
        context.userId,
        context.userRole || 'viewer',
        parsedCommand.name,
        Date.now()
      );

      // Resolve command
      const command = this.registry.getCommand(parsedCommand.name);
      if (!command) {
        const suggestions = this.registry.getSuggestions(parsedCommand.name);
        return this.createErrorResponse(`Command '${parsedCommand.name}' not found`, {
          suggestions
        });
      }

      // Check permissions
      const permissionCheck = await this.securityManager.checkPermissions(
        command,
        parsedCommand.args,
        context
      );

      if (!permissionCheck.allowed) {
        // Record permission denial
        this.monitor.recordSecurityEvent('permission_denied', {
          userId: context.userId,
          command: command.name,
          required: permissionCheck.required,
          userRole: permissionCheck.userRole
        });

        return this.createErrorResponse(permissionCheck.reason, {
          type: permissionCheck.type,
          required: permissionCheck.required,
          userRole: permissionCheck.userRole
        });
      }

      // Execute command in sandbox
      const result = await this.securityManager.executeInSandbox(command, parsedCommand.args, {
        ...context,
        parsedCommand,
        securityContext: securityCheck.securityContext
      });

      // Record execution metrics
      const executionTime = performance.now() - startTime;
      // Consider undefined success as success for commands that don't explicitly return success
      const successStatus = result.success !== false; // Only false means failure
      this.recordExecutionMetrics(command.name, executionTime, successStatus);

      // Record command execution in monitor
      this.monitor.recordCommand(command, successStatus, executionTime, context);

      // Add to history
      this.addToHistory(input, result, executionTime);

      return this.createSuccessResponse(result);
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordExecutionMetrics('error', executionTime, false);

      // Record error in monitor
      this.monitor.recordError(error, {
        command: input,
        userId: context.userId,
        sessionId: context.sessionId,
        executionTime
      });

      console.error('CLI Command execution error:', error);
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Parse command input with advanced features
   */
  parseCommand(input) {
    if (!input || typeof input !== 'string') {
      return null;
    }

    const trimmed = input.trim();
    if (!trimmed) return null;

    // Handle advanced features
    if (trimmed.includes('|')) {
      return this.parsePipelineCommand(trimmed);
    }

    if (trimmed.includes('&&') || trimmed.includes('||')) {
      return this.parseCompoundCommand(trimmed);
    }

    if (trimmed.startsWith('!')) {
      return this.parseHistoryCommand(trimmed);
    }

    // Standard command parsing
    const parts = trimmed.split(/\s+/);
    const commandName = parts[0];

    return {
      name: commandName,
      args: this.parseArguments(parts.slice(1)),
      original: trimmed,
      timestamp: Date.now()
    };
  }

  /**
   * Parse command arguments with advanced options
   */
  parseArguments(args) {
    const parsed = {
      positional: [],
      options: {},
      flags: {},
      arrays: {},
      ranges: {}
    };

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      if (arg.startsWith('--')) {
        // Long option
        const [key, value] = arg.slice(2).split('=');

        if (value !== undefined) {
          // --key=value format
          parsed.options[key] = this.parseValue(value);
        } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          // --key value format
          parsed.options[key] = this.parseValue(args[i + 1]);
          i++;
        } else {
          // --key format (boolean flag)
          parsed.flags[key] = true;
        }
      } else if (arg.startsWith('-')) {
        // Short option or flag
        const key = arg.slice(1);

        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          parsed.options[key] = this.parseValue(args[i + 1]);
          i++;
        } else {
          parsed.flags[key] = true;
        }
      } else if (arg.includes('..')) {
        // Range syntax (e.g., 1..10)
        const [start, end] = arg.split('..').map(n => parseInt(n));
        if (!isNaN(start) && !isNaN(end)) {
          parsed.ranges[i] = { start, end };
        }
        parsed.positional.push(arg);
      } else if (arg.includes(',')) {
        // Array syntax (e.g., AAPL,MSFT,GOOGL)
        parsed.arrays[i] = arg.split(',');
        parsed.positional.push(arg);
      } else {
        // Regular positional argument
        parsed.positional.push(arg);
      }

      i++;
    }

    return parsed;
  }

  /**
   * Parse pipeline commands (cmd1 | cmd2)
   */
  parsePipelineCommand(input) {
    const parts = input.split('|').map(cmd => cmd.trim());
    const commands = parts.map(cmd => this.parseCommand(cmd)).filter(Boolean);

    if (commands.length < 2) {
      return this.parseCommand(parts[0]);
    }

    return {
      name: 'pipeline',
      args: {
        commands,
        pipeType: 'standard'
      },
      original: input,
      timestamp: Date.now()
    };
  }

  /**
   * Parse compound commands (cmd1 && cmd2 || cmd3)
   */
  parseCompoundCommand(input) {
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        current += char;
      } else if (!inQuotes && (input.substr(i, 2) === '&&' || input.substr(i, 2) === '||')) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        parts.push(input.substr(i, 2));
        current = '';
        i++; // Skip next character
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    // Parse individual commands and operators
    const commands = [];
    const operators = [];

    parts.forEach(part => {
      if (part === '&&' || part === '||') {
        operators.push(part);
      } else {
        const parsed = this.parseCommand(part);
        if (parsed) {
          commands.push(parsed);
        }
      }
    });

    return {
      name: 'compound',
      args: {
        commands,
        operators
      },
      original: input,
      timestamp: Date.now()
    };
  }

  /**
   * Parse history command (!n or !!)
   */
  parseHistoryCommand(input) {
    const match = input.match(/^!(\d+|\!)$/);
    if (!match) return null;

    const historyRef = match[1];

    return {
      name: 'history',
      args: {
        reference: historyRef,
        original: input
      },
      original: input,
      timestamp: Date.now()
    };
  }

  /**
   * Parse value with type detection
   */
  parseValue(value) {
    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return numValue;
    }

    // JSON
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        return JSON.parse(value);
      } catch (e) {
        // Not valid JSON, treat as string
      }
    }

    // String
    return value;
  }

  /**
   * Load built-in commands
   */
  async loadBuiltInCommands() {
    const builtInCommands = [
      // System commands
      {
        name: 'help',
        description: 'Show help for commands',
        category: 'system',
        permissions: ['system:read'], // Available to all authenticated users
        handler: async function (args, context) {
          return await this.helpSystem.getHelp(args, context);
        }.bind(this)
      },

      {
        name: 'clear',
        description: 'Clear the terminal output',
        category: 'system',
        permissions: ['system:read'], // Available to all authenticated users
        handler: async () => {
          return { action: 'clear_output' };
        }
      },

      {
        name: 'history',
        description: 'Show command history',
        category: 'system',
        permissions: ['system:read'], // Available to all authenticated users
        handler: async args => {
          const count = args.positional[0] ? parseInt(args.positional[0]) : 20;
          return this.getHistory(count);
        }
      },

      // Financial commands
      {
        name: 'dcf',
        description: 'Discounted Cash Flow analysis',
        category: 'financial',
        permissions: ['financial:read', 'financial:analyze'], // Requires analyst level
        handler: async function (args, context) {
          return await this.executeDCF(args, context);
        }.bind(this)
      },

      {
        name: 'comps',
        description: 'Comparable company analysis',
        category: 'financial',
        permissions: ['financial:read', 'financial:analyze'], // Requires analyst level
        handler: async function (args, context) {
          return await this.executeComps(args, context);
        }.bind(this)
      },

      {
        name: 'lbo',
        description: 'Leveraged Buyout analysis',
        category: 'financial',
        permissions: ['financial:analyze'], // Requires analyst level
        handler: async function (args, context) {
          return await this.executeLBO(args, context);
        }.bind(this)
      },

      {
        name: 'quote',
        description: 'Get stock quotes',
        category: 'market',
        permissions: ['market:read'], // Requires analyst level
        handler: async function (args, context) {
          return await this.executeQuote(args, context);
        }.bind(this)
      },

      {
        name: 'chart',
        description: 'Generate stock price charts',
        category: 'market',
        permissions: ['market:read'], // Available to viewers
        handler: async function (args, context) {
          return await this.executeChart(args, context);
        }.bind(this)
      },

      {
        name: 'news',
        description: 'Get market news and updates',
        category: 'market',
        permissions: ['market:read'], // Available to viewers
        handler: async function (args, context) {
          return await this.executeNews(args, context);
        }.bind(this)
      },

      {
        name: 'portfolio',
        description: 'Portfolio management commands',
        category: 'portfolio',
        permissions: ['portfolio:read', 'portfolio:write'], // Requires analyst level
        usage: 'portfolio <action> [options]',
        examples: [
          'portfolio create "My Portfolio"',
          'portfolio list',
          'portfolio add AAPL 100',
          'portfolio analyze',
          'portfolio export csv'
        ],
        handler: async function (args, context) {
          return await this.executePortfolio(args, context);
        }.bind(this)
      },

      {
        name: 'analyze',
        description: 'Analyze portfolio performance',
        category: 'portfolio',
        permissions: ['portfolio:read', 'portfolio:analyze'], // Requires analyst level
        handler: async function (args, context) {
          return await this.executePortfolioAnalysis(args, context);
        }.bind(this)
      },

      {
        name: 'report',
        description: 'Generate financial reports',
        category: 'reporting',
        permissions: ['reporting:read', 'reporting:write'], // Requires analyst level
        handler: async function (args, context) {
          return await this.executeReport(args, context);
        }.bind(this)
      },

      {
        name: 'export',
        description: 'Export data in various formats',
        category: 'reporting',
        permissions: ['data:export', 'reporting:write'], // Requires analyst level
        handler: async function (args, context) {
          return await this.executeExport(args, context);
        }.bind(this)
      },

      {
        name: 'visualize',
        description: 'Create data visualizations',
        category: 'reporting',
        permissions: ['reporting:read'], // Available to analysts
        handler: async function (args, context) {
          return await this.executeVisualize(args, context);
        }.bind(this)
      },

      {
        name: 'interactive',
        description: 'Start interactive command workflows',
        category: 'utility',
        permissions: ['system:read'], // Available to all authenticated users
        usage: 'interactive <template> [options]',
        examples: [
          'interactive dcf-analysis',
          'interactive portfolio-creation',
          'interactive analysis-workflow'
        ],
        handler: async function (args, context) {
          return await this.handleInteractive(args, context);
        }.bind(this)
      },

      {
        name: 'complete',
        description: 'Get intelligent command completions',
        category: 'utility',
        permissions: ['system:read'], // Available to all authenticated users
        usage: 'complete <partial-command>',
        examples: ['complete quot', 'complete analy', 'complete port'],
        handler: async function (args, context) {
          return await this.handleComplete(args, context);
        }.bind(this)
      },

      {
        name: 'pipeline',
        description: 'Create and manage command pipelines',
        category: 'utility',
        permissions: ['automation:read', 'automation:write'], // Requires analyst level
        usage: 'pipeline <action> [options]',
        examples: [
          'pipeline create my_analysis "Stock analysis pipeline"',
          'pipeline list',
          'pipeline run <pipeline-id>',
          'pipeline delete <pipeline-id>'
        ],
        handler: async function (args, context) {
          return await this.handlePipeline(args, context);
        }.bind(this)
      },

      {
        name: 'batch',
        description: 'Execute batch operations',
        category: 'utility',
        permissions: ['automation:read', 'automation:write'], // Requires analyst level
        usage: 'batch <operations...>',
        examples: [
          'batch "quote AAPL" "quote MSFT" "quote GOOGL"',
          'batch --parallel "analyze AAPL" "analyze MSFT"'
        ],
        handler: async function (args, context) {
          return await this.handleBatch(args, context);
        }.bind(this)
      },

      {
        name: 'jobs',
        description: 'Manage background jobs',
        category: 'utility',
        permissions: ['automation:read'], // Requires analyst level
        usage: 'jobs [list|status|cancel] [job-id]',
        examples: ['jobs list', 'jobs status <job-id>', 'jobs cancel <job-id>'],
        handler: async function (args, context) {
          return await this.handleJobs(args, context);
        }.bind(this)
      },

      {
        name: 'tutorial',
        description: 'Interactive learning tutorials',
        category: 'learning',
        permissions: ['system:read'], // Available to all authenticated users
        usage: 'tutorial <start|list|progress> [tutorial-id]',
        examples: ['tutorial list', 'tutorial start getting-started', 'tutorial progress'],
        handler: async function (args, context) {
          return await this.handleTutorial(args, context);
        }.bind(this)
      },

      {
        name: 'tips',
        description: 'Get contextual tips and suggestions',
        category: 'learning',
        permissions: ['system:read'], // Available to all authenticated users
        usage: 'tips [topic]',
        examples: ['tips', 'tips dcf', 'tips portfolio'],
        handler: async function (args, context) {
          return await this.handleTips(args, context);
        }.bind(this)
      },

      {
        name: 'learn',
        description: 'Personalized learning dashboard',
        category: 'learning',
        permissions: ['system:read'], // Available to all authenticated users
        usage: 'learn [dashboard|suggestions]',
        examples: ['learn dashboard', 'learn suggestions'],
        handler: async function (args, context) {
          return await this.handleLearn(args, context);
        }.bind(this)
      }
    ];

    // Register all built-in commands
    for (const cmd of builtInCommands) {
      await this.registry.register(cmd.name, cmd.handler, cmd);
    }
  }

  /**
   * Execute DCF analysis
   */
  async executeDCF(args, context) {
    const symbol = args.positional[0];
    if (!symbol) {
      return { error: 'Symbol required. Usage: dcf <symbol> [options]' };
    }

    try {
      // Get DCF calculator from plugin manager
      const dcfCalculator = this.pluginManager.getCalculator('dcf');
      if (!dcfCalculator) {
        return { error: 'DCF calculator not available' };
      }

      // Prepare inputs
      const inputs = {
        symbol,
        currentRevenue: args.options.revenue || 1000000000,
        projectionYears: args.options.years || 5,
        terminalGrowthRate: (args.options.terminal || 2.5) / 100,
        discountRate: (args.options.discount || 12) / 100,
        yearlyData: {}
      };

      // Execute DCF
      const result = await dcfCalculator.compute(inputs);

      return {
        symbol,
        enterpriseValue: result.ev,
        equityValue: result.equity,
        sharePrice: result.perShare,
        assumptions: inputs
      };
    } catch (error) {
      return { error: `DCF calculation failed: ${error.message}` };
    }
  }

  /**
   * Execute comparable analysis
   */
  async executeComps(args, context) {
    const symbol = args.positional[0];
    if (!symbol) {
      return { error: 'Symbol required. Usage: comps <symbol> [options]' };
    }

    try {
      const compsCalculator = this.pluginManager.getCalculator('comps');
      if (!compsCalculator) {
        return { error: 'Comps calculator not available' };
      }

      const inputs = {
        symbol,
        metric: args.options.metric || 100000000,
        multiple: args.options.multiple || 12,
        netDebt: args.options.debt || 200000000,
        shares: args.options.shares || 50000000
      };

      const result = await compsCalculator.compute(inputs);

      return {
        symbol,
        enterpriseValue: result.ev,
        sharePrice: result.perShare,
        valuationMultiple: inputs.multiple
      };
    } catch (error) {
      return { error: `Comps calculation failed: ${error.message}` };
    }
  }

  /**
   * Execute LBO analysis
   */
  async executeLBO(args, context) {
    const symbol = args.positional[0];
    if (!symbol) {
      return { error: 'Symbol required. Usage: lbo <symbol> [options]' };
    }

    try {
      // Get LBO calculator from plugin manager
      const lboCalculator = this.pluginManager.getCalculator('lbo');
      if (!lboCalculator) {
        return { error: 'LBO calculator not available' };
      }

      // Prepare LBO inputs
      const inputs = {
        symbol,
        equityInvestment: args.options.equity || 500000000,
        debtFinancing: args.options.debt || 1500000000,
        interestRate: (args.options.interest || 6) / 100,
        taxRate: (args.options.tax || 25) / 100,
        exitMultiple: args.options.exit || 8.0,
        holdingPeriod: args.options.period || 5
      };

      // Execute LBO analysis
      const result = await lboCalculator(inputs, context);

      return {
        symbol,
        equityInvestment: inputs.equityInvestment,
        debtFinancing: inputs.debtFinancing,
        totalCapital: inputs.equityInvestment + inputs.debtFinancing,
        irr: result.irr,
        npv: result.npv,
        exitMultiple: inputs.exitMultiple,
        holdingPeriod: inputs.holdingPeriod
      };
    } catch (error) {
      return { error: `LBO analysis failed: ${error.message}` };
    }
  }

  /**
   * Execute quote command
   */
  async executeQuote(args, context) {
    const symbol = args.positional[0];
    if (!symbol) {
      return { error: 'Symbol required. Usage: quote <symbol>' };
    }

    try {
      // Mock quote data - in real implementation, this would call market data service
      const quote = {
        symbol: symbol.toUpperCase(),
        price: 150.25 + (Math.random() - 0.5) * 10,
        change: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        marketCap: Math.floor(Math.random() * 2000000000000) + 100000000000
      };

      quote.changePercent = (quote.change / (quote.price - quote.change)) * 100;

      return {
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        marketCap: quote.marketCap
      };
    } catch (error) {
      return { error: `Quote retrieval failed: ${error.message}` };
    }
  }

  /**
   * Execute chart command
   */
  async executeChart(args, context) {
    const symbol = args.positional[0];
    if (!symbol) {
      return { error: 'Symbol required. Usage: chart <symbol> [options]' };
    }

    try {
      // Get chart data from market-data plugin
      const chartData = await this.pluginManager.executePluginMethod(
        'market-data',
        'chart',
        {
          symbol: symbol.toUpperCase(),
          period: args.options.period || '1M',
          interval: args.options.interval || '1D'
        },
        context
      );

      return {
        symbol: symbol.toUpperCase(),
        period: args.options.period || '1M',
        data: chartData,
        generated: new Date().toISOString()
      };
    } catch (error) {
      return { error: `Chart generation failed: ${error.message}` };
    }
  }

  /**
   * Execute news command
   */
  async executeNews(args, context) {
    const symbol = args.positional[0] || 'general';

    try {
      // Get news from market-data plugin
      const newsData = await this.pluginManager.executePluginMethod(
        'market-data',
        'news',
        {
          symbol: symbol.toUpperCase(),
          limit: args.options.limit || 5
        },
        context
      );

      return {
        symbol: symbol.toUpperCase(),
        articles: newsData,
        retrieved: new Date().toISOString()
      };
    } catch (error) {
      return { error: `News retrieval failed: ${error.message}` };
    }
  }

  /**
   * Execute portfolio command
   */
  async executePortfolio(args, context) {
    const action = args.positional[0];
    if (!action) {
      return { error: 'Action required. Usage: portfolio <action> [options]' };
    }

    try {
      const portfolioArgs = {
        action,
        name: args.positional[1] || args.options.name,
        symbol: args.positional[1],
        shares: parseInt(args.positional[2]) || parseInt(args.options.shares),
        format: args.options.format
      };

      // Execute portfolio operation via plugin
      const result = await this.pluginManager.executePluginMethod(
        'portfolio',
        'portfolio',
        portfolioArgs,
        context
      );

      return {
        action,
        result,
        executed: new Date().toISOString()
      };
    } catch (error) {
      return { error: `Portfolio operation failed: ${error.message}` };
    }
  }

  /**
   * Execute portfolio analysis
   */
  async executePortfolioAnalysis(args, context) {
    try {
      // Get portfolio ID from args or use default
      const portfolioId = args.positional[0] || 'default';

      // Execute portfolio analysis via plugin
      const result = await this.pluginManager.executePluginMethod(
        'portfolio',
        'analyze',
        {
          portfolioId,
          metrics: args.options.metrics || ['return', 'risk', 'sharpe']
        },
        context
      );

      return {
        portfolioId,
        analysis: result,
        generated: new Date().toISOString()
      };
    } catch (error) {
      return { error: `Portfolio analysis failed: ${error.message}` };
    }
  }

  /**
   * Execute report command
   */
  async executeReport(args, context) {
    const type = args.positional[0] || 'monthly';

    try {
      const reportArgs = {
        type,
        format: args.options.format || 'pdf',
        title: args.options.title,
        dateRange: args.options.range || 'last-month'
      };

      // Generate report via reporting plugin
      const result = await this.pluginManager.executePluginMethod(
        'reporting',
        'report',
        reportArgs,
        context
      );

      return {
        type,
        report: result,
        generated: new Date().toISOString()
      };
    } catch (error) {
      return { error: `Report generation failed: ${error.message}` };
    }
  }

  /**
   * Execute export command
   */
  async executeExport(args, context) {
    const format = args.positional[0] || 'excel';
    const dataType = args.positional[1] || 'portfolio';

    try {
      const exportArgs = {
        data: args.options.data || [],
        format,
        filename: args.options.filename,
        dataType
      };

      // Export data via reporting plugin
      const result = await this.pluginManager.executePluginMethod(
        'reporting',
        'export',
        exportArgs,
        context
      );

      return {
        format,
        dataType,
        export: result,
        exported: new Date().toISOString()
      };
    } catch (error) {
      return { error: `Data export failed: ${error.message}` };
    }
  }

  /**
   * Execute visualize command
   */
  async executeVisualize(args, context) {
    const dataType = args.positional[0] || 'portfolio';
    const chartType = args.options.type || 'pie';

    try {
      const visualizeArgs = {
        data: args.options.data || [10, 20, 30, 40, 50],
        type: chartType,
        title: args.options.title,
        dataType
      };

      // Create visualization via reporting plugin
      const result = await this.pluginManager.executePluginMethod(
        'reporting',
        'visualize',
        visualizeArgs,
        context
      );

      return {
        dataType,
        chartType,
        visualization: result,
        created: new Date().toISOString()
      };
    } catch (error) {
      return { error: `Visualization creation failed: ${error.message}` };
    }
  }

  /**
   * Get command history
   */
  getHistory(count = 20) {
    const recent = this.commandHistory.slice(-count);
    return recent.map((entry, index) => ({
      index: this.commandHistory.length - count + index + 1,
      command: entry.command,
      timestamp: entry.timestamp,
      success: entry.success,
      executionTime: entry.executionTime
    }));
  }

  /**
   * Add command to history
   */
  addToHistory(command, result, executionTime) {
    this.commandHistory.push({
      command,
      timestamp: new Date().toISOString(),
      success: result.success,
      executionTime,
      result: result.data || result.error
    });

    // Maintain history size limit
    if (this.commandHistory.length > this.options.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(-this.options.maxHistorySize);
    }
  }

  /**
   * Record execution metrics
   */
  recordExecutionMetrics(commandName, executionTime, success) {
    this.performanceMetrics.commandsExecuted++;

    // Update average execution time
    const totalTime =
      this.performanceMetrics.averageExecutionTime *
        (this.performanceMetrics.commandsExecuted - 1) +
      executionTime;
    this.performanceMetrics.averageExecutionTime =
      totalTime / this.performanceMetrics.commandsExecuted;

    // Update error rate
    if (!success) {
      this.performanceMetrics.errorRate =
        (this.performanceMetrics.errorRate * (this.performanceMetrics.commandsExecuted - 1) + 1) /
        this.performanceMetrics.commandsExecuted;
    }
  }

  /**
   * Create success response
   */
  createSuccessResponse(data) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      commandId: crypto.randomUUID()
    };
  }

  /**
   * Create error response
   */
  createErrorResponse(error, metadata = {}) {
    return {
      success: false,
      error,
      metadata,
      timestamp: new Date().toISOString(),
      commandId: crypto.randomUUID()
    };
  }

  /**
   * Get intelligent suggestions
   */
  getSuggestions(input, context = {}) {
    return this.registry.getSuggestions(input, context);
  }

  /**
   * Get intelligent completions
   */
  async getCompletions(input, cursorPosition, context = {}) {
    return await this.autoCompletion.getCompletions(input, cursorPosition, context);
  }

  /**
   * Start interactive command session
   */
  async startInteractive(templateName, context = {}) {
    return await this.interactiveSystem.startInteractive(templateName, context);
  }

  /**
   * Process interactive response
   */
  async processInteractiveResponse(sessionId, response, context = {}) {
    return await this.interactiveSystem.processResponse(sessionId, response, context);
  }

  /**
   * Get interactive session status
   */
  getInteractiveSessionStatus(sessionId) {
    return this.interactiveSystem.getSessionStatus(sessionId);
  }

  /**
   * Get available interactive templates
   */
  getInteractiveTemplates() {
    return this.interactiveSystem.getAvailableTemplates();
  }

  /**
   * Cancel interactive session
   */
  cancelInteractiveSession(sessionId) {
    return this.interactiveSystem.cancelInteractive(sessionId);
  }

  /**
   * Create a command pipeline
   */
  createPipeline(name, description = '') {
    return this.pipelineSystem.createPipeline(name, description);
  }

  /**
   * Add step to pipeline
   */
  addPipelineStep(pipelineId, step) {
    return this.pipelineSystem.addStep(pipelineId, step);
  }

  /**
   * Execute a pipeline
   */
  async executePipeline(pipelineId, context = {}, options = {}) {
    return await this.pipelineSystem.executePipeline(pipelineId, context, options);
  }

  /**
   * Create and execute batch operation
   */
  async createBatchOperation(operations, options = {}) {
    const batchId = await this.pipelineSystem.createBatchOperation(operations, options);
    return await this.pipelineSystem.executeBatchOperation(batchId, options.context || {});
  }

  /**
   * Get pipeline statistics
   */
  getPipelineStats() {
    return this.pipelineSystem.getPipelineStats();
  }

  /**
   * Get active jobs
   */
  getActiveJobs() {
    return this.pipelineSystem.listActiveJobs();
  }

  /**
   * Start interactive tutorial
   */
  async startTutorial(tutorialId, context) {
    return await this.helpSystem.startTutorial(tutorialId, context);
  }

  /**
   * Process tutorial step
   */
  async processTutorialStep(userId, input, context) {
    return await this.helpSystem.processTutorialStep(userId, input, context);
  }

  /**
   * Get contextual help
   */
  async getContextualHelp(context, input = '') {
    return await this.helpSystem.getContextualHelp(context, input);
  }

  /**
   * Get help dashboard
   */
  getHelpDashboard(userId) {
    return this.helpSystem.getHelpDashboard(userId);
  }

  /**
   * Get available tutorials
   */
  getAvailableTutorials() {
    return Array.from(this.helpSystem.interactiveTutorials.entries()).map(([id, tutorial]) => ({
      id,
      title: tutorial.title,
      description: tutorial.description,
      estimatedTime: tutorial.estimatedTime,
      difficulty: tutorial.difficulty,
      steps: tutorial.steps.length
    }));
  }

  /**
   * Get CLI performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      historySize: this.commandHistory.length,
      activeSessions: this.activeSessions.size,
      loadedPlugins: this.pluginManager.getLoadedPlugins().length,
      registeredCommands: this.registry.getCommandCount(),
      activeInteractions: this.interactiveSystem.getInteractionStats().activeSessions,
      completionStats: this.autoCompletion.getCompletionStats(),
      pipelineStats: this.pipelineSystem.getPipelineStats(),
      helpStats: {
        totalTutorials: this.helpSystem.interactiveTutorials.size,
        totalHelpTopics: this.helpSystem.helpContent.size,
        activeUsers: this.helpSystem.userLearningProgress.size
      }
    };
  }

  /**
   * Restore CLI state
   */
  async restoreState() {
    try {
      // Restore from localStorage or other persistence
      const savedState = localStorage.getItem('enhanced-cli-state');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.commandHistory = state.history || [];
        // Restore other state as needed
      }
    } catch (error) {
      console.warn('Failed to restore CLI state:', error.message);
    }
  }

  /**
   * Save CLI state
   */
  async saveState() {
    try {
      const state = {
        history: this.commandHistory.slice(-1000), // Save last 1000 commands
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('enhanced-cli-state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save CLI state:', error.message);
    }
  }

  /**
   * Handle interactive command
   */
  async handleInteractive(args, context) {
    const template = args.positional[0];
    if (!template) {
      const templates = this.getInteractiveTemplates();
      let output = 'Available Interactive Templates:\n';
      output += '═══════════════════════════════════════\n\n';

      templates.forEach(tmpl => {
        output += `• ${tmpl.id}: ${tmpl.name}\n`;
        output += `  ${tmpl.description}\n`;
        output += `  Steps: ${tmpl.steps}\n\n`;
      });

      output += 'Usage: interactive <template-name>\n';
      output += 'Example: interactive dcf-analysis';

      return output;
    }

    try {
      const result = await this.startInteractive(template, context);

      if (result.success) {
        return `Started interactive session: ${result.template}\n\n${result.firstStep.prompt}`;
      } else {
        return `Failed to start interactive session: ${result.error}`;
      }
    } catch (error) {
      return `Interactive command failed: ${error.message}`;
    }
  }

  /**
   * Handle complete command
   */
  async handleComplete(args, context) {
    const partial = args.positional[0];
    if (!partial) {
      return 'Usage: complete <partial-command>\nExample: complete quot';
    }

    try {
      const completions = await this.getCompletions(partial, partial.length, context);

      if (completions.completions.length === 0) {
        return `No completions found for "${partial}"`;
      }

      let output = `Completions for "${partial}":\n`;
      output += '═══════════════════════════════════════\n\n';

      completions.completions.slice(0, 10).forEach((completion, index) => {
        output += `${index + 1}. ${completion.displayText}\n`;
        if (completion.description) {
          output += `   ${completion.description}\n`;
        }
      });

      if (completions.completions.length > 10) {
        output += `\n... and ${completions.completions.length - 10} more`;
      }

      return output;
    } catch (error) {
      return `Completion failed: ${error.message}`;
    }
  }

  /**
   * Handle pipeline command
   */
  async handlePipeline(args, context) {
    const action = args.positional[0];

    switch (action) {
      case 'create': {
        const name = args.positional[1];
        const description = args.positional[2] || '';
        if (!name) {
          return 'Usage: pipeline create <name> [description]';
        }

        const pipelineId = this.createPipeline(name, description);
        return `Created pipeline: ${name} (ID: ${pipelineId})`;
      }

      case 'list': {
        const stats = this.getPipelineStats();
        let output = `Pipelines: ${stats.totalPipelines}\n`;
        output += `Active Jobs: ${stats.activeJobs}\n`;
        output += `Queued Jobs: ${stats.queuedJobs}\n`;

        if (stats.totalPipelines > 0) {
          output += '\nAvailable pipelines:\n';
          // In a real implementation, we'd list actual pipelines
          output += '(Pipeline listing not yet implemented)';
        }

        return output;
      }

      case 'run': {
        const pipelineId = args.positional[1];
        if (!pipelineId) {
          return 'Usage: pipeline run <pipeline-id>';
        }

        try {
          const result = await this.executePipeline(pipelineId, context);
          return `Pipeline executed successfully: ${result.status}`;
        } catch (error) {
          return `Pipeline execution failed: ${error.message}`;
        }
      }

      case 'delete': {
        const pipelineId = args.positional[1];
        if (!pipelineId) {
          return 'Usage: pipeline delete <pipeline-id>';
        }

        // In a real implementation, we'd delete the pipeline
        return `Pipeline deletion not yet implemented: ${pipelineId}`;
      }

      default:
        return 'Usage: pipeline <create|list|run|delete> [options]';
    }
  }

  /**
   * Handle batch command
   */
  async handleBatch(args, context) {
    const operations = [];

    // Parse operations from arguments
    if (args.positional.length > 0) {
      args.positional.forEach(op => {
        if (op.startsWith('"') && op.endsWith('"')) {
          operations.push({
            command: op.slice(1, -1),
            description: `Batch operation: ${op.slice(1, -1)}`
          });
        } else {
          operations.push({
            command: op,
            description: `Batch operation: ${op}`
          });
        }
      });
    }

    if (operations.length === 0) {
      return 'Usage: batch <operation1> [operation2] ... or batch "operation1" "operation2" ...';
    }

    try {
      const result = await this.createBatchOperation(operations, {
        parallel: args.flags.parallel || false,
        continueOnError: args.flags.continueOnError || false,
        context
      });

      return `Batch operation completed: ${result.status}`;
    } catch (error) {
      return `Batch operation failed: ${error.message}`;
    }
  }

  /**
   * Handle jobs command
   */
  async handleJobs(args, context) {
    const action = args.positional[0] || 'list';

    switch (action) {
      case 'list': {
        const jobs = this.getActiveJobs();
        if (jobs.length === 0) {
          return 'No active jobs';
        }

        let output = 'Active Jobs:\n';
        output += '═══════════════════════════════════════\n';

        jobs.forEach(job => {
          output += `• ${job.id}: ${job.type} - ${job.status}\n`;
          if (job.pipelineName) {
            output += `  Pipeline: ${job.pipelineName}\n`;
          }
          output += `  Created: ${job.createdAt}\n\n`;
        });

        return output;
      }

      case 'status': {
        const jobId = args.positional[1];
        if (!jobId) {
          return 'Usage: jobs status <job-id>';
        }

        const job = this.pipelineSystem.getJobStatus(jobId);
        if (!job) {
          return `Job not found: ${jobId}`;
        }

        return `Job ${jobId}:\nStatus: ${job.status}\nType: ${job.type}\nCreated: ${job.createdAt}`;
      }

      case 'cancel': {
        const jobId = args.positional[1];
        if (!jobId) {
          return 'Usage: jobs cancel <job-id>';
        }

        const cancelled = this.pipelineSystem.cancelJob(jobId);
        return cancelled ? `Job cancelled: ${jobId}` : `Job not found: ${jobId}`;
      }

      default:
        return 'Usage: jobs <list|status|cancel> [job-id]';
    }
  }

  /**
   * Handle tutorial command
   */
  async handleTutorial(args, context) {
    const action = args.positional[0];

    switch (action) {
      case 'list': {
        const tutorials = this.getAvailableTutorials();
        let output = 'Available Interactive Tutorials:\n';
        output += '═══════════════════════════════════════\n\n';

        tutorials.forEach(tutorial => {
          output += `🎯 ${tutorial.id}\n`;
          output += `   ${tutorial.title}\n`;
          output += `   ${tutorial.description}\n`;
          output += `   ⏱️ ${tutorial.estimatedTime} • 📚 ${tutorial.difficulty} • 📝 ${tutorial.steps} steps\n\n`;
        });

        output += 'Usage: tutorial start <tutorial-id>\n';
        output += 'Example: tutorial start getting-started';

        return output;
      }

      case 'start': {
        const tutorialId = args.positional[1];
        if (!tutorialId) {
          return 'Usage: tutorial start <tutorial-id>\nUse "tutorial list" to see available tutorials';
        }

        const result = await this.startTutorial(tutorialId, context);
        if (result.success) {
          return `🎯 Started tutorial: ${result.tutorial}\n\n${result.firstStep.content}\n\n${result.firstStep.instruction}`;
        } else {
          return `❌ Failed to start tutorial: ${result.error}`;
        }
      }

      case 'progress': {
        const dashboard = this.getHelpDashboard(context.userId);
        const progress = dashboard.userProgress;

        let output = '📊 Your Learning Progress:\n';
        output += '═══════════════════════════════\n\n';
        output += `📚 Tutorials Completed: ${progress.tutorialsCompleted}\n`;
        output += `🎓 Skills Learned: ${progress.skillsLearned}\n`;
        output += `📈 Completion Rate: ${progress.completionRate}%\n`;

        if (progress.currentTutorial) {
          output += `🎯 Current Tutorial: ${progress.currentTutorial}\n`;
        }

        if (dashboard.suggestions.length > 0) {
          output += '\n💡 Suggested Next Steps:\n';
          dashboard.suggestions.slice(0, 3).forEach(suggestion => {
            output += `• ${suggestion.title}: ${suggestion.reason}\n`;
          });
        }

        return output;
      }

      default:
        return 'Usage: tutorial <list|start|progress> [tutorial-id]';
    }
  }

  /**
   * Handle tips command
   */
  async handleTips(args, context) {
    const topic = args.positional[0] || '';

    const contextualHelp = await this.getContextualHelp(context, topic);

    let output = '💡 Contextual Tips & Suggestions:\n';
    output += '═══════════════════════════════════════\n\n';

    // Quick tips
    if (contextualHelp.quickTips.length > 0) {
      output += '⚡ Quick Tips:\n';
      contextualHelp.quickTips.forEach(tip => {
        output += `• ${tip}\n`;
      });
      output += '\n';
    }

    // Contextual suggestions
    if (contextualHelp.suggestions.length > 0) {
      output += '🎯 Personalized Suggestions:\n';
      contextualHelp.suggestions.slice(0, 5).forEach(suggestion => {
        if (suggestion.type === 'tutorial') {
          output += `• 📚 ${suggestion.title}: ${suggestion.reason}\n`;
          output += `  Try: ${suggestion.command}\n`;
        } else if (suggestion.type === 'feature') {
          output += `• 🚀 ${suggestion.title}: ${suggestion.reason}\n`;
          output += `  Try: ${suggestion.command}\n`;
        } else if (suggestion.type === 'pattern') {
          output += `• 🔄 ${suggestion.suggestion}\n`;
          output += `  Reason: ${suggestion.reason}\n`;
        }
      });
      output += '\n';
    }

    // Recent activity analysis
    const recentCommands = this.helpSystem.getRecentCommands(context.userId, 3);
    if (recentCommands.length > 0) {
      output += '📈 Based on your recent activity:\n';
      recentCommands.forEach(cmd => {
        output += `• ${cmd}\n`;
      });
    }

    return output;
  }

  /**
   * Handle learn command
   */
  async handleLearn(args, context) {
    const action = args.positional[0] || 'dashboard';

    switch (action) {
      case 'dashboard': {
        const dashboard = this.getHelpDashboard(context.userId);

        let output = '🎓 Learning Dashboard:\n';
        output += '═══════════════════════\n\n';

        // Progress summary
        const progress = dashboard.userProgress;
        output += '📊 Your Progress:\n';
        output += `• Tutorials Completed: ${progress.tutorialsCompleted}\n`;
        output += `• Skills Mastered: ${progress.skillsLearned}\n`;
        output += `• Learning Completion: ${progress.completionRate}%\n\n`;

        // Available tutorials
        if (dashboard.availableTutorials.length > 0) {
          output += '📚 Available Tutorials:\n';
          dashboard.availableTutorials.forEach(tutorial => {
            const status = progress.tutorialsCompleted > 0 ? '✅' : '🎯';
            output += `${status} ${tutorial.title} (${tutorial.estimatedTime})\n`;
            output += `   ${tutorial.description}\n\n`;
          });
        }

        // Recent activity
        if (dashboard.recentActivity.length > 0) {
          output += '🕒 Recent Learning Activity:\n';
          dashboard.recentActivity.forEach(activity => {
            output += `• ${activity}\n`;
          });
          output += '\n';
        }

        // Suggestions
        if (dashboard.suggestions.length > 0) {
          output += '💡 Recommended Next Steps:\n';
          dashboard.suggestions.slice(0, 3).forEach(suggestion => {
            output += `• ${suggestion.title}\n`;
            output += `  ${suggestion.reason}\n\n`;
          });
        }

        // Quick tips
        if (dashboard.quickTips.length > 0) {
          output += '⚡ Quick Tips:\n';
          dashboard.quickTips.forEach(tip => {
            output += `• ${tip}\n`;
          });
        }

        return output;
      }

      case 'suggestions': {
        const contextualHelp = await this.getContextualHelp(context);

        let output = '🎯 Personalized Learning Suggestions:\n';
        output += '═══════════════════════════════════════\n\n';

        if (contextualHelp.suggestions.length === 0) {
          output += "You're doing great! Keep exploring the platform.\n\n";
          output += '💡 Try these features:\n';
          output += '• tutorial list - See available interactive tutorials\n';
          output += '• interactive - Explore guided workflows\n';
          output += '• pipeline create my-workflow - Create automated workflows\n';
          output += '• batch "quote AAPL" "quote MSFT" - Run multiple commands\n';
        } else {
          contextualHelp.suggestions.forEach(suggestion => {
            if (suggestion.type === 'tutorial') {
              output += `📚 ${suggestion.title}\n`;
              output += `   ${suggestion.reason}\n`;
              output += `   Command: ${suggestion.command}\n\n`;
            } else if (suggestion.type === 'feature') {
              output += `🚀 ${suggestion.title}\n`;
              output += `   ${suggestion.reason}\n`;
              output += `   Command: ${suggestion.command}\n\n`;
            }
          });
        }

        return output;
      }

      default:
        return 'Usage: learn <dashboard|suggestions>';
    }
  }

  /**
   * Get monitoring metrics
   */
  getMonitoringMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return this.monitor.getHealth();
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.monitor.getAlerts();
  }

  /**
   * Export monitoring data
   */
  exportMonitoringData() {
    return this.monitor.exportData();
  }

  /**
   * Reset monitoring metrics (for testing)
   */
  resetMonitoringMetrics() {
    this.monitor.resetMetrics();
  }

  /**
   * Clean up resources
   */
  async destroy() {
    // Save state before destroying
    await this.saveState();

    // Stop monitoring
    await this.monitor.stop();

    // Clean up components
    this.pluginManager.destroy();
    this.executionEngine.destroy();
    this.securityManager.destroy();
    this.autoCompletion.destroy();
    this.interactiveSystem.destroy();
    this.pipelineSystem.destroy();

    // Clear state
    this.commandHistory = [];
    this.activeSessions.clear();
    this.isInitialized = false;

    console.log('🧹 Enhanced CLI system destroyed');
  }
}

// Export singleton instance
export const enhancedCLI = new EnhancedCLI();
