# Implementation Plan: Library Vendor Onboarding and Store Management

**Branch**: `003-library-vendor-onboarding` | **Date**: 2026-04-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-library-vendor-onboarding/spec.md`

## Summary

Build the library vendor lifecycle on top of the existing auth/roles foundation: expand the `libraries` stub table into a full-featured entity with status machine, create library staff memberships with tiered owner/staff permissions, add an onboarding wizard with saveable drafts, admin approval queue, library profile management with image uploads, moderation controls with audit trail, public storefront pages, and library-level operational settings. All new tables enforce RLS policies using the existing `authorize()` and `authorize_library()` functions.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Supabase JS v2, Zod 4, next-intl, next-themes, goey-toast, Radix UI, Tailwind CSS
**Storage**: Supabase PostgreSQL + Supabase Storage (new `library-assets` bucket)
**Testing**: Vitest (unit/integration), Playwright (e2e)
**Target Platform**: Web (desktop + mobile responsive), SSR
**Project Type**: Multi-vendor marketplace web application
**Performance Goals**: Storefront pages < 3s load, profile updates < 5s save-to-display
**Constraints**: All authorization via Supabase RLS; existing `authorize()` and `authorize_library()` functions; domain-driven modular architecture; Arabic/English + RTL/LTR from day one
**Scale/Scope**: 1,000+ concurrent active libraries, ~15 new source files, 4 new database migrations, 1 new storage bucket

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain-Driven Modular Architecture | PASS | New `src/features/libraries/` domain module with models, services, types, schemas, components, actions |
| II. SOLID & Clean Code | PASS | Service layer separated from actions; repository pattern for DB access; small focused functions |
| III. Type Safety First | PASS | Zod schemas for all form inputs and server action boundaries; generated Supabase types updated; strict mode |
| IV. Security by Design | PASS | RLS policies on all new tables; `authorize()` and `authorize_library()` for row-level checks; server-side role validation in all actions; library-assets bucket with scoped policies |
| V. Separation of Concerns | PASS | UI components → actions → services → Supabase. No raw queries in pages/components |
| VI. i18n & Accessibility | PASS | All strings via next-intl; logical CSS properties; RTL support; semantic HTML; keyboard accessible |
| VII. Realtime with Durable Persistence | N/A | No realtime features in this phase |
| VIII. Migration-Safe Incremental Delivery | PASS | Additive migrations only; existing `libraries` stub expanded non-destructively; new tables; no breaking changes to Phase 1 schema |

## Project Structure

### Documentation (this feature)

```text
specs/003-library-vendor-onboarding/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── server-actions.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── features/
│   └── libraries/
│       ├── actions/
│       │   ├── create-library.ts
│       │   ├── update-library.ts
│       │   ├── submit-library.ts
│       │   ├── approve-library.ts
│       │   ├── reject-library.ts
│       │   ├── suspend-library.ts
│       │   ├── reactivate-library.ts
│       │   ├── archive-library.ts
│       │   ├── update-library-settings.ts
│       │   ├── upload-library-asset.ts
│       │   ├── manage-staff.ts
│       │   └── resubmit-library.ts
│       ├── components/
│       │   ├── OnboardingWizard.tsx
│       │   ├── LibraryProfileForm.tsx
│       │   ├── LibrarySettingsForm.tsx
│       │   ├── StaffManagementPanel.tsx
│       │   ├── ApprovalQueueTable.tsx
│       │   ├── LibraryStatusBadge.tsx
│       │   ├── LibraryCard.tsx
│       │   └── ModerationPanel.tsx
│       ├── schemas/
│       │   └── library.ts
│       ├── services/
│       │   ├── library-service.ts
│       │   ├── library-status-machine.ts
│       │   ├── library-staff-service.ts
│       │   └── library-settings-service.ts
│       └── types/
│           └── index.ts
├── app/
│   └── [locale]/
│       ├── (dashboard)/
│       │   └── dashboard/
│       │       ├── libraries/
│       │       │   ├── new/
│       │       │   │   └── page.tsx
│       │       │   └── [id]/
│       │       │       ├── page.tsx
│       │       │       ├── settings/
│       │       │       │   └── page.tsx
│       │       │       └── staff/
│       │       │           └── page.tsx
│       │       └── admin/
│       │           └── approvals/
│       │               └── page.tsx
│       └── (public)/
│           └── libraries/
│               └── [slug]/
│                   └── page.tsx

supabase/
└── migrations/
    ├── 20260426100000_expand_libraries_table.sql
    ├── 20260426100001_create_library_status_history.sql
    ├── 20260426100002_create_library_staff_memberships.sql
    ├── 20260426100003_create_library_settings.sql
    └── 20260426100004_create_library_assets_bucket.sql
```

**Structure Decision**: New `src/features/libraries/` domain module following the established pattern from `src/features/auth/`, `src/features/profiles/`, `src/features/invitations/`, and `src/features/roles/`. All library-related logic is self-contained within this module. New routes extend the existing `(dashboard)` and `(public)` route groups.

## Complexity Tracking

No constitution violations to justify. All design decisions align with established principles and patterns.
