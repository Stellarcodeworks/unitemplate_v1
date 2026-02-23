import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import NetInfo from "@react-native-community/netinfo";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OfflineContext = createContext<boolean>(false);

export function OfflineProvider({ children }: { children: ReactNode }) {
    const [isOffline, setIsOffline] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Subscribe to network changes
        const unsubscribe = NetInfo.addEventListener((state) => {
            // isConnected can be null. We treat null/false as offline,
            // but also verify internetReachable is not strictly false.
            const connected = state.isConnected === true && state.isInternetReachable !== false;
            setIsOffline(!connected);
        });

        // Fetch initial state
        NetInfo.fetch().then((state) => {
            const connected = state.isConnected === true && state.isInternetReachable !== false;
            setIsOffline(!connected);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <OfflineContext.Provider value={isOffline}>
            {children}
            {isOffline && (
                <View
                    className="absolute bottom-0 w-full bg-destructive flex-row justify-center items-center py-2 z-50 shadow-lg"
                    style={{ paddingBottom: Math.max(insets.bottom, 12) + 60 }} // Above tabs
                >
                    <Text className="text-destructive-foreground font-semibold text-sm text-center">
                        Offline — changes are disabled
                    </Text>
                </View>
            )}
        </OfflineContext.Provider>
    );
}

export function useIsOffline() {
    return useContext(OfflineContext);
}
