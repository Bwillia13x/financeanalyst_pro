/**
 * Meaningful Animation System
 * Animations that provide meaning and context, not decoration
 * Visual explanations of model logic and data relationships
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity
  // AlertCircle,
  // CheckCircle
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

const MeaningfulAnimations = ({
  children,
  onAssumptionChange,
  modelData: _modelData,
  dependencyMap: _dependencyMap
}) => {
  const [changedAssumptions, setChangedAssumptions] = useState(new Set());
  const [affectedOutputs, setAffectedOutputs] = useState(new Set());
  const [_animationQueue, _setAnimationQueue] = useState([]);
  const [_isCalculating, _setIsCalculating] = useState(false);
  const animationRefs = useRef(new Map());

  // Animation configurations for different types of changes
  const animationTypes = {
    assumption_change: {
      duration: 0.6,
      glow: { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
      scale: 1.02,
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    },
    output_impact: {
      duration: 1.2,
      glow: { boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' },
      scale: 1.01,
      backgroundColor: 'rgba(16, 185, 129, 0.05)'
    },
    warning: {
      duration: 0.8,
      glow: { boxShadow: '0 0 15px rgba(245, 158, 11, 0.6)' },
      scale: 1.015,
      backgroundColor: 'rgba(245, 158, 11, 0.1)'
    },
    error: {
      duration: 1.0,
      glow: { boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)' },
      scale: 1.02,
      backgroundColor: 'rgba(239, 68, 68, 0.1)'
    },
    calculation: {
      duration: 2.0,
      glow: { boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)' },
      scale: 1.005,
      backgroundColor: 'rgba(139, 92, 246, 0.05)'
    }
  };

  // Flow animation for showing data dependencies
  const _FlowArrow = ({ fromId, toId, type = 'data', delay = 0 }) => {
    const fromRef = animationRefs.current.get(fromId);
    const toRef = animationRefs.current.get(toId);

    if (!fromRef || !toRef) return null;

    const fromRect = fromRef.getBoundingClientRect();
    const toRect = toRef.getBoundingClientRect();

    const startX = fromRect.right;
    const startY = fromRect.top + fromRect.height / 2;
    const endX = toRect.left;
    const endY = toRect.top + toRect.height / 2;

    const pathData = `M ${startX} ${startY} Q ${startX + (endX - startX) / 2} ${startY} ${endX} ${endY}`;

    return (
      <motion.svg
        className="absolute inset-0 pointer-events-none z-20"
        style={{ width: '100vw', height: '100vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay }}
      >
        <defs>
          <marker
            id={`arrowhead-${type}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={type === 'impact' ? '#10B981' : '#3B82F6'} />
          </marker>
        </defs>

        <motion.path
          d={pathData}
          stroke={type === 'impact' ? '#10B981' : '#3B82F6'}
          strokeWidth="2"
          fill="none"
          markerEnd={`url(#arrowhead-${type})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Flowing particles */}
        <motion.circle
          r="3"
          fill={type === 'impact' ? '#10B981' : '#3B82F6'}
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
            delay: delay + 0.5
          }}
          style={{ offsetPath: `path('${pathData}')` }}
        />
      </motion.svg>
    );
  };

  // Ripple effect for showing impact propagation
  const _RippleEffect = ({ x, y, intensity: _intensity = 1, type = 'assumption' }) => {
    const rippleVariants = {
      initial: { scale: 0, opacity: 0.8 },
      animate: {
        scale: 3 * _intensity,
        opacity: 0,
        transition: { duration: 1.5, ease: 'easeOut' }
      }
    };

    const colors = {
      assumption: 'rgba(59, 130, 246, 0.3)',
      impact: 'rgba(16, 185, 129, 0.3)',
      warning: 'rgba(245, 158, 11, 0.3)',
      error: 'rgba(239, 68, 68, 0.3)'
    };

    return (
      <motion.div
        className="absolute pointer-events-none z-10"
        style={{
          left: x - 20,
          top: y - 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: colors[type]
        }}
        variants={rippleVariants}
        initial="initial"
        animate="animate"
      />
    );
  };

  // Pulse animation for active calculations
  const CalculationPulse = ({ children, isActive }) => {
    return (
      <motion.div
        animate={
          isActive
            ? {
                boxShadow: [
                  '0 0 0 0 rgba(139, 92, 246, 0.7)',
                  '0 0 0 10px rgba(139, 92, 246, 0)',
                  '0 0 0 0 rgba(139, 92, 246, 0)'
                ]
              }
            : {}
        }
        transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
      >
        {children}
      </motion.div>
    );
  };

  // Glow effect for highlighting changed elements
  const GlowHighlight = ({
    children,
    isHighlighted,
    type = 'assumption_change',
    intensity: _intensity = 1
  }) => {
    const config = animationTypes[type];
    const _animationIntensity = _intensity || 1;

    return (
      <motion.div
        animate={
          isHighlighted
            ? {
                ...config.glow,
                scale: config.scale,
                backgroundColor: config.backgroundColor
              }
            : {
                boxShadow: '0 0 0 0 transparent',
                scale: 1,
                backgroundColor: 'transparent'
              }
        }
        transition={{
          duration: config.duration,
          ease: 'easeInOut'
        }}
        className="rounded-lg"
      >
        {children}
      </motion.div>
    );
  };

  // Value change animation with direction indicators
  const ValueChangeIndicator = ({
    oldValue,
    newValue,
    format: _format = 'number',
    isVisible = true
  }) => {
    const isIncrease = newValue > oldValue;
    const changePercent = oldValue !== 0 ? ((newValue - oldValue) / oldValue) * 100 : 0;

    if (!isVisible || oldValue === newValue) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-semibold ${
          isIncrease
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}
      >
        <div className="flex items-center space-x-1">
          {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{Math.abs(changePercent).toFixed(1)}%</span>
        </div>
      </motion.div>
    );
  };

  // Chain reaction visualization
  const _ChainReaction = ({ assumptions, outputs: _outputs, delay = 0 }) => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay }}
        className="absolute inset-0 pointer-events-none z-15"
      >
        {assumptions.map((assumption, index) => (
          <motion.div
            key={assumption.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ delay: delay + index * 0.2 }}
            className="absolute w-4 h-4 bg-blue-500 rounded-full"
            style={{
              left: assumption.x,
              top: assumption.y
            }}
          >
            <motion.div
              className="absolute inset-0 bg-blue-500 rounded-full"
              animate={{ scale: [1, 2, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: delay + index * 0.2
              }}
              style={{ opacity: 0.3 }}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  // Model recalculation indicator
  const RecalculationIndicator = ({ isRecalculating, progress = 0 }) => {
    if (!isRecalculating) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Activity className="w-5 h-5 text-blue-600" />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-gray-900">Recalculating Model</p>
            <div className="w-48 bg-gray-200 rounded-full h-2 mt-1">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Register element for animation tracking
  const registerElement = (id, ref) => {
    if (ref) {
      animationRefs.current.set(id, ref);
    }
  };

  // Handle assumption changes with animation
  const handleAssumptionChange = (assumptionId, oldValue, newValue, affectedIds = []) => {
    setChangedAssumptions(prev => new Set([...prev, assumptionId]));
    setAffectedOutputs(prev => new Set([...prev, ...affectedIds]));

    // Clear highlights after animation
    setTimeout(() => {
      setChangedAssumptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(assumptionId);
        return newSet;
      });
      setAffectedOutputs(prev => {
        const newSet = new Set(prev);
        affectedIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }, 3000);

    if (onAssumptionChange) {
      onAssumptionChange(assumptionId, oldValue, newValue, affectedIds);
    }
  };

  // Enhanced children with animation props
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        registerElement,
        handleAssumptionChange,
        changedAssumptions,
        affectedOutputs,
        GlowHighlight,
        ValueChangeIndicator,
        CalculationPulse,
        isCalculating: _isCalculating
      });
    }
    return child;
  });

  return (
    <div className="relative">
      {enhancedChildren}

      {/* Animation overlays */}
      <AnimatePresence>
        {_isCalculating && (
          <RecalculationIndicator
            isRecalculating={_isCalculating}
            progress={75} // This would come from actual calculation progress
          />
        )}
      </AnimatePresence>

      {/* CSS for meaningful animations */}
      <style>
        {`
        .animate-glow {
          animation: meaningful-glow 2s ease-in-out infinite alternate;
        }

        @keyframes meaningful-glow {
          from {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
          }
          to {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
          }
        }

        .animate-impact {
          animation: impact-highlight 1.5s ease-out;
        }

        @keyframes impact-highlight {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .animate-calculation {
          animation: calculation-pulse 1s ease-in-out infinite;
        }

        @keyframes calculation-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }

        /* Smooth transitions for all animated elements */
        .meaningful-animation {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Focus enhancement during animations */
        .animation-focus {
          z-index: 10;
          position: relative;
        }
      `}
      </style>
    </div>
  );
};

// Individual animation components for specific use cases
export const AssumptionInput = ({
  id,
  value,
  onChange,
  registerElement,
  handleAssumptionChange,
  changedAssumptions,
  GlowHighlight,
  children
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [_previousValue, _setPreviousValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (registerElement) {
      registerElement(id, inputRef.current);
    }
  }, [id, registerElement]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = newValue => {
    _setPreviousValue(localValue);
    setLocalValue(newValue);

    if (handleAssumptionChange) {
      // Simulate finding affected outputs (in real app, this would be calculated)
      const affectedOutputs = [`output_${id}_1`, `output_${id}_2`];
      handleAssumptionChange(id, localValue, newValue, affectedOutputs);
    }

    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <GlowHighlight isHighlighted={changedAssumptions?.has(id)} type="assumption_change">
      <div ref={inputRef} className="meaningful-animation">
        {React.cloneElement(children, {
          value: localValue,
          onChange: handleChange
        })}
      </div>
    </GlowHighlight>
  );
};

export const ModelOutput = ({
  id,
  value,
  previousValue,
  registerElement,
  affectedOutputs,
  GlowHighlight,
  ValueChangeIndicator,
  children
}) => {
  const outputRef = useRef(null);

  useEffect(() => {
    if (registerElement) {
      registerElement(id, outputRef.current);
    }
  }, [id, registerElement]);

  return (
    <GlowHighlight isHighlighted={affectedOutputs?.has(id)} type="output_impact">
      <div ref={outputRef} className="meaningful-animation relative">
        {children}
        <ValueChangeIndicator
          oldValue={previousValue}
          newValue={value}
          isVisible={affectedOutputs?.has(id)}
        />
      </div>
    </GlowHighlight>
  );
};

export default MeaningfulAnimations;
