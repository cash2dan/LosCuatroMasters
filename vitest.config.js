import { defineConfig } from "vitest/config";

/* Egen config i stället för vite.config.js: testerna behöver varken
   PWA-plugin, service worker eller React-transform, och de ska kunna
   köras utan att bygget dras igång. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
