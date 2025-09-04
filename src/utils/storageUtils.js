/**
 * Safe localStorage utility for cross-environment compatibility
 * Handles both browser and Node.js contexts gracefully
 */

/**
 * Check if localStorage is available in the current environment
 * @returns {boolean} True if localStorage is available
 */
export const isLocalStorageAvailable = () => {
  // Check if running in browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    // Actually test localStorage access
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    // Storage not available (disabled, quota exceeded, etc.)
    console.warn('localStorage is not available:', error.message);
    return false;
  }
};

/**
 * Safely get an item from localStorage
 * @param {string} key - The key to retrieve
 * @param {*} defaultValue - Default value if key not found or storage unavailable
 * @returns {*} The stored value or default value
 */
export const safeGetItem = (key, defaultValue = null) => {
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error.message);
    return defaultValue;
  }
};

/**
 * Safely set an item in localStorage
 * @param {string} key - The key to set
 * @param {*} value - The value to store (will be JSON.stringify'd if object)
 * @returns {boolean} True if successful, false otherwise
 */
export const safeSetItem = (key, value) => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    // Handle objects by serializing them
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error.message);
    return false;
  }
};

/**
 * Safely remove an item from localStorage
 * @param {string} key - The key to remove
 * @returns {boolean} True if successful, false otherwise
 */
export const safeRemoveItem = (key) => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error.message);
    return false;
  }
};

/**
 * Safely clear all localStorage items with optional prefix filter
 * @param {string} prefix - Optional prefix to filter items (removes only items starting with this prefix)
 * @returns {boolean} True if successful, false otherwise
 */
export const safeClear = (prefix = null) => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    if (!prefix) {
      localStorage.clear();
    } else {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
    }
    return true;
  } catch (error) {
    console.warn(`Failed to clear localStorage${prefix ? ` (prefix: ${prefix})` : ''}:`, error.message);
    return false;
  }
};

/**
 * Get localStorage stats (size information)
 * @returns {Object} Stats object or empty object if storage unavailable
 */
export const getStorageStats = () => {
  if (!isLocalStorageAvailable()) {
    return {
      available: false,
      used: 0,
      keys: 0,
      error: 'localStorage not available'
    };
  }

  try {
    const keys = Object.keys(localStorage);
    let totalSize = 0;

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      totalSize += key.length + (value ? value.length : 0);
    });

    return {
      available: true,
      used: totalSize,
      keys: keys.length,
      formattedSize: `${(totalSize / 1024).toFixed(1)} KB`
    };
  } catch (error) {
    return {
      available: false,
      used: 0,
      keys: 0,
      error: error.message
    };
  }
};

/**
 * Enhanced localStorage wrapper that provides additional features
 */
export class SafeStorage {
  constructor(prefix = '') {
    this.prefix = prefix;
    this.isAvailable = isLocalStorageAvailable();
  }

  getKey(key) {
    return this.prefix ? `${this.prefix}_${key}` : key;
  }

  getItem(key, defaultValue = null) {
    return safeGetItem(this.getKey(key), defaultValue);
  }

  setItem(key, value) {
    return safeSetItem(this.getKey(key), value);
  }

  removeItem(key) {
    return safeRemoveItem(this.getKey(key));
  }

  clear() {
    if (this.prefix) {
      return safeClear(this.prefix);
    } else {
      return safeClear();
    }
  }

  getStats() {
    if (!this.isAvailable) {
      return { available: false, error: 'localStorage not available' };
    }

    try {
      const allStats = getStorageStats();
      if (this.prefix) {
        // Calculate stats only for prefixed items
        const keys = Object.keys(localStorage);
        const prefixedKeys = keys.filter(key => key.startsWith(this.prefix));
        let prefixSize = 0;

        prefixedKeys.forEach(key => {
          const value = localStorage.getItem(key);
          prefixSize += key.length + (value ? value.length : 0);
        });

        return {
          ...allStats,
          prefixed: {
            keys: prefixedKeys.length,
            size: prefixSize,
            formattedSize: `${(prefixSize / 1024).toFixed(1)} KB`
          }
        };
      }

      return allStats;
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
}

// Global instance for general use
export const globalStorage = new SafeStorage();

// Initialize diagnostic logging
if (typeof console !== 'undefined') {
  const availability = isLocalStorageAvailable();
  console.log(
    '🔧 localStorage Status:',
    availability ? '✅ Available' : '❌ Not Available',
    availability ? `(${getStorageStats().formattedSize || '0 KB'})` : ''
  );

  if (!availability) {
    console.info(
      '💡 Tip: Running in Node.js environment - localStorage operations will be safely handled'
    );
  }
}

export default SafeStorage;
