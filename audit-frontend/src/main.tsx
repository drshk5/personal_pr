import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { QueryProvider } from "@/lib/query-provider";
import AppRouter from "@/routes/app-routes";

import "./index.css";

// Force internal frontend routes to open in the same tab, even if older code uses window.open(..., "_blank").
const singleTabPatchKey = "__singleTabOpenPatched";

if (typeof window !== "undefined") {
  const singleTabWindow = window as Window & { [singleTabPatchKey]?: boolean };
  if (!singleTabWindow[singleTabPatchKey]) {
    const originalOpen = window.open.bind(window);

    window.open = ((
      url?: string | URL,
      target?: string,
      features?: string
    ): Window | null => {
      const rawUrl = typeof url === "string" ? url : url?.toString() ?? "";
      const isBlankTarget = target === "_blank";
      const isInternalPath =
        rawUrl.startsWith("/") || rawUrl.startsWith(window.location.origin);

      if (isBlankTarget && isInternalPath) {
        const nextUrl = rawUrl.startsWith(window.location.origin)
          ? rawUrl.slice(window.location.origin.length)
          : rawUrl;
        window.location.assign(nextUrl);
        return window;
      }

      return originalOpen(url as string | URL | undefined, target, features);
    }) as typeof window.open;

    singleTabWindow[singleTabPatchKey] = true;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={AppRouter} />
    </QueryProvider>
  </StrictMode>
);
