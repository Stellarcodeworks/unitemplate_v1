/**
 * Login screen — email + password authentication.
 * On success, the auth state change listener in AuthProvider
 * will trigger navigation to the main app.
 */
import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../providers/AuthProvider";

export default function LoginScreen() {
    const { signIn, loading: authLoading } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Please enter both email and password.");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            await signIn(email.trim(), password);
            // Navigate directly to the authenticated home tab to bypass index evaluation
            router.replace("/(tabs)/home");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Sign in failed. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
        >
            <View className="flex-1 items-center justify-center px-8">
                {/* Header */}
                <Text className="text-3xl font-bold text-foreground mb-2">
                    EOP Mobile
                </Text>
                <Text className="text-base text-muted mb-10">
                    Sign in to manage your operations
                </Text>

                {/* Error Banner */}
                {error && (
                    <View className="w-full bg-destructive/20 border border-destructive rounded-lg p-3 mb-4">
                        <Text className="text-destructive text-sm">{error}</Text>
                    </View>
                )}

                {/* Email Input */}
                <View className="w-full mb-4">
                    <Text className="text-sm text-muted mb-2">Email</Text>
                    <TextInput
                        className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground"
                        placeholder="you@example.com"
                        placeholderTextColor="#a1a1aa"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                    />
                </View>

                {/* Password Input */}
                <View className="w-full mb-6">
                    <Text className="text-sm text-muted mb-2">Password</Text>
                    <TextInput
                        className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground"
                        placeholder="••••••••"
                        placeholderTextColor="#a1a1aa"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="password"
                    />
                </View>

                {/* Sign In Button */}
                <Pressable
                    onPress={handleSignIn}
                    disabled={submitting}
                    className="w-full bg-primary rounded-lg py-3.5 items-center"
                    style={({ pressed }) => ({
                        opacity: pressed || submitting ? 0.7 : 1,
                    })}
                >
                    {submitting ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text className="text-primary-foreground font-semibold text-base">
                            Sign In
                        </Text>
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}
