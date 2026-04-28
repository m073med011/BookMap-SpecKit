# Feature Specification: Catalog Core — Books, Listings, Formats, Metadata, Media

**Feature Branch**: `003-catalog-core`  
**Created**: 2026-04-27  
**Status**: Draft  
**Input**: User description: "Build the core marketplace catalog that supports physical books and ebooks with canonical book data, vendor-owned listings, format management, metadata, cover images, and digital asset handling."

## Clarifications

### Session 2026-04-27

- Q: Which listing status transitions are allowed? → A: Strict linear workflow: draft → pending review → published → unpublished → archived. No skipping or backward transitions.
- Q: Who can create/edit canonical book records and how are duplicates prevented? → A: Library-scoped creation with soft dedup — each library creates their own book records; system warns on ISBN duplicates but allows them. Admin can merge duplicates later.
- Q: Can a listing be published without a cover image? → A: No. Cover image is mandatory before transitioning to published. Drafts can be saved without one.
- Q: What is the default listing approval policy? → A: Auto-approve by default. Listings automatically move from "pending review" to "published" unless the library is flagged for manual review. Admin can toggle the review requirement per-library.
- Q: Should genres use a flat list or hierarchical structure? → A: Single-level grouping — genres have an optional parent category (max 2 levels, e.g., "Fiction > Fantasy"). Balances simplicity with basic navigation hierarchy.


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Library Staff Creates a Book and Listing (Priority: P1)

A library staff member wants to add a new book to their catalog. They create a canonical book record with metadata (title, author, publisher, year, genre, language), then create a listing under their library for that book. They select whether the listing is physical, ebook, or both, set pricing, upload a cover image, and optionally upload an ebook file. They save the listing as a draft for later review.

**Why this priority**: This is the foundational workflow — without it, no products exist in the marketplace. Every other catalog feature depends on books and listings being created.

**Independent Test**: Can be fully tested by logging in as library staff, creating a new book with metadata, creating a listing with a selected format, uploading a cover image, and verifying the listing appears in the vendor's catalog management page as a draft.

**Acceptance Scenarios**:

1. **Given** a logged-in library staff member, **When** they fill in the book creation form with title, author, genre, language, and publisher, **Then** a canonical book record is saved and associated with the library.
2. **Given** a saved book record, **When** the staff member creates a listing and selects "physical" format, sets a price, and enters stock quantity, **Then** the listing is saved as a draft with the correct format and inventory.
3. **Given** a saved book record, **When** the staff member creates a listing and selects "ebook" format, sets a price, and uploads an ebook file, **Then** the listing is saved as a draft and the ebook file is stored securely.
4. **Given** a saved book record, **When** the staff member creates a listing and selects "both" format, **Then** separate format entries for physical and ebook are created under the same listing.

---

### User Story 2 - Library Staff Manages Listing Lifecycle (Priority: P1)

A library staff member wants to publish a draft listing so it becomes visible to customers. They also want the ability to unpublish, archive, or edit listings after creation. Each status transition follows a defined workflow.

**Why this priority**: Listings must be controllable — staff need to manage visibility and lifecycle states to operate their storefront effectively.

**Independent Test**: Can be tested by creating a draft listing, transitioning it through pending review → published → unpublished → archived states, and verifying each state change is reflected in the vendor dashboard and public visibility.

**Acceptance Scenarios**:

1. **Given** a draft listing, **When** the staff member submits it for review, **Then** the listing status changes to "pending review."
2. **Given** a listing in "pending review" status, **When** it is approved (by admin or auto-approval policy), **Then** the listing status changes to "published" and becomes visible on the public storefront.
3. **Given** a published listing, **When** the staff member unpublishes it, **Then** the listing status changes to "unpublished" and it is hidden from the public storefront.
4. **Given** any active listing, **When** the staff member archives it, **Then** the listing status changes to "archived" and it is removed from active catalog views.

---

### User Story 3 - Library Staff Uploads Cover Images and Ebook Files (Priority: P1)

A library staff member wants to upload a cover image for a book and an ebook file for digital listings. Cover images are publicly visible on the product page, while ebook files are private and only accessible to authorized purchasers.

**Why this priority**: Visual assets drive purchase decisions, and ebook files are the core digital product. Without media handling, the catalog cannot function.

**Independent Test**: Can be tested by uploading a cover image and verifying it displays on the book's product page, then uploading an ebook file and verifying it is stored privately and not accessible via public URLs.

**Acceptance Scenarios**:

1. **Given** a book record, **When** the staff member uploads a cover image, **Then** the image is stored and displayed on the book's public product page.
2. **Given** a listing with ebook format, **When** the staff member uploads an ebook file, **Then** the file is stored in a private location and cannot be accessed without authorization.
3. **Given** an existing cover image, **When** the staff member uploads a new cover image, **Then** the new image replaces the old one and the old image is cleaned up.
4. **Given** an ebook file upload, **When** the file exceeds the maximum allowed size, **Then** the upload is rejected with a clear error message.

---

### User Story 4 - Library Staff Manages Book Metadata (Priority: P2)

A library staff member wants to enrich their book records with complete metadata including multiple authors, subtitle, ISBN, publication year, publisher, genre/category, and language. They also want to edit metadata after initial creation.

**Why this priority**: Rich metadata improves discoverability and user experience, but basic listings can function with minimal metadata.

**Independent Test**: Can be tested by creating a book with all metadata fields populated, saving it, then editing individual fields and verifying changes persist correctly.

**Acceptance Scenarios**:

1. **Given** a book creation form, **When** the staff member enters title, subtitle, multiple authors, publisher, year, genre, language, and ISBN, **Then** all fields are saved and displayed correctly.
2. **Given** an existing book, **When** the staff member edits the title and adds a new author, **Then** the changes are persisted and reflected wherever the book is displayed.
3. **Given** a book with ISBN, **When** the staff member enters a duplicate ISBN already in the system, **Then** a warning is shown indicating the ISBN already exists for another book.

---

### User Story 5 - Library Staff Manages Physical Book Inventory (Priority: P2)

A library staff member wants to track stock levels for physical book listings. They can set initial stock, adjust quantities, and see when stock is running low.

**Why this priority**: Inventory tracking prevents overselling and helps staff manage their physical inventory, but the catalog can launch initially without advanced inventory features.

**Independent Test**: Can be tested by setting stock quantity for a physical listing, reducing it, and verifying stock levels are reflected correctly in the vendor dashboard.

**Acceptance Scenarios**:

1. **Given** a physical listing, **When** the staff member sets the stock quantity to 50, **Then** the inventory record shows 50 units available.
2. **Given** a physical listing with 50 units, **When** the staff member adjusts stock to 30, **Then** the inventory reflects the updated quantity.
3. **Given** a physical listing with 0 units, **When** a customer views the product page, **Then** the product shows as "out of stock" and cannot be added to cart.

---

### User Story 6 - Customer Views Published Product Page (Priority: P2)

A customer wants to browse a published book listing and see all relevant details including cover image, title, author, description, price, format availability, and library/vendor information. This page is a read-only public view.

**Why this priority**: The public product page is the primary interface for purchase decisions, but it depends on listings and metadata being created first.

**Independent Test**: Can be tested by navigating to a published listing's URL and verifying all metadata, pricing, cover image, format availability, and vendor information are displayed correctly.

**Acceptance Scenarios**:

1. **Given** a published listing with complete metadata, **When** a customer navigates to the product page, **Then** they see the book title, author(s), description, cover image, price, format options, and library name.
2. **Given** a listing available in both physical and ebook formats, **When** the customer views the product page, **Then** both format options are displayed with their respective prices.
3. **Given** an unpublished or draft listing, **When** anyone attempts to navigate to its product page, **Then** a "not found" or "unavailable" message is shown.

---

### User Story 7 - Vendor Catalog Management Dashboard (Priority: P3)

Library staff want a dedicated management page to view, filter, and manage all their books and listings. They can see listing statuses at a glance, filter by format or status, and quickly access edit actions.

**Why this priority**: A management dashboard improves operational efficiency but is not required for basic catalog functionality.

**Independent Test**: Can be tested by logging in as staff and viewing their catalog dashboard with multiple listings in various statuses, applying filters, and verifying results are correct.

**Acceptance Scenarios**:

1. **Given** a library with multiple listings, **When** the staff member opens the catalog management page, **Then** all listings are shown with their current status, format type, and creation date.
2. **Given** the catalog management page, **When** the staff member filters by "published" status, **Then** only published listings are displayed.
3. **Given** the catalog management page, **When** the staff member clicks "Edit" on a listing, **Then** they are taken to the listing edit form.

---

### Edge Cases

- What happens when a staff member tries to publish a listing without a cover image? → Blocked: cover image is mandatory for publishing. System prevents the transition and displays a validation error.
- What happens when a staff member tries to create an ebook listing without uploading an ebook file?
- What happens when two libraries create listings for the same canonical book?
- How does the system handle uploading an ebook file in an unsupported format?
- What happens when a library's store is suspended — are their published listings automatically hidden?
- What happens when a staff member deletes a book that has active listings?
- How does the system handle concurrent edits to the same listing by multiple staff members?
- What happens when the cover image upload fails mid-way?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support a canonical book content model separate from vendor-specific listing data. Each library creates and manages its own book records. The system warns on ISBN duplicates across libraries but allows them. Admin may merge duplicate book records in a future phase.
- **FR-002**: System MUST allow library staff to create book records with mandatory fields: title, at least one author, at least one genre/category, and language.
- **FR-003**: System MUST allow library staff to create listings for books belonging to their own library only.
- **FR-004**: System MUST support three listing format types: physical only, ebook only, or both physical and ebook.
- **FR-005**: System MUST enforce a strict linear listing status workflow: draft → pending review → published → unpublished → archived. No skipping states or backward transitions are permitted.
- **FR-006**: System MUST allow library staff to upload cover images for books and store them in a publicly accessible storage location.
- **FR-007**: System MUST allow library staff to upload ebook files for digital listings and store them in a private, access-controlled storage location.
- **FR-008**: System MUST prevent direct public access to ebook files — downloads must require authorization.
- **FR-009**: System MUST allow library staff to set and adjust stock quantities for physical book listings.
- **FR-010**: System MUST display "out of stock" status for physical listings with zero inventory.
- **FR-011**: System MUST render a public product page for published listings showing all metadata, pricing, cover image, format availability, and vendor information.
- **FR-012**: System MUST hide unpublished, draft, and archived listings from public-facing views.
- **FR-013**: System MUST support multiple authors per book record.
- **FR-014**: System MUST support optional metadata fields: subtitle, ISBN, publisher, and publication year.
- **FR-015**: System MUST allow staff to edit book metadata and listing details after creation.
- **FR-016**: System MUST display a warning when a staff member enters an ISBN that already exists in the system.
- **FR-017**: System MUST enforce that only authorized staff of the owning library can create, edit, or manage listings for that library.
- **FR-018**: System MUST automatically hide listings belonging to suspended libraries from public-facing views.
- **FR-019**: System MUST provide a vendor catalog management page where library staff can view, filter, and manage all their listings.
- **FR-020**: System MUST validate file types for cover image uploads (common image formats) and ebook file uploads (common ebook formats).
- **FR-021**: System MUST enforce maximum file size limits for cover image and ebook file uploads.
- **FR-022**: System MUST allow library staff to replace existing cover images and ebook files, cleaning up previous versions.
- **FR-023**: System MUST require a cover image to be uploaded before a listing can transition to "published" status. Drafts and pending review listings may exist without a cover image.
- **FR-024**: System MUST auto-approve listings by default, automatically transitioning them from "pending review" to "published." Admin can enable manual review on a per-library basis, in which case listings remain in "pending review" until explicitly approved.

### Key Entities

- **Book**: Canonical book content record representing a unique work. Created and owned by a specific library. Key attributes: title, subtitle, publication year, language, ISBN. Has relationships to authors (many-to-many), genres (many-to-many), publisher (many-to-one), and owning library (many-to-one). ISBN duplicates across libraries are warned but allowed.
- **Author**: Represents a book author. Can be associated with multiple books.
- **Genre**: Category or genre classification for books. Uses single-level grouping: genres have an optional parent category (max 2 levels, e.g., "Fiction > Fantasy"). Can be associated with multiple books.
- **Publisher**: Represents a publishing house. Can be associated with multiple books.
- **Language**: Represents a language a book is written in. Used for filtering and metadata display.
- **Listing**: A vendor-specific offering of a book. Belongs to one library and one book. Contains pricing, status, and format configuration. Multiple libraries can have separate listings for the same book.
- **Listing Format**: Defines whether a listing offers physical, ebook, or both formats. Contains format-specific data (stock for physical, file reference for ebook).
- **Inventory**: Tracks stock levels for physical book listings. Tied to a specific listing format entry.
- **Book Cover**: Image asset for a book. Stored in publicly accessible storage. One primary cover per book.
- **Ebook File**: Digital asset for an ebook listing. Stored in private, access-controlled storage. Tied to a specific listing format entry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Library staff can create a complete book record with all metadata and create a listing in under 5 minutes.
- **SC-002**: Cover images are visible on product pages within 10 seconds of upload completion.
- **SC-003**: Ebook files are never accessible via direct public URL — 100% of unauthorized access attempts are blocked.
- **SC-004**: Listing status transitions (draft → pending review → published) complete within 2 seconds of user action.
- **SC-005**: Published listings appear on the public storefront immediately after status change, and unpublished/archived listings are hidden within the same timeframe.
- **SC-006**: 95% of library staff can successfully create their first book and listing without external help on first attempt.
- **SC-007**: The vendor catalog management page loads and displays up to 100 listings within 3 seconds.
- **SC-008**: Inventory updates (stock adjustments) are reflected immediately and prevent overselling of physical books.
- **SC-009**: The system correctly supports at least two concurrent libraries each listing the same canonical book independently.

## Assumptions

- Authentication, authorization, and role-based access control are fully implemented (Phase 1 dependency).
- Library vendor onboarding and store management are fully implemented, including library status management (Phase 2 dependency).
- The platform's shared UI components, layout system, theme, and localization support are available (Phase 0 dependency).
- File storage infrastructure (buckets for public and private assets) is configured and accessible.
- Cover images will be served via a public bucket or CDN-like access pattern; ebook files use a private bucket with signed URL or server-mediated access.
- Maximum cover image file size is 5 MB; maximum ebook file size is 100 MB. These are reasonable defaults.
- Supported cover image formats: JPEG, PNG, WebP. Supported ebook formats: PDF, EPUB.
- ISBN validation follows standard ISBN-10 or ISBN-13 format but does not require external ISBN registry verification.
- Listing approval is auto-approved by default. Admin can toggle manual review per-library. This is the configured default for Phase 3.
- Arabic and English content are supported in all text fields from the beginning.
- Search indexing of published catalog data is out of scope for this phase — it will be handled in Phase 5 (Search and Discovery).
- AI-generated titles and descriptions are out of scope — they will be handled in Phase 4.
- Cart, checkout, and purchase flows are out of scope — they will be handled in Phase 6.
- Ebook download/fulfillment logic is out of scope — it will be handled in Phase 7.
