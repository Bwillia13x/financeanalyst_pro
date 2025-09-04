/**
 * Intelligent Help System
 * Provides contextual help, tutorials, and command assistance
 */

export class IntelligentHelpSystem {
  constructor(cli) {
    this.cli = cli;

    // Help content storage
    this.helpContent = new Map();
    this.tutorials = new Map();
    this.faqDatabase = new Map();
    this.commandExamples = new Map();
    this.interactiveTutorials = new Map();
    this.contextualHelp = new Map();

    // User interaction tracking
    this.userHelpHistory = new Map();
    this.userLearningProgress = new Map();
    this.commonIssues = new Map();
    this.helpAnalytics = new Map();

    // Configuration
    this.config = {
      enableContextualHelp: true,
      enableTutorials: true,
      enableAutoSuggestions: true,
      enableInteractiveTutorials: true,
      enableLearningProgress: true,
      enableHelpAnalytics: true,
      maxHelpHistory: 100,
      maxTutorialSteps: 20,
      tutorialTimeout: 300000, // 5 minutes
      contextualHelpThreshold: 0.7 // Similarity threshold for contextual suggestions
    };
  }

  /**
   * Initialize help system
   */
  async initialize() {
    console.log('📚 Help System initializing...');

    // Load help content
    await this.loadHelpContent();

    // Initialize tutorials
    await this.initializeTutorials();

    // Initialize interactive tutorials
    await this.initializeInteractiveTutorials();

    // Initialize contextual help
    await this.initializeContextualHelp();

    // Load common issues
    await this.loadCommonIssues();

    console.log('✅ Help System initialized');
  }

  /**
   * Get help for command or general help
   */
  async getHelp(args, context) {
    const { positional } = args;
    const topic = positional[0];

    if (!topic) {
      return this.getGeneralHelp(context);
    }

    // Check if it's a command
    const command = this.cli.registry.getCommand(topic);
    if (command) {
      return this.getCommandHelp(command, context);
    }

    // Check if it's a help topic
    const topicHelp = this.helpContent.get(topic.toLowerCase());
    if (topicHelp) {
      return this.getTopicHelp(topicHelp, context);
    }

    // Fuzzy search for similar topics
    const suggestions = this.findSimilarTopics(topic);
    return {
      success: false,
      error: `Help topic '${topic}' not found`,
      suggestions
    };
  }

  /**
   * Get general help overview
   */
  getGeneralHelp(context) {
    const userId = context.userId;
    const userContext = userId ? this.cli.contextManager.getUserContext(userId) : null;

    let help = '🔧 FINANCEANALYST PRO CLI HELP\n';
    help += '═══════════════════════════════════════\n\n';

    // Personalized greeting
    if (userContext) {
      const commandCount = userContext.analytics.totalCommands;
      help += `Welcome back! You've executed ${commandCount} commands.\n\n`;
    }

    // Quick start guide
    help += '🚀 QUICK START:\n';
    help += '• Type \'help <command>\' for specific command help\n';
    help += '• Use Tab for auto-completion\n';
    help += '• Use ↑/↓ for command history\n';
    help += '• Type \'tutorial\' for interactive learning\n\n';

    // Command categories
    help += '📂 COMMAND CATEGORIES:\n';
    const categories = this.cli.registry.getAllCategories();

    categories.forEach(category => {
      help += `• ${category.icon} ${category.name} (${category.commandCount} commands)\n`;
    });

    help += '\n';

    // Popular commands for this user
    if (userContext && userContext.analytics.preferredCommands.length > 0) {
      help += '⭐ YOUR FREQUENTLY USED COMMANDS:\n';
      userContext.analytics.preferredCommands.slice(0, 5).forEach(cmd => {
        help += `• ${cmd.command} (used ${cmd.count} times)\n`;
      });
      help += '\n';
    }

    // Getting started commands
    help += '🎯 GETTING STARTED COMMANDS:\n';
    help += '• quote AAPL          - Get stock quote\n';
    help += '• dcf AAPL           - Run DCF analysis\n';
    help += '• portfolio create   - Create portfolio\n';
    help += '• analyze AAPL       - Analyze stock\n';
    help += '• tutorial           - Start learning\n\n';

    // Help topics
    help += '📚 AVAILABLE HELP TOPICS:\n';
    help += '• commands          - Command reference\n';
    help += '• analysis          - Analysis techniques\n';
    help += '• portfolio         - Portfolio management\n';
    help += '• tutorials         - Learning resources\n';
    help += '• faq               - Frequently asked questions\n\n';

    help += '💡 TIP: Type \'help <topic>\' for detailed information';

    // Track help usage
    this.trackHelpUsage('general', userId);

    return {
      success: true,
      output: help,
      type: 'help'
    };
  }

  /**
   * Get detailed help for a specific command
   */
  getCommandHelp(command, context) {
    let help = `${command.name.toUpperCase()} COMMAND HELP\n`;
    help += '═══════════════════════════════════════\n\n';

    // Basic information
    help += `📝 Description: ${command.description}\n`;
    help += `🏷️  Category: ${command.category}\n`;
    help += `📖 Usage: ${command.usage}\n`;

    if (command.aliases && command.aliases.length > 0) {
      help += `🔗 Aliases: ${command.aliases.join(', ')}\n`;
    }

    help += '\n';

    // Examples
    if (command.examples && command.examples.length > 0) {
      help += '💡 EXAMPLES:\n';
      command.examples.forEach(example => {
        help += `  ${example}\n`;
      });
      help += '\n';
    }

    // Parameters
    if (command.parameters) {
      help += '⚙️ PARAMETERS:\n';

      if (command.parameters.positional) {
        help += '  Positional:\n';
        command.parameters.positional.forEach(param => {
          const required = param.required ? '(required)' : '(optional)';
          help += `    ${param.name}: ${param.description} ${required}\n`;
        });
      }

      if (command.parameters.options) {
        help += '  Options:\n';
        Object.entries(command.parameters.options).forEach(([key, param]) => {
          const required = param.required ? '(required)' : '(optional)';
          help += `    --${key}: ${param.description} ${required}\n`;
        });
      }

      help += '\n';
    }

    // Related commands
    const related = this.getRelatedCommands(command.name);
    if (related.length > 0) {
      help += '🔗 RELATED COMMANDS:\n';
      related.forEach(cmd => {
        help += `  ${cmd}\n`;
      });
      help += '\n';
    }

    // Contextual tips
    const tips = this.getContextualTips(command, context);
    if (tips.length > 0) {
      help += '💡 TIPS:\n';
      tips.forEach(tip => {
        help += `  • ${tip}\n`;
      });
      help += '\n';
    }

    // Track help usage
    this.trackHelpUsage(`command:${command.name}`, context.userId);

    return {
      success: true,
      output: help,
      type: 'help',
      command: command.name
    };
  }

  /**
   * Get help for a specific topic
   */
  getTopicHelp(topicContent, context) {
    let help = `${topicContent.title.toUpperCase()}\n`;
    help += '═══════════════════════════════════════\n\n';

    help += `${topicContent.content}\n\n`;

    if (topicContent.sections) {
      topicContent.sections.forEach(section => {
        help += `${section.title}:\n`;
        help += `${section.content}\n\n`;
      });
    }

    if (topicContent.examples) {
      help += '💡 EXAMPLES:\n';
      topicContent.examples.forEach(example => {
        help += `${example}\n`;
      });
      help += '\n';
    }

    if (topicContent.relatedTopics) {
      help += '📚 RELATED TOPICS:\n';
      topicContent.relatedTopics.forEach(topic => {
        help += `  help ${topic}\n`;
      });
      help += '\n';
    }

    // Track help usage
    this.trackHelpUsage(`topic:${topicContent.title}`, context.userId);

    return {
      success: true,
      output: help,
      type: 'help',
      topic: topicContent.title
    };
  }

  /**
   * Get related commands
   */
  getRelatedCommands(commandName) {
    const relatedMap = {
      quote: ['chart', 'analyze', 'dcf'],
      chart: ['quote', 'analyze', 'export'],
      dcf: ['comps', 'lbo', 'sensitivity'],
      portfolio: ['analyze', 'rebalance', 'export'],
      analyze: ['dcf', 'comps', 'export']
    };

    return relatedMap[commandName] || [];
  }

  /**
   * Get contextual tips for command
   */
  getContextualTips(command, context) {
    const tips = [];

    // Command-specific tips
    switch (command.name) {
      case 'dcf':
        tips.push('Use --growth and --discount to customize assumptions');
        tips.push('Run sensitivity analysis with "dcf AAPL --sensitivity"');
        break;
      case 'portfolio':
        tips.push('Use "portfolio analyze --risk" for risk metrics');
        tips.push('Create watchlists with "portfolio create my_watchlist"');
        break;
      case 'quote':
        tips.push('Add --detailed for comprehensive quote information');
        tips.push('Use --historical for price history');
        break;
    }

    // Context-specific tips
    if (context.userId) {
      const userContext = this.cli.contextManager.getUserContext(context.userId);
      if (userContext.state.favoriteSymbols.length > 0) {
        tips.push(
          `Your favorite symbols: ${userContext.state.favoriteSymbols.slice(0, 3).join(', ')}`
        );
      }
    }

    return tips;
  }

  /**
   * Find similar help topics
   */
  findSimilarTopics(query) {
    const queryLower = query.toLowerCase();
    const suggestions = [];

    // Search help content
    for (const [key, content] of this.helpContent) {
      if (key.includes(queryLower) || content.title.toLowerCase().includes(queryLower)) {
        suggestions.push({
          topic: key,
          title: content.title,
          type: 'topic'
        });
      }
    }

    // Search commands
    const commands = this.cli.registry.search(query, {}, 5);
    commands.forEach(cmd => {
      suggestions.push({
        topic: cmd.name,
        title: cmd.name,
        type: 'command'
      });
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Get tutorial recommendations
   */
  getTutorialRecommendations(context) {
    const recommendations = [];
    const userId = context.userId;

    if (userId) {
      const userContext = this.cli.contextManager.getUserContext(userId);
      const commandCount = userContext.analytics.totalCommands;

      // Beginner tutorials
      if (commandCount < 10) {
        recommendations.push({
          id: 'getting-started',
          title: 'Getting Started with FinanceAnalyst Pro',
          description: 'Learn basic commands and navigation',
          difficulty: 'Beginner'
        });
      }

      // Analysis tutorials
      if (commandCount >= 10 && !userContext.history.commands.some(c => c.command === 'dcf')) {
        recommendations.push({
          id: 'dcf-analysis',
          title: 'DCF Valuation Tutorial',
          description: 'Master discounted cash flow analysis',
          difficulty: 'Intermediate'
        });
      }

      // Advanced tutorials
      if (commandCount >= 50) {
        recommendations.push({
          id: 'advanced-portfolio',
          title: 'Advanced Portfolio Management',
          description: 'Risk management and optimization techniques',
          difficulty: 'Advanced'
        });
      }
    }

    return recommendations;
  }

  /**
   * Start interactive tutorial
   */
  async startTutorial(tutorialId, context) {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) {
      return {
        success: false,
        error: `Tutorial '${tutorialId}' not found`
      };
    }

    // Initialize tutorial session
    const session = {
      tutorialId,
      currentStep: 0,
      startedAt: new Date().toISOString(),
      progress: [],
      userId: context.userId
    };

    // Return first step
    return {
      success: true,
      tutorial: tutorial.title,
      step: tutorial.steps[0],
      totalSteps: tutorial.steps.length,
      sessionId: crypto.randomUUID()
    };
  }

  /**
   * Get FAQ answer
   */
  getFAQAnswer(question) {
    const questionLower = question.toLowerCase();

    for (const [key, faq] of this.faqDatabase) {
      if (key.includes(questionLower) || faq.question.toLowerCase().includes(questionLower)) {
        return {
          question: faq.question,
          answer: faq.answer,
          related: faq.related || []
        };
      }
    }

    return null;
  }

  /**
   * Load help content
   */
  async loadHelpContent() {
    // Core help topics
    this.helpContent.set('commands', {
      title: 'Command Reference',
      content: 'Complete guide to all available CLI commands organized by category.',
      sections: [
        {
          title: 'Getting Help',
          content:
            '• help - General help\n• help <command> - Command-specific help\n• tutorial - Interactive tutorials'
        },
        {
          title: 'Navigation',
          content:
            '• Use Tab for auto-completion\n• Use ↑/↓ for command history\n• Use Ctrl+C to cancel commands'
        }
      ]
    });

    this.helpContent.set('analysis', {
      title: 'Financial Analysis',
      content: 'Learn about different valuation methods and analysis techniques.',
      sections: [
        {
          title: 'DCF Analysis',
          content:
            'Discounted Cash Flow (DCF) estimates intrinsic value based on future cash flows.'
        },
        {
          title: 'Comparable Analysis',
          content: 'Trading Comps compare valuation multiples across similar companies.'
        },
        {
          title: 'LBO Analysis',
          content: 'Leveraged Buyout analysis evaluates private equity returns.'
        }
      ],
      examples: [
        'dcf AAPL --growth 0.05 --discount 0.10',
        'comps AAPL --metric EBITDA --multiple 12',
        'lbo TSLA --entry 8 --exit 12 --debt 0.6'
      ]
    });

    this.helpContent.set('tutorials', {
      title: 'Interactive Tutorials',
      content: 'Step-by-step learning guides for mastering the platform.',
      sections: [
        {
          title: 'Available Tutorials',
          content:
            '• getting-started - Basic commands and navigation\n• dcf-analysis - DCF valuation techniques\n• portfolio-management - Portfolio creation and analysis\n• advanced-analysis - Complex valuation methods'
        }
      ]
    });
  }

  /**
   * Initialize tutorials
   */
  async initializeTutorials() {
    // Getting Started Tutorial
    this.tutorials.set('getting-started', {
      title: 'Getting Started with FinanceAnalyst Pro',
      description: 'Learn the basics of using the CLI',
      difficulty: 'Beginner',
      estimatedTime: '10 minutes',
      steps: [
        {
          title: 'Welcome to FinanceAnalyst Pro',
          content:
            'Welcome! This tutorial will teach you the basics of using the FinanceAnalyst Pro CLI.',
          instruction: 'Type "help" and press Enter to see available commands.'
        },
        {
          title: 'Getting Stock Quotes',
          content: 'The quote command lets you get real-time stock information.',
          instruction: 'Try: quote AAPL',
          validation: 'Should display AAPL stock information'
        },
        {
          title: 'Basic Analysis',
          content: 'You can analyze stocks using various methods.',
          instruction: 'Try: analyze AAPL --type fundamental',
          validation: 'Should show fundamental analysis results'
        },
        {
          title: 'Command History',
          content: 'Use arrow keys to navigate through your command history.',
          instruction: 'Press ↑ to see your previous commands',
          validation: 'Should show command history'
        }
      ]
    });

    // DCF Tutorial
    this.tutorials.set('dcf-analysis', {
      title: 'DCF Valuation Tutorial',
      description: 'Master discounted cash flow analysis',
      difficulty: 'Intermediate',
      estimatedTime: '15 minutes',
      steps: [
        {
          title: 'Understanding DCF',
          content: "DCF calculates a company's intrinsic value based on its future cash flows.",
          instruction: 'Type: dcf AAPL --help'
        },
        {
          title: 'Basic DCF Calculation',
          content: 'Run a basic DCF analysis with default assumptions.',
          instruction: 'dcf AAPL',
          validation: 'Should show DCF valuation results'
        },
        {
          title: 'Customizing Assumptions',
          content: 'You can customize growth rates and discount rates.',
          instruction: 'dcf AAPL --growth 0.08 --discount 0.12',
          validation: 'Should show customized DCF results'
        }
      ]
    });
  }

  /**
   * Load common issues database
   */
  async loadCommonIssues() {
    this.faqDatabase.set('command_not_found', {
      question: 'Command not found error',
      answer:
        'The command you typed doesn\'t exist. Use "help" to see available commands or check for typos.',
      related: ['help', 'commands']
    });

    this.faqDatabase.set('permission_denied', {
      question: 'Permission denied error',
      answer:
        "You don't have permission to run this command. Contact your administrator or check your user role.",
      related: ['help', 'permissions']
    });

    this.faqDatabase.set('network_error', {
      question: 'Network connection error',
      answer: 'Unable to connect to data services. Check your internet connection and try again.',
      related: ['status', 'connectivity']
    });
  }

  /**
   * Track help usage for analytics
   */
  trackHelpUsage(topic, userId) {
    if (!userId) return;

    if (!this.userHelpHistory.has(userId)) {
      this.userHelpHistory.set(userId, []);
    }

    const history = this.userHelpHistory.get(userId);
    history.push({
      topic,
      timestamp: new Date().toISOString()
    });

    // Maintain history size
    if (history.length > this.config.maxHelpHistory) {
      history.splice(0, history.length - this.config.maxHelpHistory);
    }
  }

  /**
   * Get help usage statistics
   */
  getHelpStats() {
    const stats = {
      totalHelpRequests: 0,
      popularTopics: {},
      usersHelped: this.userHelpHistory.size
    };

    // Aggregate topic usage
    for (const [userId, history] of this.userHelpHistory) {
      history.forEach(entry => {
        stats.totalHelpRequests++;
        stats.popularTopics[entry.topic] = (stats.popularTopics[entry.topic] || 0) + 1;
      });
    }

    return stats;
  }

  /**
   * Search help content
   */
  searchHelp(query) {
    const queryLower = query.toLowerCase();
    const results = [];

    // Search help content
    for (const [key, content] of this.helpContent) {
      if (
        key.includes(queryLower) ||
        content.title.toLowerCase().includes(queryLower) ||
        content.content.toLowerCase().includes(queryLower)
      ) {
        results.push({
          type: 'topic',
          title: content.title,
          key,
          excerpt: content.content.substring(0, 100) + '...'
        });
      }
    }

    // Search commands
    const commands = this.cli.registry.search(query);
    commands.forEach(cmd => {
      results.push({
        type: 'command',
        title: cmd.name,
        key: cmd.name,
        excerpt: cmd.description
      });
    });

    // Search FAQs
    for (const [key, faq] of this.faqDatabase) {
      if (
        key.includes(queryLower) ||
        faq.question.toLowerCase().includes(queryLower) ||
        faq.answer.toLowerCase().includes(queryLower)
      ) {
        results.push({
          type: 'faq',
          title: faq.question,
          key,
          excerpt: faq.answer.substring(0, 100) + '...'
        });
      }
    }

    return results;
  }

  /**
   * Initialize interactive tutorials
   */
  async initializeInteractiveTutorials() {
    console.log('🎯 Initializing Interactive Tutorials...');

    // Getting Started Tutorial
    this.interactiveTutorials.set('getting-started', {
      title: 'Getting Started with FinanceAnalyst Pro',
      description: 'Learn the basics of using the CLI',
      estimatedTime: '10 minutes',
      difficulty: 'beginner',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to FinanceAnalyst Pro!',
          content: `
Welcome to FinanceAnalyst Pro CLI! 🚀

This interactive tutorial will guide you through the essential features and commands.

💡 Pro Tip: You can use Tab for auto-completion and ↑/↓ for command history.

Ready to get started? Type "help" and press Enter.`,
          instruction: 'Type: help',
          validation: input => input.trim().toLowerCase() === 'help',
          autoExecute: 'help'
        },
        {
          id: 'basic-navigation',
          title: 'Basic Navigation',
          content: `
Great! You can see all available commands. Let's explore some basic ones:

📋 Available command categories:
• Financial Analysis (dcf, comps, lbo)
• Market Data (quote, chart)
• Portfolio Management (portfolio, analyze)
• Utilities (pipeline, batch, jobs)

Try getting a stock quote next.`,
          instruction: 'Type: quote AAPL',
          validation: input => input.includes('quote'),
          autoExecute: 'quote AAPL --help'
        },
        {
          id: 'first-analysis',
          title: 'Your First Analysis',
          content: `
Excellent! Now let's try a basic analysis. The DCF (Discounted Cash Flow) analysis is one of our most powerful tools.

It estimates a company's intrinsic value based on its future cash flows.

Try running a DCF analysis on Apple.`,
          instruction: 'Type: dcf AAPL',
          validation: input => input.includes('dcf'),
          autoExecute: 'dcf AAPL --help'
        },
        {
          id: 'interactive-features',
          title: 'Interactive Features',
          content: `
🎉 Congratulations! You've completed the getting started tutorial.

You now know how to:
✅ Navigate the CLI interface
✅ Get stock quotes
✅ Run financial analysis
✅ Access help and documentation

💡 Next steps:
• Try the interactive DCF analysis: interactive dcf-analysis
• Learn about batch operations: batch "quote AAPL" "quote MSFT"
• Explore command pipelines: pipeline create my-workflow

Keep exploring and happy analyzing! 📊`,
          instruction: 'Type: interactive (to see available interactive workflows)',
          validation: input => input.includes('interactive'),
          autoExecute: 'interactive'
        }
      ]
    });

    // Advanced Analysis Tutorial
    this.interactiveTutorials.set('advanced-analysis', {
      title: 'Advanced Financial Analysis',
      description: 'Master complex valuation techniques and workflows',
      estimatedTime: '20 minutes',
      difficulty: 'advanced',
      steps: [
        {
          id: 'comparable-analysis',
          title: 'Comparable Company Analysis',
          content: `
Now let's explore Comparable Company Analysis (Comps).

This method values a company by comparing it to similar publicly traded companies.

Key metrics to consider:
• Enterprise Value / Revenue
• Enterprise Value / EBITDA
• Price / Earnings
• Price / Book Value

Try running comps analysis on Apple.`,
          instruction: 'Type: comps AAPL',
          validation: input => input.includes('comps'),
          autoExecute: 'comps AAPL --help'
        },
        {
          id: 'batch-operations',
          title: 'Batch Operations',
          description: 'Process multiple commands efficiently',
          content: `
Batch operations allow you to execute multiple commands simultaneously.

This is perfect for:
• Analyzing multiple stocks at once
• Running comparative analysis
• Processing large datasets
• Automating repetitive tasks

Try analyzing multiple tech stocks:`,
          instruction: 'Type: batch "quote AAPL" "quote MSFT" "quote GOOGL"',
          validation: input => input.includes('batch'),
          autoExecute: 'batch "quote AAPL" "quote MSFT" "quote GOOGL"'
        }
      ]
    });

    console.log('✅ Interactive Tutorials initialized');
  }

  /**
   * Initialize contextual help
   */
  async initializeContextualHelp() {
    console.log('🎯 Initializing Contextual Help...');

    // Command-specific contextual help
    this.contextualHelp.set('quote', {
      related: ['chart', 'analyze', 'dcf', 'comps'],
      tips: [
        'Use --detailed for comprehensive quote information',
        'Combine with chart: quote AAPL && chart AAPL',
        'Try batch quotes: batch "quote AAPL" "quote MSFT"'
      ],
      shortcuts: ['q AAPL', 'quote AAPL --detailed']
    });

    this.contextualHelp.set('dcf', {
      related: ['comps', 'lbo', 'sensitivity', 'portfolio'],
      tips: [
        'Use interactive mode: interactive dcf-analysis',
        'Customize assumptions with options',
        'Compare results with comps analysis',
        'Save results to portfolio for tracking'
      ],
      shortcuts: ['dcf AAPL --growth 10', 'interactive dcf-analysis']
    });

    this.contextualHelp.set('portfolio', {
      related: ['analyze', 'quote', 'export'],
      tips: [
        'Create new portfolio: portfolio create my-portfolio',
        'Add positions: portfolio add AAPL 100',
        'Analyze performance: portfolio analyze',
        'Export data: portfolio export'
      ],
      shortcuts: ['portfolio show', 'portfolio analyze']
    });

    console.log('✅ Contextual Help initialized');
  }

  /**
   * Start interactive tutorial
   */
  async startTutorial(tutorialId, context) {
    const tutorial = this.interactiveTutorials.get(tutorialId);
    if (!tutorial) {
      return {
        success: false,
        error: `Tutorial '${tutorialId}' not found`
      };
    }

    const userId = context.userId;
    const tutorialSession = {
      tutorialId,
      tutorial,
      currentStep: 0,
      startedAt: new Date().toISOString(),
      completedSteps: [],
      status: 'active'
    };

    // Initialize user progress if not exists
    if (!this.userLearningProgress.has(userId)) {
      this.userLearningProgress.set(userId, {
        tutorialsCompleted: [],
        currentTutorial: null,
        skillsLearned: new Set(),
        timeSpent: 0
      });
    }

    const userProgress = this.userLearningProgress.get(userId);
    userProgress.currentTutorial = tutorialSession;

    // Set tutorial timeout
    setTimeout(() => {
      this.endTutorial(userId, 'timeout');
    }, this.config.tutorialTimeout);

    console.log(`🎯 Started tutorial: ${tutorial.title} for user ${userId}`);

    return {
      success: true,
      tutorial: tutorialId,
      firstStep: tutorial.steps[0],
      progress: {
        current: 1,
        total: tutorial.steps.length
      }
    };
  }

  /**
   * Process tutorial step
   */
  async processTutorialStep(userId, input, context) {
    const userProgress = this.userLearningProgress.get(userId);
    if (!userProgress || !userProgress.currentTutorial) {
      return {
        success: false,
        error: 'No active tutorial session'
      };
    }

    const tutorial = userProgress.currentTutorial;
    const currentStep = tutorial.tutorial.steps[tutorial.currentStep];

    if (!currentStep) {
      return this.completeTutorial(userId);
    }

    // Validate user input
    const isValid = currentStep.validation ? currentStep.validation(input) : true;

    if (isValid) {
      // Mark step as completed
      tutorial.completedSteps.push({
        stepId: currentStep.id,
        completedAt: new Date().toISOString(),
        userInput: input
      });

      tutorial.currentStep++;

      // Check if tutorial is complete
      if (tutorial.currentStep >= tutorial.tutorial.steps.length) {
        return this.completeTutorial(userId);
      }

      const nextStep = tutorial.tutorial.steps[tutorial.currentStep];

      return {
        success: true,
        nextStep,
        progress: {
          current: tutorial.currentStep + 1,
          total: tutorial.tutorial.steps.length
        },
        feedback: 'Great! Step completed successfully.'
      };
    } else {
      return {
        success: false,
        error: "That doesn't seem right. Try following the instruction above.",
        retry: true,
        currentStep
      };
    }
  }

  /**
   * Complete tutorial
   */
  completeTutorial(userId) {
    const userProgress = this.userLearningProgress.get(userId);
    const tutorial = userProgress.currentTutorial;

    tutorial.status = 'completed';
    tutorial.completedAt = new Date().toISOString();

    // Update user progress
    userProgress.tutorialsCompleted.push({
      tutorialId: tutorial.tutorialId,
      completedAt: tutorial.completedAt,
      timeSpent: new Date(tutorial.completedAt) - new Date(tutorial.startedAt),
      stepsCompleted: tutorial.completedSteps.length
    });

    // Update skills learned
    const skills = this.extractSkillsFromTutorial(tutorial.tutorial);
    skills.forEach(skill => userProgress.skillsLearned.add(skill));

    userProgress.currentTutorial = null;

    console.log(`✅ Tutorial completed: ${tutorial.tutorial.title} for user ${userId}`);

    return {
      success: true,
      completed: true,
      tutorial: tutorial.tutorialId,
      summary: `Congratulations! You've completed the "${tutorial.tutorial.title}" tutorial.`,
      skillsLearned: Array.from(userProgress.skillsLearned),
      nextSteps: this.getRecommendedNextSteps(userId)
    };
  }

  /**
   * End tutorial (timeout, cancel, etc.)
   */
  endTutorial(userId, reason = 'completed') {
    const userProgress = this.userLearningProgress.get(userId);
    if (userProgress && userProgress.currentTutorial) {
      userProgress.currentTutorial.status = reason;
      userProgress.currentTutorial.endedAt = new Date().toISOString();
      userProgress.currentTutorial = null;

      console.log(`🎯 Tutorial ended (${reason}): for user ${userId}`);
    }
  }

  /**
   * Get contextual help based on current context
   */
  async getContextualHelp(context, input = '') {
    const userId = context.userId;
    const suggestions = [];

    // Get user's recent command history
    const recentCommands = this.getRecentCommands(userId, 5);

    // Analyze current input for contextual suggestions
    if (input) {
      const inputWords = input.toLowerCase().split(/\s+/);

      // Find related commands based on input
      for (const [commandName, helpData] of this.contextualHelp) {
        if (inputWords.some(word => commandName.includes(word))) {
          suggestions.push({
            type: 'command_context',
            command: commandName,
            related: helpData.related,
            tips: helpData.tips,
            shortcuts: helpData.shortcuts
          });
        }
      }
    }

    // Add learning suggestions based on user progress
    const learningSuggestions = this.getLearningSuggestions(userId);
    suggestions.push(...learningSuggestions);

    // Add command pattern suggestions
    if (recentCommands.length > 0) {
      const patternSuggestions = this.analyzeCommandPatterns(recentCommands);
      suggestions.push(...patternSuggestions);
    }

    return {
      suggestions,
      userProgress: this.getUserLearningProgress(userId),
      quickTips: this.getQuickTips(context)
    };
  }

  /**
   * Get learning suggestions for user
   */
  getLearningSuggestions(userId) {
    const suggestions = [];
    const userProgress = this.userLearningProgress.get(userId);

    if (!userProgress) return suggestions;

    // Suggest tutorials based on completed ones
    const completedTutorialIds = userProgress.tutorialsCompleted.map(t => t.tutorialId);

    if (!completedTutorialIds.includes('getting-started')) {
      suggestions.push({
        type: 'tutorial',
        id: 'getting-started',
        title: 'Getting Started Tutorial',
        reason: 'Perfect for new users learning the basics'
      });
    }

    if (
      completedTutorialIds.includes('getting-started') &&
      !completedTutorialIds.includes('advanced-analysis')
    ) {
      suggestions.push({
        type: 'tutorial',
        id: 'advanced-analysis',
        title: 'Advanced Analysis Tutorial',
        reason: 'Build on your basic knowledge with advanced techniques'
      });
    }

    // Suggest based on command usage patterns
    const recentCommands = this.getRecentCommands(userId, 10);
    if (recentCommands.some(cmd => cmd.includes('quote'))) {
      if (!recentCommands.some(cmd => cmd.includes('chart'))) {
        suggestions.push({
          type: 'feature',
          command: 'chart',
          title: 'Try Chart Analysis',
          reason: "You've been using quotes - charts provide visual insights"
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze command patterns for suggestions
   */
  analyzeCommandPatterns(recentCommands) {
    const suggestions = [];
    const commandCounts = {};

    // Count command usage
    recentCommands.forEach(cmd => {
      const mainCommand = cmd.split(' ')[0];
      commandCounts[mainCommand] = (commandCounts[mainCommand] || 0) + 1;
    });

    // Suggest related commands
    if (commandCounts.quote > 2 && !commandCounts.chart) {
      suggestions.push({
        type: 'pattern',
        suggestion: 'Try combining quotes with charts: quote AAPL && chart AAPL',
        reason: 'You use quotes frequently - charts complement this well'
      });
    }

    if (commandCounts.dcf && commandCounts.comps) {
      suggestions.push({
        type: 'pattern',
        suggestion: 'Create a valuation pipeline: pipeline create valuation-workflow',
        reason: 'You use both DCF and comps - consider automating this workflow'
      });
    }

    return suggestions;
  }

  /**
   * Get recent commands for user
   */
  getRecentCommands(userId, limit = 10) {
    if (!this.userHelpHistory.has(userId)) return [];

    const history = this.userHelpHistory.get(userId);
    return history.slice(-limit).map(entry => entry.command);
  }

  /**
   * Get user learning progress
   */
  getUserLearningProgress(userId) {
    const progress = this.userLearningProgress.get(userId);
    if (!progress) {
      return {
        tutorialsCompleted: 0,
        skillsLearned: 0,
        timeSpent: 0,
        currentTutorial: null
      };
    }

    return {
      tutorialsCompleted: progress.tutorialsCompleted.length,
      skillsLearned: progress.skillsLearned.size,
      timeSpent: progress.timeSpent,
      currentTutorial: progress.currentTutorial?.tutorialId || null,
      completionRate:
        progress.tutorialsCompleted.length > 0
          ? Math.round((progress.tutorialsCompleted.length / this.interactiveTutorials.size) * 100)
          : 0
    };
  }

  /**
   * Get quick tips based on context
   */
  getQuickTips(context) {
    const tips = [
      '💡 Use Tab for auto-completion',
      '💡 Use ↑/↓ for command history',
      '💡 Try interactive dcf-analysis for guided valuation',
      '💡 Use batch operations for multiple commands',
      '💡 Create pipelines for complex workflows'
    ];

    // Context-specific tips
    if (context.currentCommand) {
      if (context.currentCommand.includes('quote')) {
        tips.push('💡 Add --detailed for comprehensive quote data');
        tips.push('💡 Combine with chart: quote SYMBOL && chart SYMBOL');
      }

      if (context.currentCommand.includes('dcf')) {
        tips.push('💡 Try interactive mode: interactive dcf-analysis');
        tips.push('💡 Customize assumptions with command options');
      }
    }

    return tips.slice(0, 3); // Return top 3 tips
  }

  /**
   * Extract skills from tutorial
   */
  extractSkillsFromTutorial(tutorial) {
    const skills = new Set();

    // Map tutorial IDs to skills
    const skillMapping = {
      'getting-started': ['basic-navigation', 'quote-usage', 'help-system'],
      'advanced-analysis': ['comparable-analysis', 'batch-operations', 'advanced-workflows']
    };

    const tutorialSkills = skillMapping[tutorial.id] || [];
    tutorialSkills.forEach(skill => skills.add(skill));

    return skills;
  }

  /**
   * Get recommended next steps for user
   */
  getRecommendedNextSteps(userId) {
    const progress = this.getUserLearningProgress(userId);
    const nextSteps = [];

    if (progress.tutorialsCompleted === 0) {
      nextSteps.push({
        type: 'tutorial',
        title: 'Complete Getting Started Tutorial',
        command: 'tutorial getting-started',
        benefit: 'Learn CLI basics and essential commands'
      });
    }

    if (progress.completionRate < 50) {
      nextSteps.push({
        type: 'tutorial',
        title: 'Explore Advanced Analysis',
        command: 'tutorial advanced-analysis',
        benefit: 'Master complex valuation techniques'
      });
    }

    if (!nextSteps.length) {
      nextSteps.push({
        type: 'feature',
        title: 'Try Interactive Workflows',
        command: 'interactive',
        benefit: 'Experience guided analysis workflows'
      });

      nextSteps.push({
        type: 'feature',
        title: 'Create Command Pipelines',
        command: 'pipeline create my-workflow',
        benefit: 'Automate complex analysis workflows'
      });
    }

    return nextSteps;
  }

  /**
   * Get comprehensive help dashboard
   */
  getHelpDashboard(userId) {
    const progress = this.getUserLearningProgress(userId);
    const recentActivity = this.getRecentCommands(userId, 5);
    const availableTutorials = Array.from(this.interactiveTutorials.values());
    const contextualHelp = this.getContextualHelp({ userId });

    return {
      userProgress: progress,
      recentActivity,
      availableTutorials: availableTutorials.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        estimatedTime: t.estimatedTime,
        difficulty: t.difficulty
      })),
      suggestions: contextualHelp.suggestions,
      quickTips: contextualHelp.quickTips,
      stats: {
        totalTutorials: this.interactiveTutorials.size,
        totalHelpTopics: this.helpContent.size,
        totalFAQs: this.faqDatabase.size,
        activeUsers: this.userLearningProgress.size
      }
    };
  }

  /**
   * Record help interaction for analytics
   */
  recordHelpInteraction(userId, interactionType, details) {
    if (!this.config.enableHelpAnalytics) return;

    if (!this.helpAnalytics.has(userId)) {
      this.helpAnalytics.set(userId, []);
    }

    const analytics = this.helpAnalytics.get(userId);
    analytics.push({
      type: interactionType,
      details,
      timestamp: new Date().toISOString()
    });

    // Maintain analytics history limit
    if (analytics.length > this.config.maxHelpHistory) {
      analytics.splice(0, analytics.length - this.config.maxHelpHistory);
    }
  }

  /**
   * Destroy help system
   */
  async destroy() {
    // Clear all help data
    this.helpContent.clear();
    this.tutorials.clear();
    this.faqDatabase.clear();
    this.commandExamples.clear();
    this.interactiveTutorials.clear();
    this.contextualHelp.clear();
    this.userHelpHistory.clear();
    this.userLearningProgress.clear();
    this.commonIssues.clear();
    this.helpAnalytics.clear();

    console.log('🧹 Help System destroyed');
  }
}
