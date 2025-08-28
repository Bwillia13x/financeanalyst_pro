import React, { useState, useRef, useEffect } from 'react';

import Icon from '../../../components/AppIcon';
import { commandProcessor } from '../../../services/commandProcessor';
import { commandRegistry } from '../../../services/commandRegistry';
import { dataFetchingService } from '../../../services/dataFetching';
import { persistenceManager } from '../../../services/persistence/PersistenceManager';
// Import command initializer to ensure commands are registered
import '../../../services/commandInitializer';

const TerminalInterface = ({ onCommandExecute, calculationResults: _calculationResults }) => {
  const [commands, setCommands] = useState([
    {
      id: 1,
      type: 'system',
      content: 'FinanceAnalyst Pro Terminal v2.4.0 - Enhanced Command Suite Ready',
      timestamp: new Date()
    },
    {
      id: 2,
      type: 'system',
      content:
        'Type "HELP()" for available commands or start with DCF(AAPL), PORTFOLIO([AAPL,MSFT], [0.5,0.5])',
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const commandProcessorRef = useRef(commandProcessor);

  // Get available commands from registry for suggestions
  const getAvailableCommands = () => {
    const allCommands = commandRegistry.getAllCommands();
    const commandInfos = allCommands.map(cmdName => {
      const info = commandRegistry.getCommandInfo(cmdName);
      return info ? info.usage : cmdName;
    });
    return commandInfos;
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Initialize persistence layer
    const initializePersistence = async () => {
      try {
        await persistenceManager.initialize();
        console.log('✅ Persistence layer initialized in terminal');
      } catch (error) {
        console.error('❌ Failed to initialize persistence in terminal:', error);
      }
    };

    initializePersistence();
  }, []);

  const handleInputChange = e => {
    const value = e.target.value;
    setCurrentInput(value);

    if (value.length > 0) {
      const availableCommands = getAvailableCommands();
      const suggestions = commandRegistry.getSuggestions(value);
      const commandSuggestions = suggestions.map(s => s.usage);

      // Also include partial matches from available commands
      const partialMatches = availableCommands.filter(
        cmd => cmd.toLowerCase().includes(value.toLowerCase()) && !commandSuggestions.includes(cmd)
      );

      const allSuggestions = [...commandSuggestions, ...partialMatches];
      setSuggestions(allSuggestions.slice(0, 8));
      setShowSuggestions(allSuggestions.length > 0);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1));
    } else if (e.key === 'Tab' && showSuggestions) {
      e.preventDefault();
      setCurrentInput(suggestions[selectedSuggestion]);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const executeCommand = async () => {
    if (!currentInput.trim()) return;

    const newCommand = {
      id: commands.length + 1,
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setCommands(prev => [...prev, newCommand]);
    setIsLoading(true);
    setCurrentInput('');
    setShowSuggestions(false);

    try {
      // Use the new command processor
      const context = {
        demoMode: dataFetchingService.demoMode,
        showLoading: message => {
          const loadingCommand = {
            id: commands.length + 2,
            type: 'info',
            content: message,
            timestamp: new Date()
          };
          setCommands(prev => [...prev, loadingCommand]);
        }
      };

      const response = await commandProcessorRef.current.processCommand(currentInput, context);

      // Handle special actions
      if (response.action === 'clear') {
        setCommands([
          {
            id: 1,
            type: 'system',
            content: 'Terminal cleared',
            timestamp: new Date()
          }
        ]);
        return;
      }

      const responseCommand = {
        id: commands.length + 2,
        type: response.type,
        content: response.content,
        timestamp: new Date(),
        data: response.data
      };

      setCommands(prev => [...prev, responseCommand]);

      if (onCommandExecute) {
        onCommandExecute(currentInput, response);
      }
    } catch (error) {
      const errorCommand = {
        id: commands.length + 2,
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setCommands(prev => [...prev, errorCommand]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSuggestion = suggestion => {
    setCurrentInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-green-400 font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Icon name="Terminal" size={16} className="text-green-400" />
          <span className="text-green-400 font-medium">Financial Terminal</span>
          <span className="text-xs text-blue-400">• Enhanced Command Suite</span>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}
          />
          <span className="text-xs text-gray-400">{isLoading ? 'Processing...' : 'Connected'}</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        onClick={() => inputRef.current?.focus()}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        {commands.map(command => (
          <div key={command.id} className="space-y-1">
            <div className="flex items-start space-x-2">
              {command.type === 'user' && (
                <span className="text-blue-400 shrink-0">analyst@finpro:~$</span>
              )}
              {command.type === 'system' && (
                <Icon name="Info" size={14} className="text-yellow-400 mt-0.5 shrink-0" />
              )}
              {command.type === 'success' && (
                <Icon name="CheckCircle" size={14} className="text-green-400 mt-0.5 shrink-0" />
              )}
              {command.type === 'error' && (
                <Icon name="XCircle" size={14} className="text-red-400 mt-0.5 shrink-0" />
              )}
              {command.type === 'warning' && (
                <Icon name="AlertTriangle" size={14} className="text-yellow-400 mt-0.5 shrink-0" />
              )}
              {command.type === 'info' && (
                <Icon name="Info" size={14} className="text-blue-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <pre className="whitespace-pre-wrap break-words">{command.content}</pre>
                {command.data && (
                  <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
                    <div className="text-xs text-gray-400">
                      Real-time calculation data available • Analysis:{' '}
                      {command.data.analysis || 'financial'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-yellow-400">
            <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
            <span>Processing command...</span>
          </div>
        )}

        {/* Input Line */}
        <div className="flex items-center space-x-2 relative">
          <span className="text-blue-400 shrink-0">analyst@finpro:~$</span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-green-400 outline-none border-none"
              placeholder="Enter command (e.g., DCF(AAPL), PORTFOLIO([AAPL,MSFT], [0.5,0.5]))..."
              autoComplete="off"
              disabled={isLoading}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      index === selectedSuggestion
                        ? 'bg-gray-700 text-green-400'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => selectSuggestion(suggestion)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectSuggestion(suggestion);
                      }
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalInterface;
