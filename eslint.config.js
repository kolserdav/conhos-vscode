// @ts-check
const ts = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');
const prettier = require('eslint-plugin-prettier');

module.exports = [
  {
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
      },
    },
    files: ['**/*.js', '**/*.ts'],
    plugins: { '@typescript-eslint': ts, prettier },
    ignores: ['node_modules', 'dist', 'tmp'],
    rules: {
      'prettier/prettier': 1,
      'no-unused-vars': 1,
      '@typescript-eslint/ban-ts-comment': 1,
      'no-console': 1,
      '@typescript-eslint/no-unused-vars': 1,
      '@typescript-eslint/no-explicit-any': 1,
      '@typescript-eslint/no-this-alias': 1,
    },
  },
];
