/**
 * Persistent CLI Component
 * Professional financial terminal interface that stays visible across all pages
 * Enhanced with full persistence and state management
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  X,
  Download,
  Zap,
  Save,
  RotateCcw
} from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { CLICommandProcessor } from '../../services/cliCommandProcessor';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

// Persistence keys
const CLI_STORAGE_KEYS = {
  STATE: 'fa_cli_state',
  HISTORY: 'fa_cli_history',
  OUTPUT: 'fa_cli_output',
  SETTINGS: 'fa_cli_settings'
};

const PersistentCLI = ({
  currentContext = {},
  portfolioData = null,
  marketData = null,
  onNavigate,
  isExpanded: externalIsExpanded = false,
  onToggle
}) => {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const [isMinimized, setIsMinimized] = useState(false);
  const [cliHeight, setCliHeight] = useState(() => {
    // Start with 50% of viewport as a reasonable default
    if (typeof window !== 'undefined') return Math.round(window.innerHeight * 0.5);
    return 400;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([
    {
      id: 1,
      type: 'system',
      content: '💻 Valor-IVX Terminal v1.0.0 - Persistent Session Active',
      timestamp: new Date()
    },
    {
      id: 2,
      type: 'info',
      content:
        '🔄 Session persistence enabled • Command history saved • State restored automatically',
      timestamp: new Date()
    },
    {
      id: 3,
      type: 'info',
      content: '📡 Connected to secure backend API • Market data live • Type "help" for commands',
      timestamp: new Date()
    },
    {
      id: 4,
      type: 'info',
      content: '💾 Session data: Auto-saved • Export/Import available • Clear state with caution',
      timestamp: new Date()
    }
  ]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [showResizeHint, setShowResizeHint] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const cliProcessor = useRef(null);
  const saveTimeoutRef = useRef(null);
  const resizeRef = useRef(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const prevHeightRef = useRef(null);

  // Load persisted state on mount
  useEffect(() => {
    loadPersistedState();
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (isRestored) {
      saveStateToStorage();
    }
  }, [isExpanded, isMinimized, cliHeight, commandHistory, output]);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input when CLI is expanded
  useEffect(() => {
    if (isExpanded && !isMinimized && inputRef.current && isRestored) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded, isMinimized, isRestored]);

  const getMaxHeight = useCallback(() => {
    try {
      return Math.max(120, Math.round((typeof window !== 'undefined' ? window.innerHeight : 1000) - 8));
    } catch {
      return 1000;
    }
  }, []);

  const clampHeight = useCallback((h) => {
    const maxH = getMaxHeight();
    const minH = 120; // keep a usable minimum
    return Math.max(minH, Math.min(maxH, h));
  }, [getMaxHeight]);

  // Load CLI height from persisted state
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(CLI_STORAGE_KEYS.STATE);
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.cliHeight && typeof state.cliHeight === 'number') {
          setCliHeight(clampHeight(state.cliHeight));
        } else {
          // initialize with default 50% viewport height
          setCliHeight(clampHeight(Math.round(window.innerHeight * 0.5)));
        }
        if (typeof state.isMaximized === 'boolean') {
          setIsMaximized(state.isMaximized);
        }
        if (!state.resizeHintDismissed) {
          setShowResizeHint(true);
        }
      }
    } catch (error) {
      console.warn('Failed to load CLI height:', error);
    }
  }, [clampHeight]);

  // Re-clamp height on window resize
  useEffect(() => {
    const onResize = () => setCliHeight(h => clampHeight(h));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampHeight]);

  // Mouse event handlers for resizing
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    setIsMaximized(false);
    startYRef.current = e.clientY;
    startHeightRef.current = cliHeight;

    // Add global mouse event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Dismiss resize hint on first interaction
    try {
      const savedState = JSON.parse(localStorage.getItem(CLI_STORAGE_KEYS.STATE) || '{}');
      savedState.resizeHintDismissed = true;
      localStorage.setItem(CLI_STORAGE_KEYS.STATE, JSON.stringify(savedState));
    } catch {}
    setShowResizeHint(false);
  }, [cliHeight]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;

    const deltaY = startYRef.current - e.clientY; // Negative when dragging down
    const newHeight = clampHeight(startHeightRef.current + deltaY);

    setCliHeight(newHeight);
  }, [isResizing, clampHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);

    // Remove global mouse event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Save height to localStorage
    try {
      const savedState = JSON.parse(localStorage.getItem(CLI_STORAGE_KEYS.STATE) || '{}');
      savedState.cliHeight = clampHeight(cliHeight);
      localStorage.setItem(CLI_STORAGE_KEYS.STATE, JSON.stringify(savedState));
    } catch (error) {
      console.warn('Failed to save CLI height:', error);
    }
  }, [cliHeight, clampHeight]);

  // Cleanup mouse event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Initialize CLI processor with context
  useEffect(() => {
    if (cliProcessor.current) {
      cliProcessor.current.updateContext({
        currentContext,
        portfolioData,
        marketData,
        onNavigate
      });
    }
  }, [currentContext, portfolioData, marketData, onNavigate]);

  // Load persisted state
  const loadPersistedState = useCallback(() => {
    try {
      // Load CLI state
      const savedState = localStorage.getItem(CLI_STORAGE_KEYS.STATE);
      if (savedState) {
        const state = JSON.parse(savedState);
        if (externalIsExpanded === undefined) {
          setInternalIsExpanded(state.isExpanded || false);
        }
        setIsMinimized(state.isMinimized || false);
      }

      // Load command history
      const savedHistory = localStorage.getItem(CLI_STORAGE_KEYS.HISTORY);
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setCommandHistory(history);
      }

      // Load output (last 100 entries)
      const savedOutput = localStorage.getItem(CLI_STORAGE_KEYS.OUTPUT);
      if (savedOutput) {
        const parsedOutput = JSON.parse(savedOutput);
        // Convert timestamp strings back to Date objects
        const restoredOutput = parsedOutput.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setOutput(restoredOutput);
      }

      // Initialize CLI processor
      cliProcessor.current = new CLICommandProcessor();

      // Load settings
      const savedSettings = localStorage.getItem(CLI_STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        // Apply any saved settings
        if (settings.theme) {
          document.documentElement.setAttribute('data-theme', settings.theme);
        }
      }

      setIsRestored(true);
      console.log('🔄 CLI state restored successfully');
    } catch (error) {
      console.error('Failed to restore CLI state:', error);
      // Fallback to fresh state
      cliProcessor.current = new CLICommandProcessor();
      setIsRestored(true);
    }
  }, []);

  // Save state to localStorage (debounced)
  const saveStateToStorage = useCallback(() => {
    if (!isRestored) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Save CLI state
        const state = {
          isExpanded,
          isMinimized,
          cliHeight,
          isMaximized,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(CLI_STORAGE_KEYS.STATE, JSON.stringify(state));

        // Save command history (last 500 commands)
        const historyToSave = commandHistory.slice(-500);
        localStorage.setItem(CLI_STORAGE_KEYS.HISTORY, JSON.stringify(historyToSave));

        // Save output (last 100 entries)
        const outputToSave = output.slice(-100);
        localStorage.setItem(CLI_STORAGE_KEYS.OUTPUT, JSON.stringify(outputToSave));

        // Save settings
        const settings = {
          theme: document.documentElement.getAttribute('data-theme') || 'dark',
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem(CLI_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save CLI state:', error);
      }
    }, 1000); // Debounce saves by 1 second
  }, [isExpanded, isMinimized, commandHistory, output, isRestored]);

  const addOutput = useCallback((content, type = 'output') => {
    const newOutput = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date()
    };
    setOutput(prev => [...prev, newOutput]);
  }, []);

  // Enhanced command handling with persistence
  const handleCommand = async command => {
    if (!command.trim()) return;

    // Add command to history (with timestamp for better persistence)
    const commandEntry = {
      command,
      timestamp: new Date().toISOString(),
      success: true
    };

    setCommandHistory(prev => [...prev, commandEntry]);
    setHistoryIndex(-1);

    // Add command to output
    addOutput(`$ ${command}`, 'command');
    setIsProcessing(true);

    try {
      const result = await cliProcessor.current.processCommand(command);

      if (result.success) {
        if (result.output) {
          addOutput(result.output, result.type || 'output');
        }
        if (result.data && result.format) {
          // Handle formatted data output (tables, charts, etc.)
          addOutput(formatCommandOutput(result.data, result.format), 'formatted');
        }
        if (result.navigation) {
          onNavigate?.(result.navigation);
        }
      } else {
        addOutput(result.error || 'Command failed', 'error');
        commandEntry.success = false;
        commandEntry.error = result.error;
      }
    } catch (error) {
      addOutput(`Error: ${error.message}`, 'error');
      commandEntry.success = false;
      commandEntry.error = error.message;
    } finally {
      setIsProcessing(false);
      // Update the command entry in history
      setCommandHistory(prev =>
        prev.map(entry => (entry === commandEntry ? { ...commandEntry } : entry))
      );
    }
  };

  // Clear CLI state (with confirmation)
  const clearCLIState = useCallback(() => {
    if (
      confirm('Are you sure you want to clear all CLI history and output? This cannot be undone.')
    ) {
      setOutput([]);
      setCommandHistory([]);
      setInput('');

      // Clear from localStorage
      Object.values(CLI_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      addOutput('CLI state cleared successfully', 'info');
    }
  }, []);

  // Export CLI session
  const exportSession = useCallback(() => {
    const sessionData = {
      timestamp: new Date().toISOString(),
      commandHistory,
      output,
      settings: {
        theme: document.documentElement.getAttribute('data-theme') || 'dark'
      }
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fa-cli-session-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addOutput('CLI session exported successfully', 'success');
  }, [commandHistory, output]);

  // Import CLI session
  const importSession = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = event => {
          try {
            const sessionData = JSON.parse(event.target.result);

            if (sessionData.commandHistory) {
              setCommandHistory(sessionData.commandHistory);
            }

            if (sessionData.output) {
              const restoredOutput = sessionData.output.map(item => ({
                ...item,
                timestamp: new Date(item.timestamp)
              }));
              setOutput(restoredOutput);
            }

            if (sessionData.settings?.theme) {
              document.documentElement.setAttribute('data-theme', sessionData.settings.theme);
            }

            addOutput('CLI session imported successfully', 'success');
          } catch (error) {
            addOutput(`Failed to import session: ${error.message}`, 'error');
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  }, []);

  // Get persistence status
  const getPersistenceStatus = useCallback(() => {
    try {
      const stateSize = localStorage.getItem(CLI_STORAGE_KEYS.STATE)?.length || 0;
      const historySize = localStorage.getItem(CLI_STORAGE_KEYS.HISTORY)?.length || 0;
      const outputSize = localStorage.getItem(CLI_STORAGE_KEYS.OUTPUT)?.length || 0;

      return {
        isPersisted: stateSize > 0 || historySize > 0 || outputSize > 0,
        totalSize: stateSize + historySize + outputSize,
        lastSaved: JSON.parse(localStorage.getItem(CLI_STORAGE_KEYS.STATE) || '{}').lastUpdated
      };
    } catch {
      return { isPersisted: false, totalSize: 0 };
    }
  }, []);

  const persistenceStatus = getPersistenceStatus();

  const formatCommandOutput = (data, format) => {
    switch (format) {
      case 'table':
        return formatTable(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'portfolio':
        return formatPortfolioData(data);
      case 'market':
        return formatMarketData(data);
      default:
        return data;
    }
  };

  const formatTable = data => {
    if (!Array.isArray(data) || data.length === 0) return 'No data';

    const headers = Object.keys(data[0]);
    const maxWidths = headers.map(header =>
      Math.max(header.length, ...data.map(row => String(row[header] || '').length))
    );

    const headerRow = headers.map((header, i) => header.padEnd(maxWidths[i])).join(' | ');
    const separator = maxWidths.map(width => '-'.repeat(width)).join('-|-');
    const dataRows = data.map(row =>
      headers.map((header, i) => String(row[header] || '').padEnd(maxWidths[i])).join(' | ')
    );

    return [headerRow, separator, ...dataRows].join('\n');
  };

  const formatPortfolioData = data => {
    if (!data) return 'No portfolio data available';

    let output = '📊 PORTFOLIO OVERVIEW\n';
    output += '═══════════════════════════════════════\n';
    output += `Total Value: ${formatCurrency(data.totalValue || 0)}\n`;
    output += `Total Return: ${formatPercentage(data.totalReturn || 0)}\n`;
    output += `Holdings: ${data.holdings?.length || 0}\n\n`;

    if (data.holdings && data.holdings.length > 0) {
      output += 'HOLDINGS:\n';
      data.holdings.forEach(holding => {
        output += `${holding.symbol.padEnd(6)} ${formatCurrency(holding.value || 0).padStart(12)} ${formatPercentage(holding.weight || 0).padStart(8)}\n`;
      });
    }

    return output;
  };

  const formatMarketData = data => {
    if (!data) return 'No market data available';

    let output = '📈 MARKET DATA\n';
    output += '═══════════════════════════════════════\n';

    Object.entries(data).forEach(([key, value]) => {
      output += `${key.toUpperCase().padEnd(15)} ${String(value).padStart(12)}\n`;
    });

    return output;
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(input);
      setInput('');
      setShowSuggestions(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[0]);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = e => {
    const value = e.target.value;
    setInput(value);

    // Generate suggestions
    if (value.trim()) {
      const newSuggestions = cliProcessor.current.getSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const exportOutput = () => {
    const exportText = output
      .map(item => `[${item.timestamp.toLocaleTimeString()}] ${item.content}`)
      .join('\n');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeanalyst-cli-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getOutputTypeColor = type => {
    switch (type) {
      case 'command':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-cyan-400';
      case 'system':
        return 'text-gray-400';
      case 'formatted':
        return 'text-purple-400';
      default:
        return 'text-gray-300';
    }
  };

  // Quick helper to expand CLI to a comfortable default height
  const expandCLI = useCallback(() => {
    const target = clampHeight(Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.5));
    setCliHeight(target);
    try {
      const savedState = JSON.parse(localStorage.getItem(CLI_STORAGE_KEYS.STATE) || '{}');
      savedState.cliHeight = target;
      localStorage.setItem(CLI_STORAGE_KEYS.STATE, JSON.stringify(savedState));
    } catch {}
    if (externalIsExpanded === undefined) {
      setInternalIsExpanded(true);
    } else if (typeof onToggle === 'function') {
      onToggle();
    }
  }, [clampHeight, externalIsExpanded, onToggle]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* CLI Header Bar */}
      <div
        className="bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center justify-between cursor-pointer select-none"
        onClick={() => {
          // Clicking the bottom ribbon should ENLARGE to a reasonable size
          if (!isExpanded) {
            // Set a default reasonable height (50% of viewport), and persist it
            expandCLI();
          } else {
            // If already expanded, do not collapse on ribbon click; keep size
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} terminal`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (externalIsExpanded === undefined) {
              setInternalIsExpanded(!isExpanded);
            }
          }
        }}
      >
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-green-400" />
          <span className="text-sm font-mono text-gray-300">Valor-IVX Terminal</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline text-[11px] text-gray-500">Ctrl/⌘ + ` to toggle</span>
          {/* Persistence Status Indicator */}
          <div className="flex items-center space-x-1">
            {persistenceStatus.isPersisted && (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">
                  {(persistenceStatus.totalSize / 1024).toFixed(1)}KB
                </span>
              </>
            )}
          </div>

          {!isMinimized && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  clearOutput();
                }}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
                title="Clear output"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  exportOutput();
                }}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
                title="Export output"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  exportSession();
                }}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
                title="Export session"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  importSession();
                }}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
                title="Import session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  clearCLIState();
                }}
                className="p-1 hover:bg-red-800 rounded text-red-400 hover:text-red-300"
                title="Clear CLI state (irreversible)"
              >
                <Zap className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={e => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
            title={isExpanded ? 'Collapse' : 'Expand'}
            onClick={e => {
              e.stopPropagation();
              setIsMaximized(false);
              if (externalIsExpanded === undefined) {
                setInternalIsExpanded(!isExpanded);
              } else if (typeof onToggle === 'function') {
                onToggle();
              }
            }}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CLI Interface */}
      <AnimatePresence>
        {isExpanded && !isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: cliHeight, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-gray-900 border-t border-gray-700 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Output Area */}
              <div
                ref={outputRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1"
                style={{ maxHeight: `${cliHeight - 120}px` }}
              >
                {output.map(item => (
                  <div
                    key={item.id}
                    className={`${getOutputTypeColor(item.type)} whitespace-pre-wrap`}
                  >
                    {item.type === 'formatted' ? (
                      <div className="bg-gray-800 p-3 rounded border border-gray-700 overflow-x-auto">
                        <pre className="text-xs text-gray-300">{item.content}</pre>
                      </div>
                    ) : (
                      item.content
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="text-yellow-400 flex items-center space-x-2">
                    <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="border-t border-gray-700 bg-gray-800 p-2">
                  <div className="text-xs text-gray-400 mb-1">Suggestions (Tab to complete):</div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 6).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInput(suggestion);
                          setShowSuggestions(false);
                          inputRef.current?.focus();
                        }}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-700 p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 font-mono">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter financial command... (type 'help' for commands)"
                    className="flex-1 bg-transparent text-gray-300 font-mono outline-none placeholder-gray-500"
                    disabled={isProcessing}
                  />
                  {isProcessing && (
                    <div className="text-yellow-400">
                      <Zap className="w-4 h-4 animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                  <span>
                    Use ↑↓ for history • Tab for autocomplete • Type &quot;help&quot; for commands
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${persistenceStatus.isPersisted ? 'bg-green-400' : 'bg-gray-400'}`}
                      />
                      <span>{persistenceStatus.isPersisted ? 'Persisted' : 'Not persisted'}</span>
                    </span>
                    <span>{commandHistory.length} commands</span>
                    {persistenceStatus.lastSaved && (
                      <span
                        title={`Last saved: ${new Date(persistenceStatus.lastSaved).toLocaleString()}`}
                      >
                        💾
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resize Handle */}
            <div
              ref={resizeRef}
              className={`absolute top-0 left-0 right-0 h-2 cursor-row-resize bg-gray-700 hover:bg-blue-600 transition-colors ${
                isResizing ? 'bg-blue-600' : ''
              }`}
              onMouseDown={handleMouseDown}
              onDoubleClick={(e) => {
                e.stopPropagation();
                const maxH = getMaxHeight();
                if (!isMaximized) {
                  // Save current height, maximize
                  prevHeightRef.current = cliHeight;
                  const target = clampHeight(maxH);
                  setCliHeight(target);
                  setIsMaximized(true);
                  try {
                    const savedState = JSON.parse(localStorage.getItem(CLI_STORAGE_KEYS.STATE) || '{}');
                    savedState.cliHeight = target;
                    savedState.isMaximized = true;
                    localStorage.setItem(CLI_STORAGE_KEYS.STATE, JSON.stringify(savedState));
                  } catch {}
                } else {
                  // Restore previous height
                  const restore = clampHeight(prevHeightRef.current || Math.round(window.innerHeight * 0.5));
                  setCliHeight(restore);
                  setIsMaximized(false);
                  try {
                    const savedState = JSON.parse(localStorage.getItem(CLI_STORAGE_KEYS.STATE) || '{}');
                    savedState.cliHeight = restore;
                    savedState.isMaximized = false;
                    localStorage.setItem(CLI_STORAGE_KEYS.STATE, JSON.stringify(savedState));
                  } catch {}
                }
                // Dismiss hint if showing
                setShowResizeHint(false);
              }}
              title="Drag to resize CLI"
            >
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-0.5 bg-gray-400 rounded-full"></div>
              </div>
            </div>

            {/* One-time Resize Hint */}
            {showResizeHint && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-100 text-xs px-2 py-1 rounded shadow border border-gray-700">
                Drag the bar to resize
                <button
                  onClick={() => {
                    try {
                      const savedState = JSON.parse(localStorage.getItem(CLI_STORAGE_KEYS.STATE) || '{}');
                      savedState.resizeHintDismissed = true;
                      localStorage.setItem(CLI_STORAGE_KEYS.STATE, JSON.stringify(savedState));
                    } catch {}
                    setShowResizeHint(false);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-200"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Floating Tab to reopen CLI */}
      {!isExpanded && (
        <button
          className="fixed bottom-14 right-6 z-40 px-3 py-1.5 rounded-full border border-gray-600 bg-gray-900 text-gray-100 shadow hover:bg-gray-800 transition-colors"
          onClick={expandCLI}
          aria-label="Open CLI"
          title="Open CLI (Ctrl/⌘ + `)"
        >
          <span className="font-mono text-sm">CLI</span>
          <span className="ml-2 hidden sm:inline text-[10px] text-gray-400">Ctrl/⌘+`</span>
        </button>
      )}
    </div>
  );
};

export default PersistentCLI;
