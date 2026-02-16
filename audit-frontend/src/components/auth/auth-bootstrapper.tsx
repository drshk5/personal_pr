import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { AppLoader } from "@/components/layout/app-loader";
import { useAuthContext, useUserRights } from "@/hooks";
import { useToken } from "@/hooks/common/use-token";

interface AuthBootstrapperProps {
  children: ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/change-password",
];

export const AuthBootstrapper = ({ children }: AuthBootstrapperProps) => {
  const { isLoading: isAuthLoading } = useAuthContext();
  const { isLoading: isMenuLoading } = useUserRights();
  const { hasToken } = useToken();
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

    // For public routes, bootstrap immediately
    if (isPublicRoute) {
      setIsBootstrapped(true);
      return;
    }

    // For protected routes, wait for auth to load
    if (isAuthLoading) return;

    // If has token, wait for menu to load
    if (hasToken && isMenuLoading) return;

    // Everything is ready - show content immediately
    setIsBootstrapped(true);
  }, [isAuthLoading, isMenuLoading, hasToken, location.pathname]);

  if (!isBootstrapped) {
    return <AppLoader />;
  }

  // After bootstrapping, if no token and not on public route, redirect to login
  // But give axios interceptor a chance to refresh first
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  if (!hasToken && !isPublicRoute && !isAuthLoading) {
    console.log("[AuthBootstrapper] No token found, redirecting to login");
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};
