import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { UserContextProvider } from "../providers/UserContextProvider";
import { OfflineProvider } from "../providers/OfflineProvider";
import { queryClient } from "../lib/query-client";
import "../global.css";

// 5 minutes in milliseconds
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

function AppStateListener() {
    const router = useRouter();
    const segments = useSegments();
    const { user } = useAuth(); // Only lock if they are logged in

    const appState = useRef(AppState.currentState);
    const backgroundTimestamp = useRef<number | null>(null);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
            // Track when app goes to background
            if (appState.current.match(/active/) && nextAppState === "background") {
                backgroundTimestamp.current = Date.now();
            }

            // Check when app comes to foreground
            if (appState.current.match(/inactive|background/) && nextAppState === "active") {
                const now = Date.now();
                const wasBackgroundedAt = backgroundTimestamp.current;

                // If logged in, not already on the lock screen, and exceeded timeout
                if (
                    user &&
                    segments[0] !== "lock" &&
                    wasBackgroundedAt &&
                    now - wasBackgroundedAt > LOCK_TIMEOUT_MS
                ) {
                    router.push("/lock");
                }

                // Reset timestamp
                backgroundTimestamp.current = null;
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [router, segments, user]);

    return null;
}

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <OfflineProvider>
                <AuthProvider>
                    <UserContextProvider>
                        <AppStateListener />
                        <StatusBar style="light" />
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="index" />
                            <Stack.Screen name="login" />
                            <Stack.Screen name="lock" />
                            <Stack.Screen name="(tabs)" />
                        </Stack>
                    </UserContextProvider>
                </AuthProvider>
            </OfflineProvider>
        </QueryClientProvider>
    );
}
