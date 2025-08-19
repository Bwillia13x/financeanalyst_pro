/**
 * Enhanced Command Processor for FinanceAnalyst Pro Terminal
 * Provides modular, extensible command processing with categorization
 */

import { commandRegistry } from './commandRegistry';
import { dataFetchingService as _dataFetchingService } from './dataFetching';
import { persistenceManager } from './persistence/PersistenceManager';

export class CommandProcessor {
  constructor() {
    this.commandHistory = [];
    this.variables = new Map();
    this.settings = {
      currency: 'USD',
      precision: 2,
      dateFormat: 'YYYY-MM-DD'
    };
    this.persistenceInitialized = false;
    this.maxHistorySize = 1000;
  }

  /**
   * Initialize persistence layer
   */
  async initializePersistence() {
    if (this.persistenceInitialized) return;

    try {
      await persistenceManager.initialize();

      // Load persisted data
      await this.loadPersistedData();

      this.persistenceInitialized = true;
      console.log('✅ Command processor persistence initialized');
    } catch (error) {
      console.error('❌ Failed to initialize persistence:', error);
      // Continue without persistence
    }
  }

  /**
   * Load persisted data
   */
  async loadPersistedData() {
    try {
      // Load command history
      const history = await persistenceManager.retrieve('command_history');
      if (history && Array.isArray(history)) {
        this.commandHistory = history.slice(-this.maxHistorySize);
      }

      // Load variables
      const variables = await persistenceManager.retrieve('user_variables');
      if (variables && typeof variables === 'object') {
        this.variables = new Map(Object.entries(variables));
      }

      // Load settings
      const settings = await persistenceManager.retrieve('user_preferences');
      if (settings && typeof settings === 'object') {
        this.settings = { ...this.settings, ...settings };
      }

    } catch (error) {
      console.error('Failed to load persisted data:', error);
    }
  }

  /**
   * Save data to persistence layer
   */
  async saveData() {
    if (!this.persistenceInitialized) return;

    try {
      // Save command history
      await persistenceManager.store('command_history', this.commandHistory, {
        storage: 'indexedDB'
      });

      // Save variables
      const variablesObj = Object.fromEntries(this.variables);
      await persistenceManager.store('user_variables', variablesObj, {
        storage: 'localStorage'
      });

      // Save settings
      await persistenceManager.store('user_preferences', this.settings, {
        storage: 'localStorage'
      });

    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  /**
   * Process a command input and return structured response
   * @param {string} input - Raw command input
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Command response
   */
  async processCommand(input, context = {}) {
    const startTime = Date.now();

    try {
      // Initialize persistence if not already done
      if (!this.persistenceInitialized) {
        await this.initializePersistence();
      }

      // Parse command
      const parsedCommand = this.parseCommand(input);

      // Add to history
      const historyEntry = {
        input,
        timestamp: new Date(),
        success: false,
        ...parsedCommand
      };
      this.commandHistory.push(historyEntry);

      // Trim history if too long
      if (this.commandHistory.length > this.maxHistorySize) {
        this.commandHistory = this.commandHistory.slice(-this.maxHistorySize);
      }

      // Get command handler
      const handler = commandRegistry.getHandler(parsedCommand.command);

      if (!handler) {
        return this.createErrorResponse(`Unknown command: "${parsedCommand.command}"`, input);
      }

      // Validate parameters
      const validationResult = this.validateParameters(handler, parsedCommand);
      if (!validationResult.valid) {
        return this.createErrorResponse(validationResult.error, input);
      }

      // Execute command
      const result = await handler.execute(parsedCommand, context, this);

      // Mark command as successful in history
      historyEntry.success = result.type !== 'error';
      historyEntry.executionTime = Date.now() - startTime;

      // Add execution metadata
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date();

      // Save data asynchronously (don't wait)
      this.saveData().catch(error => {
        console.error('Failed to save command processor data:', error);
      });

      return result;

    } catch (error) {
      return this.createErrorResponse(`Command execution failed: ${error.message}`, input);
    }
  }

  /**
   * Parse command input into structured format
   * @param {string} input - Raw command input
   * @returns {Object} Parsed command object
   */
  parseCommand(input) {
    const trimmed = input.trim();

    // Handle function-style commands: COMMAND(param1, param2)
    const functionMatch = trimmed.match(/^([A-Z_]+)\s*\(\s*([^)]*)\s*\)$/i);
    if (functionMatch) {
      const [, command, paramString] = functionMatch;
      const parameters = this.parseParameters(paramString);
      return {
        command: command.toUpperCase(),
        parameters,
        rawInput: trimmed,
        style: 'function'
      };
    }

    // Handle space-separated commands: COMMAND param1 param2
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toUpperCase();
    const parameters = parts.slice(1);

    return {
      command,
      parameters,
      rawInput: trimmed,
      style: 'space-separated'
    };
  }

  /**
   * Parse function parameters from string
   * @param {string} paramString - Parameter string
   * @returns {Array} Parsed parameters
   */
  parseParameters(paramString) {
    if (!paramString.trim()) return [];

    const params = [];
    let current = '';
    let inQuotes = false;
    let inBrackets = 0;
    let quoteChar = '';

    for (let i = 0; i < paramString.length; i++) {
      const char = paramString[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === '[' && !inQuotes) {
        inBrackets++;
        current += char;
      } else if (char === ']' && !inQuotes) {
        inBrackets--;
        current += char;
      } else if (char === ',' && !inQuotes && inBrackets === 0) {
        params.push(this.parseParameterValue(current.trim()));
        current = '';
        continue;
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      params.push(this.parseParameterValue(current.trim()));
    }

    return params;
  }

  /**
   * Parse individual parameter value
   * @param {string} value - Parameter value string
   * @returns {*} Parsed value
   */
  parseParameterValue(value) {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Parse arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      if (!arrayContent.trim()) return [];
      return arrayContent.split(',').map(item => this.parseParameterValue(item.trim()));
    }

    // Parse numbers
    if (/^-?\d+\.?\d*$/.test(value)) {
      return parseFloat(value);
    }

    // Parse booleans
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Return as string
    return value;
  }

  /**
   * Validate command parameters
   * @param {Object} handler - Command handler
   * @param {Object} parsedCommand - Parsed command
   * @returns {Object} Validation result
   */
  validateParameters(handler, parsedCommand) {
    if (!handler.parameterSchema) {
      return { valid: true };
    }

    const { required = [], optional = [] } = handler.parameterSchema;
    const { parameters } = parsedCommand;

    // Check required parameters
    if (parameters.length < required.length) {
      return {
        valid: false,
        error: `Missing required parameters. Expected: ${required.join(', ')}`
      };
    }

    // Check maximum parameters
    const maxParams = required.length + optional.length;
    if (parameters.length > maxParams) {
      return {
        valid: false,
        error: `Too many parameters. Maximum: ${maxParams}`
      };
    }

    return { valid: true };
  }

  /**
   * Create error response
   * @param {string} message - Error message
   * @param {string} input - Original input
   * @returns {Object} Error response
   */
  createErrorResponse(message, input) {
    return {
      type: 'error',
      content: message,
      suggestions: this.getSuggestions(input),
      timestamp: new Date()
    };
  }

  /**
   * Get command suggestions for invalid input
   * @param {string} input - Original input
   * @returns {Array} Suggested commands
   */
  getSuggestions(input) {
    const command = input.split(/[\s(]/)[0].toUpperCase();
    const allCommands = commandRegistry.getAllCommands();

    return allCommands
      .filter(cmd => cmd.includes(command.substring(0, 3)) ||
                     cmd.toLowerCase().includes(command.toLowerCase()))
      .slice(0, 5);
  }

  /**
   * Get command history
   * @param {number} limit - Number of recent commands
   * @returns {Array} Command history
   */
  getHistory(limit = 10) {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Clear command history
   */
  clearHistory() {
    this.commandHistory = [];
  }

  /**
   * Set variable value
   * @param {string} name - Variable name
   * @param {*} value - Variable value
   */
  setVariable(name, value) {
    this.variables.set(name, value);

    // Save variables asynchronously
    if (this.persistenceInitialized) {
      this.saveData().catch(error => {
        console.error('Failed to save variables:', error);
      });
    }
  }

  /**
   * Get variable value
   * @param {string} name - Variable name
   * @returns {*} Variable value
   */
  getVariable(name) {
    return this.variables.get(name);
  }

  /**
   * Get all variables
   * @returns {Object} All variables
   */
  getAllVariables() {
    return Object.fromEntries(this.variables);
  }

  /**
   * Update settings
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  updateSetting(key, value) {
    this.settings[key] = value;

    // Save settings asynchronously
    if (this.persistenceInitialized) {
      this.saveData().catch(error => {
        console.error('Failed to save settings:', error);
      });
    }
  }

  /**
   * Get setting value
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  getSetting(key) {
    return this.settings[key];
  }

  /**
   * Get all settings
   * @returns {Object} All settings
   */
  getAllSettings() {
    return { ...this.settings };
  }
}

// Export singleton instance
export const commandProcessor = new CommandProcessor();
