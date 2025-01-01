import { Outlet, Link, createRootRoute } from "@tanstack/react-router";

import { ConsentBanner } from "@/components/ConsentBanner";
import { ConsentPreferencesDialog } from "@/components/ConsentPreferencesDialog";
import { SiteHeader } from "@/components/SiteHeader";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Stránka nenájdená</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Stránka, ktorú hľadáš, neexistuje alebo bola presunutá.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Späť na domov
          </Link>
        </div>
      </div>
    </div>
  );
}

function RootComponent() {
  return (
    <>
      <SiteHeader />
      <Outlet />
      <ConsentBanner />
      <ConsentPreferencesDialog />
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});
