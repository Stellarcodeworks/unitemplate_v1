/**
 * Approvals tab — only visible to managers and above.
 */
import { View, Text } from "react-native";
import { Redirect } from "expo-router";
import { hasRole } from "@eop/access";
import { useSelectedOutlet, useMobileUserContext } from "../../providers/UserContextProvider";

export default function ApprovalsScreen() {
    const ctx = useMobileUserContext();
    const { outlet_name, role } = useSelectedOutlet();

    // Route-level guard: prevent direct deep-linking bypass
    if (!hasRole(ctx, "manager")) {
        return <Redirect href="/(tabs)/home" />;
    }

    return (
        <View className="flex-1 items-center justify-center bg-background px-6">
            <Text className="text-2xl font-bold text-foreground mb-2">
                Approvals
            </Text>
            <Text className="text-base text-muted text-center mb-6">
                {outlet_name}
            </Text>

            <View className="bg-card border border-border rounded-xl p-5 w-full items-center">
                <Text className="text-muted mb-2">You are viewing this as a</Text>
                <View className="bg-primary/10 px-3 py-1.5 rounded-full">
                    <Text className="text-primary text-xs font-medium uppercase tracking-wider">
                        {role.replace("_", " ")}
                    </Text>
                </View>
                <Text className="text-foreground text-center mt-4 text-sm leading-relaxed">
                    This route is strictly protected against deep linking.
                </Text>
            </View>
        </View>
    );
}
