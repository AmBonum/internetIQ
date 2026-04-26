import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ConsentProvider } from "@/hooks/useConsent";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const router = createRouter({
  routeTree,
  // Restore scroll position when navigating back/forward via the browser
  // — needed so users returning from a course CTA land back on the same
  // question card they were reading in the answer review.
  scrollRestoration: true,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConsentProvider>
      <RouterProvider router={router} />
    </ConsentProvider>
  </React.StrictMode>,
);
