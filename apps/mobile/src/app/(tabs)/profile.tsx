/**
 * Profile / Settings tab
 */
import { View, Text, Pressable } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { useMobileUserContext } from "../../providers/UserContextProvider";

export default function ProfileScreen() {
    const { signOut } = useAuth();
    const ctx = useMobileUserContext();

    return (
        <View className="flex-1 items-center justify-center bg-background px-6">
            <Text className="text-2xl font-bold text-foreground mb-2">
                User Profile
            </Text>

            <View className="bg-card w-full border border-border rounded-xl mt-4 p-6 items-center">
                <Text className="text-foreground text-lg mb-1">{ctx?.user?.full_name || "User"}</Text>
                <Text className="text-muted mb-6">{ctx?.user?.email}</Text>

                <Pressable
                    onPress={signOut}
                    className="bg-destructive w-full py-3 rounded-lg flex-row justify-center items-center"
                >
                    <Text className="text-destructive-foreground font-semibold">
                        Sign Out
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
