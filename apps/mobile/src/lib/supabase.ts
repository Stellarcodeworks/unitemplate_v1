/**
 * Native Supabase client for Expo mobile app.
 *
 * ⚠️  This file uses @supabase/supabase-js directly — NOT @eop/db.
 *     @eop/db re-exports @supabase/ssr which is incompatible with React Native.
 *
 * ⚠️  Only EXPO_PUBLIC_SUPABASE_ANON_KEY is used — never the service-role key.
 */
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import type { Database } from "@eop/db"; // TYPE-ONLY import — erased at compile time

// ─── Fail-fast env validation ─────────────────────────────────────
// Expo Metro does NOT statically inline env vars like Next.js Edge.
// We must check at runtime.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Missing Expo Supabase environment variables. " +
        "Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY " +
        "are set in your .env file."
    );
}

// ─── SecureStore adapter for Supabase Auth ────────────────────────
// Tokens are stored in the device keychain (iOS) / encrypted prefs (Android).
const SecureStoreAdapter = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// ─── Singleton Supabase client ────────────────────────────────────
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Critical for RN — no browser URL bar
    },
});
