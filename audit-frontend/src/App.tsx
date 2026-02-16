import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useDocumentMode } from "@/hooks/common/use-document-mode";
import { useDocumentModeByRoute } from "@/hooks/common/use-document-mode-by-route";
import { useAuthContext } from "@/hooks/common/use-auth-context";

import { AppProviders } from "@/contexts/app-providers";

import { SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

import { AppSidebar } from "@/components/navigation/sidebar/app-sidebar-popup";
import { DocumentSidebar } from "@/components/navigation/document-sidebar/document-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeToggle } from "@/components/shared/theme-switcher";
import { AuthBootstrapper } from "@/components/auth/auth-bootstrapper";
import { PageLoadingLayout } from "@/components/layout/page-loading-layout";
import { RouteErrorBoundary } from "@/components/error-boundaries/route-error-boundary";
import { FloatingTaskWidget } from "@/components/FloatingTaskWidget";

import "react-medium-image-zoom/dist/styles.css";

function AppContent() {
  const { isDocMode } = useDocumentMode();
  const { user } = useAuthContext();

  // No need for session-expired event listener - handleSessionExpired redirects directly

  // Request notification permission on app load
  useEffect(() => {
    const appWindow = window as Window & {
      __notificationPermissionChecked?: boolean;
    };
    if (appWindow.__notificationPermissionChecked) {
      return;
    }
    appWindow.__notificationPermissionChecked = true;

    if ("Notification" in window && Notification.permission === "default") {
      console.log("[AppContent] Requesting notification permission...");
      Notification.requestPermission()
        .then((permission) => {
          console.log("[AppContent] Notification permission:", permission);
        })
        .catch((err) => {
          console.error(
            "[AppContent] Failed to request notification permission:",
            err
          );
        });
    } else if ("Notification" in window) {
      console.log(
        "[AppContent] Current notification permission:",
        Notification.permission
      );
    }
  }, []);

  useDocumentModeByRoute();

  // Only render FloatingTaskWidget when user is in Task module
  const isTaskModule = user?.strLastModuleName === "Task";

  return (
    <>
      {isDocMode ? <DocumentSidebar /> : <AppSidebar />}
      <SidebarInset>
        <SiteHeader />
        <PageLoadingLayout>
          <Outlet />
        </PageLoadingLayout>
      </SidebarInset>
      <ThemeToggle />

      {/* Floating Task Widget - Only rendered when in Task module */}
      {isTaskModule && <FloatingTaskWidget />}
    </>
  );
}

export default function App() {
  return (
    <>
      <AppProviders>
        <AuthBootstrapper>
          <RouteErrorBoundary>
            <AppContent />
          </RouteErrorBoundary>
        </AuthBootstrapper>
      </AppProviders>
      <Toaster />
    </>
  );
}
