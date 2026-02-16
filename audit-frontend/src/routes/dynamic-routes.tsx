import { lazy, Suspense } from "react";
import type { MenuItem } from "@/types/central/user-rights";
import type { RouteObject } from "react-router-dom";
import { PageLoader } from "@/components/layout/page-loader";
import { getRouteElement } from "./route-config";

/**
 * Creates routes based on user menu rights
 */
export function createDynamicRoutes(menuItems: MenuItem[]): RouteObject[] {
  const processRoutes = (items: MenuItem[]): RouteObject[] => {
    return items.flatMap((item): RouteObject[] => {
      if (!item.permission?.bolCanView) {
        return [];
      }

      const routes: RouteObject[] = [];

      const cleanPath = item.strPath.startsWith("/")
        ? item.strPath.slice(1)
        : item.strPath;

      if (!cleanPath.includes(":")) {
        routes.push({
          path: cleanPath,
          element: getRouteElement(item.strMapKey, item),
        });
      } else {
        routes.push({
          path: cleanPath,
          element: getRouteElement(item.strMapKey, item),
        });
      }

      if (!cleanPath.includes(":") && !item.strMapKey.includes("_form")) {
        const basePath = cleanPath.endsWith("/")
          ? cleanPath.slice(0, -1)
          : cleanPath;

        // Handle both old-style (year_list -> year_form) and new-style (year) consolidated mapkeys
        const formMapKey = item.strMapKey.includes("_list")
          ? `${item.strMapKey.replace("_list", "")}_form`
          : `${item.strMapKey}_form`;

        routes.push({
          path: `${basePath}/new`,
          element: getRouteElement(formMapKey, item),
        });

        // Add route for ID parameter (e.g., /year/:id)
        routes.push({
          path: `${basePath}/:id`,
          element: getRouteElement(formMapKey, item),
        });
      }

      if (item.children && item.children.length > 0) {
        item.children.forEach((child: MenuItem) => {
          if (child.permission?.bolCanView) {
            const childRoutes = processRoutes([child]);
            routes.push(...childRoutes);
          }
        });
      }

      return routes;
    });
  };

  const routes = processRoutes(menuItems);

  // Add catch-all route for 404
  const NotFound = lazy(
    () => import("@/components/error-boundaries/page-not-found")
  );
  routes.push({
    path: "*",
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFound />
      </Suspense>
    ),
  });

  return routes;
}
