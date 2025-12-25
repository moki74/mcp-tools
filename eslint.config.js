import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      'no-console': 'off', // Disable console warnings for now
      'no-unused-vars': 'off', // We'll use TypeScript's compiler for this
      'semi': 'off', // Disable semicolon rule
      'quotes': 'off', // Disable quotes rule to avoid style issues
      'comma-dangle': 'off', // Disable comma-dangle rule
      '@typescript-eslint/no-explicit-any': 'warn', // Warn but don't error on any types
      '@typescript-eslint/no-unused-vars': 'warn', // Use TypeScript's version
      'no-undef': 'off', // Disable undef rule to handle __dirname
      'no-duplicate-imports': 'off', // Disable to avoid import issues
      'prefer-const': 'off', // Disable to reduce noise
      'no-var': 'off', // Disable to reduce noise
      'no-control-regex': 'off', // Disable control regex rule for sanitization functions
      'no-useless-escape': 'off', // Disable for regex patterns in our code
      'no-case-declarations': 'off', // Disable for switch statements with declarations
    },
    files: ['**/*.ts'],
    ignores: ['dist/**', 'node_modules/**'],
  },
];