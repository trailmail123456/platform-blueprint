import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:8080",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    defaultCommandTimeout: 15000,
    video: false,
    env: {
      // Override per environment. Two pre-existing test users are required.
      USER_A_EMAIL: "[email protected]",
      USER_A_PASSWORD: "TestPass123!",
      USER_B_EMAIL: "[email protected]",
      USER_B_PASSWORD: "TestPass123!",
    },
  },
});
