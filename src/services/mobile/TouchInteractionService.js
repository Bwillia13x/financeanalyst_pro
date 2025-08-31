/**
 * Touch Interaction Service
 * Advanced touch gesture recognition and interaction handling
 * Supports multi-touch gestures, momentum scrolling, and touch feedback
 */

class TouchInteractionService {
  constructor(options = {}) {
    this.options = {
      enableGestures: true,
      enableMultiTouch: true,
      enableMomentumScrolling: true,
      enableHapticFeedback: true,
      gestureThreshold: 10, // Minimum distance for gesture recognition
      swipeThreshold: 50, // Minimum distance for swipe recognition
      pinchThreshold: 0.1, // Minimum scale change for pinch recognition
      longPressDelay: 500, // Delay for long press recognition
      doubleTapDelay: 300, // Maximum delay between taps for double tap
      momentumDecay: 0.95, // Momentum scrolling decay factor
      ...options
    };

    this.activeTouches = new Map();
    this.gestureState = {
      isActive: false,
      type: null,
      startTime: 0,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      scale: 1,
      rotation: 0
    };

    this.gestureCallbacks = new Map();
    this.touchTargets = new WeakMap();
    this.momentumState = {
      isActive: false,
      velocity: { x: 0, y: 0 },
      position: { x: 0, y: 0 }
    };

    this.tapHistory = [];
    this.longPressTimer = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the touch interaction service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupTouchEventListeners();
      this.setupGestureRecognition();
      this.setupMomentumScrolling();
      this.setupHapticFeedback();

      this.isInitialized = true;
      console.log('Touch Interaction Service initialized');
    } catch (error) {
      console.error('Failed to initialize Touch Interaction Service:', error);
    }
  }

  /**
   * Setup touch event listeners
   */
  setupTouchEventListeners() {
    // Touch start
    const handleTouchStart = event => {
      this.handleTouchStart(event);
    };

    // Touch move
    const handleTouchMove = event => {
      this.handleTouchMove(event);
    };

    // Touch end
    const handleTouchEnd = event => {
      this.handleTouchEnd(event);
    };

    // Touch cancel
    const handleTouchCancel = event => {
      this.handleTouchCancel(event);
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, {
      passive: false,
      capture: true
    });
    document.addEventListener('touchmove', handleTouchMove, {
      passive: false,
      capture: true
    });
    document.addEventListener('touchend', handleTouchEnd, {
      passive: false,
      capture: true
    });
    document.addEventListener('touchcancel', handleTouchCancel, {
      passive: false,
      capture: true
    });

    // Store handlers for cleanup
    this.touchEventHandlers = {
      touchstart: handleTouchStart,
      touchmove: handleTouchMove,
      touchend: handleTouchEnd,
      touchcancel: handleTouchCancel
    };
  }

  /**
   * Handle touch start event
   */
  handleTouchStart(event) {
    const touches = event.touches;

    // Store active touches
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      this.activeTouches.set(touch.identifier, {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: Date.now(),
        target: touch.target
      });
    }

    // Initialize gesture state
    if (touches.length === 1) {
      this.initializeSingleTouchGesture(touches[0]);
    } else if (touches.length === 2) {
      this.initializeMultiTouchGesture(touches);
    }

    // Setup long press timer
    this.setupLongPressTimer();

    // Handle haptic feedback
    this.provideHapticFeedback('touchstart');

    this.emit('touchStart', {
      touches: Array.from(this.activeTouches.values()),
      gestureState: this.gestureState
    });
  }

  /**
   * Handle touch move event
   */
  handleTouchMove(event) {
    const touches = event.touches;

    // Update active touches
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const activeTouch = this.activeTouches.get(touch.identifier);

      if (activeTouch) {
        activeTouch.currentX = touch.clientX;
        activeTouch.currentY = touch.clientY;
      }
    }

    // Update gesture state
    if (touches.length === 1) {
      this.updateSingleTouchGesture(touches[0]);
    } else if (touches.length === 2) {
      this.updateMultiTouchGesture(touches);
    }

    // Prevent scrolling if gesture is active
    if (this.gestureState.isActive) {
      event.preventDefault();
    }

    this.emit('touchMove', {
      touches: Array.from(this.activeTouches.values()),
      gestureState: this.gestureState
    });
  }

  /**
   * Handle touch end event
   */
  handleTouchEnd(event) {
    const touches = event.touches;
    const changedTouches = event.changedTouches;

    // Remove ended touches
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      this.activeTouches.delete(touch.identifier);
    }

    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Finalize gesture
    if (this.gestureState.isActive) {
      this.finalizeGesture();
    } else if (touches.length === 0) {
      // Check for tap gestures
      this.handleTapGesture(changedTouches[0]);
    }

    // Handle haptic feedback
    this.provideHapticFeedback('touchend');

    this.emit('touchEnd', {
      touches: Array.from(this.activeTouches.values()),
      gestureState: this.gestureState
    });
  }

  /**
   * Handle touch cancel event
   */
  handleTouchCancel(event) {
    // Clear all active touches
    this.activeTouches.clear();

    // Reset gesture state
    this.resetGestureState();

    // Clear timers
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    this.emit('touchCancel', {});
  }

  /**
   * Initialize single touch gesture
   */
  initializeSingleTouchGesture(touch) {
    this.gestureState = {
      isActive: false,
      type: null,
      startTime: Date.now(),
      startPosition: { x: touch.clientX, y: touch.clientY },
      currentPosition: { x: touch.clientX, y: touch.clientY },
      velocity: { x: 0, y: 0 },
      scale: 1,
      rotation: 0
    };
  }

  /**
   * Update single touch gesture
   */
  updateSingleTouchGesture(touch) {
    const deltaX = touch.clientX - this.gestureState.startPosition.x;
    const deltaY = touch.clientY - this.gestureState.startPosition.y;
    const deltaTime = Date.now() - this.gestureState.startTime;

    this.gestureState.currentPosition = { x: touch.clientX, y: touch.clientY };
    this.gestureState.velocity = {
      x: deltaX / deltaTime,
      y: deltaY / deltaTime
    };

    // Check if gesture threshold is met
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.options.gestureThreshold && !this.gestureState.isActive) {
      this.gestureState.isActive = true;
      this.gestureState.type = this.determineGestureType(deltaX, deltaY);
    }

    // Update momentum state
    if (this.options.enableMomentumScrolling && this.gestureState.type === 'pan') {
      this.momentumState.velocity = this.gestureState.velocity;
      this.momentumState.position = this.gestureState.currentPosition;
    }
  }

  /**
   * Initialize multi-touch gesture
   */
  initializeMultiTouchGesture(touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];

    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;
    const distance = this.getDistance(touch1, touch2);
    const angle = this.getAngle(touch1, touch2);

    this.gestureState = {
      isActive: false,
      type: 'pinch',
      startTime: Date.now(),
      startPosition: { x: centerX, y: centerY },
      currentPosition: { x: centerX, y: centerY },
      startDistance: distance,
      currentDistance: distance,
      startAngle: angle,
      currentAngle: angle,
      scale: 1,
      rotation: 0
    };
  }

  /**
   * Update multi-touch gesture
   */
  updateMultiTouchGesture(touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];

    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;
    const distance = this.getDistance(touch1, touch2);
    const angle = this.getAngle(touch1, touch2);

    this.gestureState.currentPosition = { x: centerX, y: centerY };
    this.gestureState.currentDistance = distance;
    this.gestureState.currentAngle = angle;

    // Calculate scale and rotation
    this.gestureState.scale = distance / this.gestureState.startDistance;
    this.gestureState.rotation = angle - this.gestureState.startAngle;

    // Check if gesture threshold is met
    const scaleChange = Math.abs(this.gestureState.scale - 1);
    const rotationChange = Math.abs(this.gestureState.rotation);

    if (
      (scaleChange > this.options.pinchThreshold || rotationChange > 5) &&
      !this.gestureState.isActive
    ) {
      this.gestureState.isActive = true;
    }
  }

  /**
   * Determine gesture type from movement
   */
  determineGestureType(deltaX, deltaY) {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      return deltaX > 0 ? 'swipeRight' : 'swipeLeft';
    } else {
      return deltaY > 0 ? 'swipeDown' : 'swipeUp';
    }
  }

  /**
   * Finalize gesture
   */
  finalizeGesture() {
    const gesture = { ...this.gestureState };

    // Calculate final velocity and distance
    const deltaX = gesture.currentPosition.x - gesture.startPosition.x;
    const deltaY = gesture.currentPosition.y - gesture.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    gesture.distance = distance;
    gesture.duration = Date.now() - gesture.startTime;
    gesture.velocity = {
      x: deltaX / gesture.duration,
      y: deltaY / gesture.duration
    };

    // Emit gesture event
    this.emit('gesture', gesture);

    // Start momentum scrolling if applicable
    if (this.options.enableMomentumScrolling && gesture.type === 'pan') {
      this.startMomentumScrolling();
    }

    // Reset gesture state
    this.resetGestureState();
  }

  /**
   * Handle tap gesture
   */
  handleTapGesture(touch) {
    const tap = {
      position: { x: touch.clientX, y: touch.clientY },
      timestamp: Date.now(),
      target: touch.target
    };

    // Add to tap history
    this.tapHistory.push(tap);

    // Keep only recent taps
    const cutoff = Date.now() - this.options.doubleTapDelay;
    this.tapHistory = this.tapHistory.filter(t => t.timestamp > cutoff);

    // Check for double tap
    if (this.tapHistory.length >= 2) {
      const lastTap = this.tapHistory[this.tapHistory.length - 1];
      const previousTap = this.tapHistory[this.tapHistory.length - 2];

      const timeDiff = lastTap.timestamp - previousTap.timestamp;
      const distance = this.getDistance(lastTap, previousTap);

      if (timeDiff < this.options.doubleTapDelay && distance < 30) {
        this.emit('doubleTap', { position: lastTap.position, target: lastTap.target });
        this.tapHistory = []; // Clear tap history
        return;
      }
    }

    // Single tap
    this.emit('tap', tap);
  }

  /**
   * Setup long press timer
   */
  setupLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }

    this.longPressTimer = setTimeout(() => {
      if (this.activeTouches.size === 1) {
        const touch = Array.from(this.activeTouches.values())[0];
        this.emit('longPress', {
          position: { x: touch.currentX, y: touch.currentY },
          target: touch.target,
          duration: Date.now() - touch.startTime
        });
      }
    }, this.options.longPressDelay);
  }

  /**
   * Start momentum scrolling
   */
  startMomentumScrolling() {
    if (!this.options.enableMomentumScrolling) return;

    this.momentumState.isActive = true;

    const animate = () => {
      if (!this.momentumState.isActive) return;

      // Apply decay to velocity
      this.momentumState.velocity.x *= this.options.momentumDecay;
      this.momentumState.velocity.y *= this.options.momentumDecay;

      // Update position
      this.momentumState.position.x += this.momentumState.velocity.x;
      this.momentumState.position.y += this.momentumState.velocity.y;

      // Emit momentum event
      this.emit('momentum', {
        position: this.momentumState.position,
        velocity: this.momentumState.velocity
      });

      // Continue animation if velocity is significant
      const speed = Math.sqrt(
        this.momentumState.velocity.x * this.momentumState.velocity.x +
          this.momentumState.velocity.y * this.momentumState.velocity.y
      );

      if (speed > 0.1) {
        requestAnimationFrame(animate);
      } else {
        this.momentumState.isActive = false;
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Stop momentum scrolling
   */
  stopMomentumScrolling() {
    this.momentumState.isActive = false;
    this.momentumState.velocity = { x: 0, y: 0 };
  }

  /**
   * Setup haptic feedback
   */
  setupHapticFeedback() {
    if (!this.options.enableHapticFeedback || !('vibrate' in navigator)) return;

    this.hapticPatterns = {
      touchstart: [10],
      touchend: [20],
      gesture: [30],
      longpress: [50],
      doubletap: [20, 10, 20]
    };
  }

  /**
   * Provide haptic feedback
   */
  provideHapticFeedback(type) {
    if (!this.options.enableHapticFeedback || !('vibrate' in navigator)) return;

    const pattern = this.hapticPatterns[type];
    if (pattern) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Setup gesture recognition
   */
  setupGestureRecognition() {
    if (!this.options.enableGestures) return;

    // Register default gesture handlers
    this.on('swipeLeft', gesture => this.handleSwipeLeft(gesture));
    this.on('swipeRight', gesture => this.handleSwipeRight(gesture));
    this.on('swipeUp', gesture => this.handleSwipeUp(gesture));
    this.on('swipeDown', gesture => this.handleSwipeDown(gesture));
    this.on('pinch', gesture => this.handlePinch(gesture));
    this.on('rotate', gesture => this.handleRotate(gesture));
  }

  /**
   * Default gesture handlers
   */
  handleSwipeLeft(gesture) {
    this.emit('navigation', { direction: 'next', gesture });
  }

  handleSwipeRight(gesture) {
    this.emit('navigation', { direction: 'previous', gesture });
  }

  handleSwipeUp(gesture) {
    this.emit('action', { type: 'close', gesture });
  }

  handleSwipeDown(gesture) {
    this.emit('action', { type: 'refresh', gesture });
  }

  handlePinch(gesture) {
    this.emit('zoom', { scale: gesture.scale, gesture });
  }

  handleRotate(gesture) {
    this.emit('rotation', { angle: gesture.rotation, gesture });
  }

  /**
   * Register custom gesture handler
   */
  onGesture(gestureType, callback) {
    if (!this.gestureCallbacks.has(gestureType)) {
      this.gestureCallbacks.set(gestureType, []);
    }
    this.gestureCallbacks.get(gestureType).push(callback);
  }

  /**
   * Remove gesture handler
   */
  offGesture(gestureType, callback) {
    const callbacks = this.gestureCallbacks.get(gestureType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Get distance between two touches
   */
  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get angle between two touches
   */
  getAngle(touch1, touch2) {
    return (
      Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * (180 / Math.PI)
    );
  }

  /**
   * Reset gesture state
   */
  resetGestureState() {
    this.gestureState = {
      isActive: false,
      type: null,
      startTime: 0,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      scale: 1,
      rotation: 0
    };
  }

  /**
   * Get current touch state
   */
  getTouchState() {
    return {
      activeTouches: Array.from(this.activeTouches.values()),
      gestureState: this.gestureState,
      momentumState: this.momentumState,
      tapHistory: this.tapHistory
    };
  }

  /**
   * Enable/disable gestures for specific element
   */
  setElementGestures(element, enabled) {
    if (enabled) {
      this.touchTargets.set(element, true);
    } else {
      this.touchTargets.delete(element);
    }
  }

  /**
   * Check if gestures are enabled for element
   */
  isGesturesEnabled(element) {
    return this.touchTargets.has(element);
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (!this.eventListeners || !this.eventListeners.has(event)) return;

    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in touch interaction ${event} callback:`, error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Remove event listeners
    if (this.touchEventHandlers) {
      Object.entries(this.touchEventHandlers).forEach(([event, handler]) => {
        document.removeEventListener(event, handler);
      });
    }

    // Clear timers
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }

    // Stop momentum scrolling
    this.stopMomentumScrolling();

    // Clear state
    this.activeTouches.clear();
    this.gestureCallbacks.clear();
    this.tapHistory = [];
    this.resetGestureState();

    this.isInitialized = false;
    console.log('Touch Interaction Service cleaned up');
  }
}

// Export singleton instance
export const touchInteractionService = new TouchInteractionService();
export default TouchInteractionService;
