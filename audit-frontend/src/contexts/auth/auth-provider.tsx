import { useMemo, type ReactNode } from "react";
import type { User } from "@/types/central/user";

import { useAuth } from "@/hooks/api/central/use-auth";

import { AuthContext, type AuthContextType } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const value: AuthContextType = useMemo(
    () => ({
      user: auth.user as User | null | undefined,
      isLoading: auth.isLoadingUser,
      isError: auth.isUserError,
      logout: auth.logout,
      login: auth.login,
      isLoggingIn: auth.isLoggingIn,
      isLoggingOut: auth.isLoggingOut,
    }),
    [
      auth.user,
      auth.isLoadingUser,
      auth.isUserError,
      auth.logout,
      auth.login,
      auth.isLoggingIn,
      auth.isLoggingOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
