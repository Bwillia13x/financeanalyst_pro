/**
 * Data Encryption Service
 * Provides client-side encryption for sensitive financial data
 */

import { apiLogger } from '../utils/apiLogger.js';
import { cryptoUtils } from '../utils/cryptoUtils.js';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  tagLength: 16,
  saltLength: 16,
  iterations: 100000, // PBKDF2 iterations
  keyDerivation: 'PBKDF2'
};

// Data classification levels
const DATA_CLASSIFICATION = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted'
};

// Fields that require encryption based on classification
const ENCRYPTION_RULES = {
  [DATA_CLASSIFICATION.CONFIDENTIAL]: [
    'personalInfo',
    'financialData.revenue',
    'financialData.profit',
    'assumptions.proprietary',
    'notes.private'
  ],
  [DATA_CLASSIFICATION.RESTRICTED]: [
    'all' // Encrypt everything for restricted data
  ]
};

/**
 * Encryption Service Class
 */
class EncryptionService {
  constructor() {
    this.isSupported = this.checkCryptoSupport();
    this.masterKey = null;
    this.keyCache = new Map();

    if (!this.isSupported) {
      apiLogger.log('WARN', 'Web Crypto API not supported - encryption disabled');
    }
  }

  /**
   * Check if Web Crypto API is supported
   */
  checkCryptoSupport() {
    try {
      return !!cryptoUtils.subtle;
    } catch {
      return false;
    }
  }

  /**
   * Initialize encryption with user password
   */
  async initialize(password) {
    if (!this.isSupported) {
      return false;
    }

    try {
      // Derive master key from password
      this.masterKey = await this.deriveKeyFromPassword(password);

      apiLogger.log('INFO', 'Encryption service initialized');
      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to initialize encryption', { error: error.message });
      return false;
    }
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  async deriveKeyFromPassword(password, salt = null) {
    if (!salt) {
      salt = cryptoUtils.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
    }

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await cryptoUtils.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive actual encryption key
    const key = await cryptoUtils.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: ENCRYPTION_CONFIG.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );

    return { key, salt };
  }

  /**
   * Generate random encryption key
   */
  async generateKey() {
    if (!this.isSupported) {
      throw new Error('Encryption not supported');
    }

    return await cryptoUtils.subtle.generateKey(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data with AES-GCM
   */
  async encryptData(data, key = null) {
    if (!this.isSupported) {
      return { encrypted: false, data };
    }

    try {
      const encryptionKey = key || this.masterKey?.key;
      if (!encryptionKey) {
        throw new Error('No encryption key available');
      }

      // Convert data to string if needed
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);

      // Generate random IV
      const iv = cryptoUtils.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));

      // Encrypt data
      const encryptedBuffer = await cryptoUtils.subtle.encrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv
        },
        encryptionKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convert to base64 for storage
      const base64Data = btoa(String.fromCharCode(...result));

      return {
        encrypted: true,
        data: base64Data,
        algorithm: ENCRYPTION_CONFIG.algorithm,
        timestamp: Date.now()
      };
    } catch (error) {
      apiLogger.log('ERROR', 'Encryption failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Decrypt data with AES-GCM
   */
  async decryptData(encryptedData, key = null) {
    if (!this.isSupported || !encryptedData.encrypted) {
      return encryptedData.data;
    }

    try {
      const decryptionKey = key || this.masterKey?.key;
      if (!decryptionKey) {
        throw new Error('No decryption key available');
      }

      // Convert from base64
      const encryptedBuffer = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = encryptedBuffer.slice(0, ENCRYPTION_CONFIG.ivLength);
      const data = encryptedBuffer.slice(ENCRYPTION_CONFIG.ivLength);

      // Decrypt data
      const decryptedBuffer = await cryptoUtils.subtle.decrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv
        },
        decryptionKey,
        data
      );

      // Convert back to string
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      apiLogger.log('ERROR', 'Decryption failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Classify data sensitivity level
   */
  classifyData(data, context = {}) {
    // Simple classification rules - in production this would be more sophisticated
    const dataString = JSON.stringify(data).toLowerCase();

    // Check for restricted patterns
    const restrictedPatterns = [
      'ssn',
      'social security',
      'tax id',
      'ein',
      'bank account',
      'routing number',
      'credit card',
      'password',
      'secret',
      'private key'
    ];

    if (restrictedPatterns.some(pattern => dataString.includes(pattern))) {
      return DATA_CLASSIFICATION.RESTRICTED;
    }

    // Check for confidential patterns
    const confidentialPatterns = [
      'revenue',
      'profit',
      'ebitda',
      'cash flow',
      'valuation',
      'acquisition',
      'merger',
      'proprietary',
      'confidential'
    ];

    if (confidentialPatterns.some(pattern => dataString.includes(pattern))) {
      return DATA_CLASSIFICATION.CONFIDENTIAL;
    }

    // Check context
    if (context.userRole === 'guest' || context.isPublic) {
      return DATA_CLASSIFICATION.PUBLIC;
    }

    return DATA_CLASSIFICATION.INTERNAL;
  }

  /**
   * Determine if data should be encrypted based on classification
   */
  shouldEncrypt(data, classification = null) {
    if (!this.isSupported) {
      return false;
    }

    const dataClass = classification || this.classifyData(data);

    return (
      dataClass === DATA_CLASSIFICATION.CONFIDENTIAL || dataClass === DATA_CLASSIFICATION.RESTRICTED
    );
  }

  /**
   * Selectively encrypt sensitive fields in an object
   */
  async encryptSensitiveFields(data, classification = null) {
    if (!this.isSupported) {
      return { encrypted: false, data };
    }

    const dataClass = classification || this.classifyData(data);
    const encryptionRules = ENCRYPTION_RULES[dataClass];

    if (!encryptionRules) {
      return { encrypted: false, data };
    }

    try {
      const result = { ...data };
      const encryptedFields = [];

      if (encryptionRules.includes('all')) {
        // Encrypt entire object
        return await this.encryptData(data);
      }

      // Encrypt specific fields
      for (const fieldPath of encryptionRules) {
        const value = this.getNestedValue(data, fieldPath);
        if (value !== undefined) {
          const encrypted = await this.encryptData(value);
          this.setNestedValue(result, fieldPath, encrypted);
          encryptedFields.push(fieldPath);
        }
      }

      return {
        encrypted: encryptedFields.length > 0,
        data: result,
        encryptedFields,
        classification: dataClass
      };
    } catch (error) {
      apiLogger.log('ERROR', 'Selective encryption failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Decrypt sensitive fields in an object
   */
  async decryptSensitiveFields(encryptedData) {
    if (!this.isSupported || !encryptedData.encrypted) {
      return encryptedData.data;
    }

    try {
      if (!encryptedData.encryptedFields) {
        // Entire object was encrypted
        return await this.decryptData(encryptedData);
      }

      const result = { ...encryptedData.data };

      // Decrypt specific fields
      for (const fieldPath of encryptedData.encryptedFields) {
        const encryptedValue = this.getNestedValue(result, fieldPath);
        if (encryptedValue && encryptedValue.encrypted) {
          const decrypted = await this.decryptData(encryptedValue);
          this.setNestedValue(result, fieldPath, decrypted);
        }
      }

      return result;
    } catch (error) {
      apiLogger.log('ERROR', 'Selective decryption failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get nested object value by path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested object value by path
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Generate data hash for integrity verification
   */
  async generateHash(data) {
    if (!this.isSupported) {
      return null;
    }

    try {
      const encoder = new TextEncoder();
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const dataBuffer = encoder.encode(dataString);

      const hashBuffer = await cryptoUtils.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);

      return btoa(String.fromCharCode(...hashArray));
    } catch (error) {
      apiLogger.log('ERROR', 'Hash generation failed', { error: error.message });
      return null;
    }
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(data, expectedHash) {
    if (!expectedHash) {
      return true; // No hash to verify against
    }

    const actualHash = await this.generateHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Secure data wipe (overwrite memory)
   */
  secureWipe(data) {
    if (typeof data === 'string') {
      // Can't truly wipe strings in JS, but we can try
      data = null;
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      // Overwrite buffer with random data
      const view = new Uint8Array(data);
      cryptoUtils.getRandomValues(view);
    }
  }

  /**
   * Export encryption key (for backup)
   */
  async exportKey(key = null) {
    if (!this.isSupported) {
      throw new Error('Encryption not supported');
    }

    const exportKey = key || this.masterKey?.key;
    if (!exportKey) {
      throw new Error('No key to export');
    }

    const exported = await cryptoUtils.subtle.exportKey('raw', exportKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Import encryption key (from backup)
   */
  async importKey(keyData) {
    if (!this.isSupported) {
      throw new Error('Encryption not supported');
    }

    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

    return await cryptoUtils.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Clear encryption keys from memory
   */
  clearKeys() {
    this.masterKey = null;
    this.keyCache.clear();
    apiLogger.log('INFO', 'Encryption keys cleared');
  }

  /**
   * Get encryption status
   */
  getStatus() {
    return {
      supported: this.isSupported,
      initialized: !!this.masterKey,
      algorithm: ENCRYPTION_CONFIG.algorithm,
      keyLength: ENCRYPTION_CONFIG.keyLength
    };
  }
}

// Export singleton instance and constants
export const encryptionService = new EncryptionService();
export { DATA_CLASSIFICATION, ENCRYPTION_CONFIG };
export default encryptionService;
