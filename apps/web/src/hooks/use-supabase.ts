"use client";

import { useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { type SupabaseClient } from "@supabase/supabase-js";
import { type Database } from "@eop/db";

/**
 * Hook to get the Supabase browser client singleton.
 * Wraps the singleton getter in a stable reference.
 */
export function useSupabase(): SupabaseClient<Database> {
    return useMemo(() => getSupabaseBrowserClient(), []);
}
