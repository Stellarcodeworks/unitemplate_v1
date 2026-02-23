/**
 * Index route — redirects to login or tabs based on auth state.
 *
 * Uses imperative router.replace() inside useEffect instead of declarative
 * <Redirect> to avoid a known timing race: the <Redirect> component fires
 * a nested REPLACE action {name:"(tabs)", params:{screen:"home"}} during
 * the same commit phase as the navigator mount. The (tabs) navigator hasn't
 * registered yet at that point, causing an unhandled action warning.
 *
 * By deferring to a useEffect, we guarantee the full navigator tree
 * (Stack → index, login, lock, (tabs)) has committed before dispatching.
 */
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../providers/AuthProvider";

export default function IndexScreen() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        // Use requestAnimationFrame to defer navigation to the next frame,
        // ensuring the navigator tree is fully committed and ready to
        // accept nested actions targeting (tabs)/home.
        requestAnimationFrame(() => {
            if (user) {
                router.replace("/(tabs)/home");
            } else {
                router.replace("/login");
            }
        });
    }, [user, loading]);

    // Always render a loading state — the redirect happens imperatively above
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );
}
