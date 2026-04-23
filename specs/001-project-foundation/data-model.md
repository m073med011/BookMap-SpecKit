# Data Model: Project Foundation and Architecture

**Date**: 2026-04-23
**Branch**: `001-project-foundation`

## Overview

Phase 0 has **no database tables**. All state is client-side only.
This document defines the client-side data structures used by the
foundation layer.

## Client-Side Entities

### ThemePreference

Stored in cookie (`theme`) and managed by next-themes.

| Field    | Type                           | Description                        |
| -------- | ------------------------------ | ---------------------------------- |
| theme    | `"light" \| "dark" \| "system"` | User's selected theme              |
| resolved | `"light" \| "dark"`            | Actual applied theme after system resolution |

### LocalePreference

Stored in cookie (`NEXT_LOCALE`) and URL prefix.

| Field     | Type              | Description                        |
| --------- | ----------------- | ---------------------------------- |
| locale    | `"en" \| "ar"`    | Active language                    |
| direction | `"ltr" \| "rtl"`  | Layout direction derived from locale |

### EnvironmentConfig

Validated at startup via Zod schema. Server-side only.

| Field                          | Type   | Required | Scope       |
| ------------------------------ | ------ | -------- | ----------- |
| NEXT_PUBLIC_SUPABASE_URL       | URL    | Yes      | Client+Server |
| NEXT_PUBLIC_SUPABASE_ANON_KEY  | string | Yes      | Client+Server |
| SUPABASE_SERVICE_ROLE_KEY      | string | Yes      | Server only |

## State Transitions

### Theme

```
system (default) → light (user toggle) → dark (user toggle) → system (user reset)
```

### Locale

```
browser-detected (default) → en (user switch) ↔ ar (user switch)
```

## Database

No database tables, migrations, or Supabase configuration changes
in this phase. Supabase client utilities are created as typed
wrappers ready for Phase 1 consumption.
