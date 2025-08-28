import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  ArrowRight,
  Clock,
  Star,
  TrendingUp,
  Calculator,
  FileText,
  Download,
  Upload,
  BarChart3,
  Users,
  Zap,
  Globe,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

import { useCommandRegistry } from '../../hooks/useCommandRegistry';

const CommandPalette = ({
  isOpen,
  onClose,
  onExecuteCommand,
  currentContext = {},
  recentCommands = [],
  userPreferences: _userPreferences = {},
  className: _className
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [_commandHistory, setCommandHistory] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const dialogRef = useRef(null);
  const openTimestampRef = useRef(null);
  const monitoringRef = useRef(null);

  // Lazy-load monitoring utilities to keep them out of primary chunks
  const getMonitoring = async () => {
    if (monitoringRef.current) return monitoringRef.current;
    try {
      const mod = await import('../../utils/monitoring');
      const api = mod?.default || mod;
      monitoringRef.current = api;
      return api;
    } catch (_e) {
      // Fallback no-op implementation to avoid conditional checks
      const noop = { trackEvent: () => {}, trackError: () => {} };
      monitoringRef.current = noop;
      return noop;
    }
  };

  // Get command registry and search functionality
  const {
    searchCommands,
    executeCommand,
    getContextualCommands,
    getCommandCategories: _getCommandCategories,
    learnFromUsage
  } = useCommandRegistry(currentContext);

  // Search results based on query
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      // Show recent commands and contextual suggestions when no query
      const recent = recentCommands.slice(0, 3).map(cmd => ({ ...cmd, category: 'recent' }));
      const contextual = getContextualCommands()
        .slice(0, 4)
        .map(cmd => ({ ...cmd, category: 'suggested' }));
      const popular = [
        {
          id: 'new-dcf',
          title: 'Create New DCF Model',
          description: 'Start a new discounted cash flow valuation',
          icon: Calculator,
          category: 'popular',
          keywords: ['dcf', 'valuation', 'model', 'new']
        },
        {
          id: 'sensitivity-analysis',
          title: 'Run Sensitivity Analysis',
          description: 'Test assumptions with sensitivity analysis',
          icon: TrendingUp,
          category: 'popular',
          keywords: ['sensitivity', 'analysis', 'wacc', 'assumptions']
        }
      ];

      return [...recent, ...contextual, ...popular];
    }

    return searchCommands(query);
  }, [query, recentCommands, searchCommands, getContextualCommands]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
      // Mark palette open time and emit telemetry
      openTimestampRef.current = performance.now();
      getMonitoring()
        .then(mon => {
          try {
            mon.trackEvent('command_palette_open', {
              page: currentContext?.page,
              context: currentContext,
              recentCount: recentCommands?.length || 0
            });
          } catch (e) {
            console.warn('Monitoring: command_palette_open failed', e);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Keyboard navigation and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = e => {
      // Arrow/Enter/Escape behavior
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
            break;
          case 'Enter':
            e.preventDefault();
            if (searchResults[selectedIndex]) {
              handleExecuteCommand(searchResults[selectedIndex]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            onClose();
            break;
          default:
            break;
        }
        return;
      }

      // Focus trap for Tab/Shift+Tab inside dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableSelectors = [
          'a[href]',
          'button:not([disabled])',
          'textarea:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          '[tabindex]:not([tabindex="-1"])'
        ].join(',');
        const focusables = Array.from(
          dialogRef.current.querySelectorAll(focusableSelectors)
        ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, searchResults, onClose]);

  // Execute command
  const handleExecuteCommand = async command => {
    try {
      // Add to command history
      setCommandHistory(prev => [command, ...prev.slice(0, 9)]);

      // Learn from usage
      learnFromUsage(command.id, query);

      // Execute the command
      const execStart = performance.now();
      const result = await executeCommand(command.id, command.params);
      const execEnd = performance.now();

      // Emit telemetry for command execution
      try {
        const openedAt = openTimestampRef.current || execStart;
        const mon = await getMonitoring();
        mon.trackEvent('command_execute', {
          commandId: command.id,
          query,
          page: currentContext?.page,
          context: currentContext,
          latencyOpenMs: Math.max(0, Math.round(execStart - openedAt)),
          execDurationMs: Math.max(0, Math.round(execEnd - execStart))
        });
      } catch (e) {
        console.warn('Monitoring: command_execute failed', e);
      }

      // Notify parent component
      if (onExecuteCommand) {
        onExecuteCommand(command, result);
      }

      // Close palette
      onClose();
    } catch (error) {
      console.error('Command execution failed:', error);
      try {
        const mon = await getMonitoring();
        mon.trackError(error, 'command_execution', {
          commandId: command?.id,
          page: currentContext?.page
        });
      } catch (e) {
        console.warn('Monitoring: trackError failed', e);
      }
      // Could show error toast here
    }
  };

  // Get category icon
  const getCategoryIcon = category => {
    switch (category) {
      case 'recent':
        return Clock;
      case 'suggested':
        return Star;
      case 'popular':
        return TrendingUp;
      case 'navigation':
        return ArrowRight;
      case 'analysis':
        return Calculator;
      case 'data':
        return FileText;
      case 'export':
        return Download;
      case 'import':
        return Upload;
      case 'charts':
        return BarChart3;
      case 'collaboration':
        return Users;
      case 'automation':
        return Zap;
      case 'external':
        return Globe;
      case 'settings':
        return Settings;
      case 'help':
        return HelpCircle;
      default:
        return Command;
    }
  };

  // Get category color
  const getCategoryColor = category => {
    switch (category) {
      case 'recent':
        return 'text-blue-500';
      case 'suggested':
        return 'text-amber-500';
      case 'popular':
        return 'text-emerald-500';
      case 'navigation':
        return 'text-slate-500';
      case 'analysis':
        return 'text-purple-500';
      case 'data':
        return 'text-indigo-500';
      case 'export':
        return 'text-green-500';
      case 'import':
        return 'text-orange-500';
      case 'charts':
        return 'text-pink-500';
      case 'collaboration':
        return 'text-cyan-500';
      case 'automation':
        return 'text-red-500';
      case 'external':
        return 'text-gray-500';
      case 'settings':
        return 'text-slate-600';
      case 'help':
        return 'text-blue-600';
      default:
        return 'text-slate-500';
    }
  };

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1200] flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          data-testid="command-palette"
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-4 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
          ref={dialogRef}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Command size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 id="command-palette-title" className="font-semibold text-slate-900">
                Command Palette
              </h3>
              <p className="text-xs text-slate-500">
                Type to search commands, or use natural language
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Esc</kbd>
              <span>to close</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative p-4 border-b border-slate-100">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a command or just describe what you'd like to do..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500"
              />
            </div>

            {/* Quick tips */}
            {!query && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-slate-500">Try:</span>
                {[
                  'New DCF for AAPL',
                  'Run sensitivity on WACC',
                  'Export to PDF',
                  'Find revenue data'
                ].map(tip => (
                  <button
                    key={tip}
                    onClick={() => setQuery(tip)}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    &quot;{tip}&quot;
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto" ref={listRef}>
            {searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="p-3 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Search size={24} className="text-slate-400" />
                </div>
                <h4 className="font-medium text-slate-900 mb-2">No commands found</h4>
                <p className="text-sm text-slate-500">
                  Try a different search term or use natural language to describe what you want to
                  do.
                </p>
              </div>
            ) : (
              <div className="py-2">
                {searchResults.map((command, index) => {
                  const CategoryIcon = getCategoryIcon(command.category);
                  const CommandIcon = command.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <motion.div
                      key={`${command.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 ${
                        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : 'hover:bg-slate-50'
                      }`}
                      role="option"
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => handleExecuteCommand(command)}
                      onFocus={() => setSelectedIndex(index)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleExecuteCommand(command);
                        }
                      }}
                      data-testid="command-result"
                      data-command-id={command.id}
                    >
                      {/* Category indicator */}
                      <div
                        className={`p-1.5 rounded-md ${
                          isSelected ? 'bg-blue-100' : 'bg-slate-100'
                        }`}
                      >
                        <CategoryIcon size={12} className={getCategoryColor(command.category)} />
                      </div>

                      {/* Command icon */}
                      {CommandIcon && (
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? 'bg-blue-100' : 'bg-slate-100'
                          }`}
                        >
                          <CommandIcon
                            size={16}
                            className={isSelected ? 'text-blue-600' : 'text-slate-600'}
                          />
                        </div>
                      )}

                      {/* Command details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`font-medium truncate ${
                              isSelected ? 'text-blue-900' : 'text-slate-900'
                            }`}
                          >
                            {highlightMatch(command.title, query)}
                          </h4>
                          {command.shortcut && (
                            <div className="flex items-center gap-1">
                              {command.shortcut.split('+').map((key, idx) => (
                                <kbd
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-xs rounded"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-sm truncate ${
                            isSelected ? 'text-blue-700' : 'text-slate-500'
                          }`}
                        >
                          {highlightMatch(command.description, query)}
                        </p>

                        {/* Command metadata */}
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {command.category}
                          </span>
                          {command.usageCount && (
                            <span className="text-xs text-slate-400">
                              Used {command.usageCount} times
                            </span>
                          )}
                          {command.isNew && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Execute indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-blue-500"
                        >
                          <ArrowRight size={16} />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Enter</kbd>
                <span>Execute</span>
              </div>
            </div>
            <div className="text-slate-400">
              {searchResults.length} command{searchResults.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default CommandPalette;
