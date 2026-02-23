'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@eop/db';

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

interface AuthProviderProps {
    supabaseClient: any; // Instantiated Supabase client passed from root
    children: ReactNode;
}

/**
 * Provides Supabase auth state to the component tree.
 * Wraps the app and listens for auth state changes.
 */
export function AuthProvider({ supabaseClient, children }: AuthProviderProps) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        // Get initial session
        supabaseClient.auth.getSession().then(({ data: { session } }: any) => {
            setState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabaseClient.auth.onAuthStateChange((_event: any, session: any) => {
            setState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabaseClient]);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
    }, [supabaseClient]);

    const signOut = useCallback(async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw new Error(error.message);
    }, [supabaseClient]);

    const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);

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
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
