import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { QueryProvider } from "@/lib/query-provider";
import AppRouter from "@/routes/app-routes";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={AppRouter} />
    </QueryProvider>
  </StrictMode>
);
