import type {
  InvalidateOptions,
  QueryFilters,
  QueryKey,
} from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

interface QueryProviderProps {
  children: ReactNode;
}

const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true,
        retry: (failureCount, error: unknown) => {
          // Don't retry on 401 to prevent refresh token loops
          const err = error as { response?: { status?: number } };
          if (err?.response?.status === 401) {
            return false;
          }
          return failureCount < 1;
        },
        retryDelay: 2000,
      },
    },
  });
};

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = useMemo(() => createOptimizedQueryClient(), []);

  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: "audit-software-query-cache",
  });

  window.__QUERY_CLIENT__ = queryClient;

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }

    const channel = new BroadcastChannel("audit-software-query-sync");
    const clientId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const originalRemoveQueries = queryClient.removeQueries.bind(queryClient);
    const originalInvalidateQueries =
      queryClient.invalidateQueries.bind(queryClient);

    queryClient.removeQueries = ((filters?: QueryFilters<QueryKey>) => {
      const result = originalRemoveQueries(filters);
      const queryKey = filters?.queryKey;
      const exact = filters?.exact;

      channel.postMessage({
        type: "removeQueries",
        queryKey,
        exact,
        source: clientId,
      });

      return result;
    }) as typeof queryClient.removeQueries;

    queryClient.invalidateQueries = ((
      filters?: QueryFilters<QueryKey>,
      options?: InvalidateOptions
    ) => {
      const result = originalInvalidateQueries(filters, options);
      const queryKey = filters?.queryKey;
      const exact = filters?.exact;

      channel.postMessage({
        type: "invalidateQueries",
        queryKey,
        exact,
        source: clientId,
      });

      return result;
    }) as typeof queryClient.invalidateQueries;

    channel.onmessage = (event) => {
      const message = event.data as {
        type?: string;
        queryKey?: QueryKey;
        exact?: boolean;
        source?: string;
      };

      if (!message || message.source === clientId) {
        return;
      }

      if (message.type === "removeQueries") {
        originalRemoveQueries(
          message.queryKey
            ? { queryKey: message.queryKey, exact: message.exact }
            : undefined
        );
      }

      if (message.type === "invalidateQueries") {
        originalInvalidateQueries(
          message.queryKey
            ? { queryKey: message.queryKey, exact: message.exact }
            : undefined
        );
      }
    };

    return () => {
      channel.close();
      queryClient.removeQueries = originalRemoveQueries;
      queryClient.invalidateQueries = originalInvalidateQueries;
    };
  }, [queryClient]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
