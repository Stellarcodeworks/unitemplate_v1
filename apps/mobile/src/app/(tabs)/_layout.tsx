/**
 * Tab layout — RBAC-gated dynamic tabs.
 */
import { Tabs, Redirect } from "expo-router";
import { hasRole, ALL_ROLES } from "@eop/access";
import { useMobileUserContext } from "../../providers/UserContextProvider";
import { useAuth } from "../../providers/AuthProvider";
import { View, Text } from "react-native";

export default function TabsLayout() {
    const { user } = useAuth();

    // Prevent rendering children (and calling context hooks) if signed out.
    // Actively redirect to prevent getting stuck on a blank screen.
    if (!user) return <Redirect href="/login" />;

    return <TabsLayoutInner />;
}

function TabsLayoutInner() {
    const ctx = useMobileUserContext();

    // Define all available tabs and their minimum required role.
    // The name matches the route files: index.tsx, tasks.tsx, approvals.tsx, profile.tsx
    const tabs = [
        { name: "home", title: "Dashboard", icon: "🏠", minRole: "staff" as const },
        { name: "tasks", title: "Tasks", icon: "📋", minRole: "staff" as const },
        { name: "approvals", title: "Approvals", icon: "✅", minRole: "manager" as const },
        { name: "profile", title: "Profile", icon: "👤", minRole: "staff" as const },
    ];

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: "#0a0a0a" },
                headerTintColor: "#ededed",
                tabBarStyle: {
                    backgroundColor: "#0a0a0a",
                    borderTopColor: "#2a2a2a",
                    paddingBottom: 5,
                    height: 60
                },
                tabBarActiveTintColor: "#3b82f6",
                tabBarInactiveTintColor: "#a1a1aa",
            }}
        >
            {tabs.map((tab) => {
                const isVisible = hasRole(ctx, tab.minRole);
                return (
                    <Tabs.Screen
                        key={tab.name}
                        name={tab.name}
                        options={{
                            title: tab.title,
                            tabBarIcon: () => <Text style={{ fontSize: 20 }}>{tab.icon}</Text>,
                            href: isVisible ? undefined : null,
                        }}
                    />
                );
            })}
        </Tabs>
    );
}
