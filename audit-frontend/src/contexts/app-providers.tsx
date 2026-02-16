import { memo } from "react";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/contexts/theme/theme-provider";
import { AuthProvider } from "@/contexts/auth/auth-provider";
import { UserRightsProvider } from "@/contexts/user-rights/user-rights-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DocumentModeProvider } from "@/contexts/document-mode/document-mode-provider";

interface AppProvidersProps {
  children: ReactNode;
}
/**
 * AppProviders combines all the application context providers into a single component
 * This helps organize the provider hierarchy and prevents excessive nesting in App.tsx
 * Provider order matters: AuthProvider → UserRightsProvider (depends on auth) → Others
 */
export const AppProviders = memo(({ children }: AppProvidersProps) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserRightsProvider>
          <DocumentModeProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </DocumentModeProvider>
        </UserRightsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
});

AppProviders.displayName = "AppProviders";
