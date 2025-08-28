import { useState, useEffect, useCallback, useRef } from 'react';

// Hook for mobile-specific accessibility features
export function useMobileAccessibility(options = {}) {
  const {
    enableTouchOptimization = true,
    enableVoiceOver = true,
    _enableHighContrast = false,
    minTouchTarget = 44, // 44px minimum as per WCAG
    debugMode = import.meta.env.DEV
  } = options;

  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [touchTargets, setTouchTargets] = useState([]);
  const [accessibilityIssues, setAccessibilityIssues] = useState([]);

  const touchStartRef = useRef(null);
  const gestureRef = useRef({ isGesturing: false, startTime: 0 });

  // Detect mobile device and orientation
  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 768 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setIsLandscape(window.innerWidth > window.innerHeight);

      if (debugMode) {
        console.log('Mobile detection:', {
          mobile,
          width: window.innerWidth,
          userAgent: navigator.userAgent
        });
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [debugMode]);

  // Optimize touch targets
  const optimizeTouchTargets = useCallback(() => {
    if (!enableTouchOptimization || !isMobile) return;

    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );

    const issues = [];
    const targets = [];

    interactiveElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const area = rect.width * rect.height;
      const minArea = minTouchTarget * minTouchTarget;

      targets.push({
        element,
        rect,
        area,
        meetsMinimum: area >= minArea,
        id: `touch-target-${index}`
      });

      if (area < minArea) {
        issues.push({
          type: 'touch-target-too-small',
          element: element.tagName,
          id: element.id,
          className: element.className,
          currentSize: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
          minimumSize: `${minTouchTarget}x${minTouchTarget}`,
          severity: 'high'
        });
      }

      // Check for overlapping touch targets
      targets.forEach((otherTarget, otherIndex) => {
        if (index !== otherIndex && isOverlapping(rect, otherTarget.rect)) {
          issues.push({
            type: 'overlapping-touch-targets',
            element1: element.tagName,
            element2: otherTarget.element.tagName,
            severity: 'medium'
          });
        }
      });
    });

    setTouchTargets(targets);
    setAccessibilityIssues(issues);

    // Report to performance monitoring
    import('../utils/performanceMonitoring')
      .then(mod => {
        if (mod?.reportPerformanceMetric) {
          mod.reportPerformanceMetric('mobile_accessibility_audit', {
            totalTouchTargets: targets.length,
            validTouchTargets: targets.filter(t => t.meetsMinimum).length,
            touchTargetIssues: issues.length,
            isMobile,
            timestamp: Date.now()
          });
        }
      })
      .catch(() => {});

    if (debugMode && issues.length > 0) {
      console.warn('Mobile accessibility issues found:', issues);
    }
  }, [enableTouchOptimization, isMobile, minTouchTarget, debugMode]);

  // Enhanced touch event handling
  const handleTouchStart = useCallback(
    event => {
      if (!enableTouchOptimization) return;

      touchStartRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        timestamp: Date.now()
      };

      gestureRef.current = {
        isGesturing: true,
        startTime: Date.now()
      };
    },
    [enableTouchOptimization]
  );

  const handleTouchEnd = useCallback(
    event => {
      if (!enableTouchOptimization || !touchStartRef.current) return;

      const touchEnd = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
        timestamp: Date.now()
      };

      const distance = Math.sqrt(
        Math.pow(touchEnd.x - touchStartRef.current.x, 2) +
          Math.pow(touchEnd.y - touchStartRef.current.y, 2)
      );

      const duration = touchEnd.timestamp - touchStartRef.current.timestamp;

      // Track gesture performance
      import('../utils/performanceMonitoring')
        .then(mod => {
          if (mod?.reportPerformanceMetric) {
            mod.reportPerformanceMetric('mobile_gesture_performance', {
              distance,
              duration,
              type: distance < 10 ? 'tap' : 'swipe',
              isMobile,
              timestamp: Date.now()
            });
          }
        })
        .catch(() => {});

      gestureRef.current.isGesturing = false;
      touchStartRef.current = null;
    },
    [enableTouchOptimization, isMobile]
  );

  // Voice-over optimization
  const announceToScreenReader = useCallback(
    (message, priority = 'polite') => {
      if (!enableVoiceOver) return;

      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;

      document.body.appendChild(announcement);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);

      if (debugMode) {
        console.log('Screen reader announcement:', message);
      }
    },
    [enableVoiceOver, debugMode]
  );

  // High contrast mode toggle
  const toggleHighContrast = useCallback(() => {
    const body = document.body;
    const isHighContrast = body.classList.contains('high-contrast');

    if (isHighContrast) {
      body.classList.remove('high-contrast');
    } else {
      body.classList.add('high-contrast');
    }

    announceToScreenReader(
      `High contrast mode ${isHighContrast ? 'disabled' : 'enabled'}`,
      'assertive'
    );

    return !isHighContrast;
  }, [announceToScreenReader]);

  // Focus management for mobile
  const manageFocus = useCallback(
    (element, options = {}) => {
      if (!isMobile || !element) return;

      const { smooth = true, preventScroll = false } = options;

      if (smooth) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }

      // Delay focus to ensure scrolling completes
      setTimeout(
        () => {
          element.focus({ preventScroll });

          // Announce focus change for screen readers
          const label =
            element.getAttribute('aria-label') ||
            element.getAttribute('title') ||
            element.textContent?.slice(0, 50);

          if (label) {
            announceToScreenReader(`Focused on ${label}`);
          }
        },
        smooth ? 300 : 0
      );
    },
    [isMobile, announceToScreenReader]
  );

  // Skip link functionality for mobile
  const createSkipLink = useCallback(
    (targetId, label = 'Skip to main content') => {
      const skipLink = document.createElement('a');
      skipLink.href = `#${targetId}`;
      skipLink.textContent = label;
      skipLink.className =
        'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded';

      skipLink.addEventListener('click', e => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          manageFocus(target, { smooth: false });
        }
      });

      return skipLink;
    },
    [manageFocus]
  );

  // Viewport meta tag optimization
  useEffect(() => {
    if (!isMobile) return;

    let viewportMeta = document.querySelector('meta[name="viewport"]');

    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    // Optimize viewport for accessibility
    viewportMeta.content =
      'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
  }, [isMobile]);

  // Periodic accessibility audit
  useEffect(() => {
    if (!isMobile) return;

    optimizeTouchTargets();

    const auditInterval = setInterval(optimizeTouchTargets, 10000); // Every 10 seconds

    return () => clearInterval(auditInterval);
  }, [isMobile, optimizeTouchTargets]);

  // Touch event listeners
  useEffect(() => {
    if (!isMobile || !enableTouchOptimization) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, enableTouchOptimization, handleTouchStart, handleTouchEnd]);

  return {
    // State
    isMobile,
    isLandscape,
    touchTargets,
    accessibilityIssues,
    isGesturing: gestureRef.current.isGesturing,

    // Actions
    optimizeTouchTargets,
    announceToScreenReader,
    toggleHighContrast,
    manageFocus,
    createSkipLink,

    // Utilities
    isValidTouchTarget: element => {
      const rect = element.getBoundingClientRect();
      return rect.width * rect.height >= minTouchTarget * minTouchTarget;
    },

    addTouchTargetPadding: (element, padding = 8) => {
      element.style.padding = `${padding}px`;
      element.style.minHeight = `${minTouchTarget}px`;
      element.style.minWidth = `${minTouchTarget}px`;
    }
  };
}

// Utility function to check if two rectangles overlap
function isOverlapping(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect2.right < rect1.left ||
    rect1.bottom < rect2.top ||
    rect2.bottom < rect1.top
  );
}

// HOC for mobile accessibility
export function withMobileAccessibility(WrappedComponent, options = {}) {
  return function MobileAccessibilityWrapper(props) {
    const mobileA11y = useMobileAccessibility(options);

    return <WrappedComponent {...props} mobileAccessibility={mobileA11y} />;
  };
}

export default useMobileAccessibility;
