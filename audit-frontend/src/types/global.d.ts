import type { QueryClient } from "@tanstack/react-query";

// Extend the Window interface to add our global query client
declare global {
  interface Window {
    __QUERY_CLIENT__?: QueryClient;
  }
}

export {};
