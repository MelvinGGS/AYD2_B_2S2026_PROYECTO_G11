import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: false,
    defaultCommandTimeout: 8000,
    setupNodeEvents(on, config) {
      // Configuracion para eventos de Cypress
    },
  },
});
