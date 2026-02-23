/**
 * @eop/db — Supabase client factories & types (client-safe exports)
 */
export { createBrowserClient, createServerClient } from './client';
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from './types';
export type { RpcFunctions } from './rpc';

// Re-export Supabase auth types for downstream packages
export type { User, Session, AuthError } from '@supabase/supabase-js';
