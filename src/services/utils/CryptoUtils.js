/**
 * Crypto Utils
 * Provides encryption and decryption utilities for data persistence
 */

export class CryptoUtils {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for GCM
    this.tagLength = 16; // 128 bits for GCM
    this.textEncoder = new TextEncoder();
    this.textDecoder = new TextDecoder();

    // Generate or retrieve encryption key
    this.initializeKey();
  }

  /**
   * Initialize encryption key
   */
  async initializeKey() {
    try {
      // Try to get existing key from localStorage
      const storedKey = localStorage.getItem('financeanalyst_crypto_key');

      if (storedKey) {
        // Import existing key
        const keyData = this.base64ToArrayBuffer(storedKey);
        this.cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: this.algorithm },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.cryptoKey = await crypto.subtle.generateKey(
          {
            name: this.algorithm,
            length: this.keyLength
          },
          true,
          ['encrypt', 'decrypt']
        );

        // Store key for future use
        const exportedKey = await crypto.subtle.exportKey('raw', this.cryptoKey);
        const keyString = this.arrayBufferToBase64(exportedKey);
        localStorage.setItem('financeanalyst_crypto_key', keyString);
      }

      console.log('✅ Crypto key initialized');
    } catch (error) {
      console.error('❌ Failed to initialize crypto key:', error);
      throw error;
    }
  }

  /**
   * Encrypt data
   */
  async encrypt(data) {
    if (!this.cryptoKey) {
      await this.initializeKey();
    }

    try {
      // Convert string to ArrayBuffer
      const dataBuffer = this.textEncoder.encode(data);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv
        },
        this.cryptoKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convert to base64 for storage
      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData) {
    if (!this.cryptoKey) {
      await this.initializeKey();
    }

    try {
      // Convert base64 to ArrayBuffer
      const combined = this.base64ToArrayBuffer(encryptedData);

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.ivLength);
      const encryptedBuffer = combined.slice(this.ivLength);

      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv
        },
        this.cryptoKey,
        encryptedBuffer
      );

      // Convert back to string
      return this.textDecoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate hash of data
   */
  async hash(data) {
    try {
      const dataBuffer = this.textEncoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      return this.arrayBufferToBase64(hashBuffer);
    } catch (error) {
      console.error('Hashing failed:', error);
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(data, expectedHash) {
    try {
      const actualHash = await this.hash(data);
      return actualHash === expectedHash;
    } catch (error) {
      console.error('Integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure random string
   */
  generateRandomString(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array.buffer).substring(0, length);
  }

  /**
   * Derive key from password (for future use)
   */
  async deriveKeyFromPassword(password, salt) {
    try {
      const passwordBuffer = this.textEncoder.encode(password);
      const saltBuffer = this.textEncoder.encode(salt);

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      // Derive key using PBKDF2
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: this.algorithm,
          length: this.keyLength
        },
        false,
        ['encrypt', 'decrypt']
      );

      return derivedKey;
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }

  /**
   * Check if Web Crypto API is available
   */
  isAvailable() {
    return !!(window.crypto && window.crypto.subtle);
  }

  /**
   * Get encryption info
   */
  getInfo() {
    return {
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      ivLength: this.ivLength,
      available: this.isAvailable(),
      keyInitialized: !!this.cryptoKey
    };
  }

  // Utility methods

  /**
   * Convert ArrayBuffer to base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Securely clear sensitive data from memory
   */
  clearSensitiveData(data) {
    if (data instanceof ArrayBuffer) {
      const view = new Uint8Array(data);
      crypto.getRandomValues(view);
    } else if (typeof data === 'string') {
      // For strings, we can't directly clear memory in JavaScript
      // but we can at least overwrite the reference
      data = null;
    }
  }

  /**
   * Test encryption/decryption performance
   */
  async performanceTest() {
    if (!this.isAvailable()) {
      return null;
    }

    const testData = JSON.stringify({
      test: 'performance',
      data: new Array(1000).fill('test data for performance testing'),
      timestamp: Date.now()
    });

    const iterations = 50;

    try {
      // Test encryption performance
      const encryptStart = performance.now();
      let encrypted;
      for (let i = 0; i < iterations; i++) {
        encrypted = await this.encrypt(testData);
      }
      const encryptTime = performance.now() - encryptStart;

      // Test decryption performance
      const decryptStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await this.decrypt(encrypted);
      }
      const decryptTime = performance.now() - decryptStart;

      return {
        encryptTime: encryptTime / iterations,
        decryptTime: decryptTime / iterations,
        totalTime: encryptTime + decryptTime,
        dataSize: testData.length,
        encryptedSize: encrypted.length,
        compressionRatio: encrypted.length / testData.length,
        iterations
      };
    } catch (error) {
      console.error('Crypto performance test failed:', error);
      return null;
    }
  }
}
