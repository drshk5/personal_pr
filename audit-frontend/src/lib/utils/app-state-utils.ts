import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export async function resetAppState(queryClient: QueryClient): Promise<void> {
  await queryClient.removeQueries();
  localStorage.removeItem("audit-software-query-cache");

  const themePreference = localStorage.getItem("theme");
  const colorScheme = localStorage.getItem("color-scheme");
  const borderRadius = localStorage.getItem("border-radius");

  localStorage.clear();

  if (themePreference) {
    localStorage.setItem("theme", themePreference);
  }
  if (colorScheme) {
    localStorage.setItem("color-scheme", colorScheme);
  }
  if (borderRadius) {
    localStorage.setItem("border-radius", borderRadius);
  }

  sessionStorage.clear();

  window.dispatchEvent(new Event("tokenChange"));
}

// Clear auth tokens alongside React Query cache and its persisted snapshot.
export async function clearTokensAndCache(
  queryClient: QueryClient
): Promise<void> {
  await resetAppState(queryClient);
  localStorage.removeItem("Token");
}

// Clear React Query in-memory cache and its persisted localStorage entry
// without affecting auth tokens or other app preferences.
export async function clearReactQueryPersistence(
  queryClient: QueryClient
): Promise<void> {
  // Prefer full clear (queries + mutations) when available
  queryClient.clear();

  // Remove the persisted cache snapshot used by PersistQueryClientProvider
  try {
    localStorage.removeItem("audit-software-query-cache");
  } catch {
    // ignore
  }
}

export async function refreshAppState(queryClient: QueryClient): Promise<void> {
  await queryClient.resetQueries();
  await queryClient.refetchQueries({ type: "all" });
}

export async function handleSessionExpired(): Promise<void> {
  try {
    // ✅ FIX 3: STOP SignalR on token expiry (prevents infinite retry loops with bad token)
    console.log("[Session] Token expired, stopping SignalR connection...");
    const { signalRService } = await import("@/services/task/signalr.service");
    signalRService.stop().catch((err) => {
      console.warn("[Session] Error stopping SignalR on expiry:", err);
    });

    const qc = window.__QUERY_CLIENT__;
    if (qc) {
      await clearTokensAndCache(qc);
    }
  } finally {
    toast.error("Your session has expired. Please log in again.");
    window.location.replace("/auth/login");
  }
}
