import {
  Calculator,
  TrendingUp,
  BarChart3,
  FileText,
  Download,
  Upload,
  Search,
  Save,
  Settings,
  HelpCircle,
  PieChart,
  LineChart,
  Activity,
  Target,
  Eye
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

// Natural language patterns for command matching
const NATURAL_LANGUAGE_PATTERNS = {
  // Navigation patterns
  navigation: [
    { pattern: /(?:go to|navigate to|switch to|show me)\s+(.+)/i, category: 'navigation' },
    { pattern: /(?:open|view)\s+(.+)/i, category: 'navigation' }
  ],

  // Analysis patterns
  analysis: [
    {
      pattern: /(?:create|new|build|make)\s+(?:a\s+)?(?:dcf|valuation|model)(?:\s+for\s+(.+))?/i,
      category: 'analysis',
      command: 'create-dcf'
    },
    {
      pattern: /(?:run|perform|do)\s+(?:a\s+)?sensitivity\s+(?:analysis\s+)?(?:on\s+(.+))?/i,
      category: 'analysis',
      command: 'sensitivity-analysis'
    },
    { pattern: /(?:calculate|compute)\s+(.+)/i, category: 'analysis' },
    { pattern: /(?:analyze|analyse)\s+(.+)/i, category: 'analysis' }
  ],

  // Data patterns
  data: [
    { pattern: /(?:find|search|look for)\s+(.+)/i, category: 'data', command: 'search-data' },
    { pattern: /(?:import|load)\s+(.+)/i, category: 'data', command: 'import-data' },
    { pattern: /(?:export|save|download)\s+(.+)/i, category: 'export', command: 'export-data' }
  ],

  // Chart patterns
  charts: [
    {
      pattern: /(?:create|make|build|show)\s+(?:a\s+)?(?:chart|graph|plot)(?:\s+for\s+(.+))?/i,
      category: 'charts',
      command: 'create-chart'
    },
    { pattern: /(?:visualize|plot)\s+(.+)/i, category: 'charts', command: 'create-chart' }
  ]
};

// Comprehensive command registry
const COMMAND_REGISTRY = {
  // Navigation Commands
  'go-to-data': {
    id: 'go-to-data',
    title: 'Go to Data Entry',
    description: 'Navigate to financial data spreadsheet',
    category: 'navigation',
    icon: FileText,
    shortcut: 'Ctrl+1',
    keywords: ['data', 'spreadsheet', 'financial', 'entry', 'input'],
    execute: (_params, _context) => ({ action: 'navigate', target: 'data' })
  },

  'go-to-modeling': {
    id: 'go-to-modeling',
    title: 'Go to Modeling Tools',
    description: 'Navigate to financial modeling workspace',
    category: 'navigation',
    icon: Calculator,
    shortcut: 'Ctrl+2',
    keywords: ['modeling', 'tools', 'dcf', 'models'],
    execute: (_params, _context) => ({ action: 'navigate', target: 'modeling' })
  },

  'go-to-analysis': {
    id: 'go-to-analysis',
    title: 'Go to Analysis Results',
    description: 'View analysis results and outputs',
    category: 'navigation',
    icon: TrendingUp,
    shortcut: 'Ctrl+3',
    keywords: ['analysis', 'results', 'outputs', 'valuation'],
    execute: (_params, _context) => ({ action: 'navigate', target: 'analysis' })
  },

  'go-to-lbo': {
    id: 'go-to-lbo',
    title: 'Advanced LBO Tool',
    description: 'Navigate to leveraged buyout modeling workspace',
    category: 'navigation',
    icon: Calculator,
    shortcut: 'Ctrl+4',
    keywords: ['lbo', 'leveraged', 'buyout', 'private', 'equity', 'advanced'],
    execute: (_params, _context) => ({ action: 'navigate', target: 'lbo' })
  },

  'go-to-threestatement': {
    id: 'go-to-threestatement',
    title: '3-Statement Model Workspace',
    description: 'Navigate to integrated financial statement modeling',
    category: 'navigation',
    icon: FileText,
    shortcut: 'Ctrl+5',
    keywords: ['three', 'statement', 'financial', 'model', 'income', 'balance', 'cash'],
    execute: (_params, _context) => ({ action: 'navigate', target: 'threestatement' })
  },

  'go-to-scenarios': {
    id: 'go-to-scenarios',
    title: 'Scenario Analysis',
    description: 'Navigate to enhanced scenario analysis and stress testing',
    category: 'navigation',
    icon: TrendingUp,
    shortcut: 'Ctrl+6',
    keywords: ['scenario', 'analysis', 'stress', 'testing', 'sensitivity', 'multiple'],
    execute: (_params, _context) => ({ action: 'navigate', target: 'scenarios' })
  },

  'go-to-montecarlo': {
    id: 'go-to-montecarlo',
    title: 'Monte Carlo Integration Hub',
    description: 'Navigate to cross-model Monte Carlo simulation workspace',
    category: 'navigation',
    icon: Activity,
    shortcut: 'Ctrl+7',
    keywords: ['monte', 'carlo', 'simulation', 'integration', 'risk', 'probability'],
    execute: (_params, _context) => ({ action: 'navigate', target: 'montecarlo' })
  },

  // Analysis Commands
  'create-dcf': {
    id: 'create-dcf',
    title: 'Create New DCF Model',
    description: 'Start a new discounted cash flow valuation model',
    category: 'analysis',
    icon: Calculator,
    shortcut: 'Ctrl+N',
    keywords: ['dcf', 'valuation', 'model', 'discounted', 'cash', 'flow', 'new', 'create'],
    parameters: [
      { name: 'company', type: 'string', description: 'Company ticker or name', optional: true }
    ],
    execute: (params, _context) => ({
      action: 'create-model',
      type: 'dcf',
      company: params?.company || 'New Model'
    })
  },

  'sensitivity-analysis': {
    id: 'sensitivity-analysis',
    title: 'Run Sensitivity Analysis',
    description: 'Perform sensitivity analysis on key assumptions',
    category: 'analysis',
    icon: Target,
    shortcut: 'Ctrl+Shift+S',
    keywords: ['sensitivity', 'analysis', 'assumptions', 'wacc', 'growth', 'test'],
    parameters: [
      {
        name: 'variable',
        type: 'string',
        description: 'Variable to analyze (WACC, growth rate, etc.)',
        optional: true
      }
    ],
    execute: (params, _context) => ({
      action: 'run-sensitivity',
      variable: params?.variable || 'wacc'
    })
  },

  'monte-carlo': {
    id: 'monte-carlo',
    title: 'Run Monte Carlo Simulation',
    description: 'Perform Monte Carlo simulation on model',
    category: 'analysis',
    icon: Activity,
    keywords: ['monte', 'carlo', 'simulation', 'probability', 'risk'],
    execute: (_params, _context) => ({ action: 'run-monte-carlo' })
  },

  'create-lbo': {
    id: 'create-lbo',
    title: 'Create LBO Model',
    description: 'Start a new leveraged buyout analysis model',
    category: 'analysis',
    icon: Calculator,
    shortcut: 'Ctrl+Shift+L',
    keywords: ['lbo', 'leveraged', 'buyout', 'private', 'equity', 'debt', 'returns'],
    parameters: [
      {
        name: 'company',
        type: 'string',
        description: 'Target company for LBO analysis',
        optional: true
      }
    ],
    execute: (params, _context) => ({
      action: 'create-model',
      type: 'lbo',
      company: params?.company || 'New LBO Model'
    })
  },

  'create-3statement': {
    id: 'create-3statement',
    title: 'Build 3-Statement Model',
    description: 'Create integrated income statement, balance sheet, and cash flow model',
    category: 'analysis',
    icon: FileText,
    shortcut: 'Ctrl+Shift+3',
    keywords: ['three', 'statement', 'income', 'balance', 'cash', 'flow', 'integrated'],
    parameters: [
      {
        name: 'company',
        type: 'string',
        description: 'Company for financial modeling',
        optional: true
      }
    ],
    execute: (params, _context) => ({
      action: 'create-model',
      type: 'threestatement',
      company: params?.company || 'New 3-Statement Model'
    })
  },

  'scenario-analysis': {
    id: 'scenario-analysis',
    title: 'Run Scenario Analysis',
    description: 'Create and analyze multiple scenarios with different assumptions',
    category: 'analysis',
    icon: TrendingUp,
    shortcut: 'Ctrl+Shift+A',
    keywords: ['scenario', 'analysis', 'multiple', 'assumptions', 'bull', 'bear', 'base'],
    parameters: [
      {
        name: 'scenarios',
        type: 'array',
        description: 'Number of scenarios to create',
        optional: true
      }
    ],
    execute: (params, _context) => ({
      action: 'create-scenarios',
      scenarios: params?.scenarios || ['Base', 'Bull', 'Bear']
    })
  },

  // Data Commands
  'search-data': {
    id: 'search-data',
    title: 'Search Financial Data',
    description: 'Find specific financial metrics or data points',
    category: 'data',
    icon: Search,
    shortcut: 'Ctrl+F',
    keywords: ['search', 'find', 'data', 'metrics', 'revenue', 'expenses'],
    parameters: [
      { name: 'query', type: 'string', description: 'What to search for', required: true }
    ],
    execute: (params, _context) => ({
      action: 'search',
      query: params?.query
    })
  },

  'import-data': {
    id: 'import-data',
    title: 'Import Financial Data',
    description: 'Import data from Excel, CSV, or other sources',
    category: 'data',
    icon: Upload,
    shortcut: 'Ctrl+I',
    keywords: ['import', 'upload', 'excel', 'csv', 'data', 'file'],
    execute: (_params, _context) => ({ action: 'import-data' })
  },

  'export-data': {
    id: 'export-data',
    title: 'Export Analysis',
    description: 'Export current analysis to PDF, Excel, or PowerPoint',
    category: 'export',
    icon: Download,
    shortcut: 'Ctrl+E',
    keywords: ['export', 'download', 'pdf', 'excel', 'powerpoint', 'save'],
    parameters: [
      {
        name: 'format',
        type: 'string',
        description: 'Export format (PDF, Excel, PowerPoint)',
        optional: true
      }
    ],
    execute: (params, _context) => ({
      action: 'export',
      format: params?.format || 'pdf'
    })
  },

  // Chart Commands
  'create-chart': {
    id: 'create-chart',
    title: 'Create Chart',
    description: 'Create a visualization from your data',
    category: 'charts',
    icon: BarChart3,
    keywords: ['chart', 'graph', 'visualization', 'plot', 'visualize'],
    parameters: [
      {
        name: 'type',
        type: 'string',
        description: 'Chart type (line, bar, pie, etc.)',
        optional: true
      },
      { name: 'data', type: 'string', description: 'Data to visualize', optional: true }
    ],
    execute: (params, _context) => ({
      action: 'create-chart',
      type: params?.type || 'line',
      data: params?.data
    })
  },

  'revenue-chart': {
    id: 'revenue-chart',
    title: 'Create Revenue Chart',
    description: 'Visualize revenue trends over time',
    category: 'charts',
    icon: LineChart,
    keywords: ['revenue', 'sales', 'income', 'trend', 'growth'],
    execute: (_params, _context) => ({
      action: 'create-chart',
      type: 'line',
      data: 'revenue'
    })
  },

  'margin-analysis': {
    id: 'margin-analysis',
    title: 'Analyze Margins',
    description: 'Create margin analysis visualization',
    category: 'charts',
    icon: PieChart,
    keywords: ['margin', 'profitability', 'ebitda', 'operating', 'gross'],
    execute: (_params, _context) => ({
      action: 'create-chart',
      type: 'bar',
      data: 'margins'
    })
  },

  // Company-specific commands (dynamic)
  'company-apple': {
    id: 'company-apple',
    title: 'Analyze Apple (AAPL)',
    description: 'Create analysis for Apple Inc.',
    category: 'analysis',
    icon: Calculator,
    keywords: ['apple', 'aapl', 'company', 'stock'],
    execute: (_params, _context) => ({
      action: 'create-model',
      company: 'AAPL'
    })
  },

  'company-microsoft': {
    id: 'company-microsoft',
    title: 'Analyze Microsoft (MSFT)',
    description: 'Create analysis for Microsoft Corporation',
    category: 'analysis',
    icon: Calculator,
    keywords: ['microsoft', 'msft', 'company', 'stock'],
    execute: (_params, _context) => ({
      action: 'create-model',
      company: 'MSFT'
    })
  },

  // Utility Commands
  'save-analysis': {
    id: 'save-analysis',
    title: 'Save Current Analysis',
    description: 'Save your current work',
    category: 'data',
    icon: Save,
    shortcut: 'Ctrl+S',
    keywords: ['save', 'store', 'backup'],
    execute: (_params, _context) => ({ action: 'save' })
  },

  'toggle-insights': {
    id: 'toggle-insights',
    title: 'Toggle Insights Sidebar',
    description: 'Show or hide contextual insights',
    category: 'navigation',
    icon: Eye,
    keywords: ['insights', 'sidebar', 'toggle', 'show', 'hide'],
    execute: (_params, _context) => ({ action: 'toggle-insights' })
  },

  settings: {
    id: 'settings',
    title: 'Open Settings',
    description: 'Configure application preferences',
    category: 'settings',
    icon: Settings,
    keywords: ['settings', 'preferences', 'config', 'options'],
    execute: (_params, _context) => ({ action: 'open-settings' })
  },

  help: {
    id: 'help',
    title: 'Get Help',
    description: 'Access help documentation and tutorials',
    category: 'help',
    icon: HelpCircle,
    shortcut: 'F1',
    keywords: ['help', 'documentation', 'tutorial', 'support'],
    execute: (_params, _context) => ({ action: 'open-help' })
  }
};

export const useCommandRegistry = (currentContext = {}) => {
  const [commandUsage, setCommandUsage] = useState(() => {
    const saved = localStorage.getItem('commandUsage');
    return saved ? JSON.parse(saved) : {};
  });

  const [userLearning, setUserLearning] = useState(() => {
    const saved = localStorage.getItem('commandLearning');
    return saved ? JSON.parse(saved) : {};
  });

  // Parse natural language query
  const parseNaturalLanguage = useCallback(query => {
    const results = [];

    for (const [_category, patterns] of Object.entries(NATURAL_LANGUAGE_PATTERNS)) {
      for (const pattern of patterns) {
        const match = query.match(pattern.pattern);
        if (match) {
          results.push({
            category: pattern.category,
            command: pattern.command,
            parameters: match.slice(1).filter(Boolean),
            confidence: match[0].length / query.length
          });
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }, []);

  // Search commands with intelligent matching
  const searchCommands = useCallback(
    query => {
      if (!query.trim()) return [];

      const normalizedQuery = query.toLowerCase().trim();
      const results = [];

      // First, try natural language parsing
      const nlResults = parseNaturalLanguage(query);

      // Score and rank commands
      Object.values(COMMAND_REGISTRY).forEach(command => {
        let score = 0;

        // Exact title match
        if (command.title.toLowerCase() === normalizedQuery) {
          score += 100;
        }

        // Title contains query
        if (command.title.toLowerCase().includes(normalizedQuery)) {
          score += 50;
        }

        // Description contains query
        if (command.description.toLowerCase().includes(normalizedQuery)) {
          score += 30;
        }

        // Keyword matches
        const keywordMatches = command.keywords.filter(
          keyword =>
            keyword.toLowerCase().includes(normalizedQuery) ||
            normalizedQuery.includes(keyword.toLowerCase())
        );
        score += keywordMatches.length * 20;

        // Usage frequency boost
        const usageCount = commandUsage[command.id] || 0;
        score += Math.min(usageCount * 2, 20);

        // Context relevance
        if (currentContext.activeTab) {
          if (command.category === 'navigation' && command.id.includes(currentContext.activeTab)) {
            score += 15;
          }
          if (command.category === currentContext.activeTab) {
            score += 10;
          }
        }

        // Natural language match boost
        const nlMatch = nlResults.find(nl => nl.command === command.id);
        if (nlMatch) {
          score += nlMatch.confidence * 40;
        }

        if (score > 0) {
          results.push({
            ...command,
            score,
            usageCount,
            isRecommended: score > 60
          });
        }
      });

      return results.sort((a, b) => b.score - a.score).slice(0, 8); // Limit to top 8 results
    },
    [parseNaturalLanguage, commandUsage, currentContext]
  );

  // Get contextual commands based on current state
  const getContextualCommands = useCallback(() => {
    const contextual = [];

    // Based on active tab
    switch (currentContext.activeTab) {
      case 'data':
      case 'spreadsheet':
        contextual.push(
          COMMAND_REGISTRY['import-data'],
          COMMAND_REGISTRY['search-data'],
          COMMAND_REGISTRY['go-to-modeling']
        );
        break;
      case 'modeling':
        contextual.push(
          COMMAND_REGISTRY['create-dcf'],
          COMMAND_REGISTRY['sensitivity-analysis'],
          COMMAND_REGISTRY['go-to-analysis']
        );
        break;
      case 'analysis':
        contextual.push(
          COMMAND_REGISTRY['create-chart'],
          COMMAND_REGISTRY['export-data'],
          COMMAND_REGISTRY['sensitivity-analysis']
        );
        break;
      case 'lbo':
        contextual.push(
          COMMAND_REGISTRY['create-lbo'],
          COMMAND_REGISTRY['sensitivity-analysis'],
          COMMAND_REGISTRY['export-data']
        );
        break;
      case 'threestatement':
        contextual.push(
          COMMAND_REGISTRY['create-3statement'],
          COMMAND_REGISTRY['sensitivity-analysis'],
          COMMAND_REGISTRY['go-to-scenarios']
        );
        break;
      case 'scenarios':
        contextual.push(
          COMMAND_REGISTRY['scenario-analysis'],
          COMMAND_REGISTRY['monte-carlo'],
          COMMAND_REGISTRY['create-chart']
        );
        break;
      case 'montecarlo':
        contextual.push(
          COMMAND_REGISTRY['monte-carlo'],
          COMMAND_REGISTRY['scenario-analysis'],
          COMMAND_REGISTRY['export-data']
        );
        break;
      default:
        contextual.push(
          COMMAND_REGISTRY['create-dcf'],
          COMMAND_REGISTRY['import-data'],
          COMMAND_REGISTRY['help']
        );
    }

    // Add frequently used commands
    const frequentCommands = Object.entries(commandUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([id]) => COMMAND_REGISTRY[id])
      .filter(Boolean);

    return [...contextual, ...frequentCommands].slice(0, 6);
  }, [currentContext, commandUsage]);

  // Execute command
  const executeCommand = useCallback(
    async (commandName, _params) => {
      const command = COMMAND_REGISTRY[commandName];
      if (!command) {
        throw new Error(`Command not found: ${commandName}`);
      }

      try {
        const result = await command.execute(_params, currentContext);

        // Track usage
        setCommandUsage(prev => ({
          ...prev,
          [commandName]: (prev[commandName] || 0) + 1
        }));

        return result;
      } catch (error) {
        console.error(`Command execution failed: ${commandName}`, error);
        throw error;
      }
    },
    [currentContext]
  );

  // Learn from user behavior
  const learnFromUsage = useCallback((commandId, query) => {
    if (!query.trim()) return;

    setUserLearning(prev => ({
      ...prev,
      [commandId]: {
        ...prev[commandId],
        queries: [...(prev[commandId]?.queries || []), query].slice(-5), // Keep last 5 queries
        lastUsed: Date.now()
      }
    }));
  }, []);

  // Get command categories
  const getCommandCategories = useCallback(() => {
    const categories = {};
    Object.values(COMMAND_REGISTRY).forEach(command => {
      if (!categories[command.category]) {
        categories[command.category] = [];
      }
      categories[command.category].push(command);
    });
    return categories;
  }, []);

  // Save usage data to localStorage
  useEffect(() => {
    localStorage.setItem('commandUsage', JSON.stringify(commandUsage));
  }, [commandUsage]);

  useEffect(() => {
    localStorage.setItem('commandLearning', JSON.stringify(userLearning));
  }, [userLearning]);

  return {
    searchCommands,
    executeCommand,
    getContextualCommands,
    getCommandCategories,
    learnFromUsage,
    parseNaturalLanguage,
    commandRegistry: COMMAND_REGISTRY,
    commandUsage,
    userLearning
  };
};
