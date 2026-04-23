# Data Model: Authentication, Authorization, Roles, and Profiles

**Date**: 2026-04-23
**Branch**: `002-auth-roles-profiles`

## Overview

Phase 1 introduces the identity and access layer. All tables live in the `public` schema and reference `auth.users` (managed by Supabase Auth). RLS is enabled on every table.

## Entity Relationship Diagram (textual)

```
auth.users (Supabase-managed)
  ├── 1:1 ── profiles
  ├── 1:N ── user_roles
  └── 1:N ── audit_logs (as actor)

user_roles
  ├── N:1 ── profiles (via user_id)
  └── N:1 ── libraries (via library_id, nullable)

staff_invitations
  ├── N:1 ── libraries (via library_id)
  └── N:1 ── profiles (via invited_by)

libraries (stub — minimal for Phase 1, expanded in Phase 2)
```

## Tables

### profiles

Stores user profile information. Auto-created via database trigger on `auth.users` insert.

| Column           | Type                     | Constraints                            | Description                              |
| ---------------- | ------------------------ | -------------------------------------- | ---------------------------------------- |
| id               | uuid                     | PK, FK → auth.users(id) ON DELETE CASCADE | Matches Supabase auth user ID            |
| display_name     | text                     | NOT NULL, max 100 chars                | User's chosen display name               |
| bio              | text                     | NULL, max 500 chars                    | Short user biography                     |
| preferred_locale | text                     | NOT NULL, DEFAULT 'en', CHECK IN ('en','ar') | User's preferred interface language      |
| avatar_url       | text                     | NULL                                   | URL to avatar in storage bucket          |
| status           | text                     | NOT NULL, DEFAULT 'active', CHECK IN ('active','suspended') | Account status                           |
| created_at       | timestamptz              | NOT NULL, DEFAULT now()                | Record creation timestamp                |
| updated_at       | timestamptz              | NOT NULL, DEFAULT now()                | Last modification timestamp              |

**Indexes**: PK on `id`
**Trigger**: `updated_at` auto-updated on row modification via `moddatetime` extension

**RLS policies**:
- SELECT: Users can read any profile (public data for chat, reviews)
- UPDATE: Users can update only their own profile (`auth.uid() = id`)
- INSERT: Via trigger only (service role)
- DELETE: Not allowed

### app_roles (enum-like reference table)

Defines available roles in the system. Seeded at migration time.

| Column      | Type | Constraints        | Description              |
| ----------- | ---- | ------------------ | ------------------------ |
| id          | text | PK                 | Role identifier          |
| description | text | NOT NULL           | Human-readable description |

**Seed data**:
- `user` — Registered platform user
- `library_staff` — Staff member of a library
- `admin` — Platform administrator
- `superadmin` — Full platform governance

**RLS policies**:
- SELECT: All authenticated users can read
- INSERT/UPDATE/DELETE: Service role only (not user-modifiable)

### user_roles

Links users to their assigned roles. A user can have multiple roles. Staff roles are scoped to a specific library.

| Column     | Type        | Constraints                                    | Description                              |
| ---------- | ----------- | ---------------------------------------------- | ---------------------------------------- |
| id         | uuid        | PK, DEFAULT gen_random_uuid()                  | Record ID                                |
| user_id    | uuid        | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | The user                                 |
| role       | text        | NOT NULL, FK → app_roles(id)                   | Assigned role                            |
| library_id | uuid        | NULL, FK → libraries(id) ON DELETE CASCADE     | Scoped library (required for library_staff, NULL for others) |
| assigned_by| uuid        | NULL, FK → auth.users(id)                      | Who assigned this role                   |
| assigned_at| timestamptz | NOT NULL, DEFAULT now()                        | When the role was assigned               |

**Unique constraint**: `(user_id, role, library_id)` — prevents duplicate assignments
**Check constraint**: `role = 'library_staff' AND library_id IS NOT NULL` OR `role != 'library_staff' AND library_id IS NULL`

**Indexes**:
- PK on `id`
- `(user_id)` for role lookups
- `(library_id, role)` for library staff queries

**RLS policies**:
- SELECT: Users can read their own roles. Admins/superadmins can read all roles.
- INSERT: Superadmin only (for admin/superadmin assignment). Library owner or admin for staff assignment.
- UPDATE: Not allowed (delete and re-create)
- DELETE: Superadmin only

### libraries (stub for Phase 1)

Minimal library table to support staff role scoping. Expanded in Phase 2.

| Column     | Type        | Constraints                   | Description              |
| ---------- | ----------- | ----------------------------- | ------------------------ |
| id         | uuid        | PK, DEFAULT gen_random_uuid() | Library ID               |
| name       | text        | NOT NULL                      | Library name             |
| created_at | timestamptz | NOT NULL, DEFAULT now()       | Record creation timestamp |

**RLS policies**:
- SELECT: All authenticated users can read
- INSERT/UPDATE/DELETE: Deferred to Phase 2

### staff_invitations

Tracks invitations for staff members to join a library.

| Column     | Type        | Constraints                                    | Description                              |
| ---------- | ----------- | ---------------------------------------------- | ---------------------------------------- |
| id         | uuid        | PK, DEFAULT gen_random_uuid()                  | Record ID                                |
| email      | text        | NOT NULL                                       | Invitee's email address                  |
| library_id | uuid        | NOT NULL, FK → libraries(id) ON DELETE CASCADE | Target library                           |
| invited_by | uuid        | NOT NULL, FK → auth.users(id)                  | User who sent the invitation             |
| token      | text        | NOT NULL, UNIQUE                               | Unique acceptance token                  |
| status     | text        | NOT NULL, DEFAULT 'pending', CHECK IN ('pending','accepted','expired','revoked') | Invitation status |
| expires_at | timestamptz | NOT NULL                                       | Expiry timestamp (7 days from creation)  |
| created_at | timestamptz | NOT NULL, DEFAULT now()                        | Record creation timestamp                |

**Indexes**:
- PK on `id`
- UNIQUE on `token`
- `(email, library_id, status)` for duplicate detection
- `(expires_at)` for cleanup queries

**RLS policies**:
- SELECT: Inviter can see their sent invitations. Admins/superadmins can see all.
- INSERT: Library staff with invite permission, admins, superadmins
- UPDATE (status only): Service role for acceptance processing
- DELETE: Not allowed (use status transitions)

### audit_logs

Records security-relevant events for compliance and debugging.

| Column      | Type        | Constraints                   | Description                              |
| ----------- | ----------- | ----------------------------- | ---------------------------------------- |
| id          | uuid        | PK, DEFAULT gen_random_uuid() | Record ID                                |
| user_id     | uuid        | NULL, FK → auth.users(id)     | Acting user (NULL for system events)     |
| action      | text        | NOT NULL                      | Event type (e.g., 'sign_in', 'password_reset', 'role_assigned') |
| target_type | text        | NULL                          | Entity type affected (e.g., 'profile', 'user_role', 'invitation') |
| target_id   | text        | NULL                          | ID of affected entity                    |
| metadata    | jsonb       | NOT NULL, DEFAULT '{}'        | Additional event data                    |
| ip_address  | inet        | NULL                          | Client IP address                        |
| created_at  | timestamptz | NOT NULL, DEFAULT now()       | Event timestamp                          |

**Indexes**:
- PK on `id`
- `(user_id, created_at DESC)` for user activity queries
- `(action, created_at DESC)` for event type queries
- `(created_at)` for time-range queries

**RLS policies**:
- SELECT: Superadmin only
- INSERT: Service role only (audit logs are written by server-side functions, not directly by users)
- UPDATE/DELETE: Not allowed (immutable)

## State Transitions

### Profile Status

```
active (default) → suspended (by superadmin) → active (by superadmin)
```

### Staff Invitation Status

```
pending (created) → accepted (invitee accepts)
pending (created) → expired (7 days elapsed, via scheduled cleanup or on-access check)
pending (created) → revoked (inviter or admin cancels)
```

### User Role Lifecycle

```
(no role) → user (assigned on registration via trigger)
user → user + library_staff (via staff invitation acceptance)
user → admin (assigned by superadmin)
user → superadmin (assigned by bootstrap or existing superadmin)
Any role → removed (by superadmin, via DELETE on user_roles)
```

## Database Functions

### handle_new_user()

Trigger function that fires on `auth.users` INSERT. Creates a `profiles` row and assigns the `user` role.

```
TRIGGER on auth.users AFTER INSERT → handle_new_user()
  1. INSERT INTO profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'))
  2. INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user')
```

### custom_access_token_hook()

Supabase Auth Hook that enriches the JWT with role claims before token issuance.

```
INPUT: event (contains user_id, claims)
  1. Query user_roles for user_id
  2. Build roles array: [{ role, library_id }]
  3. Set event.claims.app_metadata.roles = roles array
  4. Return modified event
```

### authorize(required_role text)

SQL function used in RLS policies to check if the current user has a specific role.

```
INPUT: required_role text
  1. Read roles from auth.jwt()->'app_metadata'->'roles'
  2. Return TRUE if required_role is found in the roles array
```

### authorize_library(required_role text, lib_id uuid)

SQL function for library-scoped role checks.

```
INPUT: required_role text, lib_id uuid
  1. Read roles from auth.jwt()->'app_metadata'->'roles'
  2. Return TRUE if required_role with matching library_id is found
```

## Storage

### Bucket: avatars

| Setting         | Value                        |
| --------------- | ---------------------------- |
| Public access   | Yes (read)                   |
| File size limit | 5 MB                         |
| Allowed types   | image/jpeg, image/png, image/webp |
| Path convention | `{user_id}/avatar.{ext}`     |

**Storage policies**:
- SELECT: Public (anyone can view avatars)
- INSERT: Authenticated users, only in their own folder (`auth.uid()::text = (storage.foldername(name))[1]`)
- UPDATE: Same as INSERT (overwrite own avatar)
- DELETE: User can delete own avatar. Superadmin can delete any.

## Migration Plan

Migrations follow the naming convention `YYYYMMDDHHMMSS_descriptive_name.sql`:

1. `20260423100000_create_profiles_table.sql` — profiles table + trigger
2. `20260423100001_create_app_roles_table.sql` — app_roles reference table + seed
3. `20260423100002_create_user_roles_table.sql` — user_roles table + constraints
4. `20260423100003_create_libraries_stub.sql` — minimal libraries table for staff scoping
5. `20260423100004_create_staff_invitations_table.sql` — staff_invitations table
6. `20260423100005_create_audit_logs_table.sql` — audit_logs table
7. `20260423100006_create_auth_functions.sql` — handle_new_user trigger, authorize functions
8. `20260423100007_create_access_token_hook.sql` — custom access token hook function
9. `20260423100008_create_avatars_bucket.sql` — storage bucket + policies
10. `20260423100009_enable_rls_policies.sql` — all RLS policies
11. `20260423100010_seed_superadmin.sql` — superadmin bootstrap (seed file)
