# Quickstart: Authentication, Authorization, Roles, and Profiles

## Prerequisites

- Phase 0 foundation fully set up and running (see `specs/001-project-foundation/quickstart.md`)
- Supabase project with:
  - Email auth enabled
  - Google OAuth provider configured (client ID + secret in Supabase dashboard)
  - Email templates configured (confirmation, password reset, invitation)

## Environment Variables

Add these to `.env.local` (in addition to Phase 0 variables):

```
# Google OAuth (configured in Supabase dashboard, not in app code)
# No additional env vars needed — Supabase handles Google OAuth config

# Supabase Auth callback
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Superadmin bootstrap email
SUPERADMIN_EMAIL=admin@yourdomain.com
```

## Database Setup

1. Run migrations:
   ```bash
   pnpm supabase db push
   ```

2. Seed the superadmin:
   ```bash
   pnpm supabase db seed
   ```

3. Verify tables were created:
   - `profiles`
   - `app_roles`
   - `user_roles`
   - `libraries` (stub)
   - `staff_invitations`
   - `audit_logs`

4. Verify storage bucket:
   - `avatars` bucket exists with public read access

5. Verify auth hook:
   - Custom Access Token Hook is registered in Supabase dashboard

## Verification Checklist

After setup, verify each flow:

- [ ] **Registration**: Create account with email/password → receive verification email
- [ ] **Email verification**: Enter OTP code → email confirmed → redirect to profile setup
- [ ] **Google sign-in**: Click Google button → consent screen → callback → signed in
- [ ] **Sign-in**: Email/password sign-in → redirected to dashboard based on role
- [ ] **Password reset**: Request reset → receive email → click link → set new password → sign in
- [ ] **Google-only user**: No password reset option visible on profile/forgot-password
- [ ] **Profile update**: Change display name, bio, locale → changes persist
- [ ] **Avatar upload**: Upload JPEG/PNG/WebP under 5MB → image displays
- [ ] **Avatar rejection**: Upload file >5MB or wrong type → error message shown
- [ ] **Role-based redirect**: User → storefront, Staff → library dashboard, Admin → admin dashboard
- [ ] **Route protection**: Unauthenticated access to dashboard → redirect to sign-in
- [ ] **Unauthorized access**: User accessing admin area → denied
- [ ] **Suspended user**: Cannot access any protected area
- [ ] **Staff invitation**: Send invitation → invitee receives email → accepts → staff role assigned
- [ ] **Superadmin bootstrap**: Configured email has superadmin role after seed
- [ ] **Audit logs**: Sign-in, password reset, role changes appear in audit_logs table
- [ ] **Arabic RTL**: All auth pages render correctly in Arabic with RTL layout
- [ ] **English LTR**: All auth pages render correctly in English with LTR layout
- [ ] **Dark/light theme**: Auth pages respect theme setting

## Available Auth Routes

| Route                              | Access       | Description                           |
| ---------------------------------- | ------------ | ------------------------------------- |
| `/[locale]/auth/sign-up`           | Public       | Registration page                     |
| `/[locale]/auth/sign-in`           | Public       | Sign-in page                          |
| `/[locale]/auth/forgot-password`   | Public       | Password reset request                |
| `/[locale]/auth/reset-password`    | Public       | New password form (with token)        |
| `/[locale]/auth/verify-email`      | Public       | Email OTP verification                |
| `/[locale]/auth/callback`          | Public       | OAuth/PKCE callback handler           |
| `/[locale]/auth/error`             | Public       | Auth error page (OAuth failures)      |
| `/[locale]/dashboard`              | Authenticated| User dashboard home                   |
| `/[locale]/dashboard/profile`      | Authenticated| Profile settings                      |
| `/[locale]/dashboard/admin`        | Admin+       | Admin dashboard                       |
| `/[locale]/dashboard/library/[id]` | Library Staff| Library management                    |

## Project Structure (Phase 1 additions)

```
src/
  features/
    auth/
      actions/           # Server actions (signUp, signIn, resetPassword, etc.)
      components/        # Auth UI components (SignUpForm, SignInForm, etc.)
      schemas/           # Zod validation schemas
      services/          # Auth business logic
      types/             # Auth-specific types
    profiles/
      actions/           # Server actions (updateProfile, uploadAvatar, etc.)
      components/        # Profile UI components
      schemas/           # Profile validation schemas
      services/          # Profile business logic
      types/             # Profile-specific types
    roles/
      actions/           # Server actions (assignRole, suspendUser, etc.)
      services/          # Role checking, authorization logic
      types/             # Role-specific types
    invitations/
      actions/           # Server actions (sendInvitation, acceptInvitation, etc.)
      components/        # Invitation UI components
      schemas/           # Invitation validation schemas
      services/          # Invitation business logic
      types/             # Invitation-specific types
  app/
    [locale]/
      (auth)/
        sign-up/page.tsx
        sign-in/page.tsx
        forgot-password/page.tsx
        reset-password/page.tsx
        verify-email/page.tsx
        callback/route.ts
        error/page.tsx
      (dashboard)/
        profile/page.tsx
  lib/
    auth/
      middleware.ts       # Auth + role checking for Next.js middleware
      permissions.ts      # Permission checking utilities
  middleware.ts           # Updated: adds auth session refresh + route protection
supabase/
  migrations/            # SQL migration files
  seed.sql               # Superadmin bootstrap seed
```
