/**
 * Persistent CLI Component
 * Professional financial terminal interface that stays visible across all pages
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  X,
  Copy,
  Download,
  History,
  Settings,
  Zap,
  Search,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { CLICommandProcessor } from '../../services/cliCommandProcessor';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters';

const PersistentCLI = ({ 
  currentContext = {},
  portfolioData = null,
  marketData = null,
  onNavigate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([
    {
      id: 1,
      type: 'system',
      content: 'FinanceAnalyst Pro Terminal v1.0.0 - Type "help" for available commands',
      timestamp: new Date()
    },
    {
      id: 2,
      type: 'info', 
      content: 'Connected to secure backend API • Market data live • Ready for commands',
      timestamp: new Date()
    }
  ]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const cliProcessor = useRef(new CLICommandProcessor());

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input when CLI is expanded
  useEffect(() => {
    if (isExpanded && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded, isMinimized]);

  // Initialize CLI processor with context
  useEffect(() => {
    cliProcessor.current.updateContext({
      currentContext,
      portfolioData,
      marketData,
      onNavigate
    });
  }, [currentContext, portfolioData, marketData, onNavigate]);

  const addOutput = useCallback((content, type = 'output') => {
    const newOutput = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date()
    };
    setOutput(prev => [...prev, newOutput]);
  }, []);

  const handleCommand = async (command) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
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
      }
    } catch (error) {
      addOutput(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

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

  const formatTable = (data) => {
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

  const formatPortfolioData = (data) => {
    if (!data) return 'No portfolio data available';
    
    let output = '📊 PORTFOLIO OVERVIEW\n';
    output += `═══════════════════════════════════════\n`;
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

  const formatMarketData = (data) => {
    if (!data) return 'No market data available';
    
    let output = '📈 MARKET DATA\n';
    output += `═══════════════════════════════════════\n`;
    
    Object.entries(data).forEach(([key, value]) => {
      output += `${key.toUpperCase().padEnd(15)} ${String(value).padStart(12)}\n`;
    });
    
    return output;
  };

  const handleKeyDown = (e) => {
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

  const handleInputChange = (e) => {
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
    const exportText = output.map(item => 
      `[${item.timestamp.toLocaleTimeString()}] ${item.content}`
    ).join('\n');
    
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

  const getOutputTypeColor = (type) => {
    switch (type) {
      case 'command': return 'text-blue-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-cyan-400';
      case 'system': return 'text-gray-400';
      case 'formatted': return 'text-purple-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* CLI Header Bar */}
      <div 
        className="bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-green-400" />
          <span className="text-sm font-mono text-gray-300">
            FinanceAnalyst Pro Terminal
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isMinimized && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearOutput();
                }}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
                title="Clear output"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportOutput();
                }}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
                title="Export output"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
            title={isExpanded ? "Collapse" : "Expand"}
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
            animate={{ height: 400, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-gray-900 border-t border-gray-700 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Output Area */}
              <div 
                ref={outputRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1"
                style={{ maxHeight: '320px' }}
              >
                {output.map((item) => (
                  <div key={item.id} className={`${getOutputTypeColor(item.type)} whitespace-pre-wrap`}>
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
                    <div className="animate-spin w-3 h-3 border border-yellow-400 border-t-transparent rounded-full"></div>
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
                    Use ↑↓ for history • Tab for autocomplete • Type "help" for commands
                  </span>
                  <span>
                    {commandHistory.length} commands in history
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PersistentCLI;
