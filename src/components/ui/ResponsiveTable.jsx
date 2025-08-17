import { ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import { useDensityPreference } from '../../hooks/useDensityPreference';

/**
 * Responsive Table Wrapper for Financial Data
 * Optimizes table display for mobile and tablet devices
 */
const ResponsiveTable = ({
  children,
  className = '',
  enableVirtualization: _enableVirtualization = false,
  mobileStackedView = true,
  showDeviceToggle = true
}) => {
  const { density } = useDensityPreference();
  const densityClass = density === 'compact' ? 'fa-density-compact' : 'fa-density-comfortable';
  const [viewMode, setViewMode] = useState('auto');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleScroll = (e) => {
    const element = e.target;
    setScrollPosition(element.scrollLeft);
    setCanScrollLeft(element.scrollLeft > 0);
    setCanScrollRight(
      element.scrollLeft < element.scrollWidth - element.clientWidth
    );
  };

  const scrollTable = (direction) => {
    const tableContainer = document.querySelector('.table-scroll-container');
    if (tableContainer) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      tableContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getCurrentViewMode = () => {
    if (viewMode === 'auto') {
      if (isMobile) return 'mobile';
      if (isTablet) return 'tablet';
      return 'desktop';
    }
    return viewMode;
  };

  const currentMode = getCurrentViewMode();

  if (currentMode === 'mobile' && mobileStackedView) {
    // Return stacked mobile view (implemented in parent component)
    return (
      <div className={`mobile-stacked-view ${densityClass} ${className}`}>
        {showDeviceToggle && (
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="text-xs text-slate-500">View:</span>
            <button
              onClick={() => setViewMode(viewMode === 'auto' ? 'desktop' : 'auto')}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              {viewMode === 'auto' ? <Monitor size={12} /> : <Smartphone size={12} />}
              {viewMode === 'auto' ? 'Table' : 'Stack'}
            </button>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className={`responsive-table-wrapper ${densityClass} ${className}`}>
      {showDeviceToggle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">View:</span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode('auto')}
                className={`px-2 py-1 text-xs transition-colors ${
                  viewMode === 'auto'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <Monitor size={12} />
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                className={`px-2 py-1 text-xs transition-colors ${
                  viewMode === 'tablet'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <Tablet size={12} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`px-2 py-1 text-xs transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <Smartphone size={12} />
              </button>
            </div>
          </div>

          {(isMobile || isTablet) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollTable('left')}
                disabled={!canScrollLeft}
                className="p-1 rounded bg-white border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollTable('right')}
                disabled={!canScrollRight}
                className="p-1 rounded bg-white border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <div
        className={`table-scroll-container overflow-x-auto ${
          currentMode === 'mobile' ? 'mobile-scroll' : ''
        } ${currentMode === 'tablet' ? 'tablet-scroll' : ''}`}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: currentMode === 'mobile' ? 'thin' : 'auto',
          scrollSnapType: currentMode === 'mobile' ? 'x mandatory' : 'none'
        }}
      >
        {children}
      </div>

      {/* Mobile scroll indicator */}
      {(isMobile || isTablet) && (
        <div className="flex justify-center mt-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(scrollPosition / 300) === i
                    ? 'bg-blue-500'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveTable;

ResponsiveTable.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  enableVirtualization: PropTypes.bool,
  mobileStackedView: PropTypes.bool,
  showDeviceToggle: PropTypes.bool
};
