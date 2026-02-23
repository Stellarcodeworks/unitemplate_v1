"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * TanStack Query provider.
 * Wraps the app with a QueryClient configured with sensible defaults.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        gcTime: 5 * 60 * 1000, // 5 minutes
                        retry: (failureCount, error) => {
                            // Don't retry on 401 (expired session)
                            if (
                                error &&
                                typeof error === "object" &&
                                "status" in error &&
                                error.status === 401
                            ) {
                                return false;
                            }
                            return failureCount < 2;
                        },
                        refetchOnWindowFocus: true,
                    },
                    mutations: {
                        retry: 0,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
