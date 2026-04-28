# Tasks: Catalog Core

**Input**: Design documents from `/specs/003-catalog-core/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create Phase 3 project structure in `src/features/catalog/`
- [X] T002 Apply database migrations for `books`, `authors`, `genres`, `publishers`, `listings`, `listing_formats`, `inventory` in `supabase/migrations/`
- [X] T003 [P] Create `book_covers` (Public) and `ebook_files` (Private) storage buckets in Supabase

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create base types and Zod schemas for Catalog entities in `src/features/catalog/schemas/index.ts`
- [X] T005 [P] Implement Supabase RLS policies for `books` and `listings` visibility and library staff authorization in migration
- [X] T006 [P] Implement Supabase RLS policies for `ebook_files` bucket download access allowing only appropriate staff and eventual buyers

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Book and Listing (P1) 🎯 MVP

**Goal**: Library staff can create a canonical book record with metadata and add a listing (physical, ebook, or both).

**Independent Test**: Can create a new book with metadata, create a listing with a selected format, and verify the listing appears in the vendor's catalog management page as a draft.

### Implementation for User Story 1

- [X] T007 [P] [US1] Create `createBookAction` in `src/features/catalog/actions/books.ts`
- [X] T008 [P] [US1] Create `createListingAction` in `src/features/catalog/actions/listings.ts` (depends on T007)
- [X] T009 [US1] Implement `BookContext` provider in `src/features/catalog/components/BookProvider.tsx`
- [X] T010 [P] [US1] Build canonical book creation form UI in `src/features/catalog/components/BookCreateForm.tsx`
- [X] T011 [P] [US1] Build listing creation form UI in `src/features/catalog/components/ListingCreateForm.tsx`
- [X] T012 [US1] Build catalog page wrapper in `src/app/(dashboard)/library/catalog/create/page.tsx` integrating forms

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Manage Listing Lifecycle (P1)

**Goal**: Library staff can transition listings linearly (draft → pending_review → published → unpublished → archived).

**Independent Test**: Transition a draft listing through the states up to published and verify visibility.

### Implementation for User Story 2

- [X] T013 [P] [US2] Create `updateListingStatusAction` in `src/features/catalog/actions/listings.ts` enforcing strict linear transitions and cover image invariants
- [X] T014 [US2] Build `ListingStatusWidget` component in `src/features/catalog/components/ListingStatusWidget.tsx`
- [X] T015 [US2] Add status transition controls to listing view in `src/app/(dashboard)/library/catalog/[id]/page.tsx`

**Checkpoint**: Listing states can now be managed.

---

## Phase 5: User Story 3 - Upload Media (P1)

**Goal**: Library staff can upload cover images (mandatory for publishing) and ebook files (private access).

**Independent Test**: Upload a cover image and verify display, then upload an ebook file and verify it's securely stored.

### Implementation for User Story 3

- [X] T016 [P] [US3] Create `uploadCoverImageAction` in `src/features/catalog/actions/media.ts`
- [X] T017 [P] [US3] Create `uploadEbookFileAction` in `src/features/catalog/actions/media.ts`
- [X] T018 [P] [US3] Build `CoverImageUploader` component in `src/features/catalog/components/CoverImageUploader.tsx`
- [X] T019 [P] [US3] Build `EbookFileUploader` component in `src/features/catalog/components/EbookFileUploader.tsx`
- [X] T020 [US3] Integrate uploaders into `src/app/(dashboard)/library/catalog/[id]/page.tsx`

---

## Phase 6: User Story 4 - Manage Metadata (P2)

**Goal**: Enrich book records with complete, editable metadata (authors, publisher, ISBN, genres).

**Independent Test**: Edit metadata fields (like adding an author) and verify changes persist. Ensure ISBN duplicate triggers warning.

### Implementation for User Story 4

- [X] T021 [P] [US4] Create `updateBookMetadataAction` in `src/features/catalog/actions/books.ts` generating warnings for duplicate ISBNs
- [X] T022 [US4] Build `BookMetadataEditor` component in `src/features/catalog/components/BookMetadataEditor.tsx`
- [X] T023 [US4] Integrate metadata editor into catalog edit page in `src/app/(dashboard)/library/catalog/[id]/edit/page.tsx`

---

## Phase 7: User Story 5 - Manage Inventory (P2)

**Goal**: Track and adjust stock levels for physical listings.

**Independent Test**: Reduce stock for a listing and verify the change in the dashboard.

### Implementation for User Story 5

- [X] T024 [P] [US5] Create `updateInventoryAction` in `src/features/catalog/actions/inventory.ts`
- [X] T025 [US5] Build `InventoryManager` widget in `src/features/catalog/components/InventoryManager.tsx`
- [X] T026 [US5] Add `InventoryManager` to `src/app/(dashboard)/library/catalog/[id]/page.tsx`

---

## Phase 8: User Story 6 - Public Product Page (P2)

**Goal**: Render a public, read-only product page for published listings.

**Independent Test**: Load the product route with a published listing ID and verify metadata, cover, formats, and pricing display correctly.

### Implementation for User Story 6

- [X] T027 [P] [US6] Create `getPublicListingDetails` query action in `src/features/catalog/actions/queries.ts` ensuring drafts/archived are hidden
- [X] T028 [P] [US6] Build `PublicProductView` component in `src/features/catalog/components/PublicProductView.tsx` showing cover, metadata, format prices
- [X] T029 [US6] Implement public product route in `src/app/product/[id]/page.tsx`

---

## Phase 9: User Story 7 - Vendor Catalog Dashboard (P3)

**Goal**: Provide a dashboard for libraries to filter, view, and organize their catalog.

**Independent Test**: Load the dashboard, apply a "published" status filter, and verify the correct listings are displayed.

### Implementation for User Story 7

- [X] T030 [P] [US7] Create `getVendorCatalogListings` query action in `src/features/catalog/actions/queries.ts`
- [X] T031 [P] [US7] Build `CatalogDataTable` component with status/format filters in `src/features/catalog/components/CatalogDataTable.tsx`
- [X] T032 [US7] Implement vendor catalog dashboard root in `src/app/(dashboard)/library/catalog/page.tsx`

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T033 Code cleanup and validation optimizations for server actions in `src/features/catalog/actions/`
- [X] T034 Verify all form logic relies on `zodResolver` with standard schema formats
- [X] T035 Ensure toast notifications are uniformly triggered using `goey-toast` for success/error handling across all UI components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup
- **User Stories (Phase 3+)**: Depend on Foundational phase. Phase 3 (US1) must complete before Phase 4 (US2) as statuses rely on listing existence.
- **Polish (Final Phase)**: Depends on completing desired user stories.

### Parallel Opportunities

- DB tables, Actions, and UI components can typically be developed concurrently within a Story boundary given the Zod schemas developed in Foundational.
- Specifically, the upload actions (T016, T017) can be done while building their respective React components (T018, T019).

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup and Foundational constraints.
2. Deliver User Story 1 (Basic creation).
3. Deliver User Story 2 (Publishing workflow).
4. **Deploy/demo if ready**.

### Incremental Delivery

1. Follow closely after MVP with Media uploads (US3) so that listings are visually ready.
2. Add Metadata and Inventory (US4, US5).
3. Connect the Public Page (US6) to allow buyers to see published books.
4. Finish with the Dashboard (US7) to improve internal management quality.
