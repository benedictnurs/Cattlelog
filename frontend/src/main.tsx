import * as React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from "posthog-js/react";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const posthogApiKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

// Cache expiry time (30 minutes)
const CACHE_EXPIRY_TIME = 30 * 60 * 1000;

// QueryClient needed for tanstack query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_EXPIRY_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Create a persister using localStorage
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

// Persist the query client
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: CACHE_EXPIRY_TIME, //Expire persisted cache after CACHE_EXPIRY_TIME.
});

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <PostHogProvider
      apiKey={posthogApiKey}
      options={{ api_host: posthogHost, autocapture: true }}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </PostHogProvider>
  </StrictMode>,
);
