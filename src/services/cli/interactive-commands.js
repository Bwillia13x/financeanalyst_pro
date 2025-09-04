/**
 * Interactive Command System for Enhanced CLI
 * Provides multi-step workflows, user prompts, and guided interactions
 */

export class InteractiveCommandSystem {
  constructor(cli) {
    this.cli = cli;
    this.activeInteractions = new Map();
    this.interactionHistory = [];
    this.templates = new Map();

    // Configuration
    this.config = {
      maxConcurrentInteractions: 5,
      interactionTimeout: 300000, // 5 minutes
      enableProgressTracking: true,
      enableStepValidation: true
    };

    // Initialize built-in interaction templates
    this.initializeTemplates();
  }

  /**
   * Initialize the interactive command system
   */
  async initialize() {
    console.log('🎯 Interactive Command System initializing...');

    // Start cleanup interval for expired sessions
    this.startSessionCleanup();

    console.log('✅ Interactive Command System initialized');
  }

  /**
   * Start session cleanup interval
   */
  startSessionCleanup() {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 300000);
  }

  /**
   * Initialize built-in interaction templates
   */
  initializeTemplates() {
    // DCF Analysis Template
    this.templates.set('dcf-analysis', {
      name: 'DCF Analysis',
      description: 'Interactive DCF valuation with guided inputs',
      steps: [
        {
          id: 'symbol',
          prompt: 'Enter the stock symbol to analyze:',
          type: 'text',
          validation: /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/,
          errorMessage: 'Please enter a valid stock symbol (e.g., AAPL, MSFT)',
          required: true,
          autoComplete: 'symbol'
        },
        {
          id: 'currentPrice',
          prompt: 'Current market price per share ($):',
          type: 'number',
          validation: /^\d+(\.\d{1,2})?$/,
          errorMessage: 'Please enter a valid price (e.g., 150.25)',
          required: true
        },
        {
          id: 'revenue',
          prompt: 'Latest annual revenue ($ millions):',
          type: 'number',
          validation: /^\d+(\.\d{1,2})?$/,
          errorMessage: 'Please enter a valid revenue amount',
          required: true
        },
        {
          id: 'growth',
          prompt: 'Expected annual revenue growth rate (%):',
          type: 'percentage',
          validation: /^(100|\d{1,2}(\.\d{1,2})?)%?$/,
          errorMessage: 'Please enter a growth rate between 0-100%',
          defaultValue: '8',
          required: true
        },
        {
          id: 'margin',
          prompt: 'Expected EBIT margin (%):',
          type: 'percentage',
          validation: /^(100|\d{1,2}(\.\d{1,2})?)%?$/,
          errorMessage: 'Please enter a margin between 0-100%',
          defaultValue: '15',
          required: true
        },
        {
          id: 'taxRate',
          prompt: 'Effective tax rate (%):',
          type: 'percentage',
          validation: /^(100|\d{1,2}(\.\d{1,2})?)%?$/,
          errorMessage: 'Please enter a tax rate between 0-100%',
          defaultValue: '25',
          required: true
        },
        {
          id: 'discountRate',
          prompt: 'Discount rate (WACC) (%):',
          type: 'percentage',
          validation: /^(100|\d{1,2}(\.\d{1,2})?)%?$/,
          errorMessage: 'Please enter a discount rate between 0-100%',
          defaultValue: '10',
          required: true
        },
        {
          id: 'terminalGrowth',
          prompt: 'Terminal growth rate (%):',
          type: 'percentage',
          validation: /^(20|\d{1,2}(\.\d{1,2})?)%?$/,
          errorMessage: 'Terminal growth should be between 0-20%',
          defaultValue: '2.5',
          required: true
        }
      ],
      onComplete: async responses => {
        // Execute DCF analysis with collected data
        const result = await this.cli.executeCommand(
          `dcf ${responses.symbol} --growth ${responses.growth} --discount ${responses.discountRate} --terminal ${responses.terminalGrowth} --revenue ${responses.revenue} --margin ${responses.margin} --tax ${responses.taxRate}`,
          { userId: responses.userId }
        );

        return {
          success: result.success,
          data: result.data,
          summary: `DCF Analysis completed for ${responses.symbol.toUpperCase()}`
        };
      }
    });

    // Portfolio Creation Template
    this.templates.set('portfolio-creation', {
      name: 'Portfolio Creation',
      description: 'Create a new investment portfolio with guided setup',
      steps: [
        {
          id: 'name',
          prompt: 'Enter portfolio name:',
          type: 'text',
          validation: /^[a-zA-Z0-9\s\-_]{3,50}$/,
          errorMessage:
            'Portfolio name must be 3-50 characters, letters, numbers, spaces, hyphens, and underscores only',
          required: true
        },
        {
          id: 'type',
          prompt: 'Portfolio type (retirement, growth, income, balanced):',
          type: 'choice',
          options: ['retirement', 'growth', 'income', 'balanced'],
          defaultValue: 'balanced',
          required: true
        },
        {
          id: 'initialCapital',
          prompt: 'Initial capital ($):',
          type: 'number',
          validation: /^\d+(\.\d{1,2})?$/,
          errorMessage: 'Please enter a valid amount',
          required: true
        },
        {
          id: 'riskTolerance',
          prompt: 'Risk tolerance (conservative, moderate, aggressive):',
          type: 'choice',
          options: ['conservative', 'moderate', 'aggressive'],
          defaultValue: 'moderate',
          required: true
        },
        {
          id: 'addPositions',
          prompt: 'Would you like to add initial positions now? (yes/no):',
          type: 'boolean',
          defaultValue: 'yes',
          required: false
        }
      ],
      conditionalSteps: {
        addPositions: [
          {
            id: 'firstSymbol',
            prompt: 'Enter first stock symbol:',
            type: 'text',
            validation: /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/,
            errorMessage: 'Please enter a valid stock symbol',
            required: true,
            autoComplete: 'symbol'
          },
          {
            id: 'firstShares',
            prompt: 'Number of shares:',
            type: 'number',
            validation: /^\d+$/,
            errorMessage: 'Please enter a valid number of shares',
            required: true
          }
        ]
      },
      onComplete: async responses => {
        // Create portfolio
        const createResult = await this.cli.executeCommand(`portfolio create "${responses.name}"`, {
          userId: responses.userId
        });

        if (!createResult.success) {
          return createResult;
        }

        let result = createResult;

        // Add initial position if requested
        if (responses.addPositions && responses.firstSymbol) {
          result = await this.cli.executeCommand(
            `portfolio add ${responses.firstSymbol} ${responses.firstShares}`,
            { userId: responses.userId }
          );
        }

        return {
          success: result.success,
          data: result.data,
          summary: `Portfolio "${responses.name}" created successfully`
        };
      }
    });

    // Analysis Workflow Template
    this.templates.set('analysis-workflow', {
      name: 'Analysis Workflow',
      description: 'Complete analysis workflow with multiple tools',
      steps: [
        {
          id: 'symbol',
          prompt: 'Enter symbol to analyze:',
          type: 'text',
          validation: /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/,
          errorMessage: 'Please enter a valid stock symbol',
          required: true,
          autoComplete: 'symbol'
        },
        {
          id: 'analysisType',
          prompt: 'Analysis type (quick, comprehensive, technical):',
          type: 'choice',
          options: ['quick', 'comprehensive', 'technical'],
          defaultValue: 'comprehensive',
          required: true
        }
      ],
      onComplete: async responses => {
        const results = [];

        // Always get quote
        const quoteResult = await this.cli.executeCommand(`quote ${responses.symbol}`, {
          userId: responses.userId
        });
        results.push({ type: 'quote', result: quoteResult });

        // Analysis based on type
        if (responses.analysisType === 'quick' || responses.analysisType === 'comprehensive') {
          const dcfResult = await this.cli.executeCommand(`dcf ${responses.symbol}`, {
            userId: responses.userId
          });
          results.push({ type: 'dcf', result: dcfResult });

          const compsResult = await this.cli.executeCommand(`comps ${responses.symbol}`, {
            userId: responses.userId
          });
          results.push({ type: 'comps', result: compsResult });
        }

        if (responses.analysisType === 'technical' || responses.analysisType === 'comprehensive') {
          const chartResult = await this.cli.executeCommand(`chart ${responses.symbol}`, {
            userId: responses.userId
          });
          results.push({ type: 'chart', result: chartResult });
        }

        return {
          success: results.every(r => r.result.success),
          data: results,
          summary: `${responses.analysisType} analysis completed for ${responses.symbol.toUpperCase()}`
        };
      }
    });
  }

  /**
   * Start an interactive command session
   */
  async startInteractive(templateName, context = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      return {
        success: false,
        error: `Interactive template '${templateName}' not found`
      };
    }

    // Check concurrent interaction limits
    if (this.activeInteractions.size >= this.config.maxConcurrentInteractions) {
      return {
        success: false,
        error: 'Maximum concurrent interactive sessions reached'
      };
    }

    // Create interaction session
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      template: templateName,
      template,
      currentStep: 0,
      responses: {},
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      context,
      progress: {
        completed: 0,
        total: template.steps.length,
        percentage: 0
      }
    };

    this.activeInteractions.set(sessionId, session);

    // Set timeout for the session
    session.timeoutId = setTimeout(() => {
      this.endInteractive(sessionId, 'timeout');
    }, this.config.interactionTimeout);

    console.log(`🎯 Started interactive session: ${templateName} (${sessionId})`);

    return {
      success: true,
      sessionId,
      template: templateName,
      firstStep: template.steps[0],
      progress: session.progress
    };
  }

  /**
   * Process interactive response
   */
  async processResponse(sessionId, response, context = {}) {
    const session = this.activeInteractions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Interactive session not found or expired'
      };
    }

    // Update session activity
    session.lastActivity = new Date().toISOString();

    // Validate response
    const currentStep = session.template.steps[session.currentStep];
    const validation = this.validateStepResponse(response, currentStep);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        step: currentStep,
        retry: true
      };
    }

    // Store response
    session.responses[currentStep.id] = validation.value;

    // Update progress
    session.progress.completed++;
    session.progress.percentage = Math.round(
      (session.progress.completed / session.progress.total) * 100
    );

    // Check for conditional steps
    const conditionalSteps = this.getConditionalSteps(session, currentStep.id);
    if (conditionalSteps.length > 0) {
      // Insert conditional steps
      session.template.steps.splice(session.currentStep + 1, 0, ...conditionalSteps);
      session.progress.total += conditionalSteps.length;
    }

    // Move to next step or complete
    session.currentStep++;

    if (session.currentStep >= session.template.steps.length) {
      // Complete the interaction
      return await this.completeInteractive(session);
    } else {
      // Return next step
      const nextStep = session.template.steps[session.currentStep];
      return {
        success: true,
        nextStep,
        progress: session.progress,
        sessionId
      };
    }
  }

  /**
   * Complete interactive session
   */
  async completeInteractive(session) {
    const activeSession = this.activeInteractions.get(session.id);
    if (!activeSession) {
      return { success: false, error: 'Session not found' };
    }

    try {
      // Execute completion handler
      const result = await activeSession.template.onComplete({
        ...activeSession.responses,
        userId: activeSession.context.userId,
        sessionId: activeSession.id
      });

      // Record completion
      this.recordInteractionCompletion(activeSession, result);

      // Clean up session
      this.endInteractive(session.id, 'completed');

      return {
        success: true,
        completed: true,
        result,
        summary: result.summary || 'Interactive session completed successfully'
      };
    } catch (error) {
      this.recordInteractionCompletion(session, { success: false, error: error.message });
      this.endInteractive(session.id, 'error');

      return {
        success: false,
        error: `Completion failed: ${error.message}`,
        completed: true
      };
    }
  }

  /**
   * Validate step response
   */
  validateStepResponse(response, step) {
    // Handle empty responses with defaults
    if (!response && step.defaultValue !== undefined) {
      return { valid: true, value: step.defaultValue };
    }

    // Check required fields
    if (step.required && (!response || response.trim() === '')) {
      return { valid: false, error: 'This field is required' };
    }

    // Type-specific validation
    switch (step.type) {
      case 'text':
      case 'string':
        return this.validateText(response, step);

      case 'number':
        return this.validateNumber(response, step);

      case 'percentage':
        return this.validatePercentage(response, step);

      case 'boolean':
        return this.validateBoolean(response, step);

      case 'choice':
        return this.validateChoice(response, step);

      default:
        return { valid: true, value: response };
    }
  }

  /**
   * Validate text input
   */
  validateText(response, step) {
    if (step.validation && !step.validation.test(response)) {
      return { valid: false, error: step.errorMessage || 'Invalid format' };
    }

    return { valid: true, value: response.trim() };
  }

  /**
   * Validate number input
   */
  validateNumber(response, step) {
    const num = parseFloat(response);
    if (isNaN(num)) {
      return { valid: false, error: step.errorMessage || 'Must be a valid number' };
    }

    if (step.min !== undefined && num < step.min) {
      return { valid: false, error: `Must be at least ${step.min}` };
    }

    if (step.max !== undefined && num > step.max) {
      return { valid: false, error: `Must be at most ${step.max}` };
    }

    return { valid: true, value: num };
  }

  /**
   * Validate percentage input
   */
  validatePercentage(response, step) {
    // Remove % symbol if present
    const cleanResponse = response.replace('%', '');
    const num = parseFloat(cleanResponse);

    if (isNaN(num)) {
      return { valid: false, error: step.errorMessage || 'Must be a valid percentage' };
    }

    if (num < 0 || num > 100) {
      return { valid: false, error: 'Percentage must be between 0 and 100' };
    }

    return { valid: true, value: num };
  }

  /**
   * Validate boolean input
   */
  validateBoolean(response, step) {
    const lower = response.toLowerCase().trim();
    const booleanValues = ['yes', 'no', 'true', 'false', '1', '0', 'y', 'n'];

    if (!booleanValues.includes(lower)) {
      return { valid: false, error: step.errorMessage || 'Must be yes/no or true/false' };
    }

    const value = ['yes', 'true', '1', 'y'].includes(lower);
    return { valid: true, value };
  }

  /**
   * Validate choice input
   */
  validateChoice(response, step) {
    const lower = response.toLowerCase().trim();

    if (!step.options.includes(lower)) {
      return {
        valid: false,
        error: step.errorMessage || `Must be one of: ${step.options.join(', ')}`
      };
    }

    return { valid: true, value: lower };
  }

  /**
   * Get conditional steps based on response
   */
  getConditionalSteps(session, stepId) {
    const template = session.template;
    const response = session.responses[stepId];

    if (!template.conditionalSteps || !template.conditionalSteps[stepId]) {
      return [];
    }

    // Check if condition is met
    const conditionMet = this.evaluateCondition(response, template.conditionalSteps[stepId]);

    return conditionMet ? template.conditionalSteps[stepId] : [];
  }

  /**
   * Evaluate conditional step condition
   */
  evaluateCondition(response, conditionalConfig) {
    // Simple condition evaluation - can be extended
    if (typeof conditionalConfig.condition === 'function') {
      return conditionalConfig.condition(response);
    }

    // Default: show if response is truthy
    return !!response;
  }

  /**
   * End interactive session
   */
  endInteractive(sessionId, reason = 'completed') {
    const session = this.activeInteractions.get(sessionId);
    if (!session) return;

    // Clear timeout
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }

    // Record in history
    this.interactionHistory.push({
      sessionId,
      template: session.template,
      reason,
      duration: Date.now() - new Date(session.startedAt).getTime(),
      completedSteps: session.currentStep,
      totalSteps: session.template.steps.length,
      timestamp: new Date().toISOString()
    });

    // Maintain history size
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-1000);
    }

    // Remove from active sessions
    this.activeInteractions.delete(sessionId);

    console.log(`🎯 Ended interactive session: ${sessionId} (${reason})`);
  }

  /**
   * Record interaction completion
   */
  recordInteractionCompletion(session, result) {
    // This could be used for analytics, learning, etc.
    console.log(`✅ Interactive session completed: ${session.id}`, {
      template: session.template,
      success: result.success,
      steps: session.progress.completed
    });
  }

  /**
   * Get interactive session status
   */
  getSessionStatus(sessionId) {
    const session = this.activeInteractions.get(sessionId);
    if (!session) {
      return { active: false };
    }

    return {
      active: true,
      template: session.template,
      currentStep: session.currentStep,
      totalSteps: session.template.steps.length,
      progress: session.progress,
      lastActivity: session.lastActivity
    };
  }

  /**
   * Get available interactive templates
   */
  getAvailableTemplates() {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      steps: template.steps.length
    }));
  }

  /**
   * Cancel interactive session
   */
  cancelInteractive(sessionId) {
    this.endInteractive(sessionId, 'cancelled');
  }

  /**
   * Get interaction statistics
   */
  getInteractionStats() {
    const stats = {
      activeSessions: this.activeInteractions.size,
      totalHistory: this.interactionHistory.length,
      availableTemplates: this.templates.size,
      completionRate: 0
    };

    // Calculate completion rate
    if (this.interactionHistory.length > 0) {
      const completed = this.interactionHistory.filter(h => h.reason === 'completed').length;
      stats.completionRate = Math.round((completed / this.interactionHistory.length) * 100);
    }

    return stats;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const timeout = this.config.interactionTimeout;

    for (const [sessionId, session] of this.activeInteractions) {
      const lastActivity = new Date(session.lastActivity).getTime();
      if (now - lastActivity > timeout) {
        this.endInteractive(sessionId, 'expired');
      }
    }
  }

  /**
   * Destroy interactive system
   */
  destroy() {
    // End all active sessions
    for (const sessionId of this.activeInteractions.keys()) {
      this.endInteractive(sessionId, 'shutdown');
    }

    // Clear all data
    this.activeInteractions.clear();
    this.interactionHistory = [];
    this.templates.clear();

    console.log('🧹 Interactive Command System destroyed');
  }
}
