import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Keyboard,
  Command,
  Navigation,
  Calculator,
  FileText,
  Eye,
  Zap,
  HelpCircle
} from 'lucide-react';
import React from 'react';

import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const CommandHelpModal = ({ isOpen, onClose }) => {
  const { getShortcutsByCategory, formatKeyCombo } = useKeyboardShortcuts();

  const shortcutCategories = getShortcutsByCategory();

  const categoryConfig = {
    general: {
      title: 'General',
      icon: Command,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    navigation: {
      title: 'Navigation',
      icon: Navigation,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    analysis: {
      title: 'Analysis',
      icon: Calculator,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    data: {
      title: 'Data',
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    view: {
      title: 'View',
      icon: Eye,
      color: 'text-teal-500',
      bgColor: 'bg-teal-50'
    },
    quick: {
      title: 'Quick Access',
      icon: Zap,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Keyboard size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Keyboard Shortcuts</h2>
                <p className="text-sm text-slate-600">Speed up your workflow with these shortcuts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Command Palette Info */}
            <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Command size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Command Palette</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Access any function instantly with natural language commands. Press{' '}
                    <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
                      ⌘K
                    </kbd>{' '}
                    or{' '}
                    <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
                      Ctrl+K
                    </kbd>{' '}
                    to open.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-blue-700">
                      <span className="w-2 h-2 bg-blue-400 rounded-full" />
                      "New DCF for AAPL"
                    </div>
                    <div className="flex items-center gap-2 text-blue-700">
                      <span className="w-2 h-2 bg-blue-400 rounded-full" />
                      "Run sensitivity on WACC"
                    </div>
                    <div className="flex items-center gap-2 text-blue-700">
                      <span className="w-2 h-2 bg-blue-400 rounded-full" />
                      "Export to PDF"
                    </div>
                    <div className="flex items-center gap-2 text-blue-700">
                      <span className="w-2 h-2 bg-blue-400 rounded-full" />
                      "Find revenue data"
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shortcut Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(shortcutCategories).map(([categoryKey, shortcuts]) => {
                if (shortcuts.length === 0) return null;

                const config = categoryConfig[categoryKey];
                const CategoryIcon = config.icon;

                return (
                  <div key={categoryKey} className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <CategoryIcon size={16} className={config.color} />
                      </div>
                      <h3 className="font-semibold text-slate-900">{config.title}</h3>
                    </div>

                    <div className="space-y-2">
                      {shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 text-sm">
                              {shortcut.description}
                            </div>
                            {shortcut.target && (
                              <div className="text-xs text-slate-500 mt-1">
                                Target: {shortcut.target}
                              </div>
                            )}
                            {shortcut.company && (
                              <div className="text-xs text-slate-500 mt-1">
                                Company: {shortcut.company}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-mono text-slate-700 shadow-sm">
                              {formatKeyCombo(shortcut.key)}
                            </kbd>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tips Section */}
            <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <HelpCircle size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Pro Tips</h3>
                  <ul className="space-y-2 text-sm text-amber-800">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      <span>Use natural language in the command palette: "Create a chart for revenue trends"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      <span>The command palette learns from your usage and shows relevant suggestions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      <span>All commands are context-aware based on your current workspace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      <span>Recent commands are prioritized and easily accessible</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              Press <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">Esc</kbd> to close
            </div>
            <div className="text-sm text-slate-500">
              {Object.values(shortcutCategories).flat().length} shortcuts available
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommandHelpModal;
