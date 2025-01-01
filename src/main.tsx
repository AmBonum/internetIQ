import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ConsentProvider } from "@/hooks/useConsent";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const router = createRouter({ routeTree });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConsentProvider>
      <RouterProvider router={router} />
    </ConsentProvider>
  </React.StrictMode>,
);
