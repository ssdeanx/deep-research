import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import tsdoc from 'eslint-plugin-tsdoc'
import jsdoc from 'eslint-plugin-jsdoc'
import prettierConfig from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      tsdoc,
      jsdoc
    },
    rules: {
      // Standard style guide rules
      'no-unused-vars': 'warn', // Turn off base rule
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'warn',
      'no-var': 'warn',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'warn',
      'no-shadow': 'off', // Turn off base rule for TS version
      '@typescript-eslint/no-shadow': 'error',

      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'signature',
            'field',
            'constructor',
            'method'
          ]
        }
      ],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-regexp-exec': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',

      // Disable some rules that conflict with Standard
      'no-undef': 'off', // TypeScript handles this
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',

      // Additional code quality rules
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',

      // TSDoc documentation rules
      'tsdoc/syntax': 'error',



      // JSDoc documentation rules
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-indentation': 'warn',
      'jsdoc/check-param-names': 'warn',
      'jsdoc/check-property-names': 'warn',
      'jsdoc/check-syntax': 'warn',


      'jsdoc/require-param': 'warn', // Changed from 'warb' to 'warn'
      'jsdoc/require-param-description': 'warn', // Changed from 'error' to 'warn'
    }
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.js',
      '.mastra/**',
      'eslint.config.js',
      'vitest.config.ts',

      "vite.config.ts"
    ]
  }
]