import { defineConfig } from "vitest/config";
import * as path from 'path'

export default defineConfig({
  test: {
    globals: true,

    globalSetup: "./globalSetup.ts",
    setupFiles: ["./testSetup.ts"],
    environment: 'jsdom',
    include: [
      'src/**/*.test.{ts,tsx}',     // Colocated tests in features
      'src/**/*.spec.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',   // Tests in tests directory
      'tests/**/*.spec.{ts,tsx}'
    ],
    exclude: ['node_modules', '.git', 'docs', 'dist', 'coverage', '.mastra'],
    reporters: ['dot', 'json'],
    outputFile: {
      json: './docs/test-results/test-results.json'
    },
    testTimeout: 10000, // 10 seconds timeout
    hookTimeout: 10000, // 10 seconds for setup/teardown
    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'text-summary',
        'html',
        'json',
        'json-summary',
        'lcov'
      ],
      reportsDirectory: './docs/test-results/coverage',
      clean: false, // Don't clean the directory as it may be in use
      reportOnFailure: true, // Generate coverage reports even when tests fail
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/*.test.{ts,tsx}',
        'src/env.d.ts',
        'coverage/**',
        'dist/**',
        'public/**',
        '**/*.stories.*',
        '**/*.story.*',
      ],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      thresholds: {}
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
