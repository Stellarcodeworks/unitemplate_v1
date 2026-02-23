/**
 * UserContextProvider for EOP Mobile.
 *
 * Scopes the entire app with `MobileUserContext` (multi-outlet) and manages
 * the derived `SelectedOutletContext`.
 */
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    ReactNode,
} from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useAuth } from "./AuthProvider";
import { resolveUserContext } from "../lib/resolve-user-context";
import { OutletPicker } from "../components/OutletPicker";
import type { UserContext as MobileUserContext, OutletRole, Role } from "@eop/access";

/**
 * Derived context exported for outlet-scoped views.
 */
export interface SelectedOutletContext {
    userId: string;
    outletId: string;
    role: Role;
    outlet_name?: string;
    org_name?: string;
}

interface UserContextValue {
    context: MobileUserContext;
    selectedOutlet: SelectedOutletContext;
    switchOutlet: (outletId: string) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserContextProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [fullContext, setFullContext] = useState<MobileUserContext | null>(null);
    const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Resolve full MobileUserContext on auth
    useEffect(() => {
        if (!user) {
            setFullContext(null);
            setSelectedOutletId(null);
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);

        resolveUserContext(user.id)
            .then((ctx) => {
                if (isMounted) {
                    setFullContext(ctx);

                    // If they only have one outlet, auto-select it.
                    // If they are super_admin with no explicit assignments, we leave it null.
                    if (ctx.outletRoles.length === 1) {
                        setSelectedOutletId(ctx.outletRoles[0].outletId);
                    }
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [user]);

    const switchOutlet = (id: string) => {
        setSelectedOutletId(id);
    };

    // 2. Derive SelectedOutletContext
    const selectedOutlet = useMemo<SelectedOutletContext | null>(() => {
        if (!fullContext || !selectedOutletId || !user) return null;

        const roleDef = fullContext.outletRoles.find(
            (r) => r.outletId === selectedOutletId
        );

        if (!roleDef) return null;

        return {
            userId: user.id,
            outletId: roleDef.outletId,
            role: roleDef.role,
            outlet_name: roleDef.outlet_name,
            org_name: roleDef.org_name,
        };
    }, [fullContext, selectedOutletId, user]);

    if (!user) return <>{children}</>;

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-muted mt-4">Loading your profile...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 items-center justify-center bg-background px-6">
                <Text className="text-destructive font-semibold mb-2">Access Error</Text>
                <Text className="text-muted text-center">{error}</Text>
            </View>
        );
    }

    if (!fullContext) return null;

    // 3. Force Outlet Selection Modal if multiple available and none selected
    if (fullContext.outletRoles.length > 1 && !selectedOutletId) {
        return (
            <OutletPicker
                outlets={fullContext.outletRoles}
                onSelect={switchOutlet}
            />
        );
    }

    // 4. Edge Case: Super Admin with no explicit outlets, or Staff assigned to no outlets
    if (fullContext.outletRoles.length === 0 && !fullContext.isSuperAdmin) {
        return (
            <View className="flex-1 items-center justify-center bg-background px-6">
                <Text className="text-destructive font-semibold mb-2">No Access</Text>
                <Text className="text-muted text-center">
                    You have not been assigned to any outlets. Please contact your administrator.
                </Text>
            </View>
        );
    }

    // Provide context to the tree
    return (
        <UserContext.Provider
            value={{
                context: fullContext,
                // Cast is safe here because we guarded against multiple-unselected and zero-assigned
                selectedOutlet: (selectedOutlet ?? {
                    userId: user.id,
                    outletId: 'system',
                    role: fullContext.isSuperAdmin ? 'super_admin' : 'staff'
                }) as SelectedOutletContext,
                switchOutlet,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

// ─── Exported Hooks ────────────────────────────────────────────────────────

/** Returns the full multi-outlet context (MobileUserContext shape expected by @eop/access) */
export function useMobileUserContext(): MobileUserContext {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("Missing UserContextProvider");
    return ctx.context;
}

/** Returns the single selected outlet context suitable for scoped DB queries */
export function useSelectedOutlet(): SelectedOutletContext {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("Missing UserContextProvider");
    return ctx.selectedOutlet;
}
