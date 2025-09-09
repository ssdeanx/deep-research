import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./globalSetup.ts",
    setupFiles: ["./testSetup.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    // reporters: "verbose",
    // environment: "jsdom",
    // environmentOptions: {
    //   jsdom: {
    //     resources: "usable",
    //   },
    // },
    
  },
});