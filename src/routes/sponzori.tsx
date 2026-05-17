import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout route for /sponzori — renders an Outlet so children
 * (/sponzori/, /sponzori/vsetci) actually mount.
 *
 * TanStack file-based routing turns `sponzori.tsx` into the parent of
 * any `sponzori.<child>.tsx` sibling files. Before this layout existed,
 * `sponzori.tsx` rendered the latest-sponsors list itself; visiting
 * /sponzori/vsetci still mounted that latest-list (because the parent
 * never deferred to its child) and the filterable grid was unreachable.
 *
 * The actual /sponzori page content lives in `sponzori.index.tsx`; the
 * filterable list in `sponzori.vsetci.tsx`. Both mount inside this
 * Outlet.
 */
export const Route = createFileRoute("/sponzori")({
  component: SponzoriLayout,
});

function SponzoriLayout() {
  return <Outlet />;
}

// Backwards-compat re-exports so existing imports from "@/routes/sponzori"
// (the vsetci page + tests for both) keep working after the index split.
export { SponzoriView, type PublicSponsor } from "./sponzori.index";
