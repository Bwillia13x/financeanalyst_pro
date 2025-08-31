import { ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';

import useMobileGestures from '../../hooks/useMobileGestures';

const MobileChart = ({
  children,
  title,
  onZoomIn,
  onZoomOut,
  onReset,
  onDownload,
  onFullscreen,
  showControls = true,
  className = '',
  chartRef
}) => {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);

  // Mobile gesture handling
  const gestureRef = useMobileGestures({
    onPinch: newScale => {
      const clampedScale = Math.max(0.5, Math.min(2, newScale));
      setScale(clampedScale);
    },
    onDoubleTap: () => {
      handleReset();
    },
    threshold: 30
  });

  // Combine refs
  useEffect(() => {
    if (gestureRef.current && containerRef.current) {
      gestureRef.current = containerRef.current;
    }
    if (chartRef && containerRef.current) {
      chartRef.current = containerRef.current;
    }
  }, [gestureRef, chartRef]);

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.2, 2);
    setScale(newScale);
    onZoomIn?.(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
    onZoomOut?.(newScale);
  };

  const handleReset = () => {
    setScale(1);
    onReset?.();
  };

  const handleDownload = () => {
    onDownload?.();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
    onFullscreen?.(!isFullscreen);
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-slate-800 rounded-lg overflow-hidden ${className} ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease-out'
      }}
    >
      {/* Chart Header */}
      {(title || showControls) && (
        <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-900/50">
          {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}

          {/* Mobile Controls */}
          {showControls && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                onClick={handleZoomIn}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Reset zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {onDownload && (
                <button
                  onClick={handleDownload}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Download chart"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              {onFullscreen && (
                <button
                  onClick={handleFullscreen}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Toggle fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chart Content */}
      <div className="relative overflow-hidden">{children}</div>

      {/* Mobile Gesture Hints */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-center opacity-0 hover:opacity-100 transition-opacity md:hidden">
        <div className="bg-slate-900/90 text-slate-300 text-xs px-3 py-1 rounded-full">
          Pinch to zoom • Double tap to reset
        </div>
      </div>

      {/* Scale Indicator */}
      {scale !== 1 && (
        <div className="absolute top-2 right-2 bg-slate-900/90 text-slate-300 text-xs px-2 py-1 rounded">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};

// Mobile chart container for responsive layouts
export const MobileChartContainer = ({ children, columns = 1, gap = '1rem', className = '' }) => {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap
      }}
    >
      {children}
    </div>
  );
};

// Mobile chart legend component
export const MobileChartLegend = ({ items, position = 'bottom', className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`mobile-chart-legend ${className}`}>
      {position === 'top' && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-800 rounded">
          {items.slice(0, isExpanded ? items.length : 3).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-slate-300">{item.label}</span>
            </div>
          ))}
          {items.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {isExpanded ? 'Show less' : `+${items.length - 3} more`}
            </button>
          )}
        </div>
      )}

      {position === 'bottom' && (
        <div className="flex flex-wrap gap-2 mt-2 p-2 bg-slate-800 rounded">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileChart;
