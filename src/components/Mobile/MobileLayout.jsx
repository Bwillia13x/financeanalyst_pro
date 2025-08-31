import { Menu, X, Home, Calculator, BarChart3, Settings, Smartphone } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import pwaService from '../../utils/pwaService';

const MobileLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const mobile = pwaService.isMobile();
      const type = pwaService.getDeviceType();

      setIsMobile(mobile);
      setDeviceType(type);
    };

    checkDevice();

    // Listen for orientation changes
    window.addEventListener('orientationchange', checkDevice);
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('orientationchange', checkDevice);
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Handle swipe gestures for mobile menu
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = e => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Swipe from left edge to open menu
      if (startX < 50 && diffX < -50 && Math.abs(diffY) < 50) {
        setIsMobileMenuOpen(true);
      }

      // Swipe right to close menu
      if (isMobileMenuOpen && diffX > 50 && Math.abs(diffY) < 50) {
        setIsMobileMenuOpen(false);
      }

      startX = 0;
      startY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isMobileMenuOpen]);

  const navigationItems = [
    { icon: Home, label: 'Dashboard', path: '/financial-model-workspace' },
    { icon: Calculator, label: 'Models', path: '/models' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const handleNavigation = path => {
    window.location.href = path;
    setIsMobileMenuOpen(false);
  };

  // If not mobile, just return children
  if (!isMobile) {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold text-sm">FinancePro</span>
          </div>
        </div>

        <div className="text-xs text-slate-400">{deviceType}</div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close mobile menu"
          />

          {/* Menu Panel */}
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-slate-800 border-r border-slate-700 mobile-menu">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">FinancePro</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="p-4">
              <div className="space-y-2">
                {navigationItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Mobile-specific features */}
              <div className="mt-8 pt-6 border-t border-slate-700">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Mobile Features
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-2 text-slate-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-sm">Offline Mode</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 text-slate-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-sm">Touch Optimized</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 text-slate-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    <span className="text-sm">Push Notifications</span>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isMobile ? 'pb-20' : ''}`}>
        <div className="min-h-screen">{children}</div>
      </main>

      {/* Mobile Bottom Navigation (iOS-style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-2 py-2 md:hidden">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navigationItems.map((item, _index) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              aria-label={item.label}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Safe area for iOS devices */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  );
};

export default MobileLayout;
