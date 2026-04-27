# Research: Library Vendor Onboarding and Store Management

**Feature**: 003-library-vendor-onboarding
**Date**: 2026-04-26

## R1: Expanding the Libraries Stub Table

**Decision**: Alter the existing `libraries` table (currently only `id`, `name`, `created_at`) by adding columns rather than dropping and recreating. This preserves existing foreign key references from `user_roles` and `staff_invitations`.

**Rationale**: The stub table already has FK constraints from `user_roles.library_id` and `staff_invitations.library_id`. Dropping would cascade-delete those references. Adding columns is the migration-safe, additive approach required by Constitution Principle VIII.

**Alternatives considered**:
- Drop and recreate: Would break Phase 1 constraints and require re-creating FKs. Rejected.
- Create a separate `library_profiles` table: Adds unnecessary join complexity. The stub is minimal enough that expanding it is cleaner.

## R2: Library Status State Machine

**Decision**: Implement status as a `text` column with a `CHECK` constraint for valid values, and enforce transitions in the application service layer (not via database triggers).

**Rationale**: The transition map (draft → pending_approval → active/rejected; active ↔ suspended; active/suspended → archived; rejected → draft) is business logic that benefits from clear error messages and testability. A service-layer state machine with an explicit transition map is easier to test and modify than database triggers.

**Alternatives considered**:
- PostgreSQL enum type: Harder to add new statuses in future without migration gymnastics. Rejected.
- Database trigger enforcement: Less testable, harder to provide clear error messages. Rejected.
- No enforcement (trust the app): Violates Constitution Principle IV (Security by Design). Rejected.

## R3: Library Staff Membership vs Existing user_roles

**Decision**: Create a new `library_staff_memberships` table with a `library_role` column (`owner` or `staff`) instead of adding library-internal roles to the existing `user_roles` table.

**Rationale**: The existing `user_roles` table tracks platform-level roles (`user`, `library_staff`, `admin`, `superadmin`). Library-internal permissions (owner vs staff) are a separate domain concern. Mixing them would violate separation of concerns and complicate RLS policies. The new table handles library-scoped roles while `user_roles` continues to handle platform-wide role checks.

**Alternatives considered**:
- Add a `library_role` column to `user_roles`: Mixes platform and library concerns. Rejected.
- Use a JSON metadata column on `user_roles`: Loses queryability and constraint enforcement. Rejected.

## R4: Storage Bucket for Library Assets

**Decision**: Create a single `library-assets` bucket (public) with folder-based organization: `{library_id}/logo/` and `{library_id}/banner/`. RLS policies restrict uploads to authorized library staff.

**Rationale**: Library logos and banners are public-facing images that need to be served without signed URLs. A single bucket with folder-based organization keeps management simple. RLS policies tied to `authorize_library()` ensure only authorized staff can upload/modify.

**Alternatives considered**:
- Two separate buckets (logos, banners): Unnecessary complexity for closely related assets. Rejected.
- Private bucket with signed URLs: Logos and banners are public content; signed URLs add latency and complexity. Rejected.

## R5: Onboarding Wizard Save/Resume Pattern

**Decision**: Use the library record itself in `draft` status as the persistence mechanism for partial onboarding. The wizard saves to the `libraries` table on each step, and the final submit action transitions status to `pending_approval`.

**Rationale**: This avoids a separate "draft" storage mechanism and keeps the data model simple. The wizard writes to the same columns that the profile editor uses later. Validation for submission completeness happens in the submit action, not on individual saves.

**Alternatives considered**:
- Separate `library_drafts` table: Adds migration and merge complexity. Rejected.
- Local storage / client-side persistence: Lost on device switch; not durable. Rejected.

## R6: Notification Strategy for Status Changes

**Decision**: Use the existing `audit_logs` table to record status changes and add in-app notification stubs. The full notification system (Phase 9) will consume these events later. For this phase, status changes trigger a toast notification for the acting user and the audit log entry serves as the durable record.

**Rationale**: Phase 9 will build the formal notification system with follow engine. Building a partial notification system now would create throwaway code. The audit log already captures all the events that notifications will need.

**Alternatives considered**:
- Build a minimal notification table now: Would be replaced or heavily modified by Phase 9. Rejected.
- Email notifications: Out of scope for this phase per spec assumptions. Deferred.

## R7: Slug Generation and Uniqueness

**Decision**: Auto-generate slug from library name using a transliteration + slugify pipeline. Arabic names get transliterated to Latin characters. Add a unique constraint on the `slug` column. Allow owner customization during creation and later via settings.

**Rationale**: Supporting Arabic library names requires transliteration for URL-safe slugs. A unique constraint at the database level prevents race conditions. The slug is the primary public identifier for library URLs.

**Alternatives considered**:
- UUID-based URLs only: Poor SEO and user experience. Rejected.
- Allow non-Latin slugs: Browser compatibility and linking issues. Rejected.

## R8: Tiered Permission Enforcement Pattern

**Decision**: Implement a `requireLibraryOwner(libraryId)` helper alongside the existing `requireLibraryStaff(libraryId)`. Actions that require owner privileges (staff management, settings, promotion) use `requireLibraryOwner`. Actions available to both roles (profile editing, catalog management) use `requireLibraryStaff`. Both check against the new `library_staff_memberships` table.

**Rationale**: Follows the existing pattern from `authorize.ts` with `requireRole()` and `requireLibraryStaff()`. Adding `requireLibraryOwner()` extends rather than modifies the authorization framework.

**Alternatives considered**:
- Single permission check with role parameter: Less readable, more error-prone. Rejected.
- Client-side role checks only: Violates Constitution Principle IV. Rejected.
