# Quickstart: Library Vendor Onboarding and Store Management

**Feature**: 003-library-vendor-onboarding
**Date**: 2026-04-26

## Prerequisites

- Phase 0 (Foundation) and Phase 1 (Auth, Roles, Profiles) must be complete and functional
- Supabase project running locally or connected to a hosted instance
- Existing tables: `profiles`, `app_roles`, `user_roles`, `libraries` (stub), `staff_invitations`, `audit_logs`
- Existing functions: `authorize()`, `authorize_library()`, `handle_new_user()`
- Existing storage bucket: `avatars`

## Implementation Order

### Step 1: Database Migrations

Run migrations in order:

1. **`20260426100000_expand_libraries_table.sql`** — Adds columns to the existing `libraries` stub (slug, description, logo_url, banner_url, address, contact fields, social_links, languages, policies, status, owner_id, updated_at). Adds indexes and CHECK constraint for status values.

2. **`20260426100001_create_library_status_history.sql`** — Creates the immutable audit log for status transitions.

3. **`20260426100002_create_library_staff_memberships.sql`** — Creates the library-scoped role table (owner/staff).

4. **`20260426100003_create_library_settings.sql`** — Creates the library settings table.

5. **`20260426100004_create_library_assets_bucket.sql`** — Creates the `library-assets` storage bucket with RLS policies.

After migrations, regenerate Supabase types:
```bash
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Step 2: Domain Module — Types and Schemas

Create `src/features/libraries/types/index.ts` and `src/features/libraries/schemas/library.ts`.

Key types: `Library`, `LibraryStatus`, `LibraryRole`, `LibraryStaffMembership`, `LibrarySettings`, `LibraryStatusHistory`.

Key schemas: `createLibrarySchema`, `updateLibrarySchema`, `librarySettingsSchema`, `staffManagementSchema`, `moderationSchema`, `assetUploadSchema`.

### Step 3: Service Layer

Create services in `src/features/libraries/services/`:

1. **`library-status-machine.ts`** — Pure function that validates status transitions. No side effects.
2. **`library-service.ts`** — CRUD operations for libraries. Uses Supabase typed helpers. Records status history.
3. **`library-staff-service.ts`** — Membership CRUD. Owner/staff role management. Last-owner guard.
4. **`library-settings-service.ts`** — Settings CRUD for a library.

### Step 4: Authorization Helpers

Extend `src/features/roles/services/authorize.ts` with:
- `requireLibraryOwner(libraryId)` — Checks `library_staff_memberships` for `library_role = 'owner'`
- Update `requireLibraryStaff(libraryId)` — Can optionally also check the memberships table

### Step 5: Server Actions

Create actions in `src/features/libraries/actions/` following the contracts defined in `contracts/server-actions.md`.

### Step 6: UI Components

Create components in `src/features/libraries/components/`:
- `OnboardingWizard.tsx` — Multi-step form with save/resume for draft libraries
- `LibraryProfileForm.tsx` — Edit library profile fields
- `LibrarySettingsForm.tsx` — Edit library operational settings
- `StaffManagementPanel.tsx` — List, invite, remove, promote, demote staff
- `ApprovalQueueTable.tsx` — Admin view of pending libraries
- `LibraryStatusBadge.tsx` — Reusable status indicator
- `ModerationPanel.tsx` — Admin/superadmin moderation controls

### Step 7: Routes and Pages

Create pages under `src/app/[locale]/`:
- `(dashboard)/dashboard/libraries/new/page.tsx` — Onboarding wizard
- `(dashboard)/dashboard/libraries/[id]/page.tsx` — Library management overview
- `(dashboard)/dashboard/libraries/[id]/settings/page.tsx` — Library settings (owner only)
- `(dashboard)/dashboard/libraries/[id]/staff/page.tsx` — Staff management (owner only)
- `(dashboard)/dashboard/admin/approvals/page.tsx` — Admin approval queue
- `(public)/libraries/[slug]/page.tsx` — Public storefront page

### Step 8: i18n Messages

Add translation keys for both `en` and `ar` locales covering:
- Onboarding wizard labels and validation messages
- Library profile form labels
- Status labels and descriptions
- Approval queue interface text
- Moderation action confirmations
- Storefront page labels
- Staff management labels
- Error messages

## Key Integration Points

| System | Integration |
|--------|-------------|
| Auth (Phase 1) | `requireRole()`, `requireLibraryStaff()`, JWT role claims |
| Invitations (Phase 1) | Reuse `send-invitation` action for staff invites |
| Profiles (Phase 1) | Owner profile linked via `owner_id` |
| Audit Logs (Phase 1) | Log moderation actions to `audit_logs` table |
| Supabase Storage | New `library-assets` bucket for logo/banner |
| RLS Functions | Existing `authorize()`, `authorize_library()` for policy checks |

## Testing Strategy

- **Unit tests**: Status machine transitions, Zod schema validation, slug generation
- **Integration tests**: Library CRUD via service layer, staff management, permission boundaries
- **Permission tests**: Owner-only actions blocked for staff, admin-only actions blocked for staff/users
- **E2E tests**: Full onboarding wizard flow, approval flow, storefront page rendering
