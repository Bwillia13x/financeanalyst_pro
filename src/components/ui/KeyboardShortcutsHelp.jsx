import { X, Command, Search, Zap, KeyboardIcon } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { cn } from '../../utils/cn';

/**
 * Keyboard Shortcuts Help Panel
 * Displays all available shortcuts organized by category
 */

export const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('general');
  const { getShortcutsByCategory, formatKeyCombo } = useKeyboardShortcuts();

  if (!isOpen) return null;

  const shortcuts = getShortcutsByCategory();

  const categories = [
    { id: 'general', label: 'General', icon: Command },
    { id: 'navigation', label: 'Navigation', icon: Search },
    { id: 'analysis', label: 'Analysis', icon: Zap },
    { id: 'data', label: 'Data', icon: KeyboardIcon },
    { id: 'view', label: 'View', icon: Command },
    { id: 'quick', label: 'Quick Access', icon: Zap }
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <KeyboardIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-slate-900 mb-3">Categories</h3>
              <nav className="space-y-1">
                {categories.map(category => {
                  const Icon = category.icon;
                  const shortcutCount = shortcuts[category.id]?.length || 0;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors',
                        activeCategory === category.id
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{category.label}</span>
                      </div>
                      <span className="text-xs text-slate-500">{shortcutCount}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tips */}
            <div className="p-4 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-900 mb-2">Pro Tips</h4>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Use Cmd+K (Ctrl+K) for command palette</li>
                <li>• Hold Shift for additional shortcuts</li>
                <li>• Shortcuts work globally except in text inputs</li>
                <li>• F1 opens context-sensitive help</li>
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {categories.find(c => c.id === activeCategory)?.label} Shortcuts
                </h3>
                <p className="text-sm text-slate-600">
                  {shortcuts[activeCategory]?.length || 0} shortcuts available in this category
                </p>
              </div>

              {shortcuts[activeCategory]?.length > 0 ? (
                <div className="space-y-3">
                  {shortcuts[activeCategory].map((shortcut, index) => (
                    <div
                      key={`${shortcut.key}-${index}`}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 mb-1">
                          {shortcut.description}
                        </div>
                        {shortcut.target && (
                          <div className="text-xs text-slate-500">
                            Target: {shortcut.target}
                          </div>
                        )}
                        {shortcut.company && (
                          <div className="text-xs text-slate-500">
                            Company: {shortcut.company}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <kbd className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-mono text-slate-900">
                          {formatKeyCombo(shortcut.key)}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <KeyboardIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No shortcuts available in this category</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div>
              Press <kbd className="px-2 py-1 bg-white border border-slate-300 rounded">Esc</kbd> to close
            </div>
            <div>
              Total: {Object.values(shortcuts).flat().length} shortcuts
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default KeyboardShortcutsHelp;
