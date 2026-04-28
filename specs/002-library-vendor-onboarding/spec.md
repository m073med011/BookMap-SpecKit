# Feature Specification: Library Vendor Onboarding and Store Management

**Feature Branch**: `003-library-vendor-onboarding`  
**Created**: 2026-04-26  
**Status**: Draft  
**Input**: User description: "Allow libraries to become managed sellers on the platform — including creating library storefronts, admin approval/rejection of seller onboarding, managing library profile and settings, managing staff members, defining store status and visibility, moderation controls, and configuring shipping override settings."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Library Creation and Onboarding (Priority: P1)

A registered user who wants to sell books on the platform initiates the process of creating a new library storefront. They fill out a multi-step onboarding wizard providing the library's name, description, logo, contact information, and policies. The user can save their progress at any point and return later to continue — the library is saved in "draft" status until all required fields are complete. Upon final submission, the library enters a "pending approval" state and the user is notified that their application is under review.

**Why this priority**: This is the entry point for all vendor activity on the platform. Without library creation, no books can be listed or sold.

**Independent Test**: Can be fully tested by a registered user completing the onboarding wizard, submitting the library for review, and verifying the library appears in the admin approval queue with "pending approval" status.

**Acceptance Scenarios**:

1. **Given** a registered user on the "Create Library" page, **When** they complete all required fields and submit, **Then** a new library is created in "pending approval" status and a confirmation is shown
2. **Given** a registered user submitting the library onboarding form, **When** they leave required fields empty, **Then** validation errors are displayed for each missing field
3. **Given** a registered user creating a library, **When** they provide a library name that already exists as a slug, **Then** they are informed the name is taken and must choose another
4. **Given** a library in "pending approval" status, **When** the creator views their dashboard, **Then** they see the library's current status and a message indicating it is awaiting review
5. **Given** a registered user who already owns a library, **When** they attempt to create another library, **Then** the system allows it (multiple libraries per user are permitted)
6. **Given** a registered user partway through the onboarding wizard, **When** they save their progress without completing all required fields, **Then** the library is saved in "draft" status and accessible from their dashboard
7. **Given** a registered user with a draft library, **When** they return to the onboarding wizard, **Then** their previously entered information is restored and they can continue from where they left off

---

### User Story 2 - Admin Library Approval Queue (Priority: P1)

An admin or superadmin reviews pending library applications. They can view the library's submitted details, approve the library (moving it to "active" status), or reject it with a reason. The library creator is notified of the decision.

**Why this priority**: No library can go live without admin approval. This is the gatekeeper for marketplace quality and trust.

**Independent Test**: Can be fully tested by an admin reviewing a pending library, approving or rejecting it, and verifying the status change is reflected for both the admin and the library creator.

**Acceptance Scenarios**:

1. **Given** an admin on the approval queue page, **When** pending libraries exist, **Then** they see a list of all libraries awaiting review with submission date and key details
2. **Given** an admin reviewing a pending library, **When** they approve it, **Then** the library status changes to "active" and the creator is notified
3. **Given** an admin reviewing a pending library, **When** they reject it with a reason, **Then** the library status changes to "rejected," the reason is recorded, and the creator is notified with the rejection reason
4. **Given** an admin viewing the approval queue, **When** no pending libraries exist, **Then** an appropriate empty state message is displayed
5. **Given** a superadmin, **When** they access the approval queue, **Then** they can perform all the same actions as an admin

---

### User Story 3 - Library Profile Management (Priority: P2)

A library owner or authorized staff member manages the library's public profile — updating the name, description, logo, cover/banner image, address, contact information, social links, supported languages, and store policies. Changes to the public profile are reflected on the library's public storefront page.

**Why this priority**: The library profile is the public face of the vendor. It must be editable for vendors to present themselves properly, but it depends on the library existing first.

**Independent Test**: Can be fully tested by a library staff member updating profile fields, uploading a logo and banner image, saving the changes, and verifying they appear on the public storefront page.

**Acceptance Scenarios**:

1. **Given** an authorized staff member on the library settings page, **When** they update the library description and save, **Then** the changes persist and appear on the public storefront
2. **Given** an authorized staff member, **When** they upload a valid logo image, **Then** the logo is stored securely and displayed on the library's storefront
3. **Given** an authorized staff member, **When** they upload a cover/banner image, **Then** the banner is stored and displayed on the library's public page
4. **Given** a staff member uploading an oversized or invalid file type for logo or banner, **When** they attempt the upload, **Then** they receive a clear error explaining file requirements
5. **Given** an authorized staff member, **When** they update the library's slug, **Then** the old URL redirects to the new slug or the change is rejected if the new slug is already taken

---

### User Story 4 - Staff Assignment Management (Priority: P2)

A library owner manages their team by inviting new staff members and removing existing ones. Staff invitations leverage the existing invitation system from Phase 1. The owner can view all current staff members and their roles within the library.

**Why this priority**: Libraries need teams to manage operations. Staff management is essential for multi-person vendor operations but depends on the library existing.

**Independent Test**: Can be fully tested by a library owner inviting a staff member via email, the invitee accepting, and verifying the new staff member appears in the staff list with appropriate access to the library.

**Acceptance Scenarios**:

1. **Given** a library owner on the staff management page, **When** they send an invitation to a valid email, **Then** the invitation is sent and appears in the pending invitations list
2. **Given** a library owner viewing the staff list, **When** staff members exist, **Then** they see each member's name, email, and role within the library
3. **Given** a library owner, **When** they remove a staff member, **Then** the member loses access to that library's management area immediately
4. **Given** a staff member removed from a library, **When** they attempt to access the library's management area, **Then** they are denied access
5. **Given** a library owner, **When** they attempt to remove themselves as the last owner, **Then** the system prevents it and requires at least one owner to remain
6. **Given** a regular staff member (not owner), **When** they attempt to access staff management or library settings, **Then** they are denied access

---

### User Story 5 - Library Moderation by Admin and Superadmin (Priority: P2)

Admins and superadmins can moderate libraries — suspending active libraries that violate policies, reactivating previously suspended libraries, or archiving inactive libraries. Every moderation action records the reason and the acting moderator, creating a full audit trail.

**Why this priority**: Moderation protects marketplace quality and enables enforcement of platform policies. Without it, there is no recourse against bad actors.

**Independent Test**: Can be fully tested by an admin suspending an active library with a reason, verifying the library is no longer publicly visible, and then reactivating it and verifying visibility is restored.

**Acceptance Scenarios**:

1. **Given** an admin viewing an active library, **When** they suspend it with a reason, **Then** the library status changes to "suspended," the reason is recorded, and the library is hidden from public view
2. **Given** an admin viewing a suspended library, **When** they reactivate it, **Then** the library status returns to "active" and it becomes publicly visible again
3. **Given** a superadmin, **When** they archive a library, **Then** the library status changes to "archived" and it is removed from all public views
4. **Given** a suspended library's staff, **When** they attempt to publish new content, **Then** they are blocked from publishing and see a suspension notice
5. **Given** any moderation action, **When** it is performed, **Then** the action, reason, and acting moderator are recorded in the library's status history

---

### User Story 6 - Public Library Storefront Page (Priority: P3)

Any visitor (authenticated or guest) can view a library's public storefront page, which displays the library's profile information, logo, banner, description, policies, and eventually their listed books. Only libraries in "active" status are visible to the public.

**Why this priority**: The storefront is the outward-facing display of a library. It depends on profile management and library status system being complete.

**Independent Test**: Can be fully tested by navigating to an active library's public URL and verifying all profile information is displayed correctly, and then verifying that non-active libraries return appropriate responses.

**Acceptance Scenarios**:

1. **Given** a visitor navigating to an active library's storefront URL, **When** the page loads, **Then** the library's name, description, logo, banner, and contact information are displayed
2. **Given** a visitor navigating to a suspended library's URL, **When** the page loads, **Then** a message indicating the library is unavailable is shown
3. **Given** a visitor navigating to a non-existent library URL, **When** the page loads, **Then** a 404-style "library not found" page is shown
4. **Given** a library in "draft" or "pending approval" status, **When** anyone attempts to view its public page, **Then** it is not accessible to unauthorized visitors

---

### User Story 7 - Library Settings Management (Priority: P3)

A library owner or authorized staff configures operational settings for the library — including shipping preferences, return policies, operating hours, and other vendor-specific configurations. These settings affect how the library operates on the platform but may not all be publicly visible.

**Why this priority**: Settings allow libraries to configure their operational parameters. This is a secondary concern after the library exists and is approved.

**Independent Test**: Can be fully tested by a library staff member updating shipping preferences and other settings, saving them, and verifying the settings persist and are applied correctly.

**Acceptance Scenarios**:

1. **Given** an authorized staff member on the library settings page, **When** they update shipping preferences, **Then** the changes persist and affect future order processing for that library
2. **Given** an authorized staff member, **When** they configure return policies, **Then** the policies are saved and displayed on the library's public storefront
3. **Given** a staff member who is not authorized for settings, **When** they attempt to access the settings page, **Then** they are denied access

---

### Edge Cases

- What happens when a library's name contains characters that cannot form a valid URL slug? The system auto-generates a URL-safe slug and allows the library owner to customize it.
- What happens when an admin approves a library but the creator's account has been suspended since submission? The library remains in "pending approval" — it cannot become active while its owner is suspended.
- What happens when all staff members are removed from an active library? The system prevents removing the last owner. If a non-owner staff is the last member, they can be removed but the library must always retain at least one owner.
- What happens when a rejected library applicant wants to reapply? They can move the rejected library back to "draft" status, update their information, and resubmit for approval. The rejection reason and history are preserved for admin reference.
- What happens when two libraries try to claim the same slug? The second attempt is rejected with a message indicating the slug is taken. Slugs are globally unique.
- What happens when an admin suspends a library that has active orders? Existing orders remain processable (fulfillment continues), but no new orders can be placed and the library is hidden from public search and browsing.
- What happens when a library owner uploads a logo or banner that exceeds size limits? The upload is rejected with a clear error message explaining the maximum allowed file size and accepted formats.
- What happens when the sole remaining owner tries to self-demote to staff? The system blocks the action and informs them that at least one owner must remain. They must first promote another staff member to owner before they can self-demote.
- What happens when the storefront page is viewed in Arabic vs English? The page respects the user's language preference and displays RTL/LTR layout accordingly, with all library-provided content displayed as entered by the library.

## Clarifications

### Session 2026-04-26

- Q: What are the valid library status transitions? → A: Standard marketplace flow — draft → pending approval → active/rejected; active ↔ suspended; active/suspended → archived; rejected → draft (resubmit)
- Q: What permissions differ between library owner and staff roles? → A: Tiered access — Owners have full control (profile, settings, staff, catalog). Staff can edit profile and manage catalog/orders but cannot manage staff or change settings.
- Q: How is the "draft" library status used? → A: Saveable draft — Users can save partial progress during onboarding and return later. Submitting moves the library to pending approval.
- Q: Can an owner promote staff to owner or demote an owner to staff? → A: Owners can promote staff to owner. Demoting an owner requires that owner's own action (self-demote only).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow any registered user to create a new library by completing an onboarding wizard with required information
- **FR-002**: System MUST generate a unique, URL-safe slug for each library, allowing the owner to customize it during creation
- **FR-003**: System MUST enforce globally unique slugs — duplicate slugs are rejected
- **FR-004**: System MUST set newly created libraries to "draft" status initially, allowing users to save partial progress and return later. Submitting the completed onboarding form transitions the library to "pending approval"
- **FR-005**: System MUST support the following library statuses: draft, pending approval, active, suspended, rejected, and archived
- **FR-006**: System MUST enforce the following valid status transitions: draft → pending approval; pending approval → active; pending approval → rejected; active → suspended; suspended → active; active → archived; suspended → archived; rejected → draft (resubmit). All other transitions are blocked.
- **FR-007**: System MUST allow admins and superadmins to review, approve, or reject pending library applications
- **FR-008**: System MUST require a reason when rejecting or suspending a library
- **FR-009**: System MUST notify the library creator when their application is approved, rejected, or when their library status changes
- **FR-010**: System MUST allow authorized library staff to edit the library's public profile: name, description, logo, cover/banner image, address, contact info, social links, languages, and policies
- **FR-011**: System MUST restrict logo uploads to common image formats (JPEG, PNG, WebP) with a maximum file size of 2 MB
- **FR-012**: System MUST restrict banner/cover image uploads to common image formats (JPEG, PNG, WebP) with a maximum file size of 5 MB
- **FR-013**: System MUST allow library owners (not regular staff) to invite, view, and remove staff members for their library
- **FR-013a**: System MUST allow library owners to promote a staff member to owner role
- **FR-013b**: System MUST only allow an owner to demote themselves to staff (self-demote); owners cannot demote other owners
- **FR-014**: System MUST prevent removal or self-demotion of the last owner from a library — at least one owner must remain
- **FR-015**: System MUST immediately revoke a removed staff member's access to the library's management area
- **FR-016**: System MUST allow admins to suspend active libraries with a recorded reason
- **FR-017**: System MUST allow admins to reactivate suspended libraries
- **FR-018**: System MUST allow superadmins to archive libraries
- **FR-019**: System MUST record every status change in a history log with the acting user, timestamp, previous status, new status, and reason
- **FR-020**: System MUST hide suspended, rejected, archived, draft, and pending approval libraries from public search and browsing
- **FR-021**: System MUST display a public storefront page for active libraries showing their profile information
- **FR-022**: System MUST display an appropriate "unavailable" message for suspended library URLs instead of a 404
- **FR-023**: System MUST block suspended libraries from publishing new content (books, listings)
- **FR-024**: System MUST allow library owners (not regular staff) to configure operational settings including shipping preferences and return policies
- **FR-025**: System MUST support both Arabic and English for all library management and storefront interfaces
- **FR-026**: System MUST allow a registered user to own multiple libraries
- **FR-027**: System MUST prevent a library from becoming active if its owner's account is suspended
- **FR-028**: System MUST allow existing orders to continue fulfillment when a library is suspended, while blocking new orders

### Key Entities

- **Library**: Represents a vendor storefront on the platform — name, slug (globally unique), description, logo, banner image, address, contact info, social links, supported languages, policies, current status, and owner reference
- **Library Status History**: An audit log of all status transitions for a library — previous status, new status, reason, acting user, and timestamp. Immutable once created.
- **Library Staff Membership**: Links a user to a library with a role within that library (owner or staff). Owners have full control over profile, settings, staff management, and catalog. Staff can edit the library profile and manage catalog/orders but cannot manage staff or change library settings. A user may have memberships in multiple libraries.
- **Library Settings**: Vendor-specific operational configuration — shipping preferences, return policies, and other configurable parameters scoped to a single library
- **Library Assets**: Media files associated with a library — logo and banner/cover images, with storage references, upload timestamps, and file metadata
- **Moderation Action**: A record of platform-initiated actions against a library — action type (suspend, reactivate, archive), reason, acting moderator, and timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of library creators complete the onboarding wizard (from start to submission) within 10 minutes
- **SC-002**: Admins can review and act on a pending library application in under 2 minutes
- **SC-003**: Library profile updates (including image uploads) save and display on the public storefront within 5 seconds
- **SC-004**: 100% of library status transitions are recorded in the audit history with actor, timestamp, and reason
- **SC-005**: 100% of non-active libraries are hidden from public search and browsing
- **SC-006**: Suspended libraries cannot publish any new content — 0% bypass rate
- **SC-007**: Staff removal takes effect within 3 seconds — removed staff cannot access any library resources after removal
- **SC-008**: All library management and storefront pages are fully functional in both Arabic (RTL) and English (LTR)
- **SC-009**: The public storefront page loads within 3 seconds for 95% of requests
- **SC-010**: System supports at least 1,000 active libraries concurrently without user-facing degradation

## Assumptions

- The authentication, role, and profile system from Phase 1 is fully operational, including user registration, role assignment, staff invitation mechanisms, and session management
- Library creators must be registered and authenticated users — guest users cannot create libraries
- The notification mechanism for informing creators of approval/rejection decisions will use the same channel established for other platform notifications (initially in-app; email notifications may be added later)
- A registered user can own more than one library with no upper limit in this phase; limits may be introduced later if needed
- Shipping preferences configured at the library level are informational settings for this phase; actual shipping calculation logic is deferred to Phase 6 (Commerce)
- Coupon creation at the library level is out of scope for this phase and will be addressed in Phase 6
- The public storefront page in this phase displays library profile information only; book listings will appear when Phase 3 (Catalog) is complete
- Image processing (resizing, optimization) is desirable but not required for initial release — original uploaded images may be served directly
- Admin and superadmin dashboards for the approval queue reuse the shared dashboard shell and component patterns established in Phase 0
- Library slug customization is offered during creation only; later changes require going through the library settings page and are subject to uniqueness validation
