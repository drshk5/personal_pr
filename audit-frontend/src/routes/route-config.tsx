import React, { Suspense, lazy } from "react";
import type { MenuItem } from "@/types/central/user-rights";
import { PageLoader } from "@/components/layout/page-loader";
import { getCentralRouteElement } from "./central-routes";
import { getTaskRouteElement } from "./task-routes";
import { getAccountRouteElement } from "./account-routes";
import { getCrmRouteElement } from "./crm-routes";

const NotFound = lazy(
  () => import("@/components/error-boundaries/page-not-found")
);
const NotImplementedWrapper = lazy(
  () => import("@/components/shared/not-implemented-wrapper")
);

const wrapWithSuspense = (
  Component: React.ComponentType
): React.ReactElement => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const getRouteElement = (
  mapKey: string,
  menuItem?: MenuItem
): React.ReactElement => {
  // Try Central routes first
  const centralRoute = getCentralRouteElement(mapKey);
  if (centralRoute) return centralRoute;

  // Try Task routes
  const taskRoute = getTaskRouteElement(mapKey);
  if (taskRoute) return taskRoute;

  // Try Account routes
  const accountRoute = getAccountRouteElement(mapKey);
  if (accountRoute) return accountRoute;

  // Try CRM routes
  const crmRoute = getCrmRouteElement(mapKey);
  if (crmRoute) return crmRoute;

  // Return NotImplementedWrapper if menuItem exists, otherwise NotFound
  return menuItem ? (
    <Suspense fallback={<PageLoader />}>
      <NotImplementedWrapper menuItem={menuItem} />
    </Suspense>
  ) : (
    wrapWithSuspense(NotFound)
  );
};
