/**
 * OutletPicker modal forced on launch if the user has multiple assignments.
 * Prevents navigation until an outlet is selected.
 */
import { View, Text, Pressable, ScrollView } from "react-native";
import type { OutletRole } from "@eop/access";

interface OutletPickerProps {
    outlets: OutletRole[];
    onSelect: (outletId: string) => void;
}

export function OutletPicker({ outlets, onSelect }: OutletPickerProps) {
    return (
        <View className="flex-1 bg-background pt-20 px-6">
            <Text className="text-3xl font-bold text-foreground mb-2">
                Select Outlet
            </Text>
            <Text className="text-muted text-base mb-8">
                You are assigned to multiple locations. Please choose one to proceed.
            </Text>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="gap-y-4 pb-10">
                    {outlets.map((outlet) => (
                        <Pressable
                            key={outlet.outletId}
                            onPress={() => onSelect(outlet.outletId)}
                            className="bg-card w-full border border-border rounded-xl p-5 flex-row justify-between items-center"
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                            })}
                        >
                            <View>
                                <Text className="text-foreground font-semibold text-lg mb-1">
                                    {outlet.outlet_name || "Unknown Outlet"}
                                </Text>
                                <Text className="text-muted text-sm">
                                    {outlet.org_name || "Unknown Organization"}
                                </Text>
                            </View>

                            <View className="bg-primary/10 px-3 py-1.5 rounded-full">
                                <Text className="text-primary text-xs font-medium uppercase tracking-wider">
                                    {outlet.role.replace("_", " ")}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}
