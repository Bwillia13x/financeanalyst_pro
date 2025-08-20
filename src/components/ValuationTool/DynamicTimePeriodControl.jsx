import React, { useState, useCallback, useEffect } from 'react';

import Icon from '../AppIcon';
import { Card } from '../ui/Card';

const DynamicTimePeriodControl = ({
  initialYears = 5,
  minYears = 1,
  maxYears = 15,
  onYearsChange,
  className = ''
}) => {
  const [years, setYears] = useState(initialYears);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartYears, setDragStartYears] = useState(0);

  const handleYearsChange = useCallback((newYears) => {
    const clampedYears = Math.max(minYears, Math.min(maxYears, Math.round(newYears)));
    if (clampedYears !== years) {
      setYears(clampedYears);
      onYearsChange?.(clampedYears);
    }
  }, [years, minYears, maxYears, onYearsChange]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartYears(years);
    document.body.style.cursor = 'ew-resize';
  }, [years]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const sensitivity = 0.02; // Adjust sensitivity
    const deltaYears = deltaX * sensitivity;
    const newYears = dragStartYears + deltaYears;

    handleYearsChange(newYears);
  }, [isDragging, dragStartX, dragStartYears, handleYearsChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSliderChange = (e) => {
    const newYears = parseInt(e.target.value);
    handleYearsChange(newYears);
  };

  const handleQuickSelect = (selectedYears) => {
    handleYearsChange(selectedYears);
  };

  const getTimelineMarkers = () => {
    const markers = [];
    const step = years <= 5 ? 1 : years <= 10 ? 2 : 3;

    for (let i = 1; i <= years; i += step) {
      const percentage = (i / years) * 100;
      markers.push(
        <div
          key={i}
          className="absolute flex flex-col items-center transform -translate-x-1/2"
          style={{ left: `${percentage}%` }}
        >
          <div className="w-px h-3 bg-blue-400" />
          <span className="text-xs text-gray-400 mt-1">Y{i}</span>
        </div>
      );
    }

    return markers;
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="Clock" className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Projection Period</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Years:</span>
            <span className="text-xl font-bold text-blue-400">{years}</span>
          </div>
        </div>

        {/* Interactive Timeline */}
        <div className="space-y-4">
          <div className="relative h-12">
            {/* Timeline Track */}
            <div className="absolute top-4 left-0 right-0 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-200"
                style={{ width: `${(years / maxYears) * 100}%` }}
              />
            </div>

            {/* Draggable Handle */}
            <div
              className="absolute top-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-ew-resize transform -translate-x-1/2 hover:bg-blue-400 transition-colors duration-200"
              style={{ left: `${(years / maxYears) * 100}%` }}
              onMouseDown={handleMouseDown}
              role="slider"
              tabIndex={0}
              aria-valuenow={years}
              aria-valuemin={1}
              aria-valuemax={maxYears}
              aria-label="Time period selector"
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' && years > 1) setYears(years - 1);
                if (e.key === 'ArrowRight' && years < maxYears) setYears(years + 1);
              }}
            >
              <div className="absolute inset-0 rounded-full animate-pulse bg-blue-400 opacity-30" />
            </div>

            {/* Timeline Markers */}
            {getTimelineMarkers()}
          </div>

          {/* Range Slider */}
          <div className="px-2">
            <input
              type="range"
              min={minYears}
              max={maxYears}
              value={years}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(years / maxYears) * 100}%, #374151 ${(years / maxYears) * 100}%, #374151 100%)`
              }}
            />
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="flex justify-center space-x-2">
          {[3, 5, 7, 10, 12, 15].filter(y => y >= minYears && y <= maxYears).map(quickYears => (
            <button
              key={quickYears}
              onClick={() => handleQuickSelect(quickYears)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                years === quickYears
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {quickYears}Y
            </button>
          ))}
        </div>

        {/* Period Description */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {years <= 3 && 'Short-term focus with higher accuracy'}
            {years > 3 && years <= 7 && 'Balanced projection period for most analyses'}
            {years > 7 && years <= 10 && 'Extended projection for growth companies'}
            {years > 10 && 'Long-term strategic planning horizon'}
          </p>
        </div>

        {/* Real-time Impact Indicator */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Model updates automatically</span>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
        
        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: transparent;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
        }
      `}
      </style>
    </Card>
  );
};

export default DynamicTimePeriodControl;
