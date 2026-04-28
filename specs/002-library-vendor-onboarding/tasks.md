# Tasks: Library Vendor Onboarding and Store Management

**Input**: Design documents from `/specs/003-library-vendor-onboarding/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/server-actions.md, research.md, quickstart.md
**Tests**: Not explicitly requested — test tasks omitted. Unit/integration/e2e tests can be added in the Polish phase.
**Organization**: Tasks grouped by user story (7 stories). Each story is independently testable after Phase 2 completes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Implementation Context for LLM Implementer

> **IMPORTANT**: Before writing ANY Next.js code, read `node_modules/next/dist/docs/` for current API conventions. This project uses **Next.js 16** which may differ from your training data.

**Existing patterns to follow**:
- Server actions: `"use server"` → auth check → Zod validate → service call → typed result
- Services: `"server-only"` import → typed input/output → snake_case DB ↔ camelCase TS mapping
- Auth: `createClient()` for session, `createServiceRoleClient()` for admin ops
- Authorization: `requireRole()`, `requireLibraryStaff()`, `requireSuperadmin()` from `src/features/roles/services/authorize.ts`
- Audit: `logAuditEvent()` from `src/features/auth/services/audit-service.ts`
- Schemas: Zod v4 for all validation
- Results: `{ success: true, ...data }` or `{ code: string, error: string }`
- i18n: `getTranslations(namespace)` from `next-intl/server`; all user-facing strings via message keys
- Components: Server components by default; `"use client"` only when needed (forms, interactivity)

**Existing DB tables** (Phase 1, already exist):
- `profiles` (id, display_name, bio, preferred_locale, avatar_url, status, created_at, updated_at)
- `user_roles` (id, user_id, role, library_id, assigned_by, assigned_at)
- `libraries` **stub** (id, name, created_at) — will be expanded
- `staff_invitations` (id, email, library_id, invited_by, token, status, expires_at, created_at)
- `audit_logs` (id, user_id, action, target_type, target_id, metadata, ip_address, created_at)
- `app_roles` (id, description)

**Existing Supabase functions**: `authorize(required_role)`, `authorize_library(lib_id, required_role)`, `handle_new_user()`, `custom_access_token_hook(event)`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migrations, storage bucket, regenerated types, and domain module skeleton.

- [X] T001 Create migration file `supabase/migrations/20260426100000_expand_libraries_table.sql` that ALTERs the existing `libraries` stub table to add columns: `slug` (text, NOT NULL, UNIQUE), `description` (text, NULL), `logo_url` (text, NULL), `banner_url` (text, NULL), `address` (text, NULL), `contact_email` (text, NULL), `contact_phone` (text, NULL), `social_links` (jsonb, NOT NULL, default '{}'), `languages` (text[], NOT NULL, default '{en}'), `policies` (jsonb, NOT NULL, default '{}'), `status` (text, NOT NULL, default 'draft', CHECK status IN ('draft','pending_approval','active','suspended','rejected','archived')), `owner_id` (uuid, NOT NULL, FK → auth.users(id)), `updated_at` (timestamptz, NOT NULL, default now()). Add indexes: `libraries_slug_unique_idx` UNIQUE on slug, `libraries_status_idx` on status, `libraries_owner_id_idx` on owner_id. Add an `updated_at` trigger using `moddatetime` or a simple trigger function. Add RLS policies: SELECT for public (status='active'), SELECT for management (owner/staff via `authorize_library` or admin/superadmin via `authorize`), INSERT for any authenticated user, UPDATE for owner/staff (profile fields) and admin/superadmin (status fields), DELETE for superadmin only.

- [X] T002 Create migration file `supabase/migrations/20260426100001_create_library_status_history.sql` with columns: `id` (uuid PK default gen_random_uuid()), `library_id` (uuid NOT NULL FK → libraries(id) ON DELETE CASCADE), `previous_status` (text NULL), `new_status` (text NOT NULL), `reason` (text NULL), `changed_by` (uuid NOT NULL FK → auth.users(id)), `created_at` (timestamptz NOT NULL default now()). Add indexes: `library_status_history_library_id_idx`, `library_status_history_created_at_idx`. Enable RLS. Add policies: SELECT for library owner/staff or admin/superadmin, INSERT restricted to service role (use a SECURITY DEFINER function `record_library_status_change(p_library_id uuid, p_previous_status text, p_new_status text, p_reason text, p_changed_by uuid)` that inserts into the table).

- [X] T003 Create migration file `supabase/migrations/20260426100002_create_library_staff_memberships.sql` with columns: `id` (uuid PK default gen_random_uuid()), `library_id` (uuid NOT NULL FK → libraries(id) ON DELETE CASCADE), `user_id` (uuid NOT NULL FK → auth.users(id) ON DELETE CASCADE), `library_role` (text NOT NULL CHECK in ('owner','staff')), `assigned_by` (uuid NULL FK → auth.users(id)), `created_at` (timestamptz NOT NULL default now()). Add UNIQUE constraint on `(library_id, user_id)`. Add index: `library_staff_memberships_user_id_idx`. Enable RLS. Add policies: SELECT for library members or admin/superadmin, INSERT for library owner or admin/superadmin, UPDATE for library owner (promotions) or self (self-demotion), DELETE for library owner or admin/superadmin.

- [X] T004 Create migration file `supabase/migrations/20260426100003_create_library_settings.sql` with columns: `id` (uuid PK default gen_random_uuid()), `library_id` (uuid NOT NULL UNIQUE FK → libraries(id) ON DELETE CASCADE), `shipping_preferences` (jsonb NOT NULL default '{}'), `return_policy` (text NULL), `operating_hours` (jsonb NOT NULL default '{}'), `custom_settings` (jsonb NOT NULL default '{}'), `updated_at` (timestamptz NOT NULL default now()). Add UNIQUE index on library_id. Enable RLS. Add policies: SELECT for library owner/staff or admin/superadmin, INSERT/UPDATE for library owner only.

- [X] T005 Create migration file `supabase/migrations/20260426100004_create_library_assets_bucket.sql` that creates a Supabase storage bucket named `library-assets` (public). Add storage RLS policies: SELECT public (anyone can read), INSERT/UPDATE for authenticated users who are staff/owner of the library (use `authorize_library()` function to check library_id extracted from the storage path `library-assets/{library_id}/...`), DELETE for library owners or admin/superadmin.

- [ ] T006 Regenerate Supabase TypeScript types by running `npx supabase gen types typescript --local > src/types/supabase.ts` after all migrations are applied. Verify the generated types include the expanded `libraries` table, `library_status_history`, `library_staff_memberships`, `library_settings`, and the `record_library_status_change` function.

- [X] T007 [P] Create the domain module directory structure: `src/features/libraries/types/index.ts`, `src/features/libraries/schemas/library.ts`, `src/features/libraries/services/` (empty dir), `src/features/libraries/actions/` (empty dir), `src/features/libraries/components/` (empty dir). This is just the skeleton — files are filled in subsequent tasks.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, schemas, services, and authorization helpers that ALL user stories depend on. No user story work can begin until this phase is complete.

**CRITICAL**: Complete all Phase 2 tasks before starting any Phase 3+ task.

- [X] T008 [P] Define TypeScript types in `src/features/libraries/types/index.ts`. Export:
  - `LibraryStatus` = `"draft" | "pending_approval" | "active" | "suspended" | "rejected" | "archived"`
  - `LibraryRole` = `"owner" | "staff"`
  - `Library` type with fields: `id: string`, `name: string`, `slug: string`, `description: string | null`, `logoUrl: string | null`, `bannerUrl: string | null`, `address: string | null`, `contactEmail: string | null`, `contactPhone: string | null`, `socialLinks: Record<string, string>`, `languages: string[]`, `policies: Record<string, string>`, `status: LibraryStatus`, `ownerId: string`, `createdAt: string`, `updatedAt: string`
  - `LibraryStaffMembership` type: `id: string`, `libraryId: string`, `userId: string`, `libraryRole: LibraryRole`, `assignedBy: string | null`, `createdAt: string`
  - `LibrarySettings` type: `id: string`, `libraryId: string`, `shippingPreferences: Record<string, unknown>`, `returnPolicy: string | null`, `operatingHours: Record<string, unknown>`, `customSettings: Record<string, unknown>`, `updatedAt: string`
  - `LibraryStatusHistoryEntry` type: `id: string`, `libraryId: string`, `previousStatus: LibraryStatus | null`, `newStatus: LibraryStatus`, `reason: string | null`, `changedBy: string`, `createdAt: string`
  - `ModerationAction` = `"approve" | "reject" | "suspend" | "reactivate" | "archive"`

- [X] T009 [P] Create Zod validation schemas in `src/features/libraries/schemas/library.ts`. Export:
  - `createLibrarySchema` — `name` (string, min 2, max 200, required), `slug` (string, regex `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, min 2, max 100, optional), `description` (string, max 5000, optional), `contactEmail` (email, optional), `contactPhone` (string, max 30, optional), `address` (string, max 500, optional), `languages` (array of `z.enum(["en","ar"])`, min 1, default `["en"]`, optional)
  - `updateLibrarySchema` — Same fields as create but ALL optional, plus `libraryId` (string uuid, required), `socialLinks` (record of string→string, optional), `policies` (record of string→string, optional)
  - `submitLibrarySchema` — `libraryId` (string uuid, required)
  - `resubmitLibrarySchema` — `libraryId` (string uuid, required)
  - `moderationSchema` — `libraryId` (string uuid, required), `action` (enum: approve, reject, suspend, reactivate, archive), `reason` (string, max 1000, required when action is reject or suspend, optional otherwise)
  - `staffManagementSchema` — `libraryId` (string uuid, required), `action` (enum: invite, remove, promote, demote), `userId` (string uuid, optional — required for remove/promote/demote), `email` (email string, optional — required for invite)
  - `librarySettingsSchema` — `libraryId` (string uuid, required), `shippingPreferences` (object passthrough, optional), `returnPolicy` (string, max 5000, optional), `operatingHours` (object passthrough, optional)
  - `assetUploadSchema` — `type` (enum: logo, banner). Also export constants: `LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024`, `BANNER_MAX_SIZE_BYTES = 5 * 1024 * 1024`, `ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const`

- [X] T010 [P] Implement the library status state machine in `src/features/libraries/services/library-status-machine.ts`. This is a **pure function file** with no side effects and no database access. Export:
  - `VALID_TRANSITIONS`: A `Record<LibraryStatus, LibraryStatus[]>` mapping — `draft → [pending_approval]`, `pending_approval → [active, rejected]`, `active → [suspended, archived]`, `suspended → [active, archived]`, `rejected → [draft]`, `archived → []` (terminal)
  - `canTransition(from: LibraryStatus, to: LibraryStatus): boolean` — Returns true if the transition is in VALID_TRANSITIONS
  - `validateTransition(from: LibraryStatus, to: LibraryStatus): void` — Throws an error with message `"Invalid status transition from '{from}' to '{to}'"` if transition is not allowed
  - `REQUIRES_REASON: LibraryStatus[]` = `["rejected", "suspended"]` — Statuses that require a reason when transitioning TO them
  - Import `LibraryStatus` from `../types`

- [X] T011 Add `requireLibraryOwner(libraryId: string)` function to `src/features/roles/services/authorize.ts`. This function must:
  1. Get the current user via `createClient()` → `supabase.auth.getUser()`
  2. If no user, throw `new Error("UNAUTHORIZED")`
  3. Query `library_staff_memberships` table: `supabase.from("library_staff_memberships").select("library_role").eq("library_id", libraryId).eq("user_id", user.id).maybeSingle()`
  4. If no membership found OR `library_role !== "owner"`, throw `new Error("UNAUTHORIZED")`
  5. Also allow admin/superadmin to pass (check `hasRole(roles, "admin")` or `hasRole(roles, "superadmin")`)
  - Follow the exact same pattern as the existing `requireLibraryStaff` function for code style

- [X] T012 Implement the core library CRUD service in `src/features/libraries/services/library-service.ts`. Start with `"server-only"` import. Import `createClient`, `createServiceRoleClient` from `@/lib/supabase/server`, `logAuditEvent` from `@/features/auth/services/audit-service`, types from `../types`, and `validateTransition` from `./library-status-machine`. Create a `mapLibrary(row)` helper that maps snake_case DB columns to camelCase Library type (follow the exact same pattern as `mapProfile` in `src/features/profiles/services/profile-service.ts`). Export these functions:
  - `createLibrary(input: { name, slug?, description?, contactEmail?, contactPhone?, address?, languages?, ownerId }): Promise<{ success: true; libraryId: string } | { code: string; error: string }>` — Generates slug from name if not provided (lowercase, replace spaces/special chars with hyphens, remove consecutive hyphens). Inserts into `libraries` table with `status: 'draft'`. Creates `library_staff_memberships` entry with `library_role: 'owner'`. Adds `user_roles` entry with `role: 'library_staff'` and `library_id` (only if user doesn't already have one for this library). Creates `library_settings` record with defaults. Calls `record_library_status_change` RPC to log initial status. Calls `logAuditEvent` with action `library_created`.
  - `getLibrary(libraryId: string): Promise<Library | null>` — Fetches by ID, maps with `mapLibrary`
  - `getLibraryBySlug(slug: string): Promise<Library | null>` — Fetches by slug
  - `updateLibrary(libraryId: string, input: Partial<{name, slug, description, contactEmail, contactPhone, address, socialLinks, languages, policies}>): Promise<{ success: true } | { code: string; error: string }>` — If slug is being changed, check uniqueness first. Update only provided fields. Map camelCase input to snake_case columns.
  - `getLibrariesByOwner(ownerId: string): Promise<Library[]>` — Query where `owner_id = ownerId`, map results
  - `getLibrariesByStatus(status: LibraryStatus): Promise<Library[]>` — Query where `status = status`, ordered by `created_at desc`
  - `transitionLibraryStatus(libraryId: string, newStatus: LibraryStatus, changedBy: string, reason?: string): Promise<{ success: true } | { code: string; error: string }>` — Fetch current library, call `validateTransition`, check if reason is required (for reject/suspend), update the `status` column, call `record_library_status_change` RPC, call `logAuditEvent`
  - `getStatusHistory(libraryId: string): Promise<LibraryStatusHistoryEntry[]>` — Query `library_status_history` ordered by `created_at desc`, map results
  - Use `createClient()` for session-scoped queries, `createServiceRoleClient()` for RPC calls to `record_library_status_change`

- [X] T013 Implement library staff service in `src/features/libraries/services/library-staff-service.ts`. Start with `"server-only"`. Export:
  - `getStaffMembers(libraryId: string): Promise<(LibraryStaffMembership & { displayName: string; email: string })[]>` — Join `library_staff_memberships` with `profiles` (for display_name) and `auth.users` (for email via service role). Map results.
  - `addStaffMember(libraryId: string, userId: string, role: LibraryRole, assignedBy: string): Promise<{ success: true } | { code: string; error: string }>` — Insert into `library_staff_memberships`. Also ensure a `user_roles` entry exists with `role: 'library_staff'` and `library_id`. Log audit event.
  - `removeStaffMember(libraryId: string, userId: string): Promise<{ success: true } | { code: string; error: string }>` — Check if user is the last owner (count owners for this library — if user is owner and count === 1, return error `LAST_OWNER`). Delete from `library_staff_memberships`. Log audit event.
  - `promoteToOwner(libraryId: string, userId: string): Promise<{ success: true } | { code: string; error: string }>` — Update `library_role` from `staff` to `owner`. Log audit event.
  - `selfDemoteToStaff(libraryId: string, userId: string): Promise<{ success: true } | { code: string; error: string }>` — Check last-owner guard (same as remove). Update own `library_role` from `owner` to `staff`. Log audit event.
  - `getMembership(libraryId: string, userId: string): Promise<LibraryStaffMembership | null>` — Fetch single membership record

- [X] T014 Implement library settings service in `src/features/libraries/services/library-settings-service.ts`. Start with `"server-only"`. Export:
  - `getLibrarySettings(libraryId: string): Promise<LibrarySettings | null>` — Fetch from `library_settings` where `library_id = libraryId`, map snake_case → camelCase
  - `updateLibrarySettings(libraryId: string, input: { shippingPreferences?, returnPolicy?, operatingHours? }): Promise<{ success: true } | { code: string; error: string }>` — Upsert the settings record (update if exists, insert if not). Map camelCase input → snake_case columns.

**Checkpoint**: Foundation ready — all types, schemas, services, and auth helpers are in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Library Creation and Onboarding (Priority: P1) MVP

**Goal**: A registered user can create a library via a multi-step onboarding wizard, save drafts, resume later, and submit for admin review.

**Independent Test**: Register a user → navigate to "Create Library" → fill out wizard → save as draft → return and resume → submit → verify library shows as "pending_approval" in admin queue.

### Implementation for User Story 1

- [X] T015 [P] [US1] Create the `createLibrary` server action in `src/features/libraries/actions/create-library.ts`. Follow the established action pattern: `"use server"` → get current user via `createClient()` → validate input with `createLibrarySchema` from `../schemas/library` → call `createLibrary()` from `../services/library-service` passing `ownerId: user.id` → return the result. If user is not authenticated, return `{ code: "UNAUTHORIZED", error: "You must be signed in." }`. Handle slug uniqueness errors by returning `{ code: "SLUG_TAKEN", error: "This library URL is already taken." }`.

- [X] T016 [P] [US1] Create the `updateLibrary` server action in `src/features/libraries/actions/update-library.ts`. `"use server"` → get user → call `requireLibraryStaff(input.libraryId)` (catches error → return UNAUTHORIZED) → validate input with `updateLibrarySchema` → call `updateLibrary()` service → return result.

- [X] T017 [P] [US1] Create the `submitLibrary` server action in `src/features/libraries/actions/submit-library.ts`. `"use server"` → get user → call `requireLibraryOwner(input.libraryId)` → validate with `submitLibrarySchema` → fetch the library via `getLibrary()` → validate all required fields are present (name, slug must exist; if any required field is missing return `{ code: "INCOMPLETE", error: "Please complete all required fields before submitting." }`) → check owner's profile status is not "suspended" (fetch profile, check `status !== 'suspended'`, else return `{ code: "OWNER_SUSPENDED", error: "Cannot submit while your account is suspended." }`) → call `transitionLibraryStatus(libraryId, "pending_approval", user.id)` → return result.

- [X] T018 [P] [US1] Create the `resubmitLibrary` server action in `src/features/libraries/actions/resubmit-library.ts`. `"use server"` → get user → `requireLibraryOwner(input.libraryId)` → validate with `resubmitLibrarySchema` → call `transitionLibraryStatus(libraryId, "draft", user.id)` → return result. This moves a rejected library back to draft so the owner can edit and re-submit.

- [X] T019 [P] [US1] Create the `uploadLibraryAsset` server action in `src/features/libraries/actions/upload-library-asset.ts`. Accepts `FormData` with fields: `libraryId` (string), `type` ("logo" | "banner"), `file` (File). `"use server"` → get user → `requireLibraryStaff(libraryId)` → validate `type` with `assetUploadSchema` → validate file MIME type is in `ALLOWED_IMAGE_MIME_TYPES` → validate file size (logo ≤ `LOGO_MAX_SIZE_BYTES`, banner ≤ `BANNER_MAX_SIZE_BYTES`) → determine storage path: `library-assets/${libraryId}/${type}/${type}.${extension}` (use same `getExtension` pattern as `src/features/profiles/services/profile-service.ts` uploadAvatar) → upload to Supabase storage with `upsert: true` → get public URL → update `libraries` table: set `logo_url` or `banner_url` to the public URL → log audit event → return `{ success: true, url: publicUrl }`.

- [X] T020 [US1] Create the `OnboardingWizard` component in `src/features/libraries/components/OnboardingWizard.tsx`. This is a `"use client"` component. Props: `library?: Library` (for resume/editing a draft), `locale: string`. Implementation:
  - Multi-step form with 3 steps: (1) Basic Info — name, slug (auto-generated preview, editable), description; (2) Contact — contactEmail, contactPhone, address, languages (multi-select for en/ar); (3) Review & Submit — summary of all entered data with edit links back to each step
  - Use `useState` for current step, form data, and validation errors
  - Each step validates its own fields using the relevant parts of `createLibrarySchema`
  - "Save Draft" button on every step → calls `createLibrary` action (if new) or `updateLibrary` action (if editing) → shows success toast via `goey-toast`
  - "Next" button validates current step before advancing
  - "Back" button to go to previous step
  - "Submit for Review" button on step 3 → calls `submitLibrary` action → on success, redirect to dashboard with success toast
  - If `library` prop is provided (resume draft), pre-fill all fields from the library data
  - Logo and banner upload using `uploadLibraryAsset` action (file input with preview, accept `image/jpeg,image/png,image/webp`)
  - Slug auto-generation: as user types name, show a preview of the auto-generated slug (lowercase, hyphens). Allow manual slug editing.
  - All labels via `useTranslations("libraries")` from `next-intl`
  - Use Tailwind CSS for styling. Support RTL layout via logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`).

- [X] T021 [US1] Create the `LibraryStatusBadge` component in `src/features/libraries/components/LibraryStatusBadge.tsx`. Props: `status: LibraryStatus`. Renders a styled badge/chip with color-coded background: draft (gray), pending_approval (yellow/amber), active (green), suspended (red), rejected (red/dark), archived (slate/muted). Use translations for the status label text. This is a simple server component (no `"use client"` needed).

- [X] T022 [US1] Create the library creation page at `src/app/[locale]/(dashboard)/dashboard/libraries/new/page.tsx`. This is a server component that:
  - Calls `getCurrentUserWithRoles()` to get the authenticated user
  - Optionally accepts a `?draft=<libraryId>` search param — if present, fetch the draft library via `getLibrary(draftId)` and verify it belongs to the current user and is in `draft` status
  - Renders the `OnboardingWizard` component, passing the draft library (if any) and locale
  - Page title via `getTranslations("libraries")` → `t("createLibrary")`

- [X] T023 [US1] Create the library management overview page at `src/app/[locale]/(dashboard)/dashboard/libraries/[id]/page.tsx`. This server component:
  - Gets current user via `getCurrentUserWithRoles()`
  - Fetches the library via `getLibrary(params.id)`
  - If library not found, call `notFound()`
  - Checks user is a staff member via `getMembership(libraryId, user.id)` — if not a member and not admin/superadmin, redirect to dashboard
  - Displays: library name, status badge (using `LibraryStatusBadge`), description, logo preview, banner preview, contact info, slug/URL
  - If library is in `draft` status, show a "Continue Editing" link to `/dashboard/libraries/new?draft={id}`
  - If library is in `rejected` status, show the rejection reason (from status history) and a "Resubmit" button that calls `resubmitLibrary` action
  - Navigation links to: Settings (`/dashboard/libraries/{id}/settings`), Staff (`/dashboard/libraries/{id}/staff`)
  - All text via translations

- [X] T024 [US1] Add i18n message keys for User Story 1 to both `messages/en.json` and `messages/ar.json`. Add a `"libraries"` namespace with keys for: `createLibrary`, `editLibrary`, `libraryName`, `librarySlug`, `slugPreview`, `description`, `contactEmail`, `contactPhone`, `address`, `languages`, `logo`, `banner`, `uploadLogo`, `uploadBanner`, `saveDraft`, `savedDraft`, `submitForReview`, `submitted`, `pendingApproval`, `step1Title` (Basic Info), `step2Title` (Contact & Details), `step3Title` (Review & Submit), `next`, `back`, `slugTaken`, `incompleteFields`, `resubmit`, `rejectionReason`, `continueEditing`, `status.draft`, `status.pending_approval`, `status.active`, `status.suspended`, `status.rejected`, `status.archived`, `validation.nameRequired`, `validation.nameMinLength`, `validation.nameTooLong`, `validation.invalidSlug`, `validation.invalidEmail`, `validation.fileTooLarge`, `validation.invalidFileType`. Arabic translations must be provided (not placeholders).

- [X] T025 [US1] Update the Sidebar component at `src/components/shared/app-shell/Sidebar.tsx` to add a "My Libraries" navigation link that points to `/dashboard/libraries`. This link should be visible to all authenticated users. Also add a user's library list: fetch libraries by the current user's ownership via a server component wrapper or pass them as props from the dashboard layout.

**Checkpoint**: User Story 1 complete. A user can create a library, save drafts, upload logo/banner, resume editing, and submit for review. The library appears in their dashboard with status tracking.

---

## Phase 4: User Story 2 — Admin Library Approval Queue (Priority: P1)

**Goal**: Admins/superadmins can review pending libraries and approve or reject them with reasons.

**Independent Test**: Submit a library (from US1) → log in as admin → navigate to approval queue → see the pending library → approve it → verify status becomes "active". Repeat with rejection and verify reason is recorded.

### Implementation for User Story 2

- [X] T026 [P] [US2] Create the `approveLibrary` server action in `src/features/libraries/actions/approve-library.ts`. `"use server"` → get user → `requireRole("admin")` → fetch library → check owner's profile status is not "suspended" (if suspended, return `{ code: "OWNER_SUSPENDED", error: "Cannot approve — library owner is suspended." }`) → call `transitionLibraryStatus(libraryId, "active", user.id)` → log audit event with action `library_approved`, targetType `library`, targetId libraryId → return result.

- [X] T027 [P] [US2] Create the `rejectLibrary` server action in `src/features/libraries/actions/reject-library.ts`. `"use server"` → get user → `requireRole("admin")` → validate input with `moderationSchema` (ensure reason is provided) → call `transitionLibraryStatus(libraryId, "rejected", user.id, reason)` → log audit event with action `library_rejected` and metadata `{ reason }` → return result.

- [X] T028 [US2] Create the `ApprovalQueueTable` component in `src/features/libraries/components/ApprovalQueueTable.tsx`. This is a `"use client"` component. Props: `libraries: Library[]`, `locale: string`. Implementation:
  - Renders a table with columns: Library Name, Owner (display name), Submitted Date (formatted from `updatedAt`), Status, Actions
  - If `libraries` is empty, show an empty state message: "No pending libraries to review"
  - Each row has "Approve" and "Reject" buttons
  - "Approve" button calls `approveLibrary` action → on success, show toast and refresh (use `useRouter().refresh()`)
  - "Reject" button opens a modal/dialog with a required `reason` textarea → on submit, calls `rejectLibrary` action → on success, show toast and refresh
  - Show a loading state on buttons during action execution (use `useTransition` or `useState`)
  - All text via `useTranslations("libraries.approvalQueue")`

- [X] T029 [US2] Create the admin approval queue page at `src/app/[locale]/(dashboard)/dashboard/admin/approvals/page.tsx`. Server component:
  - Call `requireRole("admin")` — if unauthorized, redirect
  - Fetch all libraries with status `pending_approval` via `getLibrariesByStatus("pending_approval")`
  - Render the `ApprovalQueueTable` component with the fetched libraries
  - Page title: "Library Approval Queue"
  - All text via translations

- [X] T030 [US2] Add i18n keys for the approval queue to `messages/en.json` and `messages/ar.json` under `"libraries.approvalQueue"` namespace: `title`, `noLibraries`, `approve`, `reject`, `rejectReason`, `rejectReasonPlaceholder`, `rejectReasonRequired`, `approved`, `rejected`, `ownerSuspended`, `libraryName`, `owner`, `submittedDate`, `actions`, `confirmApprove`, `confirmReject`. Provide proper Arabic translations.

- [X] T031 [US2] Update the admin dashboard page at `src/app/[locale]/(dashboard)/dashboard/admin/page.tsx` to replace the placeholder content. Add a link/card to the "Library Approvals" page (`/dashboard/admin/approvals`). Show a count of pending libraries (fetch count via `getLibrariesByStatus("pending_approval").then(l => l.length)`). Only accessible to admin/superadmin (add `requireRole("admin")` check).

**Checkpoint**: User Story 2 complete. Admins can review, approve, and reject library applications. Status changes are recorded in history with reasons.

---

## Phase 5: User Story 3 — Library Profile Management (Priority: P2)

**Goal**: Library owners/staff can edit the library's public profile including uploading images.

**Independent Test**: Create and approve a library → navigate to library profile editor → update description, upload logo, upload banner → verify changes appear on the public storefront (US6).

### Implementation for User Story 3

- [ ] T032 [US3] Create the `LibraryProfileForm` component in `src/features/libraries/components/LibraryProfileForm.tsx`. `"use client"` component. Props: `library: Library`, `membership: LibraryStaffMembership`, `locale: string`. Implementation:
  - Form fields: name, slug (with uniqueness warning), description (textarea), contactEmail, contactPhone, address, socialLinks (dynamic key-value pairs for website, twitter, facebook, instagram), languages (checkboxes for en/ar), policies (textarea or structured editor)
  - Logo upload section: current logo preview, file input (accept jpeg/png/webp, max 2MB), calls `uploadLibraryAsset` action with `type: "logo"`
  - Banner upload section: current banner preview, file input (accept jpeg/png/webp, max 5MB), calls `uploadLibraryAsset` action with `type: "banner"`
  - "Save Changes" button → validates with `updateLibrarySchema` → calls `updateLibrary` action → shows success/error toast
  - Slug change shows a warning: "Changing the URL will affect existing links"
  - RTL support via logical CSS properties
  - All labels via translations

- [ ] T033 [US3] Create a library profile edit page at `src/app/[locale]/(dashboard)/dashboard/libraries/[id]/profile/page.tsx` OR incorporate the profile form into the existing `src/app/[locale]/(dashboard)/dashboard/libraries/[id]/page.tsx`. Server component:
  - Fetch library, verify membership (owner or staff)
  - Fetch membership via `getMembership(libraryId, user.id)`
  - Render `LibraryProfileForm` with library data and membership
  - If user is not a member, show unauthorized message

- [ ] T034 [US3] Add i18n keys for profile management to `messages/en.json` and `messages/ar.json` under `"libraries.profile"` namespace: `editProfile`, `socialLinks`, `website`, `twitter`, `facebook`, `instagram`, `policies`, `saveChanges`, `saved`, `slugWarning`, `uploadLogo`, `uploadBanner`, `removeLogo`, `removeBanner`, `logoRequirements` (JPEG/PNG/WebP, max 2MB), `bannerRequirements` (JPEG/PNG/WebP, max 5MB). Provide proper Arabic translations.

**Checkpoint**: User Story 3 complete. Library profile is fully editable with image uploads.

---

## Phase 6: User Story 4 — Staff Assignment Management (Priority: P2)

**Goal**: Library owners can invite, remove, promote, and demote staff members.

**Independent Test**: As library owner → invite a user by email → user accepts invitation → verify new staff appears in staff list → promote to owner → self-demote → verify role changes. Test last-owner guard.

### Implementation for User Story 4

- [ ] T035 [P] [US4] Create the `manageStaff` server action in `src/features/libraries/actions/manage-staff.ts`. `"use server"` → get user → validate input with `staffManagementSchema`. Based on `action`:
  - `"invite"`: Call `requireLibraryOwner(libraryId)`. Delegate to `sendStaffInvitation` from `@/features/invitations/services/invitation-service` passing `{ email, invitedBy: user.id, libraryId }`. Return the result.
  - `"remove"`: Call `requireLibraryOwner(libraryId)`. Call `removeStaffMember(libraryId, userId)` from the staff service. Return result.
  - `"promote"`: Call `requireLibraryOwner(libraryId)`. Call `promoteToOwner(libraryId, userId)`. Return result.
  - `"demote"`: Verify `userId === user.id` (self-demote only — if not self, return `{ code: "FORBIDDEN", error: "You can only demote yourself." }`). Call `selfDemoteToStaff(libraryId, user.id)`. Return result.

- [ ] T036 [US4] Create the `StaffManagementPanel` component in `src/features/libraries/components/StaffManagementPanel.tsx`. `"use client"` component. Props: `libraryId: string`, `staff: (LibraryStaffMembership & { displayName: string; email: string })[]`, `currentUserId: string`, `isOwner: boolean`, `locale: string`. Implementation:
  - Table/list of staff: name, email, role (owner/staff badge), joined date, actions column
  - If `isOwner` is true, show action buttons:
    - For staff members: "Promote to Owner" button, "Remove" button (with confirmation dialog)
    - For other owners: no action buttons (cannot demote others)
    - For self (if owner): "Demote to Staff" button (with warning about last-owner check)
  - If `isOwner` is false, action column is hidden (staff cannot manage other staff)
  - "Invite Staff" section (only if `isOwner`): email input + "Send Invitation" button → calls `manageStaff` action with `action: "invite"`
  - Show loading states during actions
  - All actions use `manageStaff` server action, refresh page on success
  - All text via translations

- [ ] T037 [US4] Create the staff management page at `src/app/[locale]/(dashboard)/dashboard/libraries/[id]/staff/page.tsx`. Server component:
  - Get current user via `getCurrentUserWithRoles()`
  - Fetch library, verify it exists
  - Fetch membership via `getMembership(libraryId, user.id)` — if not owner and not admin, redirect or show unauthorized
  - Fetch all staff via `getStaffMembers(libraryId)`
  - Render `StaffManagementPanel` with `isOwner: membership?.libraryRole === "owner"`

- [ ] T038 [US4] Add i18n keys for staff management to `messages/en.json` and `messages/ar.json` under `"libraries.staff"` namespace: `title`, `inviteStaff`, `emailPlaceholder`, `sendInvitation`, `invitationSent`, `removeStaff`, `confirmRemove`, `removed`, `promoteToOwner`, `confirmPromote`, `promoted`, `demoteToStaff`, `confirmDemote`, `demoted`, `lastOwnerWarning`, `selfDemoteOnly`, `role`, `owner`, `staffMember`, `joinedDate`, `noStaff`, `actions`. Provide Arabic translations.

**Checkpoint**: User Story 4 complete. Owners can manage their library team with full role lifecycle.

---

## Phase 7: User Story 5 — Library Moderation by Admin/Superadmin (Priority: P2)

**Goal**: Admins can suspend/reactivate libraries; superadmins can archive. All actions create audit trail entries.

**Independent Test**: As admin → suspend an active library with reason → verify it's hidden from public → reactivate it → verify it's visible again. As superadmin → archive a library → verify it's removed from all views.

### Implementation for User Story 5

- [ ] T039 [P] [US5] Create the `suspendLibrary` server action in `src/features/libraries/actions/suspend-library.ts`. `"use server"` → get user → `requireRole("admin")` → validate with `moderationSchema` (ensure reason provided) → call `transitionLibraryStatus(libraryId, "suspended", user.id, reason)` → log audit event `library_suspended` with metadata `{ reason }` → return result.

- [ ] T040 [P] [US5] Create the `reactivateLibrary` server action in `src/features/libraries/actions/reactivate-library.ts`. `"use server"` → get user → `requireRole("admin")` → call `transitionLibraryStatus(libraryId, "active", user.id)` → log audit event `library_reactivated` → return result.

- [ ] T041 [P] [US5] Create the `archiveLibrary` server action in `src/features/libraries/actions/archive-library.ts`. `"use server"` → get user → `requireSuperadmin()` → call `transitionLibraryStatus(libraryId, "archived", user.id)` → log audit event `library_archived` → return result.

- [ ] T042 [US5] Create the `ModerationPanel` component in `src/features/libraries/components/ModerationPanel.tsx`. `"use client"` component. Props: `library: Library`, `isAdmin: boolean`, `isSuperadmin: boolean`, `statusHistory: LibraryStatusHistoryEntry[]`, `locale: string`. Implementation:
  - Shows the library's current status with `LibraryStatusBadge`
  - Status history timeline: chronological list of all status changes with date, actor, previous→new status, and reason (if any)
  - Action buttons based on current status and user role:
    - If `active` + admin: "Suspend" button (opens reason dialog)
    - If `suspended` + admin: "Reactivate" button
    - If (`active` or `suspended`) + superadmin: "Archive" button (with strong confirmation)
  - All actions call respective server actions, refresh on success
  - Show toast notifications for success/failure
  - All text via translations

- [ ] T043 [US5] Integrate the `ModerationPanel` into the library management page (`src/app/[locale]/(dashboard)/dashboard/libraries/[id]/page.tsx`). When the current user is an admin or superadmin:
  - Fetch status history via `getStatusHistory(libraryId)`
  - Render `ModerationPanel` below or alongside the library info
  - Determine `isAdmin` and `isSuperadmin` from the user's roles

- [ ] T044 [US5] Add i18n keys for moderation to `messages/en.json` and `messages/ar.json` under `"libraries.moderation"` namespace: `title`, `suspend`, `suspendReason`, `suspendReasonPlaceholder`, `suspended`, `reactivate`, `reactivated`, `archive`, `archiveWarning`, `archived`, `statusHistory`, `changedBy`, `reason`, `noHistory`, `confirmSuspend`, `confirmReactivate`, `confirmArchive`. Provide Arabic translations.

**Checkpoint**: User Story 5 complete. Full moderation lifecycle with audit trail.

---

## Phase 8: User Story 6 — Public Library Storefront Page (Priority: P3)

**Goal**: Any visitor can view an active library's public page. Non-active libraries show appropriate messages.

**Independent Test**: Navigate to `/libraries/{slug}` for an active library → verify all profile info is displayed. Navigate to a suspended library → see "unavailable" message. Navigate to non-existent slug → see 404.

### Implementation for User Story 6

- [ ] T045 [US6] Create the `LibraryCard` component in `src/features/libraries/components/LibraryCard.tsx`. Server component. Props: `library: Library`, `locale: string`. Renders a card with: logo (or placeholder), name, short description (truncated), languages, and a link to the public storefront page (`/libraries/{slug}`). Used for listing libraries in search results or directories (future use).

- [ ] T046 [US6] Create the public library storefront page at `src/app/[locale]/(public)/libraries/[slug]/page.tsx`. Server component:
  - Fetch library by slug via `getLibraryBySlug(params.slug)`
  - If library not found → call `notFound()` which renders Next.js 404
  - If library status is `suspended` → render a styled "This library is currently unavailable" message (NOT a 404, a distinct page). Include library name if available.
  - If library status is `draft`, `pending_approval`, `rejected`, or `archived` → call `notFound()` (these should not be publicly discoverable)
  - If library status is `active` → render the full storefront:
    - Banner image (full-width hero, fallback to a colored gradient)
    - Logo (overlapping the banner bottom, circular crop)
    - Library name (h1)
    - Description
    - Contact info (email, phone, address) if provided
    - Social links (with icons/labels)
    - Supported languages
    - Policies section
    - Placeholder section: "Books coming soon" (catalog is Phase 3)
  - Use `getTranslations("libraries.storefront")` for all labels
  - RTL-aware layout
  - Generate page metadata for SEO: title = library name, description = library description

- [ ] T047 [US6] Add i18n keys for the storefront to `messages/en.json` and `messages/ar.json` under `"libraries.storefront"` namespace: `unavailable`, `unavailableDescription`, `contactInfo`, `email`, `phone`, `address`, `socialLinks`, `supportedLanguages`, `policies`, `booksComing`, `booksComingDescription`, `notFound`, `notFoundDescription`. Provide Arabic translations.

- [ ] T048 [US6] Create a `(public)` layout if it doesn't exist, or verify that the existing public layout at `src/app/[locale]/(public)/layout.tsx` supports nested routes. The storefront page should use a public layout (header/footer without dashboard sidebar). If no public layout exists, create one with a minimal header (app name, locale switcher, theme toggle) and footer.

**Checkpoint**: User Story 6 complete. Public storefront pages work for all library statuses.

---

## Phase 9: User Story 7 — Library Settings Management (Priority: P3)

**Goal**: Library owners can configure operational settings (shipping, return policies, operating hours).

**Independent Test**: As library owner → navigate to library settings → update shipping preferences and return policy → save → verify settings persist on page reload.

### Implementation for User Story 7

- [ ] T049 [P] [US7] Create the `updateLibrarySettings` server action in `src/features/libraries/actions/update-library-settings.ts`. `"use server"` → get user → `requireLibraryOwner(input.libraryId)` → validate with `librarySettingsSchema` → call `updateLibrarySettings()` from the settings service → return result.

- [ ] T050 [US7] Create the `LibrarySettingsForm` component in `src/features/libraries/components/LibrarySettingsForm.tsx`. `"use client"` component. Props: `libraryId: string`, `settings: LibrarySettings | null`, `locale: string`. Implementation:
  - Form sections:
    - Shipping Preferences: structured form or JSON editor for shipping options (informational for this phase)
    - Return Policy: textarea (max 5000 chars) for free-text return policy
    - Operating Hours: structured form for weekly schedule (day → open/close times)
  - "Save Settings" button → calls `updateLibrarySettings` action → shows toast on success/error
  - Pre-fill from `settings` prop
  - All labels via translations
  - RTL-aware

- [ ] T051 [US7] Create the library settings page at `src/app/[locale]/(dashboard)/dashboard/libraries/[id]/settings/page.tsx`. Server component:
  - Get current user, fetch library, verify ownership (call `requireLibraryOwner` or check membership)
  - Fetch settings via `getLibrarySettings(libraryId)`
  - Render `LibrarySettingsForm`
  - If user is staff (not owner), show "Owner access required" message

- [ ] T052 [US7] Add i18n keys for settings to `messages/en.json` and `messages/ar.json` under `"libraries.settings"` namespace: `title`, `shippingPreferences`, `returnPolicy`, `returnPolicyPlaceholder`, `operatingHours`, `saveSettings`, `saved`, `ownerOnly`, `day.monday` through `day.sunday`, `openTime`, `closeTime`, `closed`. Provide Arabic translations.

**Checkpoint**: User Story 7 complete. Library owners can configure all operational settings.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Integration improvements, navigation updates, and validation across all stories.

- [X] T053 [P] Update the dashboard layout at `src/app/[locale]/(dashboard)/layout.tsx` to fetch the current user's library memberships (via `getStaffMembers` or a new query) and pass them to the Sidebar for displaying the user's libraries in the navigation.

- [X] T054 [P] Create a "My Libraries" listing page at `src/app/[locale]/(dashboard)/dashboard/libraries/page.tsx` (note: this is the index page, NOT `new`). Server component that:
  - Fetches all libraries where the user is a staff member or owner (join `library_staff_memberships` with `libraries`)
  - Displays a list/grid of library cards with: name, status badge, role (owner/staff), and "Manage" link
  - Shows a "Create New Library" CTA button linking to `/dashboard/libraries/new`
  - Empty state if user has no libraries

- [X] T055 [P] Add i18n keys for the "My Libraries" page to `messages/en.json` and `messages/ar.json` under `"libraries.myLibraries"` namespace: `title`, `createNew`, `manage`, `noLibraries`, `noLibrariesDescription`, `yourRole`, `owner`, `staff`.

- [ ] T056 Verify all RLS policies work correctly by manual testing: (a) unauthenticated user can only see active libraries, (b) library staff can see their own library regardless of status, (c) admin/superadmin can see all libraries, (d) only owners can modify settings and manage staff, (e) only admin can approve/reject, (f) only superadmin can archive. Fix any policy issues found.

- [ ] T057 Run quickstart.md validation: Follow the steps in `specs/003-library-vendor-onboarding/quickstart.md` end-to-end to verify the full implementation matches the specification. Fix any discrepancies found.

- [ ] T058 Run `npx tsc --noEmit` to verify there are no TypeScript errors across all new files. Fix any type errors.

- [ ] T059 Run the existing linter/formatter (`npm run lint` and/or `npm run format`) on all new files. Fix any issues.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. Tasks T001-T005 must run sequentially (migrations depend on each other). T006 runs after all migrations. T007 is parallel.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion (especially T006 for generated types). T008, T009, T010 are parallel. T011 is parallel. T012 depends on T008, T009, T010. T013 depends on T008. T014 depends on T008.
- **Phase 3-9 (User Stories)**: All depend on Phase 2 completion.
- **Phase 10 (Polish)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependencies on other stories. **This is the MVP.**
- **US2 (P1)**: Can start after Phase 2. Benefits from US1 being done (to have pending libraries to test with), but is independently implementable.
- **US3 (P2)**: Can start after Phase 2. Uses the library that US1 creates and US2 approves, but the profile form works on any library in any status.
- **US4 (P2)**: Can start after Phase 2. Independent of US3. Leverages the existing invitation system from Phase 1.
- **US5 (P2)**: Can start after Phase 2. Independent of US3/US4. Works on approved (active) libraries.
- **US6 (P3)**: Can start after Phase 2. The storefront renders whatever profile data exists, so it benefits from US3 being complete but is not blocked by it.
- **US7 (P3)**: Can start after Phase 2. Fully independent of other stories.

### Within Each User Story

1. Server actions (marked [P]) can be created in parallel
2. Components depend on their corresponding actions being available
3. Pages depend on components
4. i18n keys should be added before or alongside component work

### Parallel Opportunities

**After Phase 2 completes, these can run simultaneously**:
- US1 actions (T015-T019) are all [P] — create them in parallel
- US2 actions (T026-T027) are [P]
- US4 action (T035) and US5 actions (T039-T041) are [P]
- All i18n tasks across stories are [P] with each other

**Cross-story parallelism** (with multiple developers):
- Developer A: US1 (Library Creation) + US2 (Approval Queue) — these form the critical path
- Developer B: US3 (Profile Management) + US6 (Storefront)
- Developer C: US4 (Staff Management) + US5 (Moderation) + US7 (Settings)

---

## Parallel Example: Phase 2 Foundational

```text
# These 3 tasks have NO dependencies on each other — run in parallel:
T008: Define TypeScript types in src/features/libraries/types/index.ts
T009: Create Zod schemas in src/features/libraries/schemas/library.ts
T010: Implement status machine in src/features/libraries/services/library-status-machine.ts

# T011 has NO dependency on T008-T010 — can also run in parallel:
T011: Add requireLibraryOwner to src/features/roles/services/authorize.ts

# T012 depends on T008 + T009 + T010 — wait for all three:
T012: Implement library-service.ts (uses types, schemas, and status machine)

# T013 and T014 depend on T008 — can run in parallel with each other after T008:
T013: Implement library-staff-service.ts
T014: Implement library-settings-service.ts
```

## Parallel Example: User Story 1

```text
# All US1 actions can be created in parallel (different files):
T015: createLibrary action
T016: updateLibrary action
T017: submitLibrary action
T018: resubmitLibrary action
T019: uploadLibraryAsset action

# Components depend on actions being available:
T020: OnboardingWizard (uses T015, T016, T17, T019)
T021: LibraryStatusBadge (no action dependency)

# Pages depend on components:
T022: libraries/new page (uses T020)
T023: libraries/[id] page (uses T021)

# i18n can be done alongside or before components:
T024: Add en/ar translation keys
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (migrations + types)
2. Complete Phase 2: Foundational (services + auth)
3. Complete Phase 3: User Story 1 — Library Creation & Onboarding
4. Complete Phase 4: User Story 2 — Admin Approval Queue
5. **STOP and VALIDATE**: Test end-to-end: create library → submit → admin approves → library is active
6. This is a deployable MVP.

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → **MVP** (create + approve libraries)
3. US3 → Profile editing
4. US4 → Staff management
5. US5 → Moderation controls
6. US6 → Public storefront
7. US7 → Settings configuration
8. Each story adds value without breaking previous stories

### Single Developer Strategy (Recommended)

Follow phases sequentially: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10. Within each phase, parallelize tasks marked [P] if possible. Commit after each completed task or logical group.

---

## Notes

- [P] tasks = different files, safe to implement in parallel
- [Story] label maps task to specific user story for traceability
- All server actions follow: `"use server"` → auth → validate → service → result
- All services follow: `"server-only"` → typed input/output → snake_case↔camelCase mapping
- All components use `next-intl` for translations — never hardcode user-facing strings
- RTL support: use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`) not `ml-`, `mr-`, `pl-`, `pr-`, `left`, `right`
- Before writing Next.js code, check `node_modules/next/dist/docs/` for current API usage
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
