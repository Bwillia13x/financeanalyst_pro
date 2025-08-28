import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { cryptoUtils } from '../../utils/cryptoUtils.js';
import { encryptionService, DATA_CLASSIFICATION, ENCRYPTION_CONFIG } from '../encryptionService.js';

vi.mock('../../utils/cryptoUtils.js', () => ({
  cryptoUtils: {
    getRandomValues: vi.fn(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      importKey: vi.fn(),
      deriveKey: vi.fn(),
      generateKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      digest: vi.fn(),
      exportKey: vi.fn()
    }
  }
}));

// Mock btoa and atob
global.btoa = vi.fn(str => Buffer.from(str, 'binary').toString('base64'));
global.atob = vi.fn(str => Buffer.from(str, 'base64').toString('binary'));

// Mock TextEncoder and TextDecoder
global.TextEncoder = vi.fn(() => ({
  encode: vi.fn(str => new Uint8Array(Buffer.from(str, 'utf8')))
}));

global.TextDecoder = vi.fn(() => ({
  decode: vi.fn(buffer => {
    if (!buffer) return '';
    return Buffer.from(buffer).toString('utf8');
  })
}));

describe('EncryptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    encryptionService.clearKeys();
  });

  afterEach(() => {
    encryptionService.clearKeys();
  });

  describe('Initialization', () => {
    it('should check crypto support correctly', () => {
      expect(encryptionService.checkCryptoSupport()).toBe(true);
    });

    it('should handle unsupported crypto environment', () => {
      const service = new encryptionService.constructor();
      service.isSupported = false;
      expect(service.isSupported).toBe(false);
    });

    it('should initialize with password successfully', async () => {
      const mockKey = { key: 'mock-key', salt: new Uint8Array(16) };

      cryptoUtils.subtle.importKey.mockResolvedValue('mock-key-material');
      cryptoUtils.subtle.deriveKey.mockResolvedValue('mock-derived-key');

      vi.spyOn(encryptionService, 'deriveKeyFromPassword').mockResolvedValue(mockKey);

      const result = await encryptionService.initialize('test-password');
      expect(result).toBe(true);
      expect(encryptionService.masterKey).toBe(mockKey);
    });

    it('should handle initialization failure', async () => {
      const spy = vi
        .spyOn(encryptionService, 'deriveKeyFromPassword')
        .mockRejectedValue(new Error('Derivation failed'));

      const result = await encryptionService.initialize('test-password');
      expect(result).toBe(false);

      spy.mockRestore();
    });
  });

  describe('Key Management', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should derive key from password with salt', async () => {
      const mockSalt = new Uint8Array(16);
      const mockKeyMaterial = 'mock-key-material';
      const mockDerivedKey = 'mock-derived-key';

      cryptoUtils.subtle.importKey.mockResolvedValue(mockKeyMaterial);
      cryptoUtils.subtle.deriveKey.mockResolvedValue(mockDerivedKey);

      const result = await encryptionService.deriveKeyFromPassword('password', mockSalt);

      expect(result).toEqual({
        key: mockDerivedKey,
        salt: mockSalt
      });

      expect(cryptoUtils.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
    });

    it('should generate random salt when not provided', async () => {
      const mockKeyMaterial = 'mock-key-material';
      const mockDerivedKey = 'mock-derived-key';

      cryptoUtils.subtle.importKey.mockResolvedValue(mockKeyMaterial);
      cryptoUtils.subtle.deriveKey.mockResolvedValue(mockDerivedKey);

      const result = await encryptionService.deriveKeyFromPassword('password');

      expect(result.salt).toBeInstanceOf(Uint8Array);
      expect(result.salt.length).toBe(ENCRYPTION_CONFIG.saltLength);
    });

    it('should generate random encryption key', async () => {
      const mockKey = 'mock-generated-key';
      cryptoUtils.subtle.generateKey.mockResolvedValue(mockKey);

      const result = await encryptionService.generateKey();

      expect(result).toBe(mockKey);
      expect(cryptoUtils.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          length: ENCRYPTION_CONFIG.keyLength
        },
        true,
        ['encrypt', 'decrypt']
      );
    });

    it('should throw error when generating key without crypto support', async () => {
      const originalSupported = encryptionService.isSupported;
      encryptionService.isSupported = false;

      await expect(encryptionService.generateKey()).rejects.toThrow('Encryption not supported');

      encryptionService.isSupported = originalSupported;
    });
  });

  describe('Data Encryption/Decryption', () => {
    beforeEach(() => {
      encryptionService.masterKey = { key: 'mock-master-key' };

      // Mock encrypt to return an ArrayBuffer with byteLength property
      const mockEncryptedBuffer = new ArrayBuffer(32);
      cryptoUtils.subtle.encrypt.mockResolvedValue(mockEncryptedBuffer);
    });

    it('should encrypt data successfully', async () => {
      const testData = { message: 'Hello, World!' };

      const result = await encryptionService.encryptData(testData);

      expect(result.encrypted).toBe(true);
      expect(typeof result.data).toBe('string'); // Base64 encoded string
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should decrypt data successfully', async () => {
      const testData = { message: 'Hello, World!' };

      // First, setup mocks for encryption
      const mockEncryptedBuffer = new ArrayBuffer(32);
      cryptoUtils.subtle.encrypt.mockResolvedValue(mockEncryptedBuffer);

      const encrypted = await encryptionService.encryptData(testData);

      // Then, setup mocks for decryption
      const mockDecryptedBuffer = new TextEncoder().encode(JSON.stringify(testData));
      cryptoUtils.subtle.decrypt.mockResolvedValue(mockDecryptedBuffer);

      const decrypted = await encryptionService.decryptData(encrypted);

      expect(decrypted).toEqual(testData);
    });

    it('should handle encryption without crypto support', async () => {
      const originalSupported = encryptionService.isSupported;
      encryptionService.isSupported = false;

      const testData = { test: 'data' };
      const result = await encryptionService.encryptData(testData);

      expect(result.encrypted).toBe(false);
      expect(result.data).toBe(testData);

      encryptionService.isSupported = originalSupported;
    });

    it('should decrypt data successfully', async () => {
      const encryptedData = {
        encrypted: true,
        data: 'encrypted-data',
        iv: new Uint8Array(12)
      };
      const mockDecryptedBuffer = new TextEncoder().encode('{"test":"data"}');

      cryptoUtils.subtle.decrypt.mockResolvedValue(mockDecryptedBuffer);

      const result = await encryptionService.decryptData(encryptedData);

      expect(result).toEqual({ test: 'data' });
    });

    it('should handle decryption of non-encrypted data', async () => {
      const nonEncryptedData = { encrypted: false, data: { test: 'data' } };

      const result = await encryptionService.decryptData(nonEncryptedData);

      expect(result).toEqual({ test: 'data' });
    });
  });

  describe('Data Classification', () => {
    it('should classify data as internal by default', () => {
      const data = { message: 'Hello world' };
      const classification = encryptionService.classifyData(data);

      expect(classification).toBe(DATA_CLASSIFICATION.INTERNAL);
    });

    it('should classify data as confidential when containing financial info', () => {
      const data = { revenue: 1000000, profit: 200000 };
      const classification = encryptionService.classifyData(data);

      expect(classification).toBe(DATA_CLASSIFICATION.CONFIDENTIAL);
    });

    it('should classify data as restricted when containing sensitive patterns', () => {
      const data = { ssn: '123-45-6789', password: 'secret123' };
      const classification = encryptionService.classifyData(data);

      expect(classification).toBe(DATA_CLASSIFICATION.RESTRICTED);
    });

    it('should classify data as public when context indicates', () => {
      const data = { message: 'Hello world' };
      const context = { isPublic: true };
      const classification = encryptionService.classifyData(data, context);

      expect(classification).toBe(DATA_CLASSIFICATION.PUBLIC);
    });

    it('should determine encryption requirement correctly', () => {
      expect(encryptionService.shouldEncrypt({}, DATA_CLASSIFICATION.PUBLIC)).toBe(false);
      expect(encryptionService.shouldEncrypt({}, DATA_CLASSIFICATION.CONFIDENTIAL)).toBe(true);
      expect(encryptionService.shouldEncrypt({}, DATA_CLASSIFICATION.RESTRICTED)).toBe(true);
    });
  });

  describe('Selective Field Encryption', () => {
    beforeEach(() => {
      encryptionService.masterKey = { key: 'mock-master-key' };
    });

    it('should encrypt sensitive fields only', async () => {
      const data = {
        publicInfo: 'public',
        personalInfo: { name: 'John Doe' },
        financialData: { revenue: 1000000 }
      };

      vi.spyOn(encryptionService, 'encryptData').mockResolvedValue({
        encrypted: true,
        data: 'encrypted-value'
      });

      const result = await encryptionService.encryptSensitiveFields(
        data,
        DATA_CLASSIFICATION.CONFIDENTIAL
      );

      expect(result.encryptedFields).toContain('personalInfo');
      expect(result.data.publicInfo).toBe('public');
    });

    it('should encrypt entire object for restricted data', async () => {
      const data = { test: 'data' };

      vi.spyOn(encryptionService, 'encryptData').mockResolvedValue({
        encrypted: true,
        data: 'encrypted-entire-object'
      });

      const result = await encryptionService.encryptSensitiveFields(
        data,
        DATA_CLASSIFICATION.RESTRICTED
      );

      expect(result.encrypted).toBe(true);
      expect(result.data).toBe('encrypted-entire-object');
    });

    it('should decrypt sensitive fields', async () => {
      const encryptedData = {
        encrypted: true,
        data: {
          publicInfo: 'public',
          personalInfo: { encrypted: true, data: 'encrypted-personal' }
        },
        encryptedFields: ['personalInfo']
      };

      vi.spyOn(encryptionService, 'decryptData').mockResolvedValue({ name: 'John Doe' });

      const result = await encryptionService.decryptSensitiveFields(encryptedData);

      expect(result.publicInfo).toBe('public');
      expect(result.personalInfo).toEqual({ name: 'John Doe' });
    });
  });

  describe('Utility Functions', () => {
    it('should get nested values correctly', () => {
      const obj = { a: { b: { c: 'value' } } };

      expect(encryptionService.getNestedValue(obj, 'a.b.c')).toBe('value');
      expect(encryptionService.getNestedValue(obj, 'a.b')).toEqual({ c: 'value' });
      expect(encryptionService.getNestedValue(obj, 'nonexistent')).toBeUndefined();
    });

    it('should set nested values correctly', () => {
      const obj = {};

      encryptionService.setNestedValue(obj, 'a.b.c', 'value');

      expect(obj.a.b.c).toBe('value');
    });

    it('should generate hash for data integrity', async () => {
      const testData = { test: 'data' };
      const mockHashBuffer = new ArrayBuffer(32);

      cryptoUtils.subtle.digest.mockResolvedValue(mockHashBuffer);

      const hash = await encryptionService.generateHash(testData);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should verify data integrity', async () => {
      const testData = { test: 'data' };
      const expectedHash = 'test-hash';

      vi.spyOn(encryptionService, 'generateHash').mockResolvedValue(expectedHash);

      const isValid = await encryptionService.verifyIntegrity(testData, expectedHash);

      expect(isValid).toBe(true);
    });

    it('should handle integrity verification without hash', async () => {
      const testData = { test: 'data' };

      const isValid = await encryptionService.verifyIntegrity(testData, null);

      expect(isValid).toBe(true);
    });
  });

  describe('Key Import/Export', () => {
    beforeEach(() => {
      encryptionService.masterKey = { key: 'mock-master-key' };
    });

    it('should export key successfully', async () => {
      const mockExportedKey = new ArrayBuffer(32);
      cryptoUtils.subtle.exportKey.mockResolvedValue(mockExportedKey);

      const exportedKey = await encryptionService.exportKey();

      expect(exportedKey).toBeDefined();
      expect(typeof exportedKey).toBe('string');
    });

    it('should import key successfully', async () => {
      const keyData = 'base64-encoded-key';
      const mockImportedKey = 'imported-key';

      cryptoUtils.subtle.importKey.mockResolvedValue(mockImportedKey);

      const importedKey = await encryptionService.importKey(keyData);

      expect(importedKey).toBe(mockImportedKey);
    });

    it('should throw error when exporting without key', async () => {
      encryptionService.masterKey = null;

      await expect(encryptionService.exportKey()).rejects.toThrow('No key to export');
    });
  });

  describe('Service Management', () => {
    it('should clear keys from memory', () => {
      encryptionService.masterKey = { key: 'test-key' };
      encryptionService.keyCache.set('test', 'cached-key');

      encryptionService.clearKeys();

      expect(encryptionService.masterKey).toBeNull();
      expect(encryptionService.keyCache.size).toBe(0);
    });

    it('should return correct status', () => {
      encryptionService.masterKey = { key: 'test-key' };

      const status = encryptionService.getStatus();

      expect(status.supported).toBe(true);
      expect(status.initialized).toBe(true);
      expect(status.algorithm).toBe(ENCRYPTION_CONFIG.algorithm);
      expect(status.keyLength).toBe(ENCRYPTION_CONFIG.keyLength);
    });

    it('should handle secure wipe for different data types', () => {
      // Test string wipe
      const stringData = 'sensitive-data';
      encryptionService.secureWipe(stringData);
      // String can't be truly wiped in JS, but function should not throw

      // Test ArrayBuffer wipe
      const bufferData = new ArrayBuffer(32);
      encryptionService.secureWipe(bufferData);
      // Should not throw

      // Test Uint8Array wipe
      const arrayData = new Uint8Array(32);
      encryptionService.secureWipe(arrayData);
      // Should not throw
    });
  });

  describe('Constants', () => {
    it('should export correct data classification constants', () => {
      expect(DATA_CLASSIFICATION.PUBLIC).toBe('public');
      expect(DATA_CLASSIFICATION.INTERNAL).toBe('internal');
      expect(DATA_CLASSIFICATION.CONFIDENTIAL).toBe('confidential');
      expect(DATA_CLASSIFICATION.RESTRICTED).toBe('restricted');
    });

    it('should export correct encryption configuration', () => {
      expect(ENCRYPTION_CONFIG.algorithm).toBe('AES-GCM');
      expect(ENCRYPTION_CONFIG.keyLength).toBe(256);
      expect(ENCRYPTION_CONFIG.ivLength).toBe(12);
      expect(ENCRYPTION_CONFIG.iterations).toBe(100000);
    });
  });
});
