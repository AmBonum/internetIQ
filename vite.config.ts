import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), TanStackRouterVite(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    outDir: "dist/client",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("/react/")) return "vendor-react";
            if (id.includes("@tanstack/")) return "vendor-tanstack";
            if (id.includes("@supabase/")) return "vendor-supabase";
            if (id.includes("@radix-ui/")) return "vendor-radix";
            if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("zod") || id.includes("react-hook-form") || id.includes("@hookform/"))
              return "vendor-forms";
            return "vendor-misc";
          }
          if (id.includes("/src/lib/quiz/questions")) return "quiz-questions";
          if (id.includes("/src/content/courses/")) return "courses-content";
          return undefined;
        },
      },
    },
  },
});
