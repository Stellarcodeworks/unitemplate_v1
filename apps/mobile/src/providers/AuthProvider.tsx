/**
 * Mobile-specific AuthProvider.
 *
 * ⚠️  This replaces @eop/core's AuthProvider which transitively imports
 *     @supabase/ssr and is incompatible with React Native.
 *
 * Uses the native Supabase singleton from ../lib/supabase.ts directly.
 */
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
} from "react";
import type { ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

interface AuthContextValue extends AuthState {
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provides Supabase auth state to the mobile component tree.
 * Wraps the app and listens for auth state changes.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        // Get initial session from SecureStore
        supabase.auth.getSession().then(({ data: { session } }) => {
            setState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        });

        // Listen for auth changes (login, logout, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw new Error(error.message);
    }, []);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    }, []);

    const value = useMemo(
        () => ({ ...state, signIn, signOut }),
        [state, signIn, signOut]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

/**
 * Access the current auth state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
