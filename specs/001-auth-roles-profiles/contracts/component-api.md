# Component & Service API Contracts: Auth, Roles, and Profiles

**Date**: 2026-04-23

## Overview

This document defines the public interfaces exposed by the auth and profiles domain modules. All server actions validate inputs with Zod and return typed results. All components accept the Phase 0 CommonProps (`className`, `data-testid`).

## Server Actions (Auth Domain)

### signUpWithEmail

```typescript
Input: { email: string, password: string, locale: 'en' | 'ar' }
Output: { success: true } | { error: string, code: 'EMAIL_TAKEN' | 'WEAK_PASSWORD' | 'RATE_LIMITED' | 'UNKNOWN' }
Side effects: Creates auth.users row, triggers profile creation, sends verification email
```

### signInWithEmail

```typescript
Input: { email: string, password: string }
Output: { success: true, redirectTo: string } | { error: string, code: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'ACCOUNT_SUSPENDED' | 'RATE_LIMITED' }
Side effects: Creates session, logs audit event
```

### signInWithGoogle

```typescript
Input: { redirectTo: string }
Output: { url: string } (redirect URL to Google consent screen)
Side effects: Initiates OAuth PKCE flow
```

### signOut

```typescript
Input: none
Output: { success: true }
Side effects: Destroys session, logs audit event
```

### requestPasswordReset

```typescript
Input: { email: string }
Output: { success: true } (always — does not reveal email existence)
Side effects: Sends reset email if user exists with email/password identity
```

### resetPassword

```typescript
Input: { password: string, code: string }
Output: { success: true } | { error: string, code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'WEAK_PASSWORD' }
Side effects: Updates password, invalidates reset token, logs audit event
```

### verifyEmail

```typescript
Input: { token: string, type: 'otp' | 'link' }
Output: { success: true } | { error: string, code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' }
Side effects: Marks email as verified, creates session
```

## Server Actions (Profile Domain)

### getProfile

```typescript
Input: { userId: string }
Output: Profile | null
```

### updateProfile

```typescript
Input: { displayName?: string, bio?: string, preferredLocale?: 'en' | 'ar' }
Output: { success: true, profile: Profile } | { error: string }
Side effects: Updates profile row, logs audit event
```

### uploadAvatar

```typescript
Input: { file: File } (max 5MB, JPEG/PNG/WebP)
Output: { success: true, avatarUrl: string } | { error: string, code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' }
Side effects: Uploads to avatars bucket, updates profile.avatar_url
```

### removeAvatar

```typescript
Input: none
Output: { success: true }
Side effects: Deletes file from storage, sets profile.avatar_url to null
```

## Server Actions (Role Domain)

### getUserRoles

```typescript
Input: { userId: string }
Output: Array<{ role: string, libraryId: string | null }>
```

### assignRole

```typescript
Input: { userId: string, role: string, libraryId?: string }
Output: { success: true } | { error: string, code: 'UNAUTHORIZED' | 'ALREADY_ASSIGNED' | 'INVALID_ROLE' }
Side effects: Inserts user_roles row, logs audit event
Requires: superadmin (for admin/superadmin), admin or library owner (for library_staff)
```

### removeRole

```typescript
Input: { userId: string, role: string, libraryId?: string }
Output: { success: true } | { error: string, code: 'UNAUTHORIZED' | 'NOT_FOUND' }
Side effects: Deletes user_roles row, logs audit event
Requires: superadmin only
```

### suspendUser

```typescript
Input: { userId: string, reason: string }
Output: { success: true } | { error: string, code: 'UNAUTHORIZED' | 'ALREADY_SUSPENDED' }
Side effects: Sets profile.status to 'suspended', logs audit event
Requires: superadmin only
```

### unsuspendUser

```typescript
Input: { userId: string }
Output: { success: true } | { error: string, code: 'UNAUTHORIZED' | 'NOT_SUSPENDED' }
Side effects: Sets profile.status to 'active', logs audit event
Requires: superadmin only
```

## Server Actions (Invitation Domain)

### sendStaffInvitation

```typescript
Input: { email: string, libraryId: string }
Output: { success: true } | { error: string, code: 'UNAUTHORIZED' | 'ALREADY_STAFF' | 'ALREADY_INVITED' | 'RATE_LIMITED' }
Side effects: Creates invitation row, sends invitation email, logs audit event
Requires: admin, superadmin, or library staff with invite permission
```

### acceptInvitation

```typescript
Input: { token: string }
Output: { success: true, libraryId: string } | { error: string, code: 'INVALID_TOKEN' | 'EXPIRED' | 'ALREADY_ACCEPTED' }
Side effects: Updates invitation status, assigns library_staff role, logs audit event
```

### revokeInvitation

```typescript
Input: { invitationId: string }
Output: { success: true } | { error: string, code: 'UNAUTHORIZED' | 'NOT_PENDING' }
Side effects: Updates invitation status to 'revoked', logs audit event
```

## Auth Callback Route

### GET /[locale]/auth/callback

```typescript
Query params: { code: string, next?: string }
Behavior: Exchanges PKCE code for session, determines user role, redirects to role-appropriate dashboard
Redirect targets:
  - superadmin/admin → /[locale]/dashboard/admin
  - library_staff → /[locale]/dashboard/library/[libraryId]
  - user → /[locale]/dashboard
  - with pending invitation → processes invitation, then redirects
Error: Redirects to /[locale]/auth/error with error description
```

## Auth Error Page

### /[locale]/auth/error

```typescript
Query params: { error?: string, provider?: string }
Behavior: Shows user-friendly error with:
  - Retry button (for OAuth failures)
  - Sign-in with email/password alternative
  - Return to home link
```

## Page Components (Auth Domain)

### SignUpForm
- Props: `locale: 'en' | 'ar'`
- Features: Email/password fields, password strength indicator, Google OAuth button, validation errors, loading states
- i18n: All labels and error messages externalized

### SignInForm
- Props: `locale: 'en' | 'ar'`
- Features: Email/password fields, Google OAuth button, forgot password link, validation errors, loading states

### ForgotPasswordForm
- Props: `locale: 'en' | 'ar'`
- Features: Email field, submit button, success confirmation, provider-aware (hides for Google-only users)

### ResetPasswordForm
- Props: `locale: 'en' | 'ar', code: string`
- Features: New password field, confirm password, strength indicator, submit

### EmailVerificationForm
- Props: `locale: 'en' | 'ar'`
- Features: OTP input (6 digits), resend button with cooldown timer

## Page Components (Profile Domain)

### ProfileSettingsForm
- Props: `profile: Profile, locale: 'en' | 'ar'`
- Features: Display name, bio (textarea), preferred language select, save button
- Validation: Display name max 100 chars, bio max 500 chars

### AvatarUploader
- Props: `currentAvatarUrl: string | null`
- Features: Image preview, upload button, remove button, file type/size validation, crop preview
- Accepts: JPEG, PNG, WebP up to 5 MB

## Shared Types

```typescript
type UserRole = 'user' | 'library_staff' | 'admin' | 'superadmin'
type ProfileStatus = 'active' | 'suspended'
type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

interface Profile {
  id: string
  displayName: string
  bio: string | null
  preferredLocale: 'en' | 'ar'
  avatarUrl: string | null
  status: ProfileStatus
  createdAt: string
  updatedAt: string
}

interface UserRoleAssignment {
  id: string
  userId: string
  role: UserRole
  libraryId: string | null
  assignedBy: string | null
  assignedAt: string
}

interface StaffInvitation {
  id: string
  email: string
  libraryId: string
  invitedBy: string
  status: InvitationStatus
  expiresAt: string
  createdAt: string
}

interface AuditLogEntry {
  id: string
  userId: string | null
  action: string
  targetType: string | null
  targetId: string | null
  metadata: Record<string, unknown>
  ipAddress: string | null
  createdAt: string
}
```
