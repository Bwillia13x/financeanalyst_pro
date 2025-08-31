// Custom hook for mobile gesture handling
import { useEffect, useRef, useCallback, useState } from 'react';

const useMobileGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onDoubleTap,
    onLongPress,
    threshold = 50,
    longPressDelay = 500,
    preventDefault = false
  } = options;

  const elementRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(0);

  const handleTouchStart = useCallback(
    e => {
      if (preventDefault) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      // Start long press timer
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress(touchStartRef.current);
          longPressTimerRef.current = null;
        }, longPressDelay);
      }
    },
    [onLongPress, longPressDelay, preventDefault]
  );

  const handleTouchEnd = useCallback(
    e => {
      if (preventDefault) {
        e.preventDefault();
      }

      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;
      const deltaTime = touchEndRef.current.time - touchStartRef.current.time;

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Check for double tap
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTapRef.current;
      lastTapRef.current = currentTime;

      if (timeDiff < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        if (onDoubleTap) {
          onDoubleTap(touchEndRef.current);
        }
        return;
      }

      // Check for swipe gestures
      if (deltaTime < 500) {
        // Only consider fast gestures as swipes
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > threshold || absDeltaY > threshold) {
          if (absDeltaX > absDeltaY) {
            // Horizontal swipe
            if (deltaX > 0) {
              onSwipeRight?.(Math.abs(deltaX));
            } else {
              onSwipeLeft?.(Math.abs(deltaX));
            }
          } else {
            // Vertical swipe
            if (deltaY > 0) {
              onSwipeDown?.(Math.abs(deltaY));
            } else {
              onSwipeUp?.(Math.abs(deltaY));
            }
          }
        }
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap, threshold, preventDefault]
  );

  const handleTouchMove = useCallback(
    e => {
      if (preventDefault) {
        e.preventDefault();
      }

      // Clear long press timer if user moves finger
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    },
    [preventDefault]
  );

  // Pinch gesture handling (for zoom functionality)
  const handleGestureStart = useCallback(_e => {
    // Prevent default gesture behavior
  }, []);

  const handleGestureChange = useCallback(
    e => {
      if (onPinch) {
        onPinch(e.scale);
      }
    },
    [onPinch]
  );

  const handleGestureEnd = useCallback(e => {
    // Reset scale or handle end of pinch
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });

    // Add gesture event listeners for pinch (iOS Safari)
    element.addEventListener('gesturestart', handleGestureStart);
    element.addEventListener('gesturechange', handleGestureChange);
    element.addEventListener('gestureend', handleGestureEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('gesturestart', handleGestureStart);
      element.removeEventListener('gesturechange', handleGestureChange);
      element.removeEventListener('gestureend', handleGestureEnd);

      // Clear any pending timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleGestureStart,
    handleGestureChange,
    handleGestureEnd
  ]);

  return elementRef;
};

// Utility hook for pull-to-refresh functionality
export const usePullToRefresh = (onRefresh, options = {}) => {
  const { threshold = 80, onPullStart, onPullEnd, onPullCancel } = options;

  const pullRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback(
    e => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
        onPullStart?.();
      }
    },
    [onPullStart]
  );

  const handleTouchMove = useCallback(
    e => {
      if (!isPulling.current || !startY.current) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;

      if (deltaY > threshold) {
        e.preventDefault();
        // Visual feedback for pull-to-refresh
        const element = pullRef.current;
        if (element) {
          element.style.transform = `translateY(${Math.min(deltaY - threshold, 60)}px)`;
        }
      }
    },
    [threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;

    const element = pullRef.current;
    if (element) {
      const transform = window.getComputedStyle(element).transform;
      const translateY = transform !== 'none' ? parseFloat(transform.split(',')[5]) : 0;

      if (translateY > 20) {
        // Trigger refresh
        try {
          await onRefresh();
          onPullEnd?.();
        } catch (error) {
          onPullCancel?.(error);
        }
      } else {
        onPullCancel?.();
      }

      // Reset position
      element.style.transform = '';
    }

    isPulling.current = false;
    startY.current = 0;
  }, [onRefresh, onPullEnd, onPullCancel]);

  useEffect(() => {
    const element = pullRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return pullRef;
};

// Utility hook for mobile viewport height handling
export const useMobileViewport = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    const handleOrientationChange = () => {
      // Delay to account for mobile browsers updating viewport height
      setTimeout(updateHeight, 100);
    };

    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return viewportHeight;
};

export default useMobileGestures;
