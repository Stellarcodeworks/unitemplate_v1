# **EOP – Build Execution Plan**

---

## **Implementation Order Clarification**

| **Question** | **Answer** |
| --- | --- |
| Database & RLS before frontend? | **Yes.** Phases 1–3 are entirely backend. Frontend begins Phase 4. |
| When are RBAC unit tests written? | **Phase 2**, immediately after `packages/access` is created. |
| When are RLS validation tests executed? | **Phase 3**, after each migration that touches policies. Re-run on every subsequent migration. |
| When are Edge Functions added? | **Phase 3**, after schema + RLS are stable and tested. |
| When are audit triggers verified? | **Phase 3**, as part of the RLS/trigger validation step. |

## **Migration Discipline — Confirmed**

- ✅ Migrations created sequentially: `001` → `002` → `003` → ...
- ✅ No schema changes outside migration files. Every DDL goes through `supabase migration new`.
- ✅ Types regenerated after each migration via `supabase gen types typescript`.
- ✅ RLS tests re-run after every migration that touches policies or tables.

---

## **Phase 1 – Monorepo Foundation**

**Goal:** A buildable, lintable, type-checkable empty monorepo.

```

Step 1: Initialize pnpm workspace + Turborepo
  - pnpm init at root
  - Install turbo as devDependency
  - Create pnpm-workspace.yaml (apps/*, packages/*)

Step 2: Create packages/config
  - tsconfig.base.json (strict mode, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
  - tsconfig.react.json (extends base, adds JSX)
  - tsconfig.node.json (extends base, server-side)
  - eslint-preset.js (includes no-restricted-imports for db/server)
  - prettier.config.js

Step 3: Create turbo.json
  - Define task graph: build, dev, lint, typecheck, test
  - Configure caching and dependency ordering

Step 4: Create placeholder package.json for each workspace
  - packages/ui/package.json
  - packages/core/package.json
  - packages/access/package.json
  - packages/db/package.json
  - apps/web/package.json
  - apps/mobile/package.json
  - Each extends shared config

Step 5: Create .env.example at root
  - Document all required env vars (no secrets)

Step 6: Create .gitignore
  - node_modules, .next, dist, .env.local, .expo
```

**Deliverables:**

- Monorepo runs `pnpm lint` and `pnpm typecheck` without errors
- Dependency boundaries enforced via ESLint
- All packages importable by apps

**Validation Checklist:**

- `pnpm install` succeeds
- `pnpm lint` passes (no errors)
- `pnpm typecheck` passes (no errors)
- Importing `packages/db/server/*` from a client file triggers ESLint error
- `packages/ui` cannot import `packages/db` (ESLint error)

---

## **Phase 2 – Shared Packages (No DB Connection Yet)**

**Goal:** Implement `packages/access`, `packages/ui`, `packages/core`, `packages/db` with types and tests. No live database yet.

```

Step 1: packages/db
  - Create Supabase client factories:
    - src/client.ts: createBrowserClient(), createServerClient()
    - server/service-client.ts: createServiceClient() (server-only)
  - Create placeholder types.ts (will be generated from Supabase later)
  - Create src/rpc.ts (typed RPC wrappers, stubs for now)

Step 2: packages/access
  - Define Role type, UserContext interface, ROLE_HIERARCHY constant
  - Implement: hasRole(), canAccessOutlet(), canAssignRole(),
    getHighestRole(), requireRole()
  - Write unit tests for ALL functions:
    - canAssignRole('manager', 'org_admin') → false
    - canAssignRole('org_admin', 'manager') → true
    - canAssignRole('outlet_admin', 'outlet_admin') → false
    - requireRole() throws for insufficient role
    - hasRole() with outletId scoping
    - super_admin bypasses all checks

Step 3: packages/core
  - AuthProvider + useAuth() hook (Supabase integration)
  - useUserContext() hook (resolves UserContext from outlet_users)
  - createQueryClient() with default config
  - Zod schemas: profileSchema, outletSchema, outletUserSchema

Step 4: packages/ui
  - NativeWind configuration (tailwind.config.ts)
  - Shared primitives: Button, Input, Card, Badge
  - Exported via src/index.ts barrel
```

**Deliverables:**

- `packages/access` with passing unit tests
- `packages/core` with auth hooks and Zod schemas
- `packages/db` with client factories (server-client isolated)
- `packages/ui` with base components
- All packages type-check and lint clean

**Validation Checklist:**

- `pnpm test` passes (RBAC unit tests)
- `pnpm typecheck` passes across all packages
- `pnpm lint` passes
- ESLint blocks `packages/db/server/*` import from client code

---

## **Phase 3 – Database, RLS & Edge Functions**

**Goal:** Live Supabase schema with all security hardening. Validated with SQL tests.

**IMPORTANT**

This phase requires a Supabase project. User must confirm project/region before this phase begins.

```

Step 1: Migration 001_initial_schema.sql
  - Create tables: organizations, outlets, profiles, outlet_users, audit_logs
  - All business columns include: outlet_id, created_at, updated_at, created_by
  - created_by UUID DEFAULT auth.uid() NOT NULL
  - Apply migration
  - Regenerate types → packages/db/src/types.ts

Step 2: Migration 002_enable_rls.sql
  - ALTER TABLE ... ENABLE ROW LEVEL SECURITY on ALL tables
  - Apply migration

Step 3: Migration 003_privilege_lockdown.sql
  - REVOKE ALL from anon and authenticated
  - Selective GRANT per table
  - Apply migration

Step 4: Migration 004_rls_policies.sql
  - profiles: select_self, update_self
  - outlets: select with outlet_users check + super_admin bypass
  - Business table templates: SELECT, INSERT (with created_by), UPDATE (with WITH CHECK), DELETE
  - audit_logs: read-only select policy
  - Apply migration
  - RUN RLS VALIDATION TESTS (Tests 1–3, 5–6 from plan)

Step 5: Migration 005_role_hierarchy_guard.sql
  - role_assignment_insert_guard on outlet_users
  - role_assignment_update_guard on outlet_users
  - role_assignment_delete_guard on outlet_users
  - Apply migration
  - RUN RLS VALIDATION TEST (Test 4: manager cannot escalate role)

Step 6: Migration 006_audit_triggers.sql
  - log_audit() function with SECURITY DEFINER
  - ALTER FUNCTION SET search_path = public
  - REVOKE ALL ON FUNCTION FROM PUBLIC
  - Attach triggers to all business tables
  - Apply migration
  - VERIFY: perform INSERT → check audit_logs has entry
  - VERIFY: direct INSERT into audit_logs via client → should fail

Step 7: Migration 007_indexes.sql
  - CREATE INDEX on outlet_id for all business tables
  - CREATE INDEX on user_id for outlet_users
  - Apply migration

Step 8: Migration 008_force_rls_all_tables.sql
  - Dynamic DO block enabling RLS on any public table missing it
  - Apply migration

Step 9: Create seed.sql
  - 1 organization, 3 outlets, 5 test users (one per role)
  - Sample business data

Step 10: Edge Functions
  - admin-create-outlet: validates org_admin+ role, creates outlet
  - admin-assign-role: validates hierarchy, prevents escalation
  - Both use verify_jwt: true + internal role resolution from DB

Step 11: Regenerate final types
  - supabase gen types typescript → packages/db/src/types.ts
```

**Deliverables:**

- 8 migration files applied and tested
- Seed data for development
- 2 Edge Functions deployed
- Generated TypeScript types

**Validation Checklist:**

- All 8 migrations applied without error
- RLS Test 1: Staff cannot SELECT cross-outlet → 0 rows
- RLS Test 2: Super-admin sees all outlets → all rows
- RLS Test 3: Staff cannot INSERT to foreign outlet → error
- RLS Test 4: Manager cannot INSERT `role='org_admin'` into outlet_users → error
- RLS Test 5: User cannot spoof created_by → error
- RLS Test 6: User cannot UPDATE outlet_id to foreign outlet → error
- Audit: INSERT triggers audit_log entry
- Audit: Direct client INSERT into audit_logs → denied
- Edge Function: admin-assign-role rejects escalation → 403
- Types regenerated and compile clean

---

## **Phase 4 – Web Application (Next.js Admin Console)**

**Goal:** Working admin dashboard with auth, outlet management, user/role management, and audit viewer.

```

Step 1: Initialize Next.js 15 in apps/web
  - App Router, TypeScript
  - NativeWind v4 + Tailwind CSS
  - Import shared packages (@repo/ui, @repo/core, @repo/access, @repo/db)
  - Zod env validation (apps/web/lib/env.ts)

Step 2: Install shadcn/ui
  - Initialize with New York style
  - Add components: Button, Input, Table, Dialog, Sheet, Select, Badge, Card

Step 3: Authentication
  - /login page with email + password (Supabase Auth)
  - httpOnly cookie handling via Route Handler
  - Middleware: validate JWT, resolve UserContext, route guards

Step 4: Dashboard Layout
  - Sidebar navigation with role-aware menu items
  - Outlet switcher (dropdown for users with multi-outlet access)
  - Breadcrumb navigation

Step 5: Outlet Management
  - /outlets page: list all outlets (org_admin+ only)
  - /outlets/[id] page: edit outlet details (outlet_admin+ scoped)
  - Create outlet form (calls admin-create-outlet Edge Function)

Step 6: User & Role Management
  - /users page: list users across outlets (org_admin+)
  - Role assignment form (calls admin-assign-role Edge Function)
  - Escalation prevention enforced in UI via canAssignRole()

Step 7: Audit Log Viewer
  - /audit page: filterable table of audit_logs (org_admin+)
  - Filters: by outlet, by user, by action, by date range

Step 8: Error Handling
  - /unauthorized page
  - Error boundaries for all routes
  - Session refresh on 401
```

**Deliverables:**

- Working Next.js admin console
- Login, Dashboard, Outlets, Users, Audit pages
- Role-based route protection via middleware
- shadcn/ui data tables

**Validation Checklist:**

- Login flow works (email + password → dashboard)
- Unauthenticated user → redirected to /login
- staff user → cannot see /outlets, /users, /audit
- org_admin → can see all outlets
- outlet_admin → can only see own outlet
- Role assignment respects hierarchy (UI disables forbidden roles)
- Audit log viewer shows entries
- Session refresh works on token expiry
- `pnpm build` succeeds (apps/web)

---

## **Phase 5 – Mobile Application (Expo)**

**Goal:** Working Expo app with auth, biometrics, outlet-scoped views, and simplified dashboards.

```

Step 1: Initialize Expo in apps/mobile
  - Expo SDK 52+, Expo Router
  - NativeWind v4
  - Import shared packages

Step 2: Authentication
  - Login screen (email + password)
  - Token storage via expo-secure-store
  - Session restore on app launch

Step 3: Biometric Lock
  - expo-local-authentication integration
  - Trigger on app resume after 5+ minutes
  - 3 failures → force re-login

Step 4: Tab Navigation
  - Home (dashboard cards for assigned outlet)
  - Tasks (outlet-scoped task list)
  - Approvals (manager+ only)
  - Profile (user settings)

Step 5: Outlet Context
  - Single outlet → auto-select
  - Multiple outlets → picker on launch
  - React Context for outlet state

Step 6: Offline Handling
  - TanStack Query offline banner
  - Cached data displayed
  - Writes blocked with user-facing message
```

**Deliverables:**

- Working Expo app running in Expo Go / Simulator
- Login with SecureStore token persistence
- Biometric lock on resume
- Tab navigation with role-based visibility
- Outlet-scoped data views

**Validation Checklist:**

- Login works on mobile
- Token persisted in SecureStore (not AsyncStorage)
- App resume after 5 min → biometric prompt
- staff user → no "Approvals" tab
- Outlet data scoped correctly
- Offline → banner shown, no write attempts

---

## **Phase 6 – Integration Testing**

**Goal:** End-to-end validation of security boundaries across the full stack.

```

Step 1: RLS Full Re-test
  - Re-run all 6 SQL validation tests against live data

Step 2: Privilege Escalation E2E
  - Login as manager → attempt role assignment via Edge Function → expect 403
  - Login as staff → attempt to access /outlets on web → expect redirect

Step 3: Cross-Outlet Leakage E2E
  - Login as Outlet A staff → verify 0 results from Outlet B queries
  - On mobile: switch outlet context → verify data changes

Step 4: Auth Flow E2E
  - Web: login → use app → wait for token expiry → verify refresh
  - Mobile: login → background app → resume after 5 min → biometric prompt

Step 5: Audit Verification
  - Perform: create outlet, assign role, update record
  - Verify each action created an audit_log entry
  - Verify audit viewer displays them correctly
```

**Deliverables:**

- All E2E tests passing
- Security boundary validation documented

**Validation Checklist:**

- All RLS SQL tests pass
- Privilege escalation blocked at Edge Function + DB
- Cross-outlet data isolation confirmed
- Auth flows work end-to-end on both platforms
- Audit trail complete for all critical actions

---

## **Phase 7 – Bootstrap & Recovery**

**Goal:** Documented and tested provisioning and recovery workflows.

```

Step 1: Create bootstrap.sh script
  - Applies migrations, prompts for first user, runs bootstrap SQL

Step 2: Create bootstrap.sql
  - INSERT for profiles, organizations, outlets, outlet_users

Step 3: Document recovery procedures
  - Super-admin lockout recovery
  - Key rotation procedure
  - Backup restore procedure

Step 4: Test recovery
  - Simulate super-admin lockout → recover via Dashboard SQL
  - Verify recovered admin can access system
```

**Deliverables:**

- `bootstrap.sh` script
- `bootstrap.sql` seed
- Recovery documentation in README

**Validation Checklist:**

- `bootstrap.sh` provisions a fresh system end-to-end
- Recovery from lockout tested and documented
- Backup restore procedure documented

---

## **Phase 8 – Documentation, CI/CD & Polish**

**Goal:** Production-ready deployment pipeline and comprehensive documentation.

```

Step 1: GitHub Actions CI/CD
  - Workflow: lint → typecheck → build on push to main
  - Zod env validation runs during build

Step 2: Sentry Integration
  - apps/web: @sentry/nextjs
  - apps/mobile: @sentry/react-native

Step 3: README.md
  - Project overview, architecture diagram
  - Getting started guide
  - Environment setup instructions

Step 4: CUSTOMIZATION.md
  - How to re-brand (colors, app name)
  - How to add new business tables (with RLS template)
  - How to add new routes/screens
  - How to add new roles

Step 5: Final Type Regeneration
  - supabase gen types → packages/db/src/types.ts

Step 6: Final Full Validation
  - pnpm lint (all workspaces)
  - pnpm typecheck (all workspaces)
  - pnpm build (all workspaces)
  - All RLS tests pass
  - Both apps launch and authenticate
```

**Deliverables:**

- CI/CD pipeline active
- Error monitoring configured
- Complete documentation
- Production-ready template

**Validation Checklist:**

- GitHub Actions passes on push
- Sentry captures test error
- README accurate and complete
- CUSTOMIZATION.md covers all extension points
- `pnpm build` succeeds across entire monorepo
- Both apps fully functional

---

## **Phase Execution Summary**

```

```

**NOTE**

Phases 4 and 5 can run in parallel since both depend on Phase 3 (DB + RLS) being complete. All other phases are sequential.