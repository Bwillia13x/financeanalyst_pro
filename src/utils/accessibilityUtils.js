/**
 * Institutional Accessibility Utilities
 * WCAG 2.1 AA Compliance Tools
 */

// ===== ACCESSIBILITY CONSTANTS =====
export const ACCESSIBILITY_CONSTANTS = {
  // ARIA roles
  ROLES: {
    ALERT: 'alert',
    STATUS: 'status',
    LOG: 'log',
    PROGRESSBAR: 'progressbar',
    SLIDER: 'slider',
    SPINBUTTON: 'spinbutton',
    COMBOBOX: 'combobox',
    LISTBOX: 'listbox',
    OPTION: 'option',
    MENU: 'menu',
    MENUITEM: 'menuitem',
    MENUBAR: 'menubar',
    TABLIST: 'tablist',
    TAB: 'tab',
    TABPANEL: 'tabpanel'
  },

  // ARIA live regions
  LIVE_REGIONS: {
    OFF: 'off',
    POLITE: 'polite',
    ASSERTIVE: 'assertive'
  },

  // Keyboard navigation
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End'
  }
};

// ===== FOCUS MANAGEMENT UTILITIES =====

/**
 * Get all focusable elements within a container
 * @param {Element} container - Container element (defaults to document)
 * @returns {Element[]} Array of focusable elements
 */
export function getFocusableElements(container = document) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)).filter(element => {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' && style.visibility !== 'hidden' && !element.hasAttribute('inert')
    );
  });
}

/**
 * Move focus to the next focusable element
 * @param {Element} container - Container to search within
 * @returns {boolean} Success status
 */
export function moveFocusNext(container = document) {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(document.activeElement);

  if (currentIndex === -1) return false;

  const nextIndex = (currentIndex + 1) % focusableElements.length;
  focusableElements[nextIndex].focus();
  return true;
}

/**
 * Move focus to the previous focusable element
 * @param {Element} container - Container to search within
 * @returns {boolean} Success status
 */
export function moveFocusPrevious(container = document) {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(document.activeElement);

  if (currentIndex === -1) return false;

  const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
  focusableElements[prevIndex].focus();
  return true;
}

/**
 * Trap focus within a container
 * @param {React.RefObject} containerRef - React ref to container
 * @param {Object} options - Configuration options
 * @returns {Function} Cleanup function
 */
export function trapFocus(containerRef, options = {}) {
  const { initialFocus = true, restoreFocus = true } = options;
  const container = containerRef.current;

  if (!container) return () => {};

  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Store the currently focused element for restoration
  const previouslyFocusedElement = document.activeElement;

  // Focus first element if requested
  if (initialFocus && firstElement) {
    firstElement.focus();
  }

  const handleKeyDown = event => {
    if (event.key === ACCESSIBILITY_CONSTANTS.KEYS.TAB) {
      if (event.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    // Escape to exit focus trap
    if (event.key === ACCESSIBILITY_CONSTANTS.KEYS.ESCAPE && restoreFocus) {
      event.preventDefault();
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    if (
      restoreFocus &&
      previouslyFocusedElement &&
      typeof previouslyFocusedElement.focus === 'function'
    ) {
      previouslyFocusedElement.focus();
    }
  };
}

// ===== SCREEN READER UTILITIES =====

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  // Create or reuse announcement element
  let announcement = document.getElementById('sr-announcements');

  if (!announcement) {
    announcement = document.createElement('div');
    announcement.id = 'sr-announcements';
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    document.body.appendChild(announcement);
  }

  announcement.setAttribute('aria-live', priority);
  announcement.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    if (announcement) {
      announcement.textContent = '';
    }
  }, 1000);
}

/**
 * Create a live region for dynamic content
 * @param {string} id - Unique identifier
 * @param {string} priority - 'polite' or 'assertive'
 * @returns {HTMLElement} Live region element
 */
export function createLiveRegion(id, priority = 'polite') {
  const liveRegion = document.createElement('div');
  liveRegion.id = id;
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';

  document.body.appendChild(liveRegion);
  return liveRegion;
}

// ===== KEYBOARD NAVIGATION UTILITIES =====

/**
 * Handle keyboard navigation for lists and menus
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Object} handlers - Handler functions
 * @returns {boolean} Whether the event was handled
 */
export function handleKeyboardNavigation(event, handlers = {}) {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd
  } = handlers;
  const { key } = event;
  let handled = false;

  switch (key) {
    case ACCESSIBILITY_CONSTANTS.KEYS.ENTER:
      if (onEnter) {
        onEnter(event);
        handled = true;
      }
      break;
    case ACCESSIBILITY_CONSTANTS.KEYS.SPACE:
      if (onSpace) {
        onSpace(event);
        handled = true;
      }
      break;
    case ACCESSIBILITY_CONSTANTS.KEYS.ESCAPE:
      if (onEscape) {
        onEscape(event);
        handled = true;
      }
      break;
    case ACCESSIBILITY_CONSTANTS.KEYS.ARROW_UP:
      if (onArrowUp) {
        onArrowUp(event);
        handled = true;
      }
      break;
    case ACCESSIBILITY_CONSTANTS.KEYS.ARROW_DOWN:
      if (onArrowDown) {
        onArrowDown(event);
        handled = true;
      }
      break;
    case ACCESSIBILITY_CONSTANTS.KEYS.ARROW_LEFT:
      if (onArrowLeft) {
        onArrowLeft(event);
        handled = true;
      }
      break;
    case ACCESSIBILITY_CONSTANTS.KEYS.ARROW_RIGHT:
      if (onArrowRight) {
        onArrowRight(event);
        handled = true;
      }
      break;
    case ACCESSIBILITY_CONSTANTS.KEYS.HOME:
      if (onHome) {
        onHome(event);
        handled = true;
      }
      break;
    case ACCESSIBILITY_CONSTANTS.KEYS.END:
      if (onEnd) {
        onEnd(event);
        handled = true;
      }
      break;
  }

  return handled;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Generate unique ID for accessibility attributes
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export function generateAriaId(prefix = 'aria') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - Element to check
 * @returns {boolean} Visibility status
 */
export function isElementVisible(element) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view with proper focus management
 * @param {Element} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollIntoView(element, options = {}) {
  const { behavior = 'smooth', block = 'center', inline = 'nearest' } = options;

  if (element && typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ behavior, block, inline });

    // Ensure element gets focus after scrolling
    setTimeout(() => {
      if (typeof element.focus === 'function') {
        element.focus();
      }
    }, 100);
  }
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} Motion preference
 */
export function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if high contrast mode is active
 * @returns {boolean} High contrast status
 */
export function isHighContrastMode() {
  // Create a test element to check contrast
  const testElement = document.createElement('div');
  testElement.style.position = 'absolute';
  testElement.style.left = '-9999px';
  testElement.style.backgroundColor = 'rgb(31, 41, 55)'; // slate-800
  testElement.style.color = 'rgb(148, 163, 184)'; // slate-400

  document.body.appendChild(testElement);

  const computedStyle = window.getComputedStyle(testElement);
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;

  // Simple contrast check
  const hasHighContrast = backgroundColor !== color;

  document.body.removeChild(testElement);
  return hasHighContrast;
}

// ===== ACCESSIBILITY VALIDATION =====

/**
 * Validate color contrast ratio
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @returns {number} Contrast ratio
 */
export function getContrastRatio(foreground, background) {
  // Convert colors to RGB
  const fgRGB = hexToRgb(foreground) || rgbStringToRgb(foreground);
  const bgRGB = hexToRgb(background) || rgbStringToRgb(background);

  if (!fgRGB || !bgRGB) return 0;

  // Calculate relative luminance
  const fgLuminance = getRelativeLuminance(fgRGB);
  const bgLuminance = getRelativeLuminance(bgRGB);

  // Calculate contrast ratio
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param {number} ratio - Contrast ratio
 * @param {boolean} isLargeText - Whether text is large
 * @returns {boolean} Compliance status
 */
export function isContrastCompliant(ratio, isLargeText = false) {
  const aaThreshold = isLargeText ? 3.0 : 4.5;
  return ratio >= aaThreshold;
}

// Helper functions for contrast calculation
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function rgbStringToRgb(rgbString) {
  const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.exec(rgbString);
  return result
    ? {
        r: parseInt(result[1]),
        g: parseInt(result[2]),
        b: parseInt(result[3])
      }
    : null;
}

function getRelativeLuminance(rgb) {
  const { r, g, b } = rgb;

  // Convert to linear RGB
  const toLinear = value => {
    value = value / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

export { ACCESSIBILITY_CONSTANTS as ACCESSIBILITY };
