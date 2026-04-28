# Phase 3 Catalog Core: Data Model

## Entities and Schema

### `books`
Canonical book content record, owned by a specific library.
- `id` (UUID, Primary Key)
- `library_id` (UUID, Foreign Key to `libraries`)
- `title` (Text, Required)
- `subtitle` (Text, Optional)
- `publication_year` (Integer, Optional)
- `language` (Text, Required) - e.g., "en", "ar"
- `isbn` (Text, Optional) - Must warn on duplicate across libraries, but allowed.
- `cover_image_path` (Text, Required for publishing parent listings)
- `created_at` (Timeline)
- `updated_at` (Timeline)

### `authors`
- `id` (UUID, Primary Key)
- `name` (Text, Required)

### `book_authors` (Join Table)
- `book_id` (UUID, FK to `books`)
- `author_id` (UUID, FK to `authors`)

### `genres`
Uses single-level grouping (max 2 levels).
- `id` (UUID, Primary Key)
- `name` (Text, Required)
- `parent_id` (UUID, FK to `genres`, Optional) - Enforces max 1 depth.

### `book_genres` (Join Table)
- `book_id` (UUID, FK to `books`)
- `genre_id` (UUID, FK to `genres`)

### `publishers`
- `id` (UUID, Primary Key)
- `name` (Text, Required)

### `listings`
Vendor-specific offering of a canonical book.
- `id` (UUID, Primary Key)
- `library_id` (UUID, FK to `libraries`)
- `book_id` (UUID, FK to `books`)
- `status` (Enum: `draft`, `pending_review`, `published`, `unpublished`, `archived`)
  - **State Transitions**: `draft` → `pending_review` → `published` → `unpublished` → `archived`. No skipping.
  - **Constraints**: Cannot transition to `published` if `books.cover_image_path` is null.
- `approval_required` (Boolean, Default: false) - Based on library settings, if true, requires admin action.
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### `listing_formats`
Defines the formats available for a listing.
- `id` (UUID, Primary Key)
- `listing_id` (UUID, FK to `listings`)
- `format_type` (Enum: `physical`, `ebook`)
- `price` (Decimal, Required)
- `ebook_file_path` (Text, Required if `format_type` is `ebook`)

### `inventory`
Tracks stock levels for physical listings.
- `id` (UUID, Primary Key)
- `listing_format_id` (UUID, FK to `listing_formats`, unique constraint)
- `stock_quantity` (Integer, Default: 0)

## Validation Rules
1. **At least one author/genre**: `books` creation requires entries in `book_authors` and `book_genres`.
2. **Cover Image Rule**: A listing cannot be `published` if the associated `book` lacks a `cover_image_path`.
3. **Ebook File Rule**: A `listing_format` of type `ebook` MUST have an `ebook_file_path`.
4. **Library Separation**: A library can only create `listings` for its own `books`.
5. **ISBN Duplicates**: When inserting/updating `books.isbn`, fetch existing matches and return warnings, but do not block insertion.

## Storage Buckets
1. **`book_covers`** (Public Bucket): Stores cover images. Accessible by anyone.
2. **`ebook_files`** (Private Bucket): Stores EPUB/PDF files. Protected by RLS (requires entitlement to download).
