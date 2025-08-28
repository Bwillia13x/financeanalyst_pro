module.exports = {
  extends: [
    'eslint:recommended',
    '@eslint/js/recommended'
  ],
  plugins: ['security'],
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    // Security-focused rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-insecure-randomness': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',

    // Additional security patterns
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-alert': 'warn',
    'no-console': 'warn',

    // Prevent common XSS vectors
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',

    // Prevent prototype pollution
    'no-prototype-builtins': 'error',

    // Enforce secure coding practices
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
      rules: {
        'security/detect-object-injection': 'off',
        'security/detect-non-literal-require': 'off'
      }
    }
  ]
};
