import { useEffect, useCallback } from 'react';

// Keyboard shortcut configuration
const SHORTCUT_CONFIG = {
  // Command Palette
  'cmd+k': { action: 'open-command-palette', description: 'Open command palette' },
  'ctrl+k': { action: 'open-command-palette', description: 'Open command palette' },

  // Navigation shortcuts
  'ctrl+1': { action: 'navigate', target: 'data', description: 'Go to Data Entry' },
  'ctrl+2': { action: 'navigate', target: 'modeling', description: 'Go to Modeling' },
  'ctrl+3': { action: 'navigate', target: 'analysis', description: 'Go to Analysis' },

  // Action shortcuts
  'ctrl+n': { action: 'create-dcf', description: 'Create new DCF model' },
  'ctrl+s': { action: 'save', description: 'Save current analysis' },
  'ctrl+i': { action: 'import-data', description: 'Import data' },
  'ctrl+e': { action: 'export-data', description: 'Export analysis' },
  'ctrl+f': { action: 'search-data', description: 'Search data' },

  // Analysis shortcuts
  'ctrl+shift+s': { action: 'sensitivity-analysis', description: 'Run sensitivity analysis' },
  'ctrl+shift+m': { action: 'monte-carlo', description: 'Run Monte Carlo simulation' },

  // View shortcuts
  'ctrl+shift+i': { action: 'toggle-insights', description: 'Toggle insights sidebar' },
  'f1': { action: 'help', description: 'Open help' },

  // Quick access
  'alt+1': { action: 'quick-company', company: 'AAPL', description: 'Quick Apple analysis' },
  'alt+2': { action: 'quick-company', company: 'MSFT', description: 'Quick Microsoft analysis' },
  'alt+3': { action: 'quick-company', company: 'GOOGL', description: 'Quick Google analysis' },
  'alt+4': { action: 'quick-company', company: 'AMZN', description: 'Quick Amazon analysis' }
};

export const useKeyboardShortcuts = (handlers = {}) => {
  // Normalize key combination
  const normalizeKey = useCallback((event) => {
    const parts = [];

    if (event.metaKey || event.ctrlKey) {
      parts.push(event.metaKey ? 'cmd' : 'ctrl');
    }
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    // Handle special keys
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'escape') key = 'esc';
    if (key === 'arrowup') key = 'up';
    if (key === 'arrowdown') key = 'down';
    if (key === 'arrowleft') key = 'left';
    if (key === 'arrowright') key = 'right';

    parts.push(key);

    return parts.join('+');
  }, []);

  // Check if element should receive shortcuts
  const shouldHandleShortcut = useCallback((target) => {
    // Don't handle shortcuts when typing in inputs, textareas, or contenteditable elements
    const tagName = target.tagName.toLowerCase();
    const isEditable = target.contentEditable === 'true';
    const isInput = ['input', 'textarea', 'select'].includes(tagName);

    return !isInput && !isEditable;
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event) => {
    // Check if we should handle this shortcut
    if (!shouldHandleShortcut(event.target)) {
      return;
    }

    const keyCombo = normalizeKey(event);
    const shortcut = SHORTCUT_CONFIG[keyCombo];

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();

      // Call the appropriate handler
      const handler = handlers[shortcut.action];
      if (handler) {
        handler(shortcut);
      } else {
        console.warn(`No handler found for shortcut action: ${shortcut.action}`);
      }
    }
  }, [normalizeKey, shouldHandleShortcut, handlers]);

  // Register global keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  // Get all shortcuts for help display
  const getAllShortcuts = useCallback(() => {
    return Object.entries(SHORTCUT_CONFIG).map(([key, config]) => ({
      key,
      ...config
    }));
  }, []);

  // Get shortcuts by category
  const getShortcutsByCategory = useCallback(() => {
    const categories = {
      general: [],
      navigation: [],
      analysis: [],
      data: [],
      view: [],
      quick: []
    };

    Object.entries(SHORTCUT_CONFIG).forEach(([key, config]) => {
      const shortcut = { key, ...config };

      if (config.action === 'navigate') {
        categories.navigation.push(shortcut);
      } else if (config.action.includes('analysis') || config.action === 'create-dcf' || config.action === 'monte-carlo') {
        categories.analysis.push(shortcut);
      } else if (config.action.includes('data') || config.action === 'import-data' || config.action === 'export-data') {
        categories.data.push(shortcut);
      } else if (config.action.includes('toggle') || config.action === 'help') {
        categories.view.push(shortcut);
      } else if (config.action === 'quick-company') {
        categories.quick.push(shortcut);
      } else {
        categories.general.push(shortcut);
      }
    });

    return categories;
  }, []);

  // Format key combination for display
  const formatKeyCombo = useCallback((keyCombo) => {
    return keyCombo
      .split('+')
      .map(key => {
        switch (key) {
          case 'cmd': return '⌘';
          case 'ctrl': return 'Ctrl';
          case 'alt': return 'Alt';
          case 'shift': return 'Shift';
          case 'space': return 'Space';
          case 'esc': return 'Esc';
          case 'up': return '↑';
          case 'down': return '↓';
          case 'left': return '←';
          case 'right': return '→';
          default: return key.toUpperCase();
        }
      })
      .join(' + ');
  }, []);

  // Check if a key combination is available
  const isShortcutAvailable = useCallback((keyCombo) => {
    return !SHORTCUT_CONFIG[keyCombo.toLowerCase()];
  }, []);

  // Register a new shortcut (for dynamic shortcuts)
  const registerShortcut = useCallback((keyCombo, config) => {
    const normalizedKey = keyCombo.toLowerCase();
    if (SHORTCUT_CONFIG[normalizedKey]) {
      console.warn(`Shortcut ${keyCombo} is already registered`);
      return false;
    }

    SHORTCUT_CONFIG[normalizedKey] = config;
    return true;
  }, []);

  return {
    getAllShortcuts,
    getShortcutsByCategory,
    formatKeyCombo,
    isShortcutAvailable,
    registerShortcut
  };
};
