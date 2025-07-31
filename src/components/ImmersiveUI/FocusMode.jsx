/**
 * Focus Mode - A Tool That Fades into the Background
 * Strips away all non-essential UI elements for deep, uninterrupted concentration
 * Creates a digital equivalent of a clean, uncluttered desk
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Focus,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
  Settings,
  Layers,
  Moon,
  Sun,
  Zap,
  Target,
  Wind,
  Feather
} from 'lucide-react';

const FocusMode = ({ children, onFocusChange }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusLevel, setFocusLevel] = useState('moderate'); // minimal, moderate, deep
  const [zenMode, setZenMode] = useState(false);
  const [breathingMode, setBreathingMode] = useState(false);
  const [autoFocusContext, setAutoFocusContext] = useState(null);
  const [userActivity, setUserActivity] = useState(Date.now());

  const focusLevels = {
    minimal: {
      name: 'Minimal Focus',
      description: 'Hides distracting elements, keeps navigation',
      hideElements: ['sidebar', 'notifications', 'footer'],
      dimOpacity: 0.3,
      breathingIntensity: 0
    },
    moderate: {
      name: 'Moderate Focus',
      description: 'Clean workspace with essential controls',
      hideElements: ['sidebar', 'notifications', 'footer', 'secondary-nav', 'breadcrumbs'],
      dimOpacity: 0.15,
      breathingIntensity: 0.3
    },
    deep: {
      name: 'Deep Focus',
      description: 'Maximum concentration, only core content',
      hideElements: ['sidebar', 'notifications', 'footer', 'secondary-nav', 'breadcrumbs', 'header-extras', 'toolbar'],
      dimOpacity: 0.05,
      breathingIntensity: 0.6
    }
  };

  const currentFocusConfig = focusLevels[focusLevel];

  // Auto-detect user inactivity and suggest focus mode
  useEffect(() => {
    const handleActivity = () => {
      setUserActivity(Date.now());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    const inactivityTimer = setInterval(() => {
      const timeSinceActivity = Date.now() - userActivity;
      // Suggest focus mode after 2 minutes of inactivity on analysis tasks
      if (timeSinceActivity > 120000 && !isFocusMode && 
          (window.location.pathname.includes('private-analysis') || 
           window.location.pathname.includes('modeling'))) {
        // Could show subtle suggestion here
      }
    }, 30000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(inactivityTimer);
    };
  }, [userActivity, isFocusMode]);

  // Keyboard shortcut for focus mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd/Ctrl + Shift + F for focus mode
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFocusMode();
      }
      // Escape to exit focus mode
      if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  const toggleFocusMode = useCallback(() => {
    const newFocusState = !isFocusMode;
    setIsFocusMode(newFocusState);
    
    if (onFocusChange) {
      onFocusChange(newFocusState, focusLevel);
    }

    // Apply focus styling to body
    if (newFocusState) {
      document.body.classList.add('focus-mode');
      document.body.style.backgroundColor = zenMode ? '#0a0a0a' : '#fafafa';
    } else {
      document.body.classList.remove('focus-mode');
      document.body.style.backgroundColor = '';
    }
  }, [isFocusMode, focusLevel, zenMode, onFocusChange]);

  const handleFocusLevelChange = (newLevel) => {
    setFocusLevel(newLevel);
    if (isFocusMode && onFocusChange) {
      onFocusChange(true, newLevel);
    }
  };

  // Breathing animation for deep focus
  const breathingAnimation = breathingMode ? {
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <div className="relative">
      {/* Focus Mode Controls */}
      <AnimatePresence>
        {!isFocusMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
              <button
                onClick={toggleFocusMode}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Enter Focus Mode (⌘⇧F)"
              >
                <Focus className="w-4 h-4" />
                <span>Focus</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Mode Interface */}
      <AnimatePresence>
        {isFocusMode && (
          <>
            {/* Subtle Focus Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-40"
              style={{
                background: zenMode 
                  ? `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,${currentFocusConfig.dimOpacity}) 70%)`
                  : `radial-gradient(circle at center, transparent 50%, rgba(0,0,0,${currentFocusConfig.dimOpacity}) 80%)`
              }}
            />

            {/* Minimal Focus Controls */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-4 right-4 z-50"
            >
              <div className={`rounded-lg shadow-lg border p-2 ${
                zenMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center space-x-1">
                  {/* Focus Level Selector */}
                  <select
                    value={focusLevel}
                    onChange={(e) => handleFocusLevelChange(e.target.value)}
                    className={`text-xs rounded px-2 py-1 border-0 ${
                      zenMode 
                        ? 'bg-gray-800 text-gray-200' 
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <option value="minimal">Minimal</option>
                    <option value="moderate">Moderate</option>
                    <option value="deep">Deep Focus</option>
                  </select>

                  {/* Zen Mode Toggle */}
                  <button
                    onClick={() => setZenMode(!zenMode)}
                    className={`p-1 rounded ${
                      zenMode 
                        ? 'bg-yellow-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Zen Mode"
                  >
                    {zenMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>

                  {/* Breathing Mode Toggle */}
                  <button
                    onClick={() => setBreathingMode(!breathingMode)}
                    className={`p-1 rounded ${
                      breathingMode 
                        ? 'bg-blue-600 text-white' 
                        : zenMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Breathing Mode"
                  >
                    <Wind className="w-4 h-4" />
                  </button>

                  {/* Exit Focus Mode */}
                  <button
                    onClick={toggleFocusMode}
                    className={`p-1 rounded ${
                      zenMode 
                        ? 'text-gray-400 hover:bg-gray-800' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Exit Focus Mode (ESC)"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Focus Mode Indicator */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed bottom-4 left-4 z-50"
            >
              <div className={`rounded-lg shadow-lg border px-3 py-2 ${
                zenMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    focusLevel === 'deep' ? 'bg-red-400' :
                    focusLevel === 'moderate' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    zenMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {currentFocusConfig.name}
                  </span>
                  <Feather className={`w-3 h-3 ${
                    zenMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content with Focus Mode Styling */}
      <motion.div
        className={`transition-all duration-500 ${
          isFocusMode ? 'focus-mode-content' : ''
        }`}
        animate={breathingMode && isFocusMode ? breathingAnimation : {}}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...child.props,
              focusMode: isFocusMode,
              focusLevel: focusLevel,
              zenMode: zenMode,
              hideElements: isFocusMode ? currentFocusConfig.hideElements : []
            });
          }
          return child;
        })}
      </motion.div>

      {/* Focus Mode CSS Injection */}
      <style jsx global>{`
        .focus-mode {
          overflow: hidden !important;
        }

        .focus-mode-content {
          position: relative;
          z-index: 45;
        }

        /* Hide elements based on focus level */
        .focus-mode [data-focus-hide~="sidebar"],
        .focus-mode [data-focus-hide~="notifications"],
        .focus-mode [data-focus-hide~="footer"],
        .focus-mode [data-focus-hide~="secondary-nav"],
        .focus-mode [data-focus-hide~="breadcrumbs"],
        .focus-mode [data-focus-hide~="header-extras"],
        .focus-mode [data-focus-hide~="toolbar"] {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        /* Enhanced focus styling */
        .focus-mode .focus-target {
          box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
          border-radius: 8px;
        }

        /* Zen mode specific styles */
        body.focus-mode.zen-mode {
          background-color: #0a0a0a !important;
          color: #e5e5e5 !important;
        }

        body.focus-mode.zen-mode .focus-mode-content {
          color: #e5e5e5;
        }

        /* Subtle breathing animation container */
        .breathing-container {
          animation: gentle-breathe 4s ease-in-out infinite;
        }

        @keyframes gentle-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default FocusMode;
