# Research: Authentication, Authorization, Roles, and Profiles

**Date**: 2026-04-23
**Branch**: `002-auth-roles-profiles`

## 1. Supabase Auth Strategy for Next.js App Router

**Decision**: Use `@supabase/ssr` with PKCE flow, cookie-based session management, and separate browser/server clients (already established in Phase 0).

**Rationale**: The PKCE flow is the default and recommended approach for SSR applications. Cookie-based auth avoids localStorage XSS vulnerabilities and provides SSR compatibility. Phase 0 already created the typed Supabase client wrappers in `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`.

**Alternatives considered**:
- Auth.js (NextAuth): Adds another auth layer on top of Supabase. Rejected — Supabase Auth is sufficient and avoids dual auth state.
- localStorage-based tokens: Vulnerable to XSS, breaks SSR. Rejected.

## 2. Email/Password Registration + Email Verification

**Decision**: Use `supabase.auth.signUp()` for email/password registration with Supabase's built-in email confirmation flow. Use OTP-based verification (6-digit code) for email confirmation.

**Rationale**: Supabase handles email sending, token generation, and verification natively. OTP codes provide a smoother UX than magic links for verification (user stays in the same browser tab). The `emailRedirectTo` parameter handles the PKCE code exchange.

**Alternatives considered**:
- Magic link verification: Requires user to switch context (email → browser). Rejected for initial verification; retained for passwordless sign-in if added later.
- Custom email service: Unnecessary complexity — Supabase's built-in email templates are sufficient. Can be customized via dashboard.

## 3. Google OAuth Integration

**Decision**: Use Supabase's built-in Google OAuth provider with PKCE flow. Implement an `/auth/callback` route handler to exchange the auth code for a session.

**Rationale**: Supabase handles the entire OAuth flow. The callback route handler calls `exchangeCodeForSession(code)` to complete authentication. Google OAuth client ID and secret are configured in the Supabase dashboard.

**Key implementation details**:
- Configure Google OAuth client in Google Cloud Console with authorized redirect URI pointing to Supabase callback URL
- Add app callback URL to Supabase redirect allow list
- Use `signInWithOAuth({ provider: 'google', options: { redirectTo } })` on client
- Callback route exchanges code and redirects based on role

## 4. Automatic Account Linking

**Decision**: Rely on Supabase Auth's built-in automatic identity linking. When a user signs in with a new provider using an email that matches an existing account, Supabase automatically links the new identity to the existing user.

**Rationale**: This is Supabase's default behavior — no custom code needed. Supabase ensures email uniqueness and removes unconfirmed identities to prevent pre-account takeover attacks. This aligns with the spec clarification (auto-link decision).

**Alternatives considered**:
- Manual linking via `linkIdentity()`: Requires user to be logged in first. Not suitable for the "register with second provider" flow.
- Block duplicate emails: Poor UX — users forget which provider they used. Rejected.

## 5. Password Reset Flow

**Decision**: Use `supabase.auth.resetPasswordForEmail()` with PKCE flow. The reset link redirects to a `/auth/reset-password` page with an auth code that is exchanged for a session, allowing `updateUser({ password })`.

**Rationale**: Standard Supabase pattern. The PKCE code exchange ensures the password reset is completed server-side. The `auth_provider_metadata` check determines whether to show the password reset option (only for users with email/password identity).

## 6. Role-Based Access Control (RBAC) via Custom Claims

**Decision**: Use a custom `user_roles` table + Supabase Custom Access Token Hook to embed role claims in the JWT. Create an `authorize()` SQL function for use in RLS policies.

**Rationale**: Supabase's official RBAC pattern. The Custom Access Token Hook runs before each token issuance, embedding the user's roles into `app_metadata.roles` in the JWT. RLS policies then read this claim via `auth.jwt()->'app_metadata'->'roles'`. This avoids per-query joins to the roles table.

**Role hierarchy**:
- `user` — default for all registered users
- `library_staff` — scoped to specific library via `library_staff_memberships`
- `admin` — platform-wide operational controls
- `superadmin` — full platform governance

**Alternatives considered**:
- Checking roles via table join in every RLS policy: Performance penalty on every query. Rejected.
- Using `user_metadata` for roles: Insecure — users can modify their own `user_metadata`. Rejected.
- Postgres-level roles: Not applicable for application-level RBAC with Supabase. Rejected.

## 7. Route Protection Middleware

**Decision**: Extend the existing Next.js middleware (which handles locale detection from Phase 0) to also check authentication status and role. Redirect unauthenticated users to sign-in. Redirect authenticated users to their role-appropriate dashboard if accessing a wrong area.

**Rationale**: Middleware runs before every request at the edge, providing fast route-level protection. Combined with RLS on the database, this creates defense in depth. The middleware checks the session and role claim from the JWT — it does NOT replace server-side validation.

**Route protection rules**:
- `/[locale]/(public)/*` — accessible to all
- `/[locale]/(auth)/*` — accessible only to unauthenticated users (redirect authenticated users away)
- `/[locale]/(dashboard)/*` — requires authentication
- `/[locale]/(dashboard)/admin/*` — requires admin or superadmin role
- `/[locale]/(dashboard)/library/[id]/*` — requires library_staff role for that library

## 8. Profile Management Pattern

**Decision**: Create a `profiles` table linked 1:1 to `auth.users` via `id` foreign key. Use a database trigger to auto-create a profile row on new user signup. Profile updates go through server actions with Zod validation.

**Rationale**: Supabase's `auth.users` table should not be extended with custom fields. A separate `profiles` table (in the `public` schema) allows RLS policies, custom fields, and clean separation. The trigger ensures every user always has a profile.

**Fields**: `id` (FK to auth.users), `display_name`, `bio`, `preferred_locale`, `avatar_url`, `status` (active/suspended), `created_at`, `updated_at`

## 9. Avatar Upload Storage

**Decision**: Use a Supabase Storage bucket named `avatars` with public access for reading, authenticated-only for writing. File path convention: `{user_id}/avatar.{ext}`. Apply storage policies for file type (JPEG, PNG, WebP) and size (5 MB max).

**Rationale**: Avatars are publicly visible (displayed in chat, profiles). Public read access avoids signed URL overhead. Write access is restricted to the file owner via storage RLS policy. Overwriting the same path on re-upload avoids orphaned files.

**Alternatives considered**:
- Private bucket with signed URLs: Unnecessary for avatars — they are public data. Rejected.
- Client-side image processing before upload: Deferred to optimization phase. Standard upload sufficient for now.

## 10. Superadmin Bootstrap

**Decision**: Use a seed SQL script executed via Supabase CLI (`supabase db seed`) that assigns the superadmin role to a pre-configured email address. The script checks if a superadmin already exists and is idempotent.

**Rationale**: Operational process, not a user-facing feature. The seed script runs during initial deployment. Using the service role key ensures it can bypass RLS. Idempotency prevents accidental duplicate superadmin creation.

**Alternatives considered**:
- Environment variable for superadmin email + auto-assign on first login: Race condition risk, harder to audit. Rejected.
- Admin UI for initial setup: Chicken-and-egg problem (need admin to create admin). Rejected.

## 11. Staff Invitation Flow

**Decision**: Create a `staff_invitations` table with fields: `id`, `email`, `library_id`, `invited_by`, `status` (pending/accepted/expired/revoked), `token` (unique), `expires_at`, `created_at`. Invitation acceptance is handled via a unique token URL.

**Rationale**: Invitations need to work for both existing and new users. A unique token URL allows the invitee to accept without being logged in. The acceptance flow checks if the user exists — if yes, assigns role directly; if no, redirects to registration with the token preserved, then assigns after signup via trigger or post-registration hook.

## 12. Security Event Logging

**Decision**: Create an `audit_logs` table with fields: `id`, `user_id`, `action` (enum), `target_type`, `target_id`, `metadata` (JSONB), `ip_address`, `created_at`. Log via a reusable service function called from server actions.

**Rationale**: FR-020 requires logging all security events. A dedicated audit table with JSONB metadata allows flexible event recording without schema changes per event type. RLS policy: only superadmins can read; inserts via service role or database function.

## 13. Rate Limiting

**Decision**: Rely on Supabase's built-in rate limiting for auth endpoints (configured in Supabase dashboard). Add application-level rate limiting via Next.js middleware for custom endpoints using a simple in-memory or edge-compatible rate limiter.

**Rationale**: Supabase Auth endpoints have built-in rate limiting. Custom application endpoints (profile updates, invitation sends) need additional protection. A lightweight middleware-based approach avoids external dependencies.

**Alternatives considered**:
- Cloudflare rate limiting: Good for production but adds infrastructure dependency. Deferred to Phase 11 (hardening).
- Redis-based rate limiting: Overkill for Phase 1 scope. Rejected.
