import { QueryClient } from '@tanstack/react-query';

/**
 * Create a TanStack Query client with sensible defaults.
 * Shared between web and mobile apps.
 */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                retry: 1,
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: 0,
            },
        },
    });
}
