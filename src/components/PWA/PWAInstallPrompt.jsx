import { Download, X, Smartphone, Monitor } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import pwaService from '../../utils/pwaService';

const PWAInstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check device type
    setIsMobile(pwaService.isMobile());
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    // Listen for installable event
    const handleInstallable = event => {
      const { installable } = event.detail;
      if (installable && !pwaService.isStandalone()) {
        // Show prompt after a short delay
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    const handleInstalled = () => {
      setIsVisible(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    // Check if already installable on mount
    if (pwaService.canInstall() && !pwaService.isStandalone()) {
      setTimeout(() => setIsVisible(true), 3000);
    }

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const installed = await pwaService.showInstallPrompt();
      if (installed) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal to avoid showing again soon
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  const handleIOSInstructions = () => {
    // Show iOS-specific instructions
    alert(
      'To install FinanceAnalyst Pro on iOS:\n\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right corner'
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isMobile ? (
              <Smartphone className="w-6 h-6 text-blue-400" />
            ) : (
              <Monitor className="w-6 h-6 text-blue-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-1">Install FinanceAnalyst Pro</h3>
            <p className="text-xs text-slate-300 mb-3">
              {isMobile
                ? 'Install our app for the best mobile experience with offline access and push notifications.'
                : 'Install our app for offline access and desktop shortcuts.'}
            </p>

            <div className="flex gap-2">
              {isIOS ? (
                <button
                  onClick={handleIOSInstructions}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors duration-200"
                >
                  How to Install
                </button>
              ) : (
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs font-medium py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  {isInstalling ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      Install App
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-md transition-colors duration-200"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* iOS hint */}
        {isIOS && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-400">
              💡 Pro tip: Use Safari browser for the best iOS installation experience.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
