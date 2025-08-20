import React, { useState, useCallback, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import CommandPalette from '../CommandPalette/CommandPalette';

import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';

/**
 * Keyboard Shortcuts Provider
 * Provides global keyboard shortcuts functionality across the application
 */

const KeyboardShortcutsContext = createContext();

export const useKeyboardShortcutsContext = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  }
  return context;
};

export const KeyboardShortcutsProvider = ({ children }) => {
  const navigate = useNavigate();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [recentCommands, setRecentCommands] = useState([]);
  const [currentContext, setCurrentContext] = useState({});

  // Define command handlers
  const commandHandlers = {
    'open-command-palette': () => setShowCommandPalette(true),
    'navigate': (shortcut) => navigate(shortcut.target),
    'create-dcf': () => {
      navigate('/private-analysis');
      // Trigger DCF creation after navigation
      setTimeout(() => {
        const event = new CustomEvent('create-dcf-model');
        window.dispatchEvent(event);
      }, 100);
    },
    'create-lbo': () => {
      navigate('/private-analysis');
      setTimeout(() => {
        const event = new CustomEvent('create-lbo-model');
        window.dispatchEvent(event);
      }, 100);
    },
    'save': () => {
      const event = new CustomEvent('save-analysis');
      window.dispatchEvent(event);
    },
    'import-data': () => {
      const event = new CustomEvent('import-data');
      window.dispatchEvent(event);
    },
    'export-data': () => {
      const event = new CustomEvent('export-data');
      window.dispatchEvent(event);
    },
    'search-data': () => {
      const event = new CustomEvent('search-data');
      window.dispatchEvent(event);
    },
    'sensitivity-analysis': () => {
      const event = new CustomEvent('run-sensitivity-analysis');
      window.dispatchEvent(event);
    },
    'monte-carlo': () => {
      const event = new CustomEvent('run-monte-carlo');
      window.dispatchEvent(event);
    },
    'toggle-insights': () => {
      const event = new CustomEvent('toggle-insights-sidebar');
      window.dispatchEvent(event);
    },
    'help': () => setShowShortcutsHelp(true),
    'quick-company': (shortcut) => {
      navigate(`/market-analysis?symbol=${shortcut.company}`);
    },
    'open-options-pricer': () => {
      navigate('/advanced-analytics');
      setTimeout(() => {
        const event = new CustomEvent('select-tab', { detail: { tab: 'options' } });
        window.dispatchEvent(event);
      }, 100);
    },
    'open-bond-analytics': () => {
      navigate('/advanced-analytics');
      setTimeout(() => {
        const event = new CustomEvent('select-tab', { detail: { tab: 'fixed-income' } });
        window.dispatchEvent(event);
      }, 100);
    },
    'open-credit-modeling': () => {
      navigate('/advanced-analytics');
      setTimeout(() => {
        const event = new CustomEvent('select-tab', { detail: { tab: 'credit' } });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(commandHandlers);

  // Handle post-execution from the canonical command palette
  // The canonical palette executes via useCommandRegistry. We only track recents here.
  const handlePostExecute = useCallback((command /* , result */) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(cmd => cmd.id !== command.id);
      return [command, ...filtered].slice(0, 5);
    });
  }, []);

  const contextValue = {
    showCommandPalette: () => setShowCommandPalette(true),
    showShortcutsHelp: () => setShowShortcutsHelp(true),
    // Expose a no-op executeCommand for compatibility; palette handles execution
    executeCommand: () => {},
    recentCommands,
    updateCommandContext: (ctx) => setCurrentContext(prev => ({ ...prev, ...ctx }))
  };

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onExecuteCommand={handlePostExecute}
        currentContext={currentContext}
        recentCommands={recentCommands}
      />

      {/* Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </KeyboardShortcutsContext.Provider>
  );
};
