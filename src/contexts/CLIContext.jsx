import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import cliService from '../services/cli/cliService';

const CLIContext = createContext();

// CLI Provider Component
export const CLIProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  // Initialize CLI on mount
  useEffect(() => {
    initializeCLI();

    // Load saved CLI state from localStorage
    loadPersistedState();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    return () => {
      cleanupCLI();
    };
  }, []);

  // Save CLI state when it changes
  useEffect(() => {
    savePersistedState();
  }, [isVisible, isMinimized, commandHistory, activeWorkspace]);

  const initializeCLI = async () => {
    try {
      // Setup CLI service integrations (when services are available)
      // This will be called when the app initializes all services

      console.log('🔧 CLI Context initialized');
    } catch (error) {
      console.error('Failed to initialize CLI context:', error);
    }
  };

  const cleanupCLI = () => {
    // Cleanup CLI resources
    console.log('🧹 CLI Context cleaned up');
  };

  const loadPersistedState = () => {
    try {
      const savedState = localStorage.getItem('fa_cli_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        setIsVisible(state.isVisible || false);
        setIsMinimized(state.isMinimized || false);
        setCommandHistory(state.commandHistory || []);
        setActiveWorkspace(state.activeWorkspace || null);
      }
    } catch (error) {
      console.error('Failed to load persisted CLI state:', error);
    }
  };

  const savePersistedState = () => {
    try {
      const state = {
        isVisible,
        isMinimized,
        commandHistory,
        activeWorkspace,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('fa_cli_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save CLI state:', error);
    }
  };

  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + ` to toggle CLI
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        toggleCLI();
      }

      // F12 to toggle CLI (alternative shortcut)
      if (e.key === 'F12') {
        e.preventDefault();
        toggleCLI();
      }

      // Ctrl/Cmd + Shift + C to toggle CLI
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        toggleCLI();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  // CLI Control Methods
  const toggleCLI = useCallback(() => {
    setIsVisible(prev => !prev);
    setIsMinimized(false); // Reset minimized state when toggling
  }, []);

  const showCLI = useCallback(() => {
    setIsVisible(true);
    setIsMinimized(false);
  }, []);

  const hideCLI = useCallback(() => {
    setIsVisible(false);
  }, []);

  const minimizeCLI = useCallback((minimized) => {
    setIsMinimized(minimized);
  }, []);

  const maximizeCLI = useCallback((fullscreen) => {
    setIsFullscreen(fullscreen);
  }, []);

  // Command Execution
  const executeCommand = useCallback(async (command) => {
    try {
      setLastCommand(command);

      // Add to command history
      setCommandHistory(prev => [...prev, {
        command,
        timestamp: new Date().toISOString(),
        success: true
      }]);

      // Execute command via CLI service
      const result = await cliService.executeCommand(command, {
        activeWorkspace,
        userContext: getCurrentUserContext()
      });

      return result;
    } catch (error) {
      console.error('CLI command execution error:', error);

      // Add failed command to history
      setCommandHistory(prev => [...prev, {
        command,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      }]);

      throw error;
    }
  }, [activeWorkspace]);

  // Workspace Management
  const setCLIWorkspace = useCallback((workspaceId) => {
    setActiveWorkspace(workspaceId);
    cliService.setContext('activeWorkspace', workspaceId);
  }, []);

  // Service Integration Methods
  const integrateService = useCallback((serviceName, service) => {
    cliService.setService(serviceName, service);
    console.log(`🔗 CLI integrated with ${serviceName} service`);
  }, []);

  const getCurrentUserContext = () => {
    // This would typically get user context from auth service
    return {
      userId: 'current_user',
      workspace: activeWorkspace,
      timestamp: new Date().toISOString()
    };
  };

  // Quick Commands
  const quickCommands = {
    // Analysis commands
    analyzeStock: (symbol) => executeCommand(`analyze stock ${symbol}`),
    analyzePortfolio: () => executeCommand('analyze portfolio'),

    // Market data commands
    getQuote: (symbol) => executeCommand(`quote ${symbol}`),
    getChart: (symbol) => executeCommand(`chart ${symbol}`),

    // Portfolio commands
    createPortfolio: (name) => executeCommand(`portfolio create "${name}"`),
    listPortfolios: () => executeCommand('portfolio list'),

    // ESG commands
    getESGScore: (symbol) => executeCommand(`esg score ${symbol}`),
    analyzeESGPortfolio: () => executeCommand('esg portfolio analyze'),

    // Workspace commands
    createWorkspace: (name) => executeCommand(`workspace create "${name}"`),
    listWorkspaces: () => executeCommand('workspace list'),

    // Utility commands
    showHelp: () => executeCommand('help'),
    clearTerminal: () => executeCommand('clear'),
    showHistory: () => executeCommand('history'),
    showTutorial: () => executeCommand('tutorial')
  };

  // CLI State
  const cliState = {
    isVisible,
    isMinimized,
    isFullscreen,
    lastCommand,
    commandHistory,
    activeWorkspace,
    serviceIntegrations: cliService.integrations
  };

  // CLI Actions
  const cliActions = {
    toggleCLI,
    showCLI,
    hideCLI,
    minimizeCLI,
    maximizeCLI,
    executeCommand,
    setCLIWorkspace,
    integrateService,
    ...quickCommands
  };

  const contextValue = {
    ...cliState,
    ...cliActions,
    cliService
  };

  return (
    <CLIContext.Provider value={contextValue}>
      {children}
    </CLIContext.Provider>
  );
};

// Custom hook to use CLI context
export const useCLI = () => {
  const context = useContext(CLIContext);

  if (!context) {
    throw new Error('useCLI must be used within a CLIProvider');
  }

  return context;
};

// CLI Toggle Button Component
export const CLIToggleButton = ({ className = '' }) => {
  const { isVisible, toggleCLI, isMinimized } = useCLI();

  return (
    <button
      onClick={toggleCLI}
      className={`fixed bottom-4 right-4 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 ${
        isVisible && !isMinimized ? 'scale-110' : ''
      } ${className}`}
      aria-label="Toggle CLI Terminal"
      title={`${isVisible ? 'Hide' : 'Show'} CLI Terminal (Ctrl+`)`}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
};

// CLI Status Indicator Component
export const CLIStatusIndicator = ({ className = '' }) => {
  const { isVisible, isMinimized, lastCommand } = useCLI();

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-30 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isMinimized ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
        <span>CLI {isMinimized ? 'Minimized' : 'Active'}</span>
        {lastCommand && (
          <span className="text-slate-400 truncate max-w-32">
            {lastCommand}
          </span>
        )}
      </div>
    </div>
  );
};

export default CLIContext;
