import * as signalR from "@microsoft/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import { environment } from "@/config/environment";
import { notificationSound } from "@/lib/notification-sound";

export interface NotificationData {
  strNotificationGUID: string;
  strUserGUID: string;
  strUserName?: string;
  strFromUserGUID?: string;
  strFromUserName?: string;
  strTaskGUID?: string;
  strTaskTitle?: string;
  strBoardGUID?: string;
  strBoardName?: string;
  strNotificationType: string;
  strTitle: string;
  strMessage: string;
  bIsRead: boolean;
  dReadOn?: string;
  dtCreatedOn: string;
  strOrganizationGUID: string;
  strYearGUID: string;
}

export interface NotificationUpdateData {
  unreadCount: number;
  lastNotification: NotificationData | null;
}

export interface NotificationBatchUpdateData {
  unreadCount: number;
  notifications: NotificationData[];
}

export type NotificationUpdateCallback = (
  update: NotificationUpdateData
) => void;

class SignalRService {
  // ✅ FIX 5: SINGLETON - only ONE instance per tab
  private static instance: SignalRService | null = null;

  private connection: HubConnection | null = null;
  private importConnection: HubConnection | null = null;
  private notificationUpdateCallbacks: NotificationUpdateCallback[] = [];
  // ✅ FIX 4: Reduce aggressive reconnect: [5000, 15000, 60000] instead of exponential backoff
  private readonly RECONNECT_DELAYS = [5000, 15000, 60000];
  private isConnecting = false;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private visibilityChangeHandler: (() => void) | null = null;

  // ✅ FIX 5: Private constructor for singleton pattern
  private constructor() {
    this.connection = null;
    this.setupVisibilityHandler();
  }

  // ✅ FIX 5: Static method to get singleton instance
  static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  async start(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      return;
    }

    if (this.connection?.state === HubConnectionState.Connecting) {
      return;
    }

    if (this.isConnecting) {
      const maxWaitTime = 10000;
      const startWait = Date.now();
      while (this.isConnecting && Date.now() - startWait < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isConnecting = true;

    try {
      const token = localStorage.getItem("Token");

      if (!token) {
        console.warn(
          "[SignalR] No authentication token found. Connection will fail."
        );
        this.isConnecting = false;
        throw new Error("Authentication token not found");
      }

      if (this.connection) {
        const currentState = this.connection.state;
        if (currentState !== HubConnectionState.Disconnected) {
          try {
            await this.connection.stop();
          } catch (err) {
            console.warn("[SignalR] Error stopping previous connection:", err);
          }
        }
        this.connection = null;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.hubUrl}/hubs/notification`, {
          transport: signalR.HttpTransportType.WebSockets,
          skipNegotiation: true,
          accessTokenFactory: () => token,
        })
        // ✅ FIX 4: Use fixed reconnect delays instead of aggressive exponential backoff
        // [5000, 15000, 60000] = wait 5s, then 15s, then 60s, then stop
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delay =
              this.RECONNECT_DELAYS[retryContext.previousRetryCount];
            if (!delay) {
              console.log(
                "[SignalR] Max reconnect attempts reached. Stopping automatic reconnect."
              );
              return null; // Stop reconnecting
            }
            console.log(
              `[SignalR] Will retry in ${delay}ms (attempt ${retryContext.previousRetryCount + 1})`
            );
            return delay;
          },
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.setupEventHandlers();

      await this.connection.start();
      console.log("[SignalR] Connected successfully");
      this.isConnecting = false;

      this.startKeepAlive();
    } catch (error) {
      this.isConnecting = false;
      console.error("[SignalR] Connection failed:", error);
      // ✅ Automatic reconnect will handle retry, or manual restart required
      throw error;
    }
  }

  async startImportConnection(): Promise<void> {
    if (this.importConnection?.state === HubConnectionState.Connected) {
      return;
    }

    if (this.importConnection?.state === HubConnectionState.Connecting) {
      return;
    }

    try {
      const token = localStorage.getItem("Token");

      if (!token) {
        console.warn(
          "[SignalR] No authentication token found for import hub. Connection will fail."
        );
        throw new Error("Authentication token not found");
      }

      if (this.importConnection) {
        const currentState = this.importConnection.state;
        if (currentState !== HubConnectionState.Disconnected) {
          try {
            await this.importConnection.stop();
          } catch (err) {
            console.warn("[SignalR] Error stopping import connection:", err);
          }
        }
        this.importConnection = null;
      }

      this.importConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.hubUrl}/hubs/task-import`, {
          transport: signalR.HttpTransportType.WebSockets,
          skipNegotiation: true,
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delay =
              this.RECONNECT_DELAYS[retryContext.previousRetryCount];
            if (!delay) {
              console.log(
                "[SignalR] Max reconnect attempts reached for import hub."
              );
              return null;
            }
            console.log(
              `[SignalR] Import hub retry in ${delay}ms (attempt ${retryContext.previousRetryCount + 1})`
            );
            return delay;
          },
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.importConnection.onreconnecting((error) => {
        console.warn("[SignalR] Import hub reconnecting...", error);
      });

      this.importConnection.onreconnected((connectionId) => {
        console.log(
          "[SignalR] Import hub reconnected. Connection ID:",
          connectionId
        );
      });

      this.importConnection.onclose((error) => {
        console.error("[SignalR] Import hub connection closed:", error);
      });

      await this.importConnection.start();
      console.log("[SignalR] Import hub connected successfully");
    } catch (error) {
      console.error("[SignalR] Import hub connection failed:", error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle single notification update (for backward compatibility)
    this.connection.on(
      "NotificationUpdate",
      (update: NotificationUpdateData) => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[SignalR] 🔔 Notification update: count=${update.unreadCount}`
          );
        }

        if (update.lastNotification) {
          this.showDesktopNotification(update.lastNotification);
        }

        requestAnimationFrame(() => {
          this.notificationUpdateCallbacks.forEach((callback) => {
            try {
              callback(update);
            } catch (error) {
              console.error(
                "[SignalR] Error in notification update callback:",
                error
              );
            }
          });
        });
      }
    );

    // Handle batch notification updates (multiple notifications at once)
    this.connection.on(
      "NotificationBatchUpdate",
      (batchUpdate: NotificationBatchUpdateData) => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[SignalR] 📦 Batch notification update: count=${batchUpdate.notifications.length}, unread=${batchUpdate.unreadCount}`
          );
        }

        // Show desktop notification for each notification in the batch
        if (batchUpdate.notifications && batchUpdate.notifications.length > 0) {
          batchUpdate.notifications.forEach((notification, index) => {
            // Add slight delay between notifications to prevent browser grouping
            setTimeout(() => {
              this.showDesktopNotification(notification);
            }, index * 300); // 300ms delay between each notification
          });
        }

        // Convert batch update to standard update format for callbacks
        // Send the first (most recent) notification as lastNotification
        const standardUpdate: NotificationUpdateData = {
          unreadCount: batchUpdate.unreadCount,
          lastNotification:
            batchUpdate.notifications && batchUpdate.notifications.length > 0
              ? batchUpdate.notifications[0]
              : null,
        };

        requestAnimationFrame(() => {
          this.notificationUpdateCallbacks.forEach((callback) => {
            try {
              callback(standardUpdate);
            } catch (error) {
              console.error(
                "[SignalR] Error in batch notification update callback:",
                error
              );
            }
          });
        });
      }
    );

    this.connection.onreconnecting((error) => {
      console.warn("[SignalR] Reconnecting...", error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log(
        "[SignalR] Reconnected successfully. Connection ID:",
        connectionId
      );
    });

    this.connection.onclose((error) => {
      console.error("[SignalR] Connection closed:", error);
      // ✅ Automatic reconnect handles retry logic now, no manual retry needed
    });
  }

  async stop(): Promise<void> {
    try {
      this.stopKeepAlive();

      // Clear all callbacks to prevent stale data from being processed
      this.notificationUpdateCallbacks = [];

      if (this.connection) {
        // Just stop the connection directly - backend doesn't have NotifyDisconnect method
        await this.connection.stop();
        console.log("[SignalR] ✓ Connection stopped cleanly");
      }

      this.isConnecting = false;
    } catch (error) {
      console.error("[SignalR] Error stopping connection:", error);
    }
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (this.isConnected()) {
        this.connection?.invoke("KeepAlive").catch(() => {});
      }
    }, 30000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private setupVisibilityHandler(): void {
    this.visibilityChangeHandler = () => {
      // ✅ Only reconnect when tab becomes visible IF connection was lost
      // DO NOT stop on tab hidden - user wants notifications even when tab is hidden
      if (document.visibilityState === "visible") {
        if (!this.isConnected() && !this.isConnecting) {
          console.log("[SignalR] Tab became visible, reconnecting...");
          this.start().catch((err) => {
            console.error(
              "[SignalR] Failed to reconnect on visibility change:",
              err
            );
          });
        }
      }
    };

    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
  }

  private showDesktopNotification(notification: NotificationData): void {
    console.log(
      "[SignalR] showDesktopNotification called for:",
      notification.strTitle
    );

    // Log notification permission state
    if ("Notification" in window) {
      console.log(
        "[SignalR] Notification API available. Permission:",
        Notification.permission
      );
    } else {
      console.log("[SignalR] Notification API not available in this browser");
      return;
    }

    // ALWAYS play sound first, regardless of tab visibility or notification permission
    // This ensures sound plays even if desktop notifications are blocked
    try {
      console.log("[SignalR] Playing notification sound...");
      notificationSound.play();
    } catch (err) {
      console.warn("[SignalR] Failed to play notification sound:", err);
    }

    // Only show desktop notification if permission is granted
    if (Notification.permission === "granted") {
      try {
        console.log("[SignalR] Creating desktop notification...");
        // Use proper public path for production builds
        const iconPath = `${window.location.origin}/neminath.png`;

        const desktopNotif = new Notification(notification.strTitle, {
          body: notification.strMessage,
          icon: iconPath,
          tag: notification.strNotificationGUID,
          requireInteraction: false, // Changed to false so notifications auto-dismiss
          badge: iconPath,
          silent: true, // Use silent:true since we're playing custom sound
        });

        desktopNotif.onclick = () => {
          console.log("[SignalR] Notification clicked");
          window.focus();
          desktopNotif.close();
        };

        console.log("[SignalR] ✓ Desktop notification shown successfully");
      } catch (err) {
        console.error("[SignalR] ✗ Failed to show desktop notification:", err);
      }
    } else if (Notification.permission === "default") {
      console.log(
        "[SignalR] Notification permission is default, requesting..."
      );
      Notification.requestPermission().then((permission) => {
        console.log("[SignalR] Permission response:", permission);
        if (permission === "granted") {
          console.log(
            "[SignalR] Permission granted! Showing notification now..."
          );
          this.showDesktopNotification(notification);
        } else {
          console.log("[SignalR] Permission denied by user");
        }
      });
    } else if (Notification.permission === "denied") {
      console.log(
        "[SignalR] Notification permission denied. User will not see browser notifications."
      );
      // Sound still plays even if notifications are denied
    }
  }

  onNotificationUpdate(callback: NotificationUpdateCallback): () => void {
    this.notificationUpdateCallbacks.push(callback);
    return () => {
      this.notificationUpdateCallbacks =
        this.notificationUpdateCallbacks.filter((cb) => cb !== callback);
    };
  }

  getState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  // ✅ Expose connection for hooks that need direct access to SignalR Hub methods
  getConnection(): HubConnection | null {
    return this.connection;
  }

  async joinOrganizationGroup(organizationGuid: string): Promise<void> {
    if (!this.isConnected()) {
      console.warn("[SignalR] Cannot join group: not connected");
      return;
    }

    try {
      await this.connection!.invoke("JoinOrganizationGroup", organizationGuid);
      console.log(`[SignalR] Joined organization group: ${organizationGuid}`);
    } catch (error) {
      console.error("[SignalR] Error joining organization group:", error);
      throw error;
    }
  }

  async leaveOrganizationGroup(organizationGuid: string): Promise<void> {
    if (!this.isConnected()) {
      console.warn("[SignalR] Cannot leave group: not connected");
      return;
    }

    try {
      await this.connection!.invoke("LeaveOrganizationGroup", organizationGuid);
      console.log(`[SignalR] Left organization group: ${organizationGuid}`);
    } catch (error) {
      console.error("[SignalR] Error leaving organization group:", error);
      throw error;
    }
  }

  /**
   * Join a task import group to receive real-time progress updates
   * Used by useImportSignalRProgress hook for live import status
   */
  async joinImportGroup(importId: string): Promise<void> {
    if (!this.isImportConnected()) {
      console.warn("[SignalR] Cannot join import group: not connected");
      return;
    }

    try {
      await this.importConnection!.invoke("JoinImportGroup", importId);
      console.log(`[SignalR] Joined import group: ${importId}`);
    } catch (error) {
      console.error("[SignalR] Error joining import group:", error);
      throw error;
    }
  }

  /**
   * Leave a task import group (stop receiving progress updates)
   * Called when import completes or user navigates away
   */
  async leaveImportGroup(importId: string): Promise<void> {
    if (!this.isImportConnected()) {
      console.warn("[SignalR] Cannot leave import group: not connected");
      return;
    }

    try {
      await this.importConnection!.invoke("LeaveImportGroup", importId);
      console.log(`[SignalR] Left import group: ${importId}`);
    } catch (error) {
      console.error("[SignalR] Error leaving import group:", error);
      throw error;
    }
  }

  isImportConnected(): boolean {
    return this.importConnection?.state === HubConnectionState.Connected;
  }

  getImportConnection(): HubConnection | null {
    return this.importConnection;
  }

  setupPageUnloadHandler(): void {
    if (
      (window as Window & { __signalrUnloadHandlerSet?: boolean })
        .__signalrUnloadHandlerSet
    ) {
      return;
    }

    let unloadHandled = false;
    const cleanupConnection = () => {
      if (unloadHandled) return;
      unloadHandled = true;
      if (this.connection) {
        console.log("[SignalR] Page unload detected, closing connection...");
        void this.connection.stop();
      }
    };

    window.addEventListener("beforeunload", cleanupConnection);
    window.addEventListener("pagehide", cleanupConnection);

    (
      window as Window & { __signalrUnloadHandlerSet?: boolean }
    ).__signalrUnloadHandlerSet = true;
  }
}

// ✅ FIX 5: Use singleton instance
export const signalRService = SignalRService.getInstance();
signalRService.setupPageUnloadHandler();
