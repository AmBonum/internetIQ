import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Vitest runs in a separate config from `vite.config.ts` so it does not pull
// in the TanStack Start / Cloudflare server plugins, which break `jsdom`.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
  },
});
