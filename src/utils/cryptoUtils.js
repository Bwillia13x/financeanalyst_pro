import { webcrypto } from 'crypto';

const getCrypto = () => {
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto;
  }
  return webcrypto;
};

export const cryptoUtils = {
  getRandomValues: (array) => getCrypto().getRandomValues(array),
  subtle: {
    importKey: (...args) => getCrypto().subtle.importKey(...args),
    deriveKey: (...args) => getCrypto().subtle.deriveKey(...args),
    encrypt: (...args) => getCrypto().subtle.encrypt(...args),
    decrypt: (...args) => getCrypto().subtle.decrypt(...args),
    exportKey: (...args) => getCrypto().subtle.exportKey(...args),
    digest: (...args) => getCrypto().subtle.digest(...args),
  },
};
