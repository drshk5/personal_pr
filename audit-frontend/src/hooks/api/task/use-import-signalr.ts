import { useEffect, useState, useCallback } from "react";
import { signalRService } from "@/services/task/signalr.service";
import type { ImportProgress, ImportError } from "@/types/task/task-import";
import { HubConnection } from "@microsoft/signalr";

interface ImportProgressDto {
  importId: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  currentAction: string;
  startTime: string;
  estimatedCompletion?: string;
  isCompleted: boolean;
  percentageComplete: number;
  rowsPerSecond: number;
  recentErrors?: ImportError[];
}

/**
 * Hook to listen for real-time import progress updates via SignalR
 * This replaces the need for polling the progress endpoint every 2 seconds
 *
 * The backend's ImportHub broadcasts "ReceiveProgress" events to all connected clients
 * in a group identified by importId
 *
 * @param importId - The import ID to listen for progress updates
 * @param enabled - Whether to enable listening for updates
 * @returns Current progress data and connection status
 */
export const useImportSignalRProgress = (
  importId?: string,
  enabled: boolean = true
) => {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProgressUpdate = useCallback((data: ImportProgressDto) => {
    console.log("[SignalR] Received progress update:", data);

    // Map backend ImportProgressDto to frontend ImportProgress type
    const progressData: ImportProgress = {
      importId: data.importId,
      status: data.isCompleted
        ? data.failureCount > 0
          ? "Failed"
          : "Completed"
        : "Processing",
      totalRows: data.totalRows,
      processedRows: data.processedRows,
      successCount: data.successCount,
      failureCount: data.failureCount,
      currentStep: data.currentAction,
      progressPercentage: Math.round(data.percentageComplete || 0),
      startTime: data.startTime,
      estimatedCompletion: data.estimatedCompletion,
    };

    setProgress(progressData);
  }, []);

  useEffect(() => {
    if (!enabled || !importId) {
      return;
    }

    const setupSignalR = async () => {
      try {
        // Ensure import hub is connected
        if (!signalRService.isImportConnected()) {
          console.log("[SignalR] Starting import hub connection...");
          await signalRService.startImportConnection();
          setIsConnected(true);
        } else {
          setIsConnected(true);
        }

        // Join the import group to receive updates for this specific import
        console.log(`[SignalR] Joining import group: ${importId}`);
        await signalRService.joinImportGroup(importId);

        // Register callback to receive progress updates
        signalRService
          .getImportConnection()
          ?.on("ReceiveProgress", handleProgressUpdate);

        console.log(`[SignalR] ✓ Listening for progress on import ${importId}`);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(
          "[SignalR] Failed to setup import progress listener:",
          err
        );
        setError(errorMsg);
      }
    };

    setupSignalR();

    // Cleanup: Leave group and unregister callback
    return () => {
      const cleanup = async () => {
        try {
          const connection = signalRService.getImportConnection();
          if (connection) {
            // Unregister the handler
            connection.off("ReceiveProgress", handleProgressUpdate);

            // Leave the group
            console.log(`[SignalR] Leaving import group: ${importId}`);
            await signalRService.leaveImportGroup(importId);
          }
        } catch (err) {
          console.error(
            "[SignalR] Error cleaning up import progress listener:",
            err
          );
        }
      };

      cleanup();
    };
  }, [importId, enabled, handleProgressUpdate]);

  return {
    progress,
    isConnected,
    error,
    isLoading: !progress && enabled && isConnected,
  };
};

/**
 * Extension of signalRService to expose getConnection method
 * Used by useImportSignalRProgress hook
 */
declare module "@/services/task/signalr.service" {
  interface SignalRService {
    getImportConnection(): HubConnection | null;
    startImportConnection(): Promise<void>;
    isImportConnected(): boolean;
  }
}
