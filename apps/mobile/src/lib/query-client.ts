/**
 * TanStack Query configuration for the mobile app.
 * Configured specifically for Phase 5's read-only offline requirement.
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Keep reads fresh but don't infinitely refetch
            staleTime: 60 * 1000,
            retry: 1,
            // When offline, pause network fetches and use cache
            networkMode: "online",
        },
        mutations: {
            // Block mutations entirely when offline.
            // Do NOT queue them for later replay in Phase 5.
            networkMode: "online",
        },
    },
});
