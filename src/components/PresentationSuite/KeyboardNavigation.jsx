/**
 * Keyboard-First Navigation System
 * Comprehensive keyboard shortcuts for power users to navigate at the speed of thought
 * Professional analysts work faster with keyboard than mouse
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  Search,
  Keyboard,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  // Enter, // not available in lucide-react
  // Escape, // not available in lucide-react
  Hash,
  Zap,
  Navigation,
  Target,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';

const KeyboardNavigation = ({ onNavigate, onExecuteCommand, children }) => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeMode, setActiveMode] = useState('navigation'); // navigation, analysis, modeling
  const commandPaletteRef = useRef(null);
  const searchInputRef = useRef(null);

  // Comprehensive keyboard shortcuts for financial analysis
  const shortcuts = {
    global: {
      'cmd+k': { action: 'openCommandPalette', description: 'Open Command Palette', category: 'Navigation' },
      'cmd+/': { action: 'showShortcuts', description: 'Show Keyboard Shortcuts', category: 'Help' },
      'cmd+shift+n': { action: 'newAnalysis', description: 'New Analysis', category: 'Analysis' },
      'cmd+shift+o': { action: 'openAnalysis', description: 'Open Analysis', category: 'Analysis' },
      'cmd+s': { action: 'saveAnalysis', description: 'Save Analysis', category: 'Analysis' },
      'cmd+z': { action: 'undo', description: 'Undo', category: 'Editing' },
      'cmd+shift+z': { action: 'redo', description: 'Redo', category: 'Editing' },
      'esc': { action: 'closeOverlays', description: 'Close Overlays/Modals', category: 'Navigation' }
    },
    navigation: {
      'g+h': { action: 'goHome', description: 'Go to Dashboard', category: 'Navigation' },
      'g+p': { action: 'goPrivateAnalysis', description: 'Go to Private Analysis', category: 'Navigation' },
      'g+m': { action: 'goMarketData', description: 'Go to Market Data', category: 'Navigation' },
      'g+s': { action: 'goScenarios', description: 'Go to Scenario Analysis', category: 'Navigation' },
      'g+l': { action: 'goLBO', description: 'Go to LBO Modeling', category: 'Navigation' },
      'g+c': { action: 'goComparables', description: 'Go to Comparables', category: 'Navigation' },
      'tab': { action: 'nextSection', description: 'Next Section', category: 'Navigation' },
      'shift+tab': { action: 'prevSection', description: 'Previous Section', category: 'Navigation' }
    },
    analysis: {
      'cmd+enter': { action: 'runAnalysis', description: 'Run/Update Analysis', category: 'Analysis' },
      'cmd+r': { action: 'refreshData', description: 'Refresh Market Data', category: 'Analysis' },
      'cmd+e': { action: 'exportAnalysis', description: 'Export Analysis', category: 'Analysis' },
      'cmd+d': { action: 'duplicateAnalysis', description: 'Duplicate Analysis', category: 'Analysis' },
      'cmd+shift+s': { action: 'saveAsTemplate', description: 'Save as Template', category: 'Analysis' },
      'f2': { action: 'renameAnalysis', description: 'Rename Analysis', category: 'Analysis' },
      'delete': { action: 'deleteAnalysis', description: 'Delete Analysis', category: 'Analysis' }
    },
    modeling: {
      'cmd+m': { action: 'toggleModelingMode', description: 'Toggle Modeling Mode', category: 'Modeling' },
      'cmd+shift+d': { action: 'addDriver', description: 'Add Key Driver', category: 'Modeling' },
      'cmd+shift+a': { action: 'addAssumption', description: 'Add Assumption', category: 'Modeling' },
      'cmd+shift+f': { action: 'addFormula', description: 'Add Formula', category: 'Modeling' },
      'cmd+shift+c': { action: 'copyFormula', description: 'Copy Formula', category: 'Modeling' },
      'cmd+shift+v': { action: 'pasteFormula', description: 'Paste Formula', category: 'Modeling' },
      'f9': { action: 'recalculate', description: 'Recalculate Model', category: 'Modeling' }
    },
    charts: {
      'c+l': { action: 'createLineChart', description: 'Create Line Chart', category: 'Charts' },
      'c+b': { action: 'createBarChart', description: 'Create Bar Chart', category: 'Charts' },
      'c+p': { action: 'createPieChart', description: 'Create Pie Chart', category: 'Charts' },
      'c+a': { action: 'createAreaChart', description: 'Create Area Chart', category: 'Charts' },
      'c+s': { action: 'createScatterChart', description: 'Create Scatter Chart', category: 'Charts' },
      'c+w': { action: 'createWaterfallChart', description: 'Create Waterfall Chart', category: 'Charts' }
    },
    tables: {
      'cmd+t': { action: 'insertTable', description: 'Insert Table', category: 'Tables' },
      'cmd+shift+r': { action: 'addRow', description: 'Add Row', category: 'Tables' },
      'cmd+shift+c': { action: 'addColumn', description: 'Add Column', category: 'Tables' },
      'cmd+minus': { action: 'deleteRow', description: 'Delete Row', category: 'Tables' },
      'cmd+shift+minus': { action: 'deleteColumn', description: 'Delete Column', category: 'Tables' }
    }
  };

  // Commands for the command palette
  const commands = [
    { id: 'new-dcf', title: 'New DCF Analysis', description: 'Create a new DCF valuation model', category: 'Analysis', shortcut: 'cmd+shift+d' },
    { id: 'new-lbo', title: 'New LBO Analysis', description: 'Create a new LBO model', category: 'Analysis', shortcut: 'cmd+shift+l' },
    { id: 'new-comp', title: 'New Comparable Analysis', description: 'Create comparable company analysis', category: 'Analysis', shortcut: 'cmd+shift+c' },
    { id: 'import-data', title: 'Import Financial Data', description: 'Import data from Excel or CSV', category: 'Data', shortcut: 'cmd+i' },
    { id: 'refresh-market', title: 'Refresh Market Data', description: 'Update real-time market data', category: 'Data', shortcut: 'cmd+r' },
    { id: 'export-pdf', title: 'Export to PDF', description: 'Export analysis as PDF report', category: 'Export', shortcut: 'cmd+e' },
    { id: 'export-excel', title: 'Export to Excel', description: 'Export model to Excel workbook', category: 'Export', shortcut: 'cmd+shift+e' },
    { id: 'save-template', title: 'Save as Template', description: 'Save current model as template', category: 'Templates', shortcut: 'cmd+shift+s' },
    { id: 'scenario-analysis', title: 'Scenario Analysis', description: 'Run scenario and sensitivity analysis', category: 'Analysis', shortcut: 'cmd+shift+a' },
    { id: 'monte-carlo', title: 'Monte Carlo Simulation', description: 'Run Monte Carlo simulation', category: 'Analysis', shortcut: 'cmd+shift+m' },
    { id: 'presentation-mode', title: 'Presentation Mode', description: 'Enter presentation-ready view', category: 'Presentation', shortcut: 'cmd+shift+p' },
    { id: 'source-transparency', title: 'Show Data Sources', description: 'View data source transparency', category: 'Data', shortcut: 'cmd+shift+t' }
  ];

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle keyboard events
  const handleKeyDown = useCallback((event) => {
    const key = event.key.toLowerCase();
    const isCmd = event.metaKey || event.ctrlKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;

    // Build shortcut string
    let shortcut = '';
    if (isCmd) shortcut += 'cmd+';
    if (isShift) shortcut += 'shift+';
    if (isAlt) shortcut += 'alt+';
    shortcut += key;

    // Handle command palette
    if (showCommandPalette) {
      switch (key) {
        case 'escape':
          setShowCommandPalette(false);
          setSearchQuery('');
          setSelectedIndex(0);
          event.preventDefault();
          return;
        case 'arrowdown':
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          event.preventDefault();
          return;
        case 'arrowup':
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          event.preventDefault();
          return;
        case 'enter':
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex].id);
            setShowCommandPalette(false);
            setSearchQuery('');
            setSelectedIndex(0);
          }
          event.preventDefault();
          return;
      }
      return;
    }

    // Handle help overlay
    if (showShortcutsHelp && key === 'escape') {
      setShowShortcutsHelp(false);
      event.preventDefault();
      return;
    }

    // Global shortcuts
    const allShortcuts = { ...shortcuts.global, ...shortcuts.navigation, ...shortcuts.analysis, ...shortcuts.modeling, ...shortcuts.charts, ...shortcuts.tables };
    const shortcutConfig = allShortcuts[shortcut];

    if (shortcutConfig) {
      event.preventDefault();
      executeShortcut(shortcutConfig.action);
    }
  }, [showCommandPalette, showShortcutsHelp, searchQuery, selectedIndex, filteredCommands]);

  const executeShortcut = (action) => {
    switch (action) {
      case 'openCommandPalette':
        setShowCommandPalette(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
        break;
      case 'showShortcuts':
        setShowShortcutsHelp(true);
        break;
      case 'closeOverlays':
        setShowCommandPalette(false);
        setShowShortcutsHelp(false);
        setSearchQuery('');
        setSelectedIndex(0);
        break;
      default:
        if (onExecuteCommand) {
          onExecuteCommand(action);
        }
        break;
    }
  };

  const executeCommand = (commandId) => {
    if (onExecuteCommand) {
      onExecuteCommand(commandId);
    }
  };

  // Attach keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus search input when command palette opens
  useEffect(() => {
    if (showCommandPalette && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showCommandPalette]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <>
      {children}

      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-24"
          >
            <motion.div
              ref={commandPaletteRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            >
              {/* Search Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search commands, actions, and features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-lg outline-none placeholder-gray-400"
                  />
                  <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">ESC</kbd>
                </div>
              </div>

              {/* Commands List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.length > 0 ? (
                  <div className="p-2">
                    {filteredCommands.map((command, index) => (
                      <motion.div
                        key={command.id}
                        className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                          index === selectedIndex ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          executeCommand(command.id);
                          setShowCommandPalette(false);
                          setSearchQuery('');
                          setSelectedIndex(0);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              index === selectedIndex ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <Command className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{command.title}</p>
                            <p className="text-sm text-gray-500">{command.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {command.category}
                          </span>
                          {command.shortcut && (
                            <kbd className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              {command.shortcut}
                            </kbd>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No commands found for "{searchQuery}"</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <ArrowUp className="w-3 h-3" />
                      <ArrowDown className="w-3 h-3" />
                      <span>navigate</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1 text-xs border rounded">↵</kbd>
                      <span>select</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1 text-xs border rounded">Esc</kbd>
                      <span>close</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Keyboard className="w-3 h-3" />
                    <span>Press</span>
                    <kbd className="px-1 py-0.5 bg-gray-200 rounded">⌘ /</kbd>
                    <span>for shortcuts</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Keyboard className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                  </div>
                  <button
                    onClick={() => setShowShortcutsHelp(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-600 mt-2">Navigate FinanceAnalyst Pro at the speed of thought</p>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-gray-900 mb-3 capitalize flex items-center">
                        {category === 'global' && <Zap className="w-4 h-4 mr-2" />}
                        {category === 'navigation' && <Navigation className="w-4 h-4 mr-2" />}
                        {category === 'analysis' && <Target className="w-4 h-4 mr-2" />}
                        {category === 'modeling' && <BookOpen className="w-4 h-4 mr-2" />}
                        {category === 'charts' && <Hash className="w-4 h-4 mr-2" />}
                        {category === 'tables' && <Hash className="w-4 h-4 mr-2" />}
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(categoryShortcuts).map(([shortcut, config]) => (
                          <div key={shortcut} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{config.description}</span>
                            <kbd className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border">
                              {shortcut.replace('cmd', '⌘').replace('shift', '⇧').replace('alt', '⌥')}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Command className="w-4 h-4" />
                    <span>Press</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded">⌘ K</kbd>
                    <span>to open command palette</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>Press</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded">ESC</kbd>
                    <span>to close</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Keyboard Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm z-40"
      >
        <div className="flex items-center space-x-2">
          <Keyboard className="w-4 h-4" />
          <span>Press</span>
          <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">⌘ K</kbd>
          <span>for commands</span>
        </div>
      </motion.div>
    </>
  );
};

export default KeyboardNavigation;
