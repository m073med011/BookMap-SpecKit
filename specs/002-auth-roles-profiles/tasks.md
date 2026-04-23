# Tasks: Authentication, Authorization, Roles, and Profiles

**Input**: Design documents from `specs/002-auth-roles-profiles/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/component-api.md, research.md, quickstart.md

**Tests**: Not explicitly requested. Test tasks are omitted. Add them via `/speckit.tasks --tdd` if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**LLM Implementation Note**: Each task below is self-contained. Read the referenced spec files (plan.md, data-model.md, contracts/component-api.md, research.md) before starting. Every task includes the exact file path to create/modify plus what the file must contain. Follow the project constitution in `.specify/memory/constitution.md` for all code.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js App Router project. Source code lives in `src/` with domain modules in `src/features/`. Database migrations live in `supabase/migrations/`. Translations in `messages/`. See `specs/002-auth-roles-profiles/plan.md` → Project Structure for the full tree.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the domain module directory structure, shared types, shared Zod schemas, and environment variable additions needed by ALL user stories in this phase. No business logic yet.

- [ ] T001 Create the auth domain module directory structure: create empty directories at `src/features/auth/actions/`, `src/features/auth/components/`, `src/features/auth/schemas/`, `src/features/auth/services/`, `src/features/auth/types/`
- [ ] T002 [P] Create the profiles domain module directory structure: create empty directories at `src/features/profiles/actions/`, `src/features/profiles/components/`, `src/features/profiles/schemas/`, `src/features/profiles/services/`, `src/features/profiles/types/`
- [ ] T003 [P] Create the roles domain module directory structure: create empty directories at `src/features/roles/actions/`, `src/features/roles/services/`, `src/features/roles/types/`
- [ ] T004 [P] Create the invitations domain module directory structure: create empty directories at `src/features/invitations/actions/`, `src/features/invitations/components/`, `src/features/invitations/schemas/`, `src/features/invitations/services/`, `src/features/invitations/types/`
- [ ] T005 [P] Create shared auth types file at `src/features/auth/types/index.ts`. Export these TypeScript types exactly as defined in `specs/002-auth-roles-profiles/contracts/component-api.md` → Shared Types section: `UserRole` (union: 'user' | 'library_staff' | 'admin' | 'superadmin'), `ProfileStatus` (union: 'active' | 'suspended'), `InvitationStatus` (union: 'pending' | 'accepted' | 'expired' | 'revoked'), `Profile` interface, `UserRoleAssignment` interface, `StaffInvitation` interface, `AuditLogEntry` interface. Use strict TypeScript with explicit types. No `any`.
- [ ] T006 [P] Create auth Zod validation schemas at `src/features/auth/schemas/auth.ts`. Define and export: `signUpSchema` (email: z.string().email(), password: z.string().min(8) with regex for uppercase+lowercase+number, locale: z.enum(['en','ar'])), `signInSchema` (email: z.string().email(), password: z.string().min(1)), `resetPasswordRequestSchema` (email: z.string().email()), `resetPasswordSchema` (password: z.string().min(8) with same strength regex, code: z.string().min(1)), `verifyEmailSchema` (token: z.string().min(1), type: z.enum(['otp','link'])). Import from 'zod'.
- [ ] T007 [P] Create profile Zod validation schemas at `src/features/profiles/schemas/profile.ts`. Define and export: `updateProfileSchema` (displayName: z.string().max(100).optional(), bio: z.string().max(500).optional(), preferredLocale: z.enum(['en','ar']).optional()), `avatarUploadSchema` (file size max 5MB, allowed MIME types: image/jpeg, image/png, image/webp — validate these as constants, not in Zod directly since File validation happens at the action level).
- [ ] T008 [P] Create invitation Zod validation schemas at `src/features/invitations/schemas/invitation.ts`. Define and export: `sendInvitationSchema` (email: z.string().email(), libraryId: z.string().uuid()), `acceptInvitationSchema` (token: z.string().min(1)), `revokeInvitationSchema` (invitationId: z.string().uuid()).
- [ ] T009 [P] Create the `src/lib/auth/` directory and add a placeholder `permissions.ts` file that exports: `type Permission = string`, a `ROLES` constant object with keys `USER`, `LIBRARY_STAFF`, `ADMIN`, `SUPERADMIN` mapping to the string values 'user', 'library_staff', 'admin', 'superadmin'. Also export a `hasRole(roles: Array<{role: string, libraryId: string | null}>, requiredRole: string, libraryId?: string): boolean` function that checks if the roles array contains the required role (and matching libraryId if provided).
- [ ] T010 Update the environment validation schema at `src/lib/config/env.ts` (already exists from Phase 0). Add a new optional field: `NEXT_PUBLIC_SITE_URL` (z.string().url().optional() with default 'http://localhost:3000') and `SUPERADMIN_EMAIL` (z.string().email().optional()). Keep all existing Phase 0 fields intact. Do not remove anything.

**Checkpoint**: All directory structures exist, shared types/schemas/permissions are ready. No business logic yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migrations, storage bucket, auth functions, RLS policies, and middleware updates that MUST be complete before ANY user story can be implemented. These create the database tables and security layer that all features depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T011 Create migration file at `supabase/migrations/20260423100000_create_profiles_table.sql`. This SQL file must: (1) Enable the moddatetime extension: `create extension if not exists moddatetime schema extensions;` (2) Create the `profiles` table exactly as defined in `specs/002-auth-roles-profiles/data-model.md` → profiles section with columns: id (uuid PK referencing auth.users(id) ON DELETE CASCADE), display_name (text NOT NULL DEFAULT 'New User' with CHECK char_length <= 100), bio (text NULL with CHECK char_length <= 500), preferred_locale (text NOT NULL DEFAULT 'en' CHECK IN ('en','ar')), avatar_url (text NULL), status (text NOT NULL DEFAULT 'active' CHECK IN ('active','suspended')), created_at (timestamptz NOT NULL DEFAULT now()), updated_at (timestamptz NOT NULL DEFAULT now()). (3) Create a moddatetime trigger on profiles for updated_at. (4) Enable RLS: `alter table profiles enable row level security;`
- [ ] T012 Create migration file at `supabase/migrations/20260423100001_create_app_roles_table.sql`. Create the `app_roles` table with columns: id (text PK), description (text NOT NULL). Enable RLS. Seed with INSERT statements for these four rows: ('user', 'Registered platform user'), ('library_staff', 'Staff member of a library'), ('admin', 'Platform administrator'), ('superadmin', 'Full platform governance').
- [ ] T013 Create migration file at `supabase/migrations/20260423100002_create_user_roles_table.sql`. Create the `user_roles` table exactly as defined in data-model.md: id (uuid PK DEFAULT gen_random_uuid()), user_id (uuid NOT NULL FK → auth.users(id) ON DELETE CASCADE), role (text NOT NULL FK → app_roles(id)), library_id (uuid NULL — FK will reference libraries(id) ON DELETE CASCADE after T014), assigned_by (uuid NULL FK → auth.users(id)), assigned_at (timestamptz NOT NULL DEFAULT now()). Add UNIQUE constraint on (user_id, role, library_id) using COALESCE for NULL handling: `UNIQUE (user_id, role, COALESCE(library_id, '00000000-0000-0000-0000-000000000000'))`. Add CHECK constraint: `CHECK ((role = 'library_staff' AND library_id IS NOT NULL) OR (role != 'library_staff' AND library_id IS NULL))`. Create indexes on (user_id) and (library_id, role). Enable RLS.
- [ ] T014 Create migration file at `supabase/migrations/20260423100003_create_libraries_stub.sql`. Create a minimal `libraries` table for Phase 1 staff scoping: id (uuid PK DEFAULT gen_random_uuid()), name (text NOT NULL), created_at (timestamptz NOT NULL DEFAULT now()). Enable RLS. Add the FK from user_roles.library_id to libraries(id) ON DELETE CASCADE using ALTER TABLE: `ALTER TABLE user_roles ADD CONSTRAINT user_roles_library_id_fkey FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE;`
- [ ] T015 Create migration file at `supabase/migrations/20260423100004_create_staff_invitations_table.sql`. Create the `staff_invitations` table exactly as in data-model.md: id (uuid PK DEFAULT gen_random_uuid()), email (text NOT NULL), library_id (uuid NOT NULL FK → libraries(id) ON DELETE CASCADE), invited_by (uuid NOT NULL FK → auth.users(id)), token (text NOT NULL UNIQUE), status (text NOT NULL DEFAULT 'pending' CHECK IN ('pending','accepted','expired','revoked')), expires_at (timestamptz NOT NULL), created_at (timestamptz NOT NULL DEFAULT now()). Create indexes on (token), (email, library_id, status), (expires_at). Enable RLS.
- [ ] T016 Create migration file at `supabase/migrations/20260423100005_create_audit_logs_table.sql`. Create the `audit_logs` table exactly as in data-model.md: id (uuid PK DEFAULT gen_random_uuid()), user_id (uuid NULL FK → auth.users(id)), action (text NOT NULL), target_type (text NULL), target_id (text NULL), metadata (jsonb NOT NULL DEFAULT '{}'), ip_address (inet NULL), created_at (timestamptz NOT NULL DEFAULT now()). Create indexes on (user_id, created_at DESC), (action, created_at DESC), (created_at). Enable RLS.
- [ ] T017 Create migration file at `supabase/migrations/20260423100006_create_auth_functions.sql`. This file must create three SQL items: (1) A trigger function `handle_new_user()` that fires AFTER INSERT on `auth.users`. It must: INSERT INTO profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))); INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user'); Return NEW. Make it SECURITY DEFINER with `SET search_path = public`. (2) Create the trigger: `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();` (3) Create the `authorize(required_role text)` function that returns boolean. It must read roles from `((auth.jwt()->'app_metadata'->'roles')::jsonb)`, iterate over the array, and return TRUE if any element has `role` matching `required_role`. Wrap the auth.jwt() call in a subselect for RLS performance. Make it STABLE SECURITY DEFINER. (4) Create the `authorize_library(required_role text, lib_id uuid)` function that returns boolean. Same as authorize() but also checks that `library_id` matches `lib_id`. Make it STABLE SECURITY DEFINER.
- [ ] T018 Create migration file at `supabase/migrations/20260423100007_create_access_token_hook.sql`. Create a PostgreSQL function `custom_access_token_hook(event jsonb)` that returns jsonb. This is a Supabase Auth Hook. It must: (1) Declare variables for `claims jsonb`, `user_roles_data jsonb`. (2) Extract claims from `event->'claims'`. (3) Query user_roles table: `SELECT COALESCE(jsonb_agg(jsonb_build_object('role', ur.role, 'library_id', ur.library_id)), '[]'::jsonb) INTO user_roles_data FROM user_roles ur WHERE ur.user_id = (event->>'user_id')::uuid;` (4) Set claims: `claims := jsonb_set(claims, '{app_metadata,roles}', user_roles_data);` (5) Update event: `event := jsonb_set(event, '{claims}', claims);` (6) RETURN event. Make it SECURITY DEFINER with `SET search_path = public`. Grant execute to `supabase_auth_admin`. Revoke from public, anon, authenticated.
- [ ] T019 Create migration file at `supabase/migrations/20260423100008_create_avatars_bucket.sql`. Use Supabase storage SQL: (1) `INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);` (2) Create storage RLS policies: SELECT policy allowing public access (no auth check needed since bucket is public). INSERT policy for authenticated users where `(storage.foldername(name))[1] = auth.uid()::text`. UPDATE policy same condition as INSERT. DELETE policy for owner `(storage.foldername(name))[1] = auth.uid()::text` OR user has superadmin role via `authorize('superadmin')`. (3) Add file size limit and MIME type restriction if supported, otherwise document that these must be set in Supabase dashboard.
- [ ] T020 Create migration file at `supabase/migrations/20260423100009_enable_rls_policies.sql`. Create ALL RLS policies for all tables. Follow data-model.md → RLS policies section exactly. For each table: **profiles**: SELECT for all authenticated, UPDATE only own (`auth.uid() = id`), INSERT none (trigger only), DELETE none. **app_roles**: SELECT for all authenticated, no INSERT/UPDATE/DELETE. **user_roles**: SELECT own roles (`auth.uid() = user_id`) OR has admin/superadmin role, INSERT by superadmin only (use `authorize('superadmin')`), DELETE by superadmin only. **libraries**: SELECT for all authenticated. **staff_invitations**: SELECT for inviter (`auth.uid() = invited_by`) OR admin/superadmin, INSERT for admin/superadmin. **audit_logs**: SELECT for superadmin only (`authorize('superadmin')`), INSERT none (service role only — do not create INSERT policy so only service role can insert), UPDATE/DELETE none.
- [ ] T021 Create seed file at `supabase/seed.sql`. This is the superadmin bootstrap script. It must: (1) Check if a superadmin role assignment already exists: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'superadmin') THEN -- Insert will happen after the superadmin user registers and the handle_new_user trigger fires. -- This seed just documents the intended bootstrap process. RAISE NOTICE 'No superadmin exists yet. The first user to register with the SUPERADMIN_EMAIL will need to be manually assigned the superadmin role via: INSERT INTO user_roles (user_id, role) SELECT id, ''superadmin'' FROM auth.users WHERE email = ''YOUR_SUPERADMIN_EMAIL'' LIMIT 1;'; END IF; END $$;`
- [ ] T022 Create the audit log service at `src/features/auth/services/audit-service.ts`. Export an `async function logAuditEvent(params: { userId?: string, action: string, targetType?: string, targetId?: string, metadata?: Record<string, unknown>, ipAddress?: string }): Promise<void>` function. It must: (1) Import the server Supabase client from `src/lib/supabase/server.ts`. (2) Create a Supabase client with the service role key (not the user's session) so it can bypass RLS. (3) Insert a row into `audit_logs` with the provided params. (4) If insert fails, log the error to console.error but do NOT throw — audit logging should never break the main flow. This is a fire-and-forget service.
- [ ] T023 Create the auth middleware utility at `src/lib/auth/middleware.ts`. Export an `async function updateSessionAndCheckAuth(request: NextRequest)` function. It must: (1) Import `createServerClient` from `@supabase/ssr` and `NextResponse` from `next/server`. (2) Create a Supabase server client with cookie handling for the middleware context (read/set/remove cookies on the response). (3) Call `supabase.auth.getUser()` to refresh the session. (4) Extract the user and their roles from the JWT claims (`session.user.app_metadata?.roles`). (5) Return an object: `{ user, roles, response, supabase }` where response is the NextResponse with updated cookies. This utility is called by the main middleware.
- [ ] T024 Update the existing Next.js middleware at `src/middleware.ts` (already exists from Phase 0 with locale detection). Add auth route protection AFTER the existing locale logic. The middleware must: (1) Keep all existing Phase 0 locale detection/redirect logic intact — do NOT remove or break it. (2) After locale handling, call the `updateSessionAndCheckAuth()` from `src/lib/auth/middleware.ts`. (3) Define route protection rules: paths matching `/(locale)/(auth)/*` should redirect TO dashboard if user is already authenticated. Paths matching `/(locale)/(dashboard)/*` should redirect TO sign-in if user is NOT authenticated. Paths matching `/(locale)/(dashboard)/admin/*` should return 403 or redirect if user does not have admin or superadmin role. Public paths `/(locale)/(public)/*` pass through. (4) Check user's `profile.status` — if 'suspended', sign them out and redirect to sign-in with an error query param. (5) Update the middleware matcher config to include auth and dashboard routes.

**Checkpoint**: Database is ready with all tables, RLS policies, storage bucket, auth trigger, JWT hook, middleware protection. All user stories can now begin.

---

## Phase 3: User Story 1 — New User Registration (Priority: P1) MVP

**Goal**: A visitor can register using email/password or Google OAuth, verify their email via OTP, and access the platform.

**Independent Test**: Register a new user with email/password → receive verification email → enter OTP → email confirmed → user can access their dashboard.

### Implementation for User Story 1

- [ ] T025 [P] [US1] Create the auth service at `src/features/auth/services/auth-service.ts`. Export these async functions using the Supabase client from `src/lib/supabase/server.ts`: (1) `signUpWithEmail({ email, password, locale })` — calls `supabase.auth.signUp({ email, password, options: { emailRedirectTo: SITE_URL + '/' + locale + '/auth/callback', data: { locale } } })`. Returns `{ success: true }` or `{ error, code }` matching the contract in contracts/component-api.md → signUpWithEmail. (2) `signInWithGoogle({ redirectTo })` — calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`. Returns the URL. (3) `verifyEmail({ token, type })` — if type is 'otp', calls `supabase.auth.verifyOtp({ token_hash: token, type: 'email' })`. Returns `{ success: true }` or `{ error, code }`. (4) `signOut()` — calls `supabase.auth.signOut()`. Each function must validate inputs with the Zod schemas from `src/features/auth/schemas/auth.ts` and call `logAuditEvent()` from `audit-service.ts` for sign-in and sign-out events.
- [ ] T026 [P] [US1] Create the provider utilities at `src/features/auth/services/provider-utils.ts`. Export: (1) `async function getUserProviders(userId: string): Promise<string[]>` — queries auth.users via `supabase.auth.admin.getUserById(userId)` to get `identities` array and returns a list of provider names (e.g., ['email', 'google']). (2) `function hasEmailProvider(providers: string[]): boolean` — returns true if 'email' is in the array. (3) `function hasOnlyGoogleProvider(providers: string[]): boolean` — returns true if providers contains only 'google' and no 'email'. These are used by the password reset flow (US3) to determine UI visibility, but are created here because they depend on the auth module.
- [ ] T027 [P] [US1] Create the sign-up server action at `src/features/auth/actions/sign-up.ts`. This must be a Next.js server action (add `'use server'` at the top). Export `async function signUpAction(formData: FormData)`. It must: (1) Extract email, password, locale from formData. (2) Validate with `signUpSchema` from `src/features/auth/schemas/auth.ts`. Return `{ error: string, code: string }` if validation fails. (3) Call `signUpWithEmail()` from auth-service.ts. (4) Return the result. Use TypeScript strict types for the return value: `{ success: true } | { error: string, code: string }`.
- [ ] T028 [P] [US1] Create the verify-email server action at `src/features/auth/actions/verify-email.ts`. Server action (`'use server'`). Export `async function verifyEmailAction(formData: FormData)`. Extract token and type from formData. Validate with `verifyEmailSchema`. Call `verifyEmail()` from auth-service.ts. Return `{ success: true }` or `{ error, code }`.
- [ ] T029 [P] [US1] Create the sign-out server action at `src/features/auth/actions/sign-out.ts`. Server action (`'use server'`). Export `async function signOutAction()`. Call `signOut()` from auth-service.ts. Call `redirect('/sign-in')` from `next/navigation` after sign-out.
- [ ] T030 [US1] Create the SignUpForm component at `src/features/auth/components/SignUpForm.tsx`. This is a client component (`'use client'`). It must: (1) Accept prop `locale: 'en' | 'ar'`. (2) Render a form with: email input (type="email", required), password input (type="password", required), a password strength indicator (check for min 8 chars, uppercase, lowercase, number — show red/yellow/green status), a "Sign up with Google" button, and a submit button. (3) Use the shared UI components from Phase 0: `Input` from `src/components/ui/form/Input`, `Button` from `src/components/ui/form/Button`. (4) On email/password submit, call `signUpAction()` via form action. (5) On Google button click, call `signInWithGoogle({ redirectTo: window.location.origin + '/' + locale + '/auth/callback' })` using the browser Supabase client from `src/lib/supabase/client.ts`. (6) Show validation errors and loading states. (7) Use `useTranslations('auth')` from `next-intl` for all user-facing strings (do NOT hardcode English text). (8) Include a link to "Already have an account? Sign in" pointing to `/${locale}/auth/sign-in`.
- [ ] T031 [US1] Create the EmailVerificationForm component at `src/features/auth/components/EmailVerificationForm.tsx`. Client component. Accept prop `locale: 'en' | 'ar'`. Render: (1) A 6-digit OTP input (use 6 individual `Input` fields or a single input with maxLength=6). (2) A submit button that calls `verifyEmailAction()`. (3) A "Resend code" button with a 60-second cooldown timer (use useState + useEffect for countdown). The resend button calls `supabase.auth.resend({ type: 'signup', email })` via the browser client. (4) Show success/error messages. Use `useTranslations('auth')` for all strings.
- [ ] T032 [US1] Create the auth callback route handler at `src/app/[locale]/(auth)/callback/route.ts`. This is a Next.js Route Handler (GET). It must: (1) Import `createServerClient` from `@supabase/ssr` and handle cookies. (2) Read the `code` and `next` query parameters from the URL. (3) If `code` exists, call `supabase.auth.exchangeCodeForSession(code)`. (4) On success, determine the user's role from the session JWT claims (`user.app_metadata?.roles`). (5) Redirect based on role: superadmin/admin → `/${locale}/dashboard/admin`, library_staff → `/${locale}/dashboard/library/${libraryId}` (get libraryId from the roles array), default user → `/${locale}/dashboard`. If `next` param exists, redirect there instead. (6) On error, redirect to `/${locale}/auth/error?error=callback_failed`.
- [ ] T033 [US1] Create the auth error page at `src/app/[locale]/(auth)/error/page.tsx`. This is a server component. It must: (1) Read `error` and `provider` from searchParams. (2) Display a user-friendly error message (use `useTranslations('auth')` — but since it's a server component, use `getTranslations('auth')` from `next-intl/server`). (3) Show a "Try again" button (link to sign-in page). (4) Show a "Sign in with email/password" link as alternative. (5) Show a "Return to home" link. Style using Tailwind, use `Card` component from Phase 0.
- [ ] T034 [US1] Create the auth layout at `src/app/[locale]/(auth)/layout.tsx`. This is a server component that wraps all auth pages. It must: (1) Render a centered card layout (max-w-md mx-auto) suitable for auth forms. (2) Include the app logo/title at the top. (3) NOT include the dashboard sidebar or header — this is a standalone auth layout. (4) Support RTL/LTR via the parent locale layout (already handled by Phase 0).
- [ ] T035 [US1] Create the sign-up page at `src/app/[locale]/(auth)/sign-up/page.tsx`. Server component. It must: (1) Import and render `SignUpForm` passing the locale param. (2) Set page metadata (title: sign up page title from translations). (3) Include the appropriate page heading.
- [ ] T036 [US1] Create the email verification page at `src/app/[locale]/(auth)/verify-email/page.tsx`. Server component. Render `EmailVerificationForm` with locale. Add page metadata.
- [ ] T037 [US1] Add auth i18n strings to `messages/en.json`. Add a new `"auth"` key at the root level with nested keys for ALL user-facing strings: `signUp.title`, `signUp.email`, `signUp.password`, `signUp.submitButton`, `signUp.googleButton`, `signUp.hasAccount`, `signUp.hasAccountLink`, `signUp.errors.emailTaken`, `signUp.errors.weakPassword`, `signUp.errors.rateLimited`, `signUp.errors.unknown`, `signIn.title`, `signIn.email`, `signIn.password`, `signIn.submitButton`, `signIn.googleButton`, `signIn.forgotPassword`, `signIn.noAccount`, `signIn.noAccountLink`, `signIn.errors.invalidCredentials`, `signIn.errors.emailNotVerified`, `signIn.errors.accountSuspended`, `signIn.errors.rateLimited`, `verifyEmail.title`, `verifyEmail.otpLabel`, `verifyEmail.submitButton`, `verifyEmail.resendButton`, `verifyEmail.resendCooldown`, `verifyEmail.errors.invalidToken`, `verifyEmail.errors.expiredToken`, `verifyEmail.success`, `forgotPassword.title`, `forgotPassword.email`, `forgotPassword.submitButton`, `forgotPassword.success`, `forgotPassword.googleOnly`, `resetPassword.title`, `resetPassword.newPassword`, `resetPassword.confirmPassword`, `resetPassword.submitButton`, `resetPassword.errors.invalidToken`, `resetPassword.errors.expiredToken`, `resetPassword.errors.weakPassword`, `resetPassword.errors.mismatch`, `resetPassword.success`, `error.title`, `error.tryAgain`, `error.emailAlternative`, `error.returnHome`, `passwordStrength.weak`, `passwordStrength.medium`, `passwordStrength.strong`. All values must be proper English text.
- [ ] T038 [US1] Add auth i18n strings to `messages/ar.json`. Add the same `"auth"` key structure as T037 but with proper Arabic translations for every key. All text must be natural Arabic — not machine-translated placeholder text. If unsure of exact Arabic phrasing, use commonly accepted Arabic UI terms for authentication flows.

**Checkpoint**: Users can register with email/password, verify their email via OTP, sign up with Google, and reach the callback. The auth error page handles failures. All auth strings are in English and Arabic.

---

## Phase 4: User Story 2 — User Sign-In and Session Management (Priority: P1)

**Goal**: A registered user can sign in with email/password or Google, and is redirected to the correct dashboard based on their role.

**Independent Test**: Sign in with email/password → redirected to user dashboard. Sign in as admin → redirected to admin dashboard. Invalid credentials → error shown. Suspended user → blocked.

### Implementation for User Story 2

- [ ] T039 [P] [US2] Create the sign-in server action at `src/features/auth/actions/sign-in.ts`. Server action (`'use server'`). Export `async function signInAction(formData: FormData)`. It must: (1) Extract email and password from formData. (2) Validate with `signInSchema`. (3) Call `supabase.auth.signInWithPassword({ email, password })` using the server Supabase client. (4) If error, map Supabase error codes to contract error codes: 'Invalid login credentials' → 'INVALID_CREDENTIALS', email not confirmed → 'EMAIL_NOT_VERIFIED'. (5) If success, check the user's profile status — query `profiles` table for the user ID. If status is 'suspended', sign the user out and return `{ error, code: 'ACCOUNT_SUSPENDED' }`. (6) If active, determine role-based redirect URL (same logic as callback route: admin/superadmin → admin dashboard, staff → library dashboard, user → user dashboard). (7) Call `logAuditEvent({ userId, action: 'sign_in' })`. (8) Return `{ success: true, redirectTo }`.
- [ ] T040 [US2] Create the SignInForm component at `src/features/auth/components/SignInForm.tsx`. Client component. Accept prop `locale: 'en' | 'ar'`. Must: (1) Render email and password inputs using shared UI components. (2) Google sign-in button (same as SignUpForm — calls `signInWithOAuth` on browser client). (3) A "Forgot password?" link pointing to `/${locale}/auth/forgot-password`. (4) On form submit, call `signInAction()`. On success, use `useRouter().push(result.redirectTo)` for client-side redirect. (5) Show specific error messages per error code (use translations). (6) "Don't have an account? Sign up" link. (7) Loading state on submit button. Use `useTranslations('auth')`.
- [ ] T041 [US2] Create the sign-in page at `src/app/[locale]/(auth)/sign-in/page.tsx`. Server component. Render `SignInForm` with locale. Set page metadata with translated title.

**Checkpoint**: Users can sign in with email/password or Google. Role-based redirect works. Error messages display correctly. Suspended users are blocked.

---

## Phase 5: User Story 3 — Password Reset for Credentials Users (Priority: P2)

**Goal**: A user who registered with email/password can request a password reset, receive a link, and set a new password. Google-only users do not see the password reset option.

**Independent Test**: Request password reset → receive email → click link → set new password → sign in with new password. Google-only user → no reset option visible.

### Implementation for User Story 3

- [ ] T042 [P] [US3] Create the reset-password server actions at `src/features/auth/actions/reset-password.ts`. Server action (`'use server'`). Export two functions: (1) `async function requestPasswordResetAction(formData: FormData)` — extracts email, validates with `resetPasswordRequestSchema`, calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL + '/' + locale + '/auth/reset-password' })`. ALWAYS returns `{ success: true }` regardless of whether the email exists (security: don't leak email existence). (2) `async function resetPasswordAction(formData: FormData)` — extracts password and code, validates with `resetPasswordSchema`, calls `supabase.auth.exchangeCodeForSession(code)` then `supabase.auth.updateUser({ password })`. Returns `{ success: true }` or `{ error, code }` per contract. Calls `logAuditEvent` on success.
- [ ] T043 [P] [US3] Create the ForgotPasswordForm component at `src/features/auth/components/ForgotPasswordForm.tsx`. Client component. Accept `locale: 'en' | 'ar'`. Must: (1) Render an email input and submit button. (2) On submit, call `requestPasswordResetAction()`. (3) On success, show a confirmation message: "If an account exists with this email, a reset link has been sent." (4) Include a "Back to sign in" link. Use `useTranslations('auth')`.
- [ ] T044 [P] [US3] Create the ResetPasswordForm component at `src/features/auth/components/ResetPasswordForm.tsx`. Client component. Accept `locale: 'en' | 'ar'` and `code: string`. Must: (1) Render new password and confirm password fields. (2) Password strength indicator (same as SignUpForm). (3) Validate that passwords match on client side before submit. (4) On submit, call `resetPasswordAction()`. (5) On success, show confirmation and redirect to sign-in. (6) Handle expired/invalid token errors. Use `useTranslations('auth')`.
- [ ] T045 [US3] Create the forgot password page at `src/app/[locale]/(auth)/forgot-password/page.tsx`. Server component. Render `ForgotPasswordForm` with locale. Set page metadata.
- [ ] T046 [US3] Create the reset password page at `src/app/[locale]/(auth)/reset-password/page.tsx`. Server component. It must: (1) Read the `code` query parameter from searchParams. (2) If no code, redirect to forgot-password page. (3) Render `ResetPasswordForm` passing locale and code. Set page metadata.

**Checkpoint**: Credentials users can request and complete password resets. Google-only distinction is handled at the provider-utils level (already created in T026 — the UI can call `hasOnlyGoogleProvider()` to conditionally hide reset options in the dashboard profile page).

---

## Phase 6: User Story 4 — Profile Management and Avatar Upload (Priority: P2)

**Goal**: An authenticated user can view/edit their profile (display name, bio, locale) and upload/remove an avatar image.

**Independent Test**: Navigate to profile settings → update display name → save → change persists. Upload avatar → image displays. Upload invalid file → error shown.

### Implementation for User Story 4

- [ ] T047 [P] [US4] Create the profile service at `src/features/profiles/services/profile-service.ts`. Export these async functions using the server Supabase client: (1) `getProfile(userId: string): Promise<Profile | null>` — queries `profiles` table by id, maps snake_case DB columns to camelCase TypeScript interface. (2) `updateProfile(userId: string, data: { displayName?: string, bio?: string, preferredLocale?: 'en' | 'ar' }): Promise<{ success: true, profile: Profile } | { error: string }>` — validates with `updateProfileSchema`, updates the `profiles` row where `id = userId`, calls `logAuditEvent`. (3) `uploadAvatar(userId: string, file: File): Promise<{ success: true, avatarUrl: string } | { error: string, code: string }>` — validates file size (max 5MB) and MIME type (jpeg, png, webp). Determines file extension from MIME. Uploads to Supabase Storage bucket 'avatars' at path `${userId}/avatar.${ext}`. Gets the public URL. Updates `profiles.avatar_url`. Returns the URL. (4) `removeAvatar(userId: string): Promise<{ success: true }>` — deletes the file from storage at `${userId}/` prefix. Sets `profiles.avatar_url` to null.
- [ ] T048 [P] [US4] Create profile server actions at `src/features/profiles/actions/get-profile.ts`. Server action. Export `async function getProfileAction(userId: string)` — calls `getProfile()` from profile-service. Returns the Profile or null.
- [ ] T049 [P] [US4] Create profile update server action at `src/features/profiles/actions/update-profile.ts`. Server action. Export `async function updateProfileAction(formData: FormData)`. Extract displayName, bio, preferredLocale from formData. Get the current user via `supabase.auth.getUser()`. Call `updateProfile()`. Return result.
- [ ] T050 [P] [US4] Create avatar server actions at `src/features/profiles/actions/avatar.ts`. Server action. Export: (1) `async function uploadAvatarAction(formData: FormData)` — extract file from formData. Get current user. Call `uploadAvatar()`. Return result. (2) `async function removeAvatarAction()` — get current user. Call `removeAvatar()`. Return result.
- [ ] T051 [US4] Create the ProfileSettingsForm component at `src/features/profiles/components/ProfileSettingsForm.tsx`. Client component. Accept props: `profile: Profile, locale: 'en' | 'ar'`. Must: (1) Render form fields: display name input (maxLength 100), bio textarea (maxLength 500 with character counter), preferred language select dropdown ('en' or 'ar'). (2) Pre-populate with current profile data. (3) On submit, call `updateProfileAction()`. (4) Show success toast (use goey-toast: `toast.success(t('profile.updateSuccess'))`) or error messages. (5) Loading state on save button. Use `useTranslations('profile')` from next-intl. Use Phase 0 shared UI components: Input, Textarea, Select, Button.
- [ ] T052 [US4] Create the AvatarUploader component at `src/features/profiles/components/AvatarUploader.tsx`. Client component. Accept props: `currentAvatarUrl: string | null`. Must: (1) Show current avatar image (or a default placeholder icon if null). (2) "Upload" button that opens a file input (accept="image/jpeg,image/png,image/webp"). (3) On file select, validate file size (max 5MB) and type client-side before uploading. Show error via toast if invalid. (4) Call `uploadAvatarAction()` with the file. (5) Show loading spinner during upload. (6) On success, display the new avatar image. (7) "Remove" button (only shown if avatar exists) that calls `removeAvatarAction()`. Use `useTranslations('profile')`.
- [ ] T053 [US4] Create the profile settings page at `src/app/[locale]/(dashboard)/profile/page.tsx`. Server component. Must: (1) Get the current user via `supabase.auth.getUser()` from the server client. (2) Call `getProfile(user.id)` to load profile data. (3) Render `AvatarUploader` and `ProfileSettingsForm` passing the profile and locale. (4) Set page metadata. Use the dashboard layout (already exists from Phase 0).
- [ ] T054 [US4] Add profile i18n strings to `messages/en.json`. Add a `"profile"` key at root level with: `settings.title`, `settings.displayName`, `settings.bio`, `settings.bioCounter`, `settings.preferredLocale`, `settings.saveButton`, `settings.updateSuccess`, `settings.updateError`, `avatar.title`, `avatar.uploadButton`, `avatar.removeButton`, `avatar.uploading`, `avatar.errors.tooLarge`, `avatar.errors.invalidType`, `avatar.errors.uploadFailed`, `avatar.placeholder`. All proper English text.
- [ ] T055 [US4] Add profile i18n strings to `messages/ar.json`. Same `"profile"` structure as T054 with proper Arabic translations.

**Checkpoint**: Users can edit their profile, change language, upload/remove avatar. Changes persist across sessions.

---

## Phase 7: User Story 5 — Role-Based Access Control (Priority: P1)

**Goal**: The platform enforces access boundaries based on user roles at every level — middleware, server actions, and database RLS.

**Independent Test**: Regular user accessing admin area → denied. Staff accessing another library → denied. Superadmin accessing any area → allowed. Unauthenticated user → redirected to sign-in.

**Note**: Most RBAC infrastructure was already built in Phase 2 (middleware T024, RLS policies T020, authorize functions T017). This phase adds the role-specific server actions and completes the application-level permission checks.

### Implementation for User Story 5

- [ ] T056 [P] [US5] Create the role service at `src/features/roles/services/role-service.ts`. Export these async functions: (1) `getUserRoles(userId: string): Promise<Array<{ role: string, libraryId: string | null }>>` — queries `user_roles` where user_id matches. Returns the array. (2) `getRoleRedirectPath(roles: Array<{ role: string, libraryId: string | null }>, locale: string): string` — determines the correct dashboard path based on the highest-priority role: if has 'superadmin' or 'admin' → `/${locale}/dashboard/admin`, if has 'library_staff' → `/${locale}/dashboard/library/${libraryId}`, else → `/${locale}/dashboard`. This centralizes the redirect logic used by sign-in, callback, and middleware.
- [ ] T057 [P] [US5] Create the authorize utility at `src/features/roles/services/authorize.ts`. Export these functions: (1) `async function requireRole(requiredRole: UserRole): Promise<void>` — gets the current user from Supabase, reads their roles from JWT claims, throws an error (or redirects) if the required role is not found. Used at the top of server actions for permission checks. (2) `async function requireSuperadmin(): Promise<void>` — convenience wrapper for `requireRole('superadmin')`. (3) `async function requireLibraryStaff(libraryId: string): Promise<void>` — checks both 'library_staff' role AND matching libraryId. (4) `async function getCurrentUserWithRoles(): Promise<{ user, roles, profile }>` — returns the authenticated user, their roles array, and their profile in one call. Used by dashboard pages.
- [ ] T058 [P] [US5] Create the role assignment server action at `src/features/roles/actions/assign-role.ts`. Server action. Export `async function assignRoleAction(formData: FormData)`. Must: (1) Extract userId, role, libraryId from formData. (2) Call `requireSuperadmin()` — if not superadmin, return `{ error, code: 'UNAUTHORIZED' }`. (3) Validate role is a valid app_role. (4) Check for existing assignment (query user_roles). If already assigned, return `{ error, code: 'ALREADY_ASSIGNED' }`. (5) Insert into user_roles. (6) Call `logAuditEvent({ action: 'role_assigned', targetType: 'user_role', targetId: userId, metadata: { role, libraryId } })`. (7) Return `{ success: true }`.
- [ ] T059 [P] [US5] Create the role removal server action at `src/features/roles/actions/remove-role.ts`. Server action. Export `async function removeRoleAction(formData: FormData)`. Must: (1) Extract userId, role, libraryId. (2) Call `requireSuperadmin()`. (3) Delete from user_roles where user_id, role, and library_id match. (4) Log audit event. (5) Return `{ success: true }` or `{ error, code: 'NOT_FOUND' }`.
- [ ] T060 [US5] Create the suspend/unsuspend server actions at `src/features/roles/actions/suspend-user.ts`. Server action. Export two functions: (1) `async function suspendUserAction(formData: FormData)` — extract userId and reason. Call `requireSuperadmin()`. Query profile by userId — if already suspended, return error. Update `profiles.status` to 'suspended'. Log audit event with reason in metadata. Return result. (2) `async function unsuspendUserAction(formData: FormData)` — extract userId. Call `requireSuperadmin()`. Update `profiles.status` to 'active'. Log audit event. Return result. Both functions follow the contract in contracts/component-api.md → suspendUser / unsuspendUser.
- [ ] T061 [US5] Create the roles types file at `src/features/roles/types/index.ts`. Re-export `UserRole` and `UserRoleAssignment` from `src/features/auth/types/index.ts`. Also export a `RoleCheckResult` type: `{ authorized: boolean, redirectTo?: string }`.

**Checkpoint**: Complete RBAC enforcement. Middleware blocks unauthorized routes. Server actions verify roles. RLS policies protect data. All five role levels (guest, user, staff, admin, superadmin) are enforced.

---

## Phase 8: User Story 6 — Staff Invitation to a Library (Priority: P3)

**Goal**: An authorized user can invite someone to become library staff via email. The invitee can accept (with or without an existing account).

**Independent Test**: Send invitation → invitee receives email → clicks link → if has account, staff role assigned; if not, registers first then role assigned.

### Implementation for User Story 6

- [ ] T062 [P] [US6] Create the invitation service at `src/features/invitations/services/invitation-service.ts`. Export these async functions: (1) `sendStaffInvitation({ email, libraryId, invitedBy }): Promise<{ success: true } | { error, code }>` — check if email is already staff (`user_roles` query). Check if pending invitation exists for same email+library. Generate a unique token (`crypto.randomUUID()`). Calculate expires_at (7 days from now). Insert into `staff_invitations`. Send invitation email via `supabase.auth.admin.inviteUserByEmail(email, { redirectTo: SITE_URL + '/auth/callback?invitation=' + token })` OR, if Supabase doesn't support custom invitation emails, document that the email must be sent via a custom email service (as a TODO for now, focus on the data layer). Log audit event. (2) `acceptInvitation({ token }): Promise<{ success: true, libraryId } | { error, code }>` — query `staff_invitations` by token. Validate: exists, status is 'pending', not expired. Update status to 'accepted'. Insert into `user_roles` (user_id from current session, role: 'library_staff', library_id). Log audit event. Return libraryId. (3) `revokeInvitation({ invitationId, revokedBy }): Promise<{ success: true } | { error, code }>` — verify the invitation is 'pending'. Verify the caller is the inviter, admin, or superadmin. Update status to 'revoked'. Log audit event.
- [ ] T063 [P] [US6] Create invitation server actions at `src/features/invitations/actions/send-invitation.ts`. Server action. Export `async function sendInvitationAction(formData: FormData)`. Validate with `sendInvitationSchema`. Get current user. Check authorization (admin, superadmin, or library staff with invite ability). Call `sendStaffInvitation()`. Return result.
- [ ] T064 [P] [US6] Create invitation acceptance server action at `src/features/invitations/actions/accept-invitation.ts`. Server action. Export `async function acceptInvitationAction(formData: FormData)`. Validate with `acceptInvitationSchema`. Get current user (must be authenticated). Call `acceptInvitation()`. Return result.
- [ ] T065 [P] [US6] Create invitation revocation server action at `src/features/invitations/actions/revoke-invitation.ts`. Server action. Export `async function revokeInvitationAction(formData: FormData)`. Validate with `revokeInvitationSchema`. Get current user. Call `revokeInvitation()`. Return result.
- [ ] T066 [US6] Create the InvitationAcceptPage component at `src/features/invitations/components/InvitationAcceptPage.tsx`. Client component. Accept props: `token: string, locale: 'en' | 'ar'`. Must: (1) On mount, call `acceptInvitationAction()` with the token. (2) Show loading state while processing. (3) On success, show confirmation message ("You have been added as staff to [library name]") and a button to go to the library dashboard. (4) On error (expired, invalid, already accepted), show appropriate message with a link back to home. Use `useTranslations('invitations')`.
- [ ] T067 [US6] Add invitation i18n strings to `messages/en.json`. Add an `"invitations"` key with: `accept.title`, `accept.processing`, `accept.success`, `accept.expired`, `accept.invalid`, `accept.alreadyAccepted`, `accept.goToDashboard`, `send.title`, `send.emailLabel`, `send.submitButton`, `send.success`, `send.errors.alreadyStaff`, `send.errors.alreadyInvited`, `send.errors.unauthorized`, `revoke.success`, `revoke.errors.notPending`.
- [ ] T068 [US6] Add invitation i18n strings to `messages/ar.json`. Same `"invitations"` structure as T067 with proper Arabic translations.
- [ ] T069 [US6] Update the auth callback route at `src/app/[locale]/(auth)/callback/route.ts` (created in T032). Add invitation handling: after exchanging the code for a session, check if there is an `invitation` query parameter. If yes, call `acceptInvitation({ token: invitationParam })`. If acceptance succeeds, redirect to the library dashboard. If the user is not yet registered (the invitation link was clicked by someone without an account), Supabase's invite flow will have created their account — the `handle_new_user` trigger already assigned the 'user' role, and now the invitation acceptance adds 'library_staff'.

**Checkpoint**: Staff invitations can be sent, accepted, and revoked. Both existing and new users can accept invitations. The invitation flow integrates with the callback route.

---

## Phase 9: User Story 7 — Superadmin Bootstrap (Priority: P3)

**Goal**: A one-time mechanism exists to designate the initial superadmin when the platform is first deployed.

**Independent Test**: Run the bootstrap seed on a fresh database → designated email gets superadmin role after registration. Run again → no effect.

### Implementation for User Story 7

- [ ] T070 [US7] Update the seed file at `supabase/seed.sql` (created in T021). Replace the placeholder with a working bootstrap script: (1) Accept the superadmin email from a psql variable or hardcode a placeholder email with instructions to change it. (2) The script should: check if a user with the target email exists in `auth.users`. If exists and does not have superadmin role, INSERT INTO `user_roles` (user_id, role) selecting the user's ID. If already has superadmin, do nothing (idempotent). If user doesn't exist yet, output a NOTICE message explaining the admin must register first, then re-run the seed. (3) Add a comment header explaining how to use: `-- Usage: SUPERADMIN_EMAIL=admin@example.com pnpm supabase db seed`
- [ ] T071 [US7] Create a superadmin bootstrap check utility at `src/features/roles/services/bootstrap.ts`. Export `async function checkSuperadminExists(): Promise<boolean>`. Uses the service role Supabase client to query `user_roles` for any row with `role = 'superadmin'`. Returns true if at least one exists. This can be used by the app to show a setup wizard or warning on first deployment.

**Checkpoint**: Superadmin can be bootstrapped via seed script. The check utility allows the app to detect if initial setup is complete.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Finalize integration, ensure all auth flows work together, update navigation, and verify i18n completeness.

- [ ] T072 [P] Regenerate Supabase TypeScript types by running `pnpm supabase gen types typescript --local > src/types/supabase.ts`. This generates typed interfaces for all database tables (profiles, app_roles, user_roles, libraries, staff_invitations, audit_logs). All services should import and use these types for database query results.
- [ ] T073 [P] Update the dashboard sidebar navigation in `src/components/shared/app-shell/Sidebar.tsx` (Phase 0 component). Add navigation links visible based on role: "Profile" link for all authenticated users (points to `/dashboard/profile`). "Admin" link visible only to admin/superadmin roles. "Library Management" link visible only to library_staff. Read the user's roles from the session/JWT and conditionally render links.
- [ ] T074 [P] Update the app header in `src/components/shared/app-shell/Header.tsx` (Phase 0 component). Add: (1) If user is authenticated, show their avatar (from profile.avatar_url) and display name in a dropdown. (2) The dropdown contains: "Profile Settings" link, "Sign Out" button (calls `signOutAction()`). (3) If not authenticated, show "Sign In" and "Sign Up" buttons/links. Read user session state from a client-side hook or pass as prop from layout.
- [ ] T075 Verify all auth pages render correctly in Arabic (RTL) and English (LTR). Open each page (`/ar/auth/sign-in`, `/ar/auth/sign-up`, `/ar/auth/forgot-password`, `/ar/auth/verify-email`, `/ar/dashboard/profile`) in the browser and check: form inputs align correctly, labels are in Arabic, buttons are positioned correctly for RTL, password strength indicator works, avatar uploader layout is correct. Fix any RTL layout issues found.
- [ ] T076 Verify all auth pages render correctly in dark mode and light mode. Toggle the theme on each auth page and the profile page. Ensure: form backgrounds, input borders, button colors, error messages, and avatar placeholder all respect the theme. Fix any theme issues found.
- [ ] T077 Run `pnpm build` to verify the project compiles without TypeScript errors. Fix any type errors. Ensure all imports resolve correctly and no circular dependencies exist between domain modules.
- [ ] T078 Run the quickstart.md verification checklist from `specs/002-auth-roles-profiles/quickstart.md`. Go through each item in the Verification Checklist section and confirm it passes. Document any failures and fix them.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories
- **US1 Registration (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 Sign-In (Phase 4)**: Depends on Foundational (Phase 2). Benefits from US1 being complete (need registered users to test), but implementation can proceed in parallel.
- **US3 Password Reset (Phase 5)**: Depends on Foundational (Phase 2). Benefits from US1 (need registered credentials users).
- **US4 Profile Management (Phase 6)**: Depends on Foundational (Phase 2). Independent of auth flows.
- **US5 Role-Based Access (Phase 7)**: Depends on Foundational (Phase 2). Enhances middleware from Phase 2. Can be developed in parallel with US1-US4.
- **US6 Staff Invitation (Phase 8)**: Depends on Foundational (Phase 2) and US5 (needs role assignment working). Benefits from US1 (need users to accept invitations).
- **US7 Superadmin Bootstrap (Phase 9)**: Depends on Foundational (Phase 2). Independent lightweight task.
- **Polish (Phase 10)**: Depends on ALL user stories being complete

### User Story Dependencies

```
Phase 2 (Foundation) ─┬── US1 (Registration) ──┐
                      ├── US2 (Sign-In)        ├── US6 (Staff Invite)
                      ├── US3 (Password Reset)  │
                      ├── US4 (Profile)          │
                      ├── US5 (RBAC) ────────────┘
                      └── US7 (Superadmin Bootstrap)
                                                  └── Phase 10 (Polish)
```

### Within Each User Story

- Server actions depend on services
- Services depend on types and schemas
- Components depend on server actions and shared UI
- Pages depend on components
- i18n strings should be added before or alongside components

### Parallel Opportunities

- **Phase 1**: T001-T004 (directories) all parallel. T005-T010 (types/schemas) all parallel.
- **Phase 2**: T011-T016 (migration files) can be written in parallel since they are separate SQL files. T017-T021 depend on tables existing. T022-T024 can be parallel with each other.
- **Phase 3 (US1)**: T025-T029 (services/actions) all parallel. T030-T031 (components) depend on actions. T037-T038 (i18n) parallel with everything.
- **Phase 4 (US2)**: T039 (action) standalone. T040 (component) depends on T039.
- **Phase 5 (US3)**: T042-T044 all parallel.
- **Phase 6 (US4)**: T047-T050 (service/actions) all parallel. T051-T052 (components) depend on actions.
- **Phase 7 (US5)**: T056-T060 all parallel.
- **Phase 8 (US6)**: T062-T065 (service/actions) all parallel. T066 (component) depends on actions.
- **Phase 10**: T072-T076 all parallel.

---

## Parallel Example: User Story 1

```bash
# Launch all services and actions in parallel (different files):
T025: auth-service.ts
T026: provider-utils.ts
T027: sign-up.ts (action)
T028: verify-email.ts (action)
T029: sign-out.ts (action)

# Then launch components (depend on actions):
T030: SignUpForm.tsx
T031: EmailVerificationForm.tsx

# Then pages (depend on components):
T032: callback/route.ts
T033: error/page.tsx
T034: layout.tsx
T035: sign-up/page.tsx
T036: verify-email/page.tsx

# i18n can run any time:
T037: messages/en.json
T038: messages/ar.json
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T024)
3. Complete Phase 3: User Story 1 — Registration (T025-T038)
4. Complete Phase 4: User Story 2 — Sign-In (T039-T041)
5. **STOP and VALIDATE**: Test registration → verification → sign-in → dashboard redirect
6. Deploy/demo if ready — users can register and sign in

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Registration) + US2 (Sign-In) → Core auth working (MVP!)
3. Add US3 (Password Reset) → Self-service recovery
4. Add US4 (Profile) → User personalization
5. Add US5 (RBAC) → Security enforcement complete
6. Add US6 (Staff Invitation) → Multi-vendor staffing ready
7. Add US7 (Superadmin Bootstrap) → Deployment ready
8. Polish → Production quality

### For Cheaper LLM Implementation

Each task is self-contained. When implementing a task:
1. Read the exact file path specified in the task
2. Read the referenced design documents (data-model.md, contracts/component-api.md) for detailed specs
3. Follow the constitution in `.specify/memory/constitution.md` (TypeScript strict, Zod validation, no `any`, externalized i18n strings)
4. Use existing Phase 0 components (Input, Button, Textarea, Select, Card, etc. from `src/components/ui/`)
5. Use existing Supabase client utilities from `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (server)
6. Test each task independently before moving to the next

---

## Notes

- [P] tasks = different files, no dependencies on each other
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- All user-facing strings MUST use next-intl translations — never hardcode text
- All form inputs MUST be validated with Zod schemas
- All server actions MUST include `'use server'` directive at the top of the file
- All audit-worthy actions MUST call `logAuditEvent()`
- All database queries MUST use the typed Supabase client — no raw SQL from application code
