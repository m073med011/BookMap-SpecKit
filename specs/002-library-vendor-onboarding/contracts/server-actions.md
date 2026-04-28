# Server Action Contracts: Library Vendor Onboarding

**Feature**: 003-library-vendor-onboarding
**Date**: 2026-04-26

All server actions follow the established pattern: Zod-validated input → authorization check → service call → typed response.

## Library Lifecycle Actions

### createLibrary

**Location**: `src/features/libraries/actions/create-library.ts`
**Auth**: Authenticated user (any registered user)
**Input**:
```
{
  name: string (required)
  slug?: string (optional, auto-generated if absent)
  description?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  languages?: ('en' | 'ar')[]
}
```
**Behavior**: Creates a library in `draft` status. Creates a `library_staff_memberships` entry with `library_role: 'owner'`. Adds a platform-level `library_staff` role via `user_roles`. Records initial status in `library_status_history`. Creates a `library_settings` record with defaults.
**Returns**: `{ success: true, libraryId: string }` or `{ success: false, error: string }`

### updateLibrary

**Location**: `src/features/libraries/actions/update-library.ts`
**Auth**: Library owner or staff (via `requireLibraryStaff`)
**Input**:
```
{
  libraryId: string (required)
  name?: string
  slug?: string
  description?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  socialLinks?: Record<string, string>
  languages?: ('en' | 'ar')[]
  policies?: Record<string, string>
}
```
**Behavior**: Updates library profile fields. Slug changes trigger uniqueness check. Only writable by owner or staff.
**Returns**: `{ success: true }` or `{ success: false, error: string }`

### submitLibrary

**Location**: `src/features/libraries/actions/submit-library.ts`
**Auth**: Library owner (via `requireLibraryOwner`)
**Input**: `{ libraryId: string }`
**Behavior**: Validates all required fields are complete. Transitions status from `draft` to `pending_approval`. Records transition in `library_status_history`. Checks owner account is not suspended.
**Returns**: `{ success: true }` or `{ success: false, error: string }`

### resubmitLibrary

**Location**: `src/features/libraries/actions/resubmit-library.ts`
**Auth**: Library owner (via `requireLibraryOwner`)
**Input**: `{ libraryId: string }`
**Behavior**: Transitions status from `rejected` to `draft`. Records transition in `library_status_history`. Owner can then edit and re-submit.
**Returns**: `{ success: true }` or `{ success: false, error: string }`

## Admin Moderation Actions

### approveLibrary

**Location**: `src/features/libraries/actions/approve-library.ts`
**Auth**: Admin or superadmin (via `requireRole('admin')`)
**Input**: `{ libraryId: string }`
**Behavior**: Transitions from `pending_approval` to `active`. Checks owner account is not suspended. Records in `library_status_history`. Logs to `audit_logs`.
**Returns**: `{ success: true }` or `{ success: false, error: string }`

### rejectLibrary

**Location**: `src/features/libraries/actions/reject-library.ts`
**Auth**: Admin or superadmin
**Input**: `{ libraryId: string, reason: string (required) }`
**Behavior**: Transitions from `pending_approval` to `rejected`. Records reason in `library_status_history`. Logs to `audit_logs`.
**Returns**: `{ success: true }` or `{ success: false, error: string }`

### suspendLibrary

**Location**: `src/features/libraries/actions/suspend-library.ts`
**Auth**: Admin or superadmin
**Input**: `{ libraryId: string, reason: string (required) }`
**Behavior**: Transitions from `active` to `suspended`. Records reason. Logs to `audit_logs`.
**Returns**: `{ success: true }` or `{ success: false, error: string }`

### reactivateLibrary

**Location**: `src/features/libraries/actions/reactivate-library.ts`
**Auth**: Admin or superadmin
**Input**: `{ libraryId: string }`
**Behavior**: Transitions from `suspended` to `active`. Records in history. Logs to `audit_logs`.
**Returns**: `{ success: true }` or `{ success: false, error: string }`

### archiveLibrary

**Location**: `src/features/libraries/actions/archive-library.ts`
**Auth**: Superadmin only (via `requireSuperadmin`)
**Input**: `{ libraryId: string }`
**Behavior**: Transitions from `active` or `suspended` to `archived`. Records in history. Logs to `audit_logs`.
**Returns**: `{ success: true }` or `{ success: false, error: string }`

## Staff Management Actions

### manageStaff

**Location**: `src/features/libraries/actions/manage-staff.ts`
**Auth**: Library owner (via `requireLibraryOwner`) for invite/remove/promote. Self only for demote.
**Input**:
```
{
  libraryId: string (required)
  action: 'invite' | 'remove' | 'promote' | 'demote'
  userId?: string (for remove/promote/demote)
  email?: string (for invite)
}
```
**Behavior**:
- `invite`: Delegates to existing invitation service from Phase 1
- `remove`: Deletes membership. Blocks removing last owner. Revokes access immediately.
- `promote`: Changes `library_role` from `staff` to `owner`
- `demote`: Self-demote only. Changes own `library_role` from `owner` to `staff`. Blocks if last owner.
**Returns**: `{ success: true }` or `{ success: false, error: string }`

## Asset Upload Action

### uploadLibraryAsset

**Location**: `src/features/libraries/actions/upload-library-asset.ts`
**Auth**: Library owner or staff (via `requireLibraryStaff`)
**Input**: `FormData` with `libraryId`, `type` ('logo' | 'banner'), `file`
**Behavior**: Validates file type (JPEG, PNG, WebP) and size (logo: 2MB, banner: 5MB). Uploads to `library-assets/{libraryId}/{type}/`. Updates `logo_url` or `banner_url` on the `libraries` record. Deletes previous file if replacing.
**Returns**: `{ success: true, url: string }` or `{ success: false, error: string }`

## Settings Action

### updateLibrarySettings

**Location**: `src/features/libraries/actions/update-library-settings.ts`
**Auth**: Library owner only (via `requireLibraryOwner`)
**Input**:
```
{
  libraryId: string (required)
  shippingPreferences?: object
  returnPolicy?: string
  operatingHours?: object
}
```
**Behavior**: Updates the `library_settings` record for the library.
**Returns**: `{ success: true }` or `{ success: false, error: string }`
