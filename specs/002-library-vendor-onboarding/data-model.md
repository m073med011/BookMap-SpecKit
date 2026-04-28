# Data Model: Library Vendor Onboarding and Store Management

**Feature**: 003-library-vendor-onboarding
**Date**: 2026-04-26

## Entity Relationship Overview

```
profiles (Phase 1)          user_roles (Phase 1)
    │                            │
    │ owner_id                   │ library_id (existing FK)
    ▼                            ▼
┌──────────────────────────────────────────┐
│              libraries                    │
│  (expanded from stub)                     │
│  PK: id (uuid)                           │
│  UNIQUE: slug                            │
└──────────┬──────────┬──────────┬─────────┘
           │          │          │
           ▼          ▼          ▼
   library_status  library_staff  library_settings
   _history        _memberships
```

## Table: libraries (ALTER — expand existing stub)

The existing stub has: `id`, `name`, `created_at`. This migration adds new columns.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | **Existing** |
| name | text | NOT NULL | **Existing** |
| created_at | timestamptz | NOT NULL, default now() | **Existing** |
| slug | text | NOT NULL, UNIQUE | URL-safe identifier; auto-generated from name, customizable |
| description | text | NULL | Library description, supports bilingual content |
| logo_url | text | NULL | Storage reference to logo image |
| banner_url | text | NULL | Storage reference to banner/cover image |
| address | text | NULL | Physical address |
| contact_email | text | NULL | Contact email for the library |
| contact_phone | text | NULL | Contact phone number |
| social_links | jsonb | NOT NULL, default '{}' | Object with keys like `website`, `twitter`, `facebook`, `instagram` |
| languages | text[] | NOT NULL, default '{en}' | Supported languages for the library |
| policies | jsonb | NOT NULL, default '{}' | Store policies (return, shipping, etc.) as structured JSON |
| status | text | NOT NULL, default 'draft', CHECK in valid values | One of: draft, pending_approval, active, suspended, rejected, archived |
| owner_id | uuid | NOT NULL, FK → auth.users(id) | User who created the library |
| updated_at | timestamptz | NOT NULL, default now() | Auto-updated on modification |

**Indexes**:
- `libraries_slug_unique_idx` — UNIQUE on `slug`
- `libraries_status_idx` — on `status` (for approval queue filtering)
- `libraries_owner_id_idx` — on `owner_id`

**Valid status values**: `draft`, `pending_approval`, `active`, `suspended`, `rejected`, `archived`

**Status Transition Map** (enforced in application layer):

| From | Allowed To |
|------|-----------|
| draft | pending_approval |
| pending_approval | active, rejected |
| active | suspended, archived |
| suspended | active, archived |
| rejected | draft |

## Table: library_status_history (NEW)

Immutable audit log of all library status transitions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| library_id | uuid | NOT NULL, FK → libraries(id) ON DELETE CASCADE | |
| previous_status | text | NULL | NULL for initial creation |
| new_status | text | NOT NULL | |
| reason | text | NULL | Required for rejection and suspension |
| changed_by | uuid | NOT NULL, FK → auth.users(id) | The user who triggered the change |
| created_at | timestamptz | NOT NULL, default now() | |

**Indexes**:
- `library_status_history_library_id_idx` — on `library_id`
- `library_status_history_created_at_idx` — on `created_at` (for chronological queries)

## Table: library_staff_memberships (NEW)

Links users to libraries with library-scoped roles (owner or staff).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| library_id | uuid | NOT NULL, FK → libraries(id) ON DELETE CASCADE | |
| user_id | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| library_role | text | NOT NULL, CHECK in ('owner', 'staff') | Library-internal role |
| assigned_by | uuid | NULL, FK → auth.users(id) | NULL for initial creator |
| created_at | timestamptz | NOT NULL, default now() | |

**Indexes**:
- `library_staff_memberships_unique_idx` — UNIQUE on `(library_id, user_id)`
- `library_staff_memberships_user_id_idx` — on `user_id` (for "my libraries" lookup)

**Constraints**:
- A user can only have one membership per library
- The `library_role` determines permission scope (enforced in application layer)

## Table: library_settings (NEW)

Library-scoped operational configuration.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| library_id | uuid | NOT NULL, UNIQUE, FK → libraries(id) ON DELETE CASCADE | One settings record per library |
| shipping_preferences | jsonb | NOT NULL, default '{}' | Informational for this phase; consumed by Phase 6 |
| return_policy | text | NULL | Free-text return policy |
| operating_hours | jsonb | NOT NULL, default '{}' | Structured operating hours |
| custom_settings | jsonb | NOT NULL, default '{}' | Extensible key-value settings |
| updated_at | timestamptz | NOT NULL, default now() | |

**Indexes**:
- `library_settings_library_id_unique_idx` — UNIQUE on `library_id`

## Storage: library-assets bucket (NEW)

**Bucket**: `library-assets` (public)

**Folder structure**:
```
library-assets/
└── {library_id}/
    ├── logo/
    │   └── {filename}.{ext}
    └── banner/
        └── {filename}.{ext}
```

**RLS Policies**:
- SELECT: Public (anyone can read — logos and banners are public)
- INSERT: Authenticated users who are staff/owner of the library (checked via `authorize_library('library_staff', library_id)`)
- UPDATE: Same as INSERT
- DELETE: Library owners or admins/superadmins

**File constraints** (enforced in application layer + bucket settings):
- Logo: JPEG, PNG, WebP — max 2 MB
- Banner: JPEG, PNG, WebP — max 5 MB

## RLS Policy Summary

### libraries table

| Operation | Policy |
|-----------|--------|
| SELECT (public view) | `status = 'active'` for anonymous/authenticated; staff and admins see all |
| SELECT (management) | Owner/staff of library OR admin/superadmin |
| INSERT | Any authenticated user (creates draft) |
| UPDATE | Owner/staff of library for profile fields; admin/superadmin for status fields |
| DELETE | Superadmin only |

### library_status_history table

| Operation | Policy |
|-----------|--------|
| SELECT | Owner/staff of library OR admin/superadmin |
| INSERT | System-level (via service role or security definer function) |

### library_staff_memberships table

| Operation | Policy |
|-----------|--------|
| SELECT | Members of the library OR admin/superadmin |
| INSERT | Library owner OR admin/superadmin |
| UPDATE | Library owner (for promotions) OR self (for self-demotion) |
| DELETE | Library owner OR admin/superadmin |

### library_settings table

| Operation | Policy |
|-----------|--------|
| SELECT | Owner/staff of library OR admin/superadmin |
| INSERT | Library owner |
| UPDATE | Library owner |

## Validation Rules (Zod Schemas)

### Library Creation Schema
- `name`: string, min 2, max 200
- `slug`: string, regex `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, min 2, max 100, optional (auto-generated if absent)
- `description`: string, max 5000, optional
- `contact_email`: email, optional
- `contact_phone`: string, max 30, optional
- `address`: string, max 500, optional
- `languages`: array of `'en' | 'ar'`, min 1, default `['en']`

### Library Update Schema
- Same as creation but all fields optional
- `slug` change triggers uniqueness check

### Library Settings Schema
- `shipping_preferences`: object, optional
- `return_policy`: string, max 5000, optional
- `operating_hours`: object, optional

### Library Asset Upload Schema
- `type`: enum `'logo' | 'banner'`
- `file`: File, validated for MIME type and size in action

### Staff Management Schema
- `action`: enum `'invite' | 'remove' | 'promote' | 'demote'`
- `user_id`: uuid (for remove/promote/demote)
- `email`: email (for invite)

### Moderation Schema
- `action`: enum `'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive'`
- `reason`: string, required for reject/suspend, max 1000
