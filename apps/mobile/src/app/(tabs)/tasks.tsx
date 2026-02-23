/**
 * Tasks tab — visible to staff and above.
 */
import { View, Text } from "react-native";
import { useSelectedOutlet } from "../../providers/UserContextProvider";

export default function TasksScreen() {
    const { outlet_name, org_name } = useSelectedOutlet();

    return (
        <View className="flex-1 items-center justify-center bg-background px-6">
            <Text className="text-2xl font-bold text-foreground mb-2">
                Active Tasks
            </Text>
            <Text className="text-base text-muted text-center mb-6">
                {outlet_name} ({org_name})
            </Text>

            <View className="bg-card flex-1 w-full border-t border-border mt-4 p-6 items-center justify-center">
                <Text className="text-muted text-center">
                    Task list for this outlet will appear here.
                </Text>
            </View>
        </View>
    );
}
