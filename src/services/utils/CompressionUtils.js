/**
 * Compression Utils
 * Provides data compression utilities for efficient storage
 */

export class CompressionUtils {
  constructor() {
    this.compressionFormat = 'gzip';
    this.textEncoder = new TextEncoder();
    this.textDecoder = new TextDecoder();
  }

  /**
   * Compress data using browser's native compression
   */
  async compress(data) {
    try {
      // Check if CompressionStream is available (modern browsers)
      if ('CompressionStream' in window) {
        return await this.compressWithStream(data);
      } else {
        // Fallback to LZ-string compression
        return await this.compressWithLZString(data);
      }
    } catch (error) {
      console.error('Compression failed:', error);
      // Return original data if compression fails
      return data;
    }
  }

  /**
   * Decompress data
   */
  async decompress(compressedData) {
    try {
      // Try native decompression first
      if ('DecompressionStream' in window && this.isNativeCompressed(compressedData)) {
        return await this.decompressWithStream(compressedData);
      } else {
        // Try LZ-string decompression
        return await this.decompressWithLZString(compressedData);
      }
    } catch (error) {
      console.error('Decompression failed:', error);
      // Return original data if decompression fails
      return compressedData;
    }
  }

  /**
   * Compress using native CompressionStream
   */
  async compressWithStream(data) {
    const stream = new CompressionStream(this.compressionFormat);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write data to compression stream
    const dataBuffer = this.textEncoder.encode(data);
    writer.write(dataBuffer);
    writer.close();

    // Read compressed data
    const chunks = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks and convert to base64
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Add marker to identify native compression
    return 'NATIVE_GZIP:' + this.arrayBufferToBase64(combined.buffer);
  }

  /**
   * Decompress using native DecompressionStream
   */
  async decompressWithStream(compressedData) {
    // Remove marker
    const data = compressedData.replace('NATIVE_GZIP:', '');
    const compressedBuffer = this.base64ToArrayBuffer(data);

    const stream = new DecompressionStream(this.compressionFormat);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write compressed data to decompression stream
    writer.write(new Uint8Array(compressedBuffer));
    writer.close();

    // Read decompressed data
    const chunks = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks and convert to string
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return this.textDecoder.decode(combined);
  }

  /**
   * Compress using LZ-string algorithm (fallback)
   */
  async compressWithLZString(data) {
    // Simple LZ77-style compression implementation
    const dictionary = new Map();
    const result = [];
    let dictSize = 256;
    
    // Initialize dictionary with single characters
    for (let i = 0; i < 256; i++) {
      dictionary.set(String.fromCharCode(i), i);
    }

    let current = '';
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const combined = current + char;
      
      if (dictionary.has(combined)) {
        current = combined;
      } else {
        result.push(dictionary.get(current));
        dictionary.set(combined, dictSize++);
        current = char;
      }
    }
    
    if (current) {
      result.push(dictionary.get(current));
    }

    // Convert to base64
    const compressed = new Uint16Array(result);
    return 'LZ_STRING:' + this.arrayBufferToBase64(compressed.buffer);
  }

  /**
   * Decompress LZ-string compressed data
   */
  async decompressWithLZString(compressedData) {
    // Remove marker
    const data = compressedData.replace('LZ_STRING:', '');
    const buffer = this.base64ToArrayBuffer(data);
    const compressed = new Uint16Array(buffer);

    const dictionary = new Map();
    let dictSize = 256;
    
    // Initialize dictionary
    for (let i = 0; i < 256; i++) {
      dictionary.set(i, String.fromCharCode(i));
    }

    let result = '';
    let previous = String.fromCharCode(compressed[0]);
    result += previous;

    for (let i = 1; i < compressed.length; i++) {
      const code = compressed[i];
      let current;
      
      if (dictionary.has(code)) {
        current = dictionary.get(code);
      } else if (code === dictSize) {
        current = previous + previous[0];
      } else {
        throw new Error('Invalid compressed data');
      }
      
      result += current;
      dictionary.set(dictSize++, previous + current[0]);
      previous = current;
    }

    return result;
  }

  /**
   * Check if data is compressed with native compression
   */
  isNativeCompressed(data) {
    return typeof data === 'string' && data.startsWith('NATIVE_GZIP:');
  }

  /**
   * Check if data is compressed with LZ-string
   */
  isLZStringCompressed(data) {
    return typeof data === 'string' && data.startsWith('LZ_STRING:');
  }

  /**
   * Check if data appears to be compressed
   */
  isCompressed(data) {
    return this.isNativeCompressed(data) || this.isLZStringCompressed(data);
  }

  /**
   * Get compression ratio
   */
  getCompressionRatio(originalData, compressedData) {
    const originalSize = new Blob([originalData]).size;
    const compressedSize = new Blob([compressedData]).size;
    return compressedSize / originalSize;
  }

  /**
   * Estimate compression benefit
   */
  async estimateCompressionBenefit(data) {
    try {
      const originalSize = new Blob([data]).size;
      const compressed = await this.compress(data);
      const compressedSize = new Blob([compressed]).size;
      
      return {
        originalSize,
        compressedSize,
        ratio: compressedSize / originalSize,
        savings: originalSize - compressedSize,
        savingsPercentage: ((originalSize - compressedSize) / originalSize) * 100,
        worthCompressing: compressedSize < originalSize * 0.9 // 10% savings threshold
      };
    } catch (error) {
      return {
        originalSize: new Blob([data]).size,
        compressedSize: new Blob([data]).size,
        ratio: 1,
        savings: 0,
        savingsPercentage: 0,
        worthCompressing: false,
        error: error.message
      };
    }
  }

  /**
   * Check if compression is available
   */
  isAvailable() {
    return 'CompressionStream' in window || true; // LZ-string fallback always available
  }

  /**
   * Get compression info
   */
  getInfo() {
    return {
      nativeCompressionAvailable: 'CompressionStream' in window,
      fallbackAvailable: true,
      defaultFormat: this.compressionFormat,
      available: this.isAvailable()
    };
  }

  /**
   * Test compression performance
   */
  async performanceTest() {
    const testData = JSON.stringify({
      test: 'compression performance',
      data: new Array(1000).fill('This is test data for compression performance testing. '.repeat(10)),
      numbers: new Array(100).fill(0).map((_, i) => i),
      timestamp: Date.now()
    });

    const iterations = 20;

    try {
      // Test compression performance
      const compressStart = performance.now();
      let compressed;
      for (let i = 0; i < iterations; i++) {
        compressed = await this.compress(testData);
      }
      const compressTime = performance.now() - compressStart;

      // Test decompression performance
      const decompressStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await this.decompress(compressed);
      }
      const decompressTime = performance.now() - decompressStart;

      const compressionRatio = this.getCompressionRatio(testData, compressed);

      return {
        compressTime: compressTime / iterations,
        decompressTime: decompressTime / iterations,
        totalTime: compressTime + decompressTime,
        originalSize: testData.length,
        compressedSize: compressed.length,
        compressionRatio,
        savingsPercentage: (1 - compressionRatio) * 100,
        iterations,
        method: this.isNativeCompressed(compressed) ? 'native' : 'lz-string'
      };

    } catch (error) {
      console.error('Compression performance test failed:', error);
      return null;
    }
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
}
