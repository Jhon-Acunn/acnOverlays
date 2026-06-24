'use strict';

const globals = {
  io: 'readonly',
};

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals,
        ...require('globals').browser,
        ...require('globals').node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'no-var': 'error',
    },
  },
  {
    files: ['src/server/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      globals: { ...require('globals').node },
    },
  },
  {
    files: ['src/client/**/*.js'],
    languageOptions: {
      globals: { ...require('globals').browser },
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
  },
];
