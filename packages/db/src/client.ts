import { createBrowserClient as _createBrowserClient, createServerClient as _createServerClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Create a Supabase client for use in the browser.
 * The application layer is responsible for providing the environment variables.
 */
export function createBrowserClient(config: { supabaseUrl: string; supabaseAnonKey: string }) {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables (URL or Anon Key).');
    }

    return _createBrowserClient<Database>(config.supabaseUrl, config.supabaseAnonKey);
}

/**
 * Create a Supabase client for use in server-side contexts (SSR).
 * Accepts environment variables and cookie getter/setter callbacks from the application layer.
 */
export function createServerClient(config: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    cookies: {
        getAll: () => Array<{ name: string; value: string }>;
        setAll: (cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void;
    };
}) {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables (URL or Anon Key).');
    }

    return _createServerClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
        cookies: config.cookies,
    });
}
