# Phase 3 Catalog Core: Server Actions Contracts

This document defines the Next.js Server Actions added in Phase 3.

## Books & Metadata

### `createBookAction`
```typescript
type CreateBookInput = {
  library_id: string;
  title: string;
  subtitle?: string;
  publication_year?: number;
  language: string;
  isbn?: string;
  author_names: string[];
  genre_ids: string[];
  publisher_name?: string;
};

type CreateBookOutput = {
  success: boolean;
  book_id?: string;
  warnings?: string[]; // e.g., "ISBN already exists in another library."
  errors?: string[];
};
```

### `updateBookAction`
Updates fields, handles cover image paths, handles joining authors/genres.

## Listings & Formats

### `createListingAction`
```typescript
type CreateListingInput = {
  library_id: string;
  book_id: string;
  formats: {
    type: 'physical' | 'ebook';
    price: number;
    stock_quantity?: number; // Valid only for physical
    ebook_file_path?: string; // Valid only for ebook
  }[]
};

type CreateListingOutput = {
  success: boolean;
  listing_id?: string;
  errors?: string[];
};
```

### `updateListingStatusAction`
Enforces strict linear transitions and cover image invariants.
```typescript
type UpdateListingStatusInput = {
  listing_id: string;
  new_status: 'draft' | 'pending_review' | 'published' | 'unpublished' | 'archived';
};
```

### `updateInventoryAction`
```typescript
type UpdateInventoryInput = {
  listing_format_id: string;
  adjustment: number; // e.g., +5, -2
};
```
