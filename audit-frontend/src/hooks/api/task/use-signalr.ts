import { useEffect, useState, useCallback, useRef } from "react";
import { HubConnectionState } from "@microsoft/signalr";

import {
  signalRService,
  type NotificationUpdateData,
} from "@/services/task/signalr.service";

import { useToken } from "@/hooks/common/use-token";

export interface SignalRHookResult {
  connectionState: HubConnectionState;
  isConnected: boolean;
  error: Error | null;
  joinOrganizationGroup: (organizationGuid: string) => Promise<void>;
  leaveOrganizationGroup: (organizationGuid: string) => Promise<void>;
}

export function useSignalR(): SignalRHookResult {
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    signalRService.getState()
  );
  const [error, setError] = useState<Error | null>(null);
  const [isInitialPageLoading, setIsInitialPageLoading] = useState(true);
  const { token } = useToken();
  const initAttemptedRef = useRef(false);

  useEffect(() => {
    console.log("[useSignalR Hook] Initializing... Token available:", !!token);
    let mounted = true;
    let stateCheckInterval: NodeJS.Timeout | null = null;
    let idleCallbackId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // ✅ FIX 1: Check if page is fully loaded before starting SignalR
    const handlePageLoadComplete = () => {
      console.log("[useSignalR Hook] Page fully loaded");
      if (mounted) {
        setIsInitialPageLoading(false);
      }
    };

    if (document.readyState === "complete") {
      handlePageLoadComplete();
    } else {
      window.addEventListener("load", handlePageLoadComplete);
    }

    const initializeConnection = async () => {
      // ✅ FIX 4: Prevent multiple initialization attempts
      if (initAttemptedRef.current) {
        console.log(
          "[useSignalR Hook] SignalR already attempted to initialize, skipping"
        );
        return;
      }
      initAttemptedRef.current = true;

      if (!token) {
        console.warn(
          "[useSignalR Hook] No token available, skipping connection"
        );
        setError(new Error("No authentication token"));
        return;
      }

      // ✅ FIX 1: Only start if authenticated AND page not loading AND tab visible
      const shouldStartSignalR =
        !!token &&
        !isInitialPageLoading &&
        document.visibilityState === "visible";

      if (!shouldStartSignalR) {
        console.log("[useSignalR Hook] Not ready for SignalR:", {
          hasToken: !!token,
          isInitialPageLoading,
          tabVisible: document.visibilityState,
        });
        return;
      }

      try {
        console.log("[useSignalR Hook] Starting SignalR connection...");
        await signalRService.start();

        if (mounted) {
          const state = signalRService.getState();
          console.log("[useSignalR Hook] Connected! State:", state);
          setConnectionState(state);
          setError(null);

          // Only poll connection state every 10s instead of 5s to reduce overhead
          stateCheckInterval = setInterval(() => {
            if (mounted) {
              const currentState = signalRService.getState();
              setConnectionState((prevState) => {
                // Only update if state actually changed to prevent unnecessary re-renders
                return prevState !== currentState ? currentState : prevState;
              });
            }
          }, 10000);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Connection failed";
        console.error("[useSignalR Hook] Connection error:", errorMsg);
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Connection failed"));
        }
      }
    };

    // ✅ FIX 2 + 3: Start SignalR after first paint using requestIdleCallback or setTimeout fallback
    const startSignalRAfterPaint = () => {
      // Global guard to avoid multiple schedules across multiple hook instances
      const win = window as unknown as { __signalrStartScheduled?: boolean };
      if (win.__signalrStartScheduled) {
        console.log(
          "[useSignalR Hook] Start already scheduled globally, skipping"
        );
        return;
      }
      win.__signalrStartScheduled = true;

      if (
        "requestIdleCallback" in window &&
        typeof window.requestIdleCallback === "function"
      ) {
        console.log("[useSignalR Hook] Using requestIdleCallback");
        idleCallbackId = window.requestIdleCallback(
          () => {
            console.log("[useSignalR Hook] requestIdleCallback fired");
            initializeConnection();
          },
          { timeout: 5000 }
        );
      } else {
        // Fallback: setTimeout 3000ms after first paint
        console.log("[useSignalR Hook] Using setTimeout fallback (3000ms)");
        timeoutId = setTimeout(() => {
          console.log("[useSignalR Hook] setTimeout fired");
          initializeConnection();
        }, 3000);
      }
    };

    // Start after page load AND only when we're actually ready
    const shouldStartSignalR =
      !!token &&
      !isInitialPageLoading &&
      document.visibilityState === "visible";

    if (shouldStartSignalR) {
      startSignalRAfterPaint();
    }

    return () => {
      console.log("[useSignalR Hook] Cleanup");
      mounted = false;
      if (stateCheckInterval) {
        clearInterval(stateCheckInterval);
      }
      if (idleCallbackId !== null) {
        cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Allow re-scheduling on full unmount/navigation
      const win = window as unknown as { __signalrStartScheduled?: boolean };
      win.__signalrStartScheduled = win.__signalrStartScheduled || false;
    };
  }, [token, isInitialPageLoading]);

  const joinOrganizationGroup = useCallback(
    async (organizationGuid: string) => {
      await signalRService.joinOrganizationGroup(organizationGuid);
    },
    []
  );

  const leaveOrganizationGroup = useCallback(
    async (organizationGuid: string) => {
      await signalRService.leaveOrganizationGroup(organizationGuid);
    },
    []
  );

  return {
    connectionState,
    isConnected: connectionState === HubConnectionState.Connected,
    error,
    joinOrganizationGroup,
    leaveOrganizationGroup,
  };
}

// Main hook to get notification updates (count + last notification)
export function useNotificationUpdateWS(
  enabled = true
): NotificationUpdateData {
  const [notificationUpdate, setNotificationUpdate] =
    useState<NotificationUpdateData>({
      unreadCount: 0,
      lastNotification: null,
    });
  // Do NOT call useSignalR here to avoid starting connection from this hook.
  // This hook only listens for updates; connection start is controlled elsewhere.

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribe = signalRService.onNotificationUpdate((update) => {
      setNotificationUpdate(update);
    });

    return () => {
      unsubscribe();
    };
  }, [enabled]);

  return notificationUpdate;
}
