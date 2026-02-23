/**
 * Biometric lock screen — route-based security gate.
 * 
 * Flow:
 * 1. Automatically navigated here by the AppState listener in _layout.tsx
 * 2. Prompts for FaceID / TouchID / Passcode
 * 3. On success, navigates back to the app (`router.back()` or `/`)
 * 4. On 3 consecutive failures, logs the user out for security.
 */
import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter, Redirect } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth } from "../providers/AuthProvider";

const MAX_ATTEMPTS = 3;

export default function LockScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();

    // 1️⃣ Guard: Unauthenticated deep-link protection
    if (!user) {
        return <Redirect href="/login" />;
    }

    const [attempts, setAttempts] = useState(0);
    const [status, setStatus] = useState<"authorizing" | "failed" | "locked">("authorizing");
    const [errorMsg, setErrorMsg] = useState("");

    const authenticate = useCallback(async () => {
        if (attempts >= MAX_ATTEMPTS) return;

        setStatus("authorizing");
        setErrorMsg("");

        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            // If the device has no biometrics configured, we let them through.
            // In a strict enterprise app, you might force passcode enrollment here,
            // but for this phase we gracefully fallback so the app isn't bricked on simulators.
            if (!hasHardware || !isEnrolled) {
                console.warn("Biometrics unavailable. Bypassing lock for development.");
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace("/(tabs)/home");
                }
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Unlock EOP Mobile",
                fallbackLabel: "Use Passcode",
                cancelLabel: "Cancel",
                disableDeviceFallback: false,
            });

            if (result.success) {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace("/(tabs)/home");
                }
            } else {
                handleFailure(result.warning || "Authentication failed");
            }
        } catch (error: any) {
            handleFailure(error.message || "An unexpected error occurred");
        }
    }, [attempts, router]);

    const handleFailure = async (msg: string) => {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
            setStatus("locked");
            setErrorMsg("Maximum attempts reached. For security, your session has been cleared.");
            // Force sign-out on max failures
            await signOut();
            router.replace("/login");
        } else {
            setStatus("failed");
            setErrorMsg(`${msg}. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }
    };

    // Auto-prompt on mount
    useEffect(() => {
        authenticate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-background px-8 text-center">
            <Text className="text-4xl mb-6">🔒</Text>
            <Text className="text-2xl font-bold text-foreground mb-2">
                Session Locked
            </Text>

            {status === "authorizing" ? (
                <View className="items-center mt-6">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-muted mt-4">Verifying Identity...</Text>
                </View>
            ) : status === "locked" ? (
                <Text className="text-destructive text-center mt-4">
                    {errorMsg}
                </Text>
            ) : (
                <View className="items-center mt-4 w-full">
                    <Text className="text-destructive text-center mb-8">
                        {errorMsg}
                    </Text>
                    <Pressable
                        onPress={authenticate}
                        className="bg-primary px-6 py-3 rounded-xl w-full"
                    >
                        <Text className="text-primary-foreground font-semibold text-center text-lg">
                            Try Again
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
