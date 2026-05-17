import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi", ".wrangler", "admin-hub"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // AH-1.7 — supabaseAdmin / service-role import lockdown.
    // The admin Supabase client (added in AH-11) MUST only be imported
    // from server-only modules (*.server.ts, CF Pages Functions, or
    // server routes). Importing it from a client component leaks the
    // service-role key into the browser bundle. This rule is the
    // lint-time guard against that mistake.
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/**/*.server.ts",
      "src/**/*.functions.ts",
      "src/integrations/supabase/admin.ts",
      "src/integrations/supabase/client.server.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/integrations/supabase/admin",
              message:
                "supabaseAdmin must only be imported from *.server.ts, *.functions.ts, or functions/** — never from client code (AH-1.7).",
            },
            {
              name: "@/integrations/supabase/client.server",
              message:
                "client.server must only be imported from *.server.ts, *.functions.ts, or functions/** — never from client code (AH-1.7).",
            },
          ],
          patterns: [
            {
              group: ["**/integrations/supabase/admin", "**/integrations/supabase/client.server"],
              message:
                "Service-role Supabase client is server-only. See AH-1.7 in /tasks/PLAN-2026-05-17-admin-hub-integration.md.",
            },
          ],
        },
      ],
    },
  },
  {
    // shadcn UI primitives, the consent provider/hook pair, and the router
    // entry point intentionally co-locate non-component exports (variants,
    // hooks, factories) with components. Fast-refresh granularity is not a
    // concern there — disable the rule rather than splitting boilerplate.
    files: ["src/components/ui/**/*.{ts,tsx}", "src/hooks/useConsent.tsx", "src/router.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Playwright fixtures use a destructured `use` callback that the
    // react-hooks plugin mistakes for a React hook. e2e/ has no React
    // — disable both react-* rule sets for the entire Playwright tree.
    files: ["e2e/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  eslintPluginPrettier,
);
