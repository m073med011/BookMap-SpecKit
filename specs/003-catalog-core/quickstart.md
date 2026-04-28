# Phase 3 Catalog Core: Quickstart

## Prerequisites
- Auth and Library Vendor Onboarding (Phases 1 & 2) must be complete.
- Supabase connected and migrations applied.

## Setup Steps

1. **Storage Buckets**:
   - Create a `book_covers` bucket in Supabase (Public).
   - Create an `ebook_files` bucket in Supabase (Private).
2. **Migrations**:
   - Generate migration for Phase 3 schema: `npm run supabase migration new phase3_catalog_core`.
   - Apply table creations for books, authors, genres, publishers, listings, formats, inventory.
   - Add RLS policies allowing `SELECT` on published listings to everyone, and `ALL` access for library staff on their own library's data.
3. **Database Seed (Optional)**:
   - Insert baseline genres if applicable.
4. **Environment**:
   - Ensure Supabase URL and anon key are available. No new env vars required.
