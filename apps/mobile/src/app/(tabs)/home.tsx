/**
 * Home tab — placeholder for Phase 5B.
 */
import { View, Text } from "react-native";
import { useAuth } from "../../providers/AuthProvider";

export default function HomeScreen() {
    const { user } = useAuth();

    return (
        <View className="flex-1 items-center justify-center bg-background px-6">
            <Text className="text-2xl font-bold text-foreground mb-2">
                Welcome
            </Text>
            <Text className="text-base text-muted text-center">
                {user?.email ?? "Loading..."}
            </Text>
            <Text className="text-sm text-muted mt-4 text-center">
                Dashboard content will be added in Phase 5B.
            </Text>
        </View>
    );
}
