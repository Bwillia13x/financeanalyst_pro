import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal,
  X,
  Minimize2,
  Maximize2,
  Play,
  ChevronUp,
  ChevronDown,
  Settings,
  History,
  Zap,
  Search,
  BookOpen,
  Save
} from 'lucide-react';

import cliService from '../../services/cli/cliService';

const CLITerminal = ({
  isVisible = false,
  onToggle,
  onMinimize,
  onMaximize,
  className = '',
  initialCommands = []
}) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const terminalRef = useRef(null);

  // Initialize CLI on mount
  useEffect(() => {
    if (isVisible) {
      initializeCLI();
      focusInput();
    }
  }, [isVisible]);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = e => {
      if (!isVisible) return;

      // Ctrl/Cmd + ` to toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        onToggle?.();
      }

      // Ctrl/Cmd + L to clear
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleClear();
      }

      // Ctrl/Cmd + C to cancel current command
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const initializeCLI = async () => {
    // Add welcome message
    const welcomeOutput = cliService.createOutput('info', cliService.config.welcomeMessage);
    setOutput([welcomeOutput]);

    // Execute initial commands if provided
    for (const command of initialCommands) {
      await executeCommand(command, false);
    }
  };

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const executeCommand = async (command, addToHistory = true) => {
    if (!command.trim()) return;

    setIsProcessing(true);

    try {
      // Add command to output
      const commandOutput = cliService.createOutput(
        'command',
        `${cliService.config.promptSymbol} ${command}`
      );
      setOutput(prev => [...prev, commandOutput]);

      // Execute command
      const result = await cliService.executeCommand(command);

      // Handle special actions
      if (result.content?.action === 'clear_output') {
        setOutput([]);
        setIsProcessing(false);
        return;
      }

      if (result.content?.action === 'exit_cli') {
        onToggle?.();
        setIsProcessing(false);
        return;
      }

      // Add result to output
      setOutput(prev => [...prev, result]);

      // Add to history if requested
      if (addToHistory) {
        setHistory(prev => [...prev, command]);
      }
    } catch (error) {
      const errorOutput = cliService.createOutput(
        'error',
        error.message || 'Command execution failed'
      );
      setOutput(prev => [...prev, errorOutput]);
    } finally {
      setIsProcessing(false);
      setHistoryIndex(-1);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!input.trim() || isProcessing) return;

    const command = input.trim();
    setInput('');

    await executeCommand(command);
  };

  const handleInputChange = e => {
    const value = e.target.value;
    setInput(value);

    // Auto-complete suggestions
    if (value.length > 0) {
      const suggestions = cliService.getCommandSuggestions(value.split(' ')[0]);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = e => {
    // Handle arrow keys for history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    }

    // Handle tab completion
    else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabComplete();
    }

    // Handle suggestion navigation
    else if (showSuggestions) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter' && suggestions[selectedSuggestion]) {
        e.preventDefault();
        setInput(suggestions[selectedSuggestion] + ' ');
        setShowSuggestions(false);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const navigateHistory = direction => {
    const historyItem = cliService.getHistoryItem(direction);
    if (historyItem) {
      setInput(historyItem);
      setShowSuggestions(false);
    }
  };

  const handleTabComplete = () => {
    if (input) {
      const completed = cliService.autoComplete(input);
      setInput(completed);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setOutput([]);
    setShowSuggestions(false);
  };

  const handleCancel = () => {
    if (isProcessing) {
      setIsProcessing(false);
      const cancelOutput = cliService.createOutput('warning', 'Command cancelled');
      setOutput(prev => [...prev, cancelOutput]);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize?.(!isMinimized);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    onMaximize?.(!isFullscreen);
  };

  const getOutputClassName = outputType => {
    switch (outputType) {
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'command':
        return 'text-purple-400';
      default:
        return 'text-slate-300';
    }
  };

  const formatTimestamp = timestamp => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!isVisible) return null;

  const terminalClasses = `
    fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden
    ${
      isFullscreen
        ? 'inset-4 w-auto h-auto'
        : isMinimized
          ? 'bottom-4 right-4 w-96 h-12'
          : 'bottom-4 right-4 w-96 h-96'
    }
    ${className}
  `;

  return (
    <div ref={terminalRef} className={terminalClasses}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-white font-medium text-sm">FinanceAnalyst CLI</span>
          {isProcessing && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">Processing...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
            aria-label={isMinimized ? 'Restore' : 'Minimize'}
          >
            <Minimize2 className="w-3 h-3" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          <button
            onClick={onToggle}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
            aria-label="Close terminal"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {!isMinimized && (
        <>
          {/* Output Area */}
          <div
            ref={outputRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-slate-950 min-h-0"
            style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '300px' }}
          >
            {output.map((item, index) => (
              <div key={item.commandId || index} className="mb-2">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 text-xs whitespace-nowrap">
                    {formatTimestamp(item.timestamp)}
                  </span>
                  <div className={`flex-1 ${getOutputClassName(item.type)}`}>
                    {typeof item.content === 'string'
                      ? item.content.split('\n').map((line, lineIndex) => (
                          <div key={lineIndex} className="whitespace-pre-wrap">
                            {line}
                          </div>
                        ))
                      : JSON.stringify(item.content, null, 2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Auto-complete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`px-3 py-2 cursor-pointer ${
                    index === selectedSuggestion
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => {
                    setInput(suggestion + ' ');
                    setShowSuggestions(false);
                    focusInput();
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-slate-700 bg-slate-900">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <span className="text-green-400 font-mono text-sm whitespace-nowrap">
                {cliService.config.promptSymbol}
              </span>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-0 outline-none text-white font-mono text-sm placeholder-slate-500"
                placeholder="Type a command or 'help' for assistance..."
                disabled={isProcessing}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />

              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Execute command"
              >
                <Play className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => executeCommand('help')}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                title="Help (F1)"
              >
                <BookOpen className="w-3 h-3" />
              </button>

              <button
                onClick={() => executeCommand('history')}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                title="History"
              >
                <History className="w-3 h-3" />
              </button>

              <button
                onClick={handleClear}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                title="Clear (Ctrl+L)"
              >
                <X className="w-3 h-3" />
              </button>

              <div className="flex-1"></div>

              <div className="text-xs text-slate-500">Use ↑↓ for history, Tab for completion</div>
            </div>
          </div>
        </>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div
          className="flex items-center justify-between px-4 py-2 cursor-pointer"
          onClick={toggleMinimize}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-white text-sm">CLI Terminal</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                onToggle();
              }}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
              aria-label="Close terminal"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CLITerminal;
