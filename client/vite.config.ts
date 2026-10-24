import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Same-origin /api in dev, so no CORS setup and the client never hardcodes a host.
    // API_URL lets a second stack (e.g. against the test schema) run beside the usual one.
    proxy: { "/api": process.env.API_URL ?? "http://localhost:4000" },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
