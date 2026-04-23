# Multi-Vendor Library Marketplace — Phase Implementation Plan

## Purpose

This document is the implementation roadmap for building a **multi-vendor ecommerce marketplace for libraries selling physical books and ebooks** using:

* **Next.js**
* **TypeScript**
* **Tailwind CSS**
* **Supabase** (Postgres, Auth, Storage, Realtime)
* **goey-toast** for toast notifications
* **Spec Kit** as the implementation workflow

This plan is intended to be used with AI during implementation. Each phase should be treated as a **separate Spec Kit feature spec** and implemented independently with clear boundaries.

---

# 1. Product Summary

## Core Product Idea

Build a scalable marketplace where multiple libraries can:

* create storefronts
* list physical books and ebooks
* manage inventory and orders
* create coupons and discounts
* chat with customers
* notify followers when new books are published

Users can:

* search globally from the header
* discover books by title, author, year, genre, library, and related metadata
* follow libraries, genres, or categories
* purchase physical books and ebooks
* receive notifications
* chat with library staff
* manage profiles, orders, downloads, and preferences

Platform roles:

* **User**
* **Library Staff**
* **Admin**
* **Superadmin**

---

# 2. Guiding Principles

## Architecture Principles

* Search-first product design
* Stable and maintainable modular architecture
* Secure access through Supabase RLS and strict role boundaries
* Arabic and English support from the beginning
* LTR and RTL support from the beginning
* Dark and light theme support from the beginning
* Realtime UX must always have durable database persistence
* AI-generated content must remain reviewable by humans before publication
* Physical books and ebooks must be supported in one coherent domain model
* Every role must have a dedicated dashboard experience

## Delivery Principles

* Each phase = one feature spec
* Each phase must be independently testable
* No phase should depend on unfinished hidden assumptions
* Data model must be migration-safe
* Shared UI and shared domain utilities should be created early
* Avoid building complex dashboards before role boundaries are stable

---

# 3. Recommended Spec Kit Workflow Per Phase

For each phase, run this sequence:

1. `constitution` only once at project start
2. `specify`
3. `clarify`
4. `plan`
5. `tasks`
6. `analyze`
7. `implement`

## Working Rule

Each phase should have:

* one focused branch
* one focused feature spec
* explicit acceptance criteria
* explicit out-of-scope boundaries
* test coverage goals
* migration review if database changes are included

---

# 4. Global Feature Areas

The full system is divided into the following areas:

1. Foundation and architecture
2. Authentication and access control
3. Library/vendor management
4. Catalog and book management
5. AI-generated title and description workflow
6. Search and discovery
7. Cart, checkout, coupons, shipping, and orders
8. Fulfillment for physical books and ebooks
9. Chat and notifications
10. Dashboards for all roles
11. Hardening, analytics, moderation, and launch readiness

---

# 5. Recommended Phase Order

## Phase 0 — Foundation and Project Architecture

## Phase 1 — Authentication, Authorization, Roles, and Profiles

## Phase 2 — Library Vendor Onboarding and Store Management

## Phase 3 — Catalog Core: Books, Listings, Formats, Metadata, Media

## Phase 4 — AI Content Generation for Titles and Descriptions

## Phase 5 — Search, Suggestions, Filters, and Discovery

## Phase 6 — Cart, Checkout, Coupons, Shipping, and Orders

## Phase 7 — Fulfillment for Physical Books and Ebooks

## Phase 8 — Realtime Chat Between Users and Library Staff

## Phase 9 — Notification System and Follow Engine

## Phase 10 — Role-Based Dashboards

## Phase 11 — Hardening, Analytics, Moderation, and Production Readiness

---

# 6. Detailed Phase Plan

---

## Phase 0 — Foundation and Project Architecture

### Objective

Create a stable technical foundation so all future phases can be added without reworking core structure.

### Why This Phase Comes First

Everything depends on architecture, folder structure, environment handling, routing conventions, localization direction, shared UI, and Supabase setup.

### Main Goals

* Initialize project structure
* Define module boundaries
* Configure Next.js app architecture
* Configure Supabase connection strategy
* Set up Tailwind and theme system
* Set up RTL and LTR support
* Set up Arabic and English readiness
* Set up shared UI primitives
* Install and integrate goey-toast
* Create validation, error handling, and environment conventions
* Create testing baseline
* Create CI/lint/formatting standards

### Scope

#### In Scope

* App router structure
* Route groups
* base layout and nested layout system
* theme provider
* locale and direction helpers
* supabase client utilities
* server/client boundary rules
* shared form patterns
* shared modal/drawer/table patterns
* toast integration
* error boundary strategy
* loading and empty state conventions
* logging conventions

#### Out of Scope

* Business features
* Search logic
* Checkout logic
* Chat logic
* Notification logic

### Recommended Technical Decisions

* Use a modular structure by domain, not by page only
* Separate `app`, `features`, `components`, `lib`, `types`, `schemas`, and `services`
* Keep Supabase access wrapped through typed helpers
* Use schema validation for server actions and API handlers
* Define a reusable permission-check utility layer
* Define bucket naming strategy early
* Define database migration naming rules early

### Deliverables

* base app shell
* route skeleton
* theme toggle
* direction toggle support
* locale-aware layout setup
* shared form input library
* shared table/list/card layout patterns
* toast system wired globally
* base dashboard shell layout
* environment validation utility
* test runner configuration
* lint/format config
* CI baseline

### Required Outputs

* architecture document
* folder structure rules
* naming conventions
* route naming rules
* component design conventions
* shared hooks conventions
* data fetching conventions

### Acceptance Criteria

* App can run in dev and production mode
* Theme switches correctly
* Layout direction can switch correctly
* Shared components work consistently
* Toasts render correctly in all layouts
* Environment variables are validated on startup
* Supabase client utilities are reusable and typed

### AI Implementation Notes

When implementing with AI, require it to:

* preserve module boundaries
* avoid creating feature-specific hacks in shared folders
* avoid mixing UI logic and data access logic
* avoid direct environment variable access outside centralized config

---

## Phase 1 — Authentication, Authorization, Roles, and Profiles

### Objective

Build the complete identity and access layer for all platform actors.

### Main Goals

* Credentials auth
* Google OAuth
* Email OTP verification/passwordless option
* Password reset for credentials accounts only
* Role-aware route protection
* Profile creation and editing
* Profile image upload
* Role assignment model
* User onboarding flow
* Staff invitation flow
* Superadmin bootstrapping

### User Types

* Guest
* Registered User
* Library Staff
* Admin
* Superadmin

### Core Requirements

* User can register using email/password
* User can sign in using Google OAuth
* User can verify email using OTP/email confirmation
* Credentials users can reset password
* Google-only users must not see password reset UI
* Users can upload avatar image
* Users have profile settings
* Users are redirected based on role
* Staff can be invited to a library
* Superadmin has full system control

### Data Model Areas

* profiles
* roles
* user_role_assignments
* libraries
* library_staff_memberships
* auth_provider_metadata
* profile_images

### Permission Model

* User: owns personal profile, orders, downloads, follows, chats
* Library Staff: manages assigned library resources only
* Admin: platform operational controls with limited governance
* Superadmin: full governance over platform configuration and all entities

### Deliverables

* sign up page
* sign in page
* Google auth callback handling
* email verification handling
* forgot password page
* reset password page
* profile settings page
* avatar upload flow
* role-aware protected routes
* staff invite flow
* role-based redirect middleware/guards

### Edge Cases

* Google account without local password
* user tries password reset for Google-only account
* invited staff email does not yet have account
* email already exists with another provider
* role conflict between multiple libraries
* suspended user tries to access protected area

### Acceptance Criteria

* All supported login flows work
* Role checks block unauthorized access
* Avatar upload works with secure storage policy
* Profile data persists correctly
* Password reset is only shown when valid
* Staff invitation and acceptance works

### AI Implementation Notes

Require AI to:

* separate auth UI from role/permission logic
* never rely on client-only role checks for security
* keep provider-specific logic isolated
* keep onboarding flows idempotent

---

## Phase 2 — Library Vendor Onboarding and Store Management

### Objective

Allow libraries to become managed sellers on the platform.

### Main Goals

* Create library storefronts
* Approve/reject seller onboarding
* Manage library profile
* Manage library settings
* Manage staff members
* Define store status
* Control visibility and moderation states
* Configure shipping override settings
* Allow store-level coupon creation later

### Store States

* draft
* pending approval
* active
* suspended
* rejected
* archived

### Library Profile Fields

* name
* slug
* description
* logo
* cover/banner image
* address/contact
* social/contact links
* languages
* policies
* shipping preferences

### Data Model Areas

* libraries
* library_status_history
* library_staff_memberships
* library_settings
* library_assets
* moderation_actions

### Deliverables

* create library flow
* library onboarding wizard
* admin approval queue
* staff assignment management
* public library profile/storefront page skeleton
* library settings page
* moderation controls for admin/superadmin

### Key Rules

* One library can have multiple staff members
* Only authorized staff can manage their own library
* Admin can review and moderate libraries
* Superadmin can override all library states

### Acceptance Criteria

* Library can be created and edited
* Staff membership rules work correctly
* Admin can approve/reject/suspend store
* Public library page reflects store status correctly
* Suspended libraries cannot publish new books

### AI Implementation Notes

Require AI to:

* keep public storefront data separate from internal operational settings
* avoid mixing moderation actions with editable business data
* preserve audit history for all state changes

---

## Phase 3 — Catalog Core: Books, Listings, Formats, Metadata, Media

### Objective

Build the core marketplace catalog that supports physical books and ebooks.

### Main Goals

* Create canonical book content model
* Create vendor-owned listing model
* Support physical books
* Support ebooks
* Support mixed vendor catalog
* Manage metadata like title, author, year, language, genre, library, publisher
* Manage cover images and digital assets
* Manage listing states
* Manage stock for physical books
* Manage access control for ebook files

### Recommended Domain Model

#### Canonical Content

* books
* authors
* genres
* publishers
* languages

#### Vendor Selling Layer

* listings
* listing_formats
* inventory
* pricing
* library_book_associations

#### Assets

* book_covers
* ebook_files
* preview_assets

### Listing Types

* physical only
* ebook only
* both

### Listing Statuses

* draft
* pending review
* published
* unpublished
* archived

### Metadata Requirements

* title
* subtitle if needed
* author(s)
* publisher
* publication year
* library/vendor
* genre/category
* language
* ISBN if available
* format availability
* description
* cover image
* ebook asset if applicable
* stock if physical

### Deliverables

* create/edit book workflow
* create/edit listing workflow
* upload cover image flow
* upload ebook file flow
* listing status management
* stock management basics
* public product page skeleton
* vendor catalog management page

### Storage Design

* bucket for avatars
* bucket for public book covers or controlled covers
* private bucket for ebook files
* optional temporary processing bucket

### Security Rules

* only authorized library staff can upload/edit their library files
* ebook files must never be publicly exposed without authorization
* product visibility must depend on publish status and seller status

### Acceptance Criteria

* Library staff can create books and listings
* Physical and ebook products can both exist
* File access control works correctly
* Metadata is saved and editable
* Published products appear in storefront and search-ready read model

### AI Implementation Notes

Require AI to:

* keep canonical book data separate from listing data
* avoid duplicating business logic across product forms
* isolate upload logic from metadata save logic
* create explicit format-specific validation

---

## Phase 4 — AI Content Generation for Titles and Descriptions

### Objective

Add AI-assisted content generation for product titles and descriptions with human review.

### Main Goals

* Generate title suggestions
* Generate product description suggestions
* Support Arabic and English generation
* Allow regeneration
* Allow manual editing
* Track prompt/output history
* Track approval state before publication
* Prevent blind auto-publish of AI text

### Core Rules

* AI can suggest content
* Human must review content before final publication
* Generated content should be stored separately from final approved content
* Every generation attempt should be auditable

### Data Model Areas

* ai_generation_requests
* ai_generation_results
* listing_content_drafts
* content_approval_history

### UX Requirements

* “Generate title” action
* “Generate description” action
* language selection or auto-detection
* preview before apply
* edit before save
* restore previous generated version
* compare generated vs final

### Quality Rules

* avoid misleading claims
* avoid made-up metadata not provided by seller
* allow generation based only on known structured fields
* allow regeneration with tone or style options if added later

### Deliverables

* AI generation service wrapper
* generation request UI in listing editor
* approval workflow fields
* history panel for generated outputs
* apply-to-draft flow

### Acceptance Criteria

* Staff can generate and review title/description suggestions
* Generated content can be edited before publishing
* Generation history is stored
* Published content always reflects approved final text

### AI Implementation Notes

Require AI to:

* never overwrite approved content without explicit action
* never assume unknown book facts
* keep generated text workflow isolated from core listing save workflow

---

## Phase 5 — Search, Suggestions, Filters, and Discovery

### Objective

Build the search-first discovery engine and make global header search the primary navigation mechanism.

### Main Goals

* Global search in header
* Search by title, author, year, library, genre, language, and related metadata
* Search suggestions/autocomplete
* Search filters
* Search ranking and relevance
* Wrong keyboard-layout correction
* Arabic/English normalization
* Typo tolerance
* Search analytics hooks
* Empty-state recovery suggestions

### Required Search Behavior

Users should be able to find books using:

* exact title
* partial title
* author name
* year
* library name
* genre/category
* mixed keywords
* misspellings
* wrong keyboard-layout input
* Arabic query for English content if handled through normalization paths
* English query for Arabic content if supported through normalization/transformation

### Example

Input like `;jhf hgpqhvi` should be recoverable as intended Arabic query when possible.

### Search Components

* header search bar
* suggestions dropdown
* search result page
* filters sidebar or sheet
* sort controls
* recent searches/history
* zero-results recovery panel

### Filters

* library
* genre
* category
* language
* format: physical / ebook / both
* year
* price range
* availability

### Data Model Areas

* search_index or searchable projection
* search_logs
* popular_searches
* recent_searches
* filter_aggregates

### Deliverables

* search input component
* query normalization pipeline
* search results page
* faceted filters
* suggestion engine
* keyboard-layout correction logic
* ranking logic baseline
* no-result fallback recommendations

### Performance Expectations

* fast response for header suggestions
* consistent ranking
* pagination or infinite loading
* scalable index/update strategy

### Acceptance Criteria

* Search can find books by all major metadata fields
* Suggestions are relevant
* Filters work predictably
* Wrong keyboard-layout input has recovery strategy
* Empty results offer useful fallback suggestions

### AI Implementation Notes

Require AI to:

* separate query preprocessing from ranking logic
* keep raw user query and transformed query both stored for analytics
* avoid tightly coupling UI filter state to backend query shape

---

## Phase 6 — Cart, Checkout, Coupons, Shipping, and Orders

### Objective

Implement the full ecommerce transaction flow.

### Main Goals

* Add to cart
* Manage cart
* Mixed-vendor carts
* Apply coupons
* Checkout flow
* Place orders
* Default shipping logic
* Admin shipping override
* Library-level shipping override where allowed
* Track order statuses
* Support physical and ebook purchasing in one commerce flow

### Commerce Rules

* Cart can contain items from multiple libraries
* Backend should support vendor separation even if checkout feels unified
* Coupons are usually library-scoped unless platform-wide promotions are added later
* Shipping must have a clear fallback hierarchy

### Shipping Hierarchy

1. platform default shipping
2. admin override
3. library-specific override if enabled

### Order Model Areas

* carts
* cart_items
* coupons
* coupon_rules
* coupon_redemptions
* orders
* order_groups or vendor order splits
* order_items
* shipping_rules
* payment placeholders or payment integration layer

### Deliverables

* cart page
* cart drawer or quick cart
* coupon apply/remove UX
* checkout page
* order placement flow
* order confirmation page
* order records and statuses
* shipping rule evaluation service

### Order Statuses

* pending
* paid
* processing
* fulfilled
* partially fulfilled
* cancelled
* refunded

### Edge Cases

* ebook-only order with no shipping
* mixed cart with physical and ebook items
* invalid coupon usage
* coupon expired or usage limit reached
* listing becomes unavailable during checkout
* library suspension during checkout

### Acceptance Criteria

* Cart supports multi-vendor items
* Coupons validate correctly
* Checkout creates valid orders and vendor splits
* Shipping is calculated according to hierarchy
* Ebook-only orders do not require physical shipment logic

### AI Implementation Notes

Require AI to:

* split vendor fulfillment concerns from checkout presentation
* keep coupon validation centralized
* keep pricing calculation deterministic and auditable
* isolate shipping strategy as a service, not page logic

---

## Phase 7 — Fulfillment for Physical Books and Ebooks

### Objective

Handle post-purchase delivery for both physical and digital products.

### Main Goals

* Physical book fulfillment lifecycle
* Ebook entitlement and secure delivery
* Download authorization
* Download limits or signed access strategy
* Order tracking states
* Customer access to purchased digital items

### Fulfillment Rules

#### Physical Books

* stock decrement after successful order policy
* shipment preparation
* shipment state updates
* delivery tracking placeholder if external carriers are added later

#### Ebooks

* access granted after successful purchase
* secure asset access
* private file delivery strategy
* optional signed URLs or controlled download endpoint
* access tied to ownership and order validity

### Data Model Areas

* inventory_movements
* fulfillment_records
* shipment_records
* ebook_entitlements
* download_logs
* access_tokens if needed

### Deliverables

* order detail fulfillment section
* my ebooks / downloads page
* secure download flow
* staff fulfillment controls for physical items
* admin/superadmin visibility into fulfillment state

### Acceptance Criteria

* Purchased ebooks are accessible only to authorized users
* Physical order fulfillment states can be updated
* Users can view order and entitlement status clearly
* Fulfillment records are auditable

### AI Implementation Notes

Require AI to:

* separate order placement from fulfillment logic
* never expose storage file paths directly for private ebook delivery
* centralize entitlement checks

---

## Phase 8 — Realtime Chat Between Users and Library Staff

### Objective

Provide support chat between customers and library staff using realtime updates with durable storage.

### Main Goals

* User-to-library chat
* Conversation threads
* Message persistence
* Realtime delivery
* Read states
* Presence indicators if added
* Role-safe access to conversation threads

### Conversation Model

* user starts chat with a library
* conversation belongs to library and user context
* library staff assigned to that library can respond
* only authorized participants can read messages

### Data Model Areas

* chat_threads
* chat_participants
* chat_messages
* message_reads
* presence or session metadata if needed

### Deliverables

* chat entry point on library/book/store pages
* chat inbox for user dashboard
* chat inbox for library staff dashboard
* thread view
* realtime message updates
* unread indicators

### Realtime Rules

* all messages must be stored in database
* websocket/realtime is for delivery experience, not sole persistence
* missed messages must still load from database

### Acceptance Criteria

* Users can start and continue conversations
* Staff can respond for their library only
* Messages persist and reload correctly
* Realtime updates work across clients

### AI Implementation Notes

Require AI to:

* keep thread authorization strict
* avoid direct realtime-only state dependence
* centralize message creation and permission checks

---

## Phase 9 — Notification System and Follow Engine

### Objective

Create a professional notification system tied to follows and important marketplace events.

### Main Goals

* Users can follow libraries
* Users can follow genres or categories
* Users receive notifications when followed entities publish relevant books
* Notification center stores persistent notifications
* Realtime delivery for live UX
* User notification preferences
* Read/unread tracking

### Event Sources

* library publishes a new book
* followed genre gets a new book
* followed category gets a new book
* order status changes
* chat message received
* admin/system notices if needed later

### Data Model Areas

* follows
* notification_preferences
* notifications
* notification_deliveries
* notification_reads
* event_dispatch_logs

### Deliverables

* follow/unfollow actions
* notification bell/dropdown
* notification center page
* read/unread handling
* notification preference settings
* notification dispatch pipeline

### Quality Rules

* no duplicate spam notifications
* rate limiting or batching strategy where needed
* durable persistence even if user was offline

### Acceptance Criteria

* Users can follow libraries and genres/categories
* Publishing a relevant book creates notifications correctly
* Notifications appear in realtime and in notification center
* Preferences affect delivery behavior correctly

### AI Implementation Notes

Require AI to:

* model notification events and delivery separately
* avoid mixing raw business events with rendered notification records
* create idempotent notification generation logic

---

## Phase 10 — Role-Based Dashboards

### Objective

Create dedicated dashboards for all actors with focused capabilities and correct permissions.

### Dashboard Types

#### User Dashboard

* profile
* orders
* downloads
* follows
* chats
* notifications
* saved/recent searches if included

#### Library Staff Dashboard

* library overview
* catalog management
* listing editor
* inventory
* coupons
* orders
* fulfillment
* chats
* basic customer interaction data

#### Admin Dashboard

* seller approvals
* moderation queue
* shipping overrides
* operational reports
* content/system management controls

#### Superadmin Dashboard

* full system control
* role management
* library governance
* platform settings
* analytics overview
* audit logs
* emergency moderation actions

### Main Goals

* clear navigation by role
* no permission leakage
* reusable dashboard shell
* role-aware sidebars and route groups
* scalable information architecture

### Deliverables

* dashboard home pages by role
* dashboard navigation structure
* permission-aware action controls
* overview widgets and key tables
* route guards and visibility rules

### Acceptance Criteria

* each role sees only allowed areas
* dashboards are usable and structured
* important workflows are reachable within few steps
* dashboard layouts are responsive and direction-aware

### AI Implementation Notes

Require AI to:

* avoid duplicating dashboard shells across roles
* separate view composition from permission checks
* prefer shared primitives with role-specific configuration

---

## Phase 11 — Hardening, Analytics, Moderation, and Production Readiness

### Objective

Prepare the platform for stable production operation.

### Main Goals

* performance optimization
* observability
* audit logging
* moderation tools
* search analytics
* abuse prevention
* migration safety
* backup/rollback thinking
* test expansion
* launch readiness checklist

### Areas to Harden

* auth flows
* permission boundaries
* search performance
* file access security
* checkout calculations
* coupon edge cases
* chat abuse prevention
* notification duplication prevention
* role escalation prevention

### Analytics Areas

* search queries and no-result patterns
* conversion funnel
* coupon usage
* follow-to-click behavior
* book publication performance
* notification engagement

### Operational Features

* audit logs for sensitive actions
* admin moderation actions history
* seller suspension and recovery process
* flagged content or suspicious behavior review

### Deliverables

* audit logging layer
* analytics event map
* moderation tools
* performance review and optimization pass
* test coverage report
* production checklist

### Acceptance Criteria

* critical paths are observable
* risky actions are auditable
* role/security regressions are covered by tests
* launch blockers are documented and addressed

### AI Implementation Notes

Require AI to:

* treat hardening as a real implementation phase, not cleanup only
* add structured instrumentation rather than console-only logs
* preserve backward-compatible migration strategy

---

# 7. Cross-Phase System Design Notes

## Search Is a Core Domain

Search should not be treated as a simple filter on raw tables forever. Plan for a searchable projection or index-oriented read model.

## AI Must Be Reviewable

AI-generated titles and descriptions should remain editable and auditable. Final published content should always be explicit.

## Physical and Ebook Logic Should Share a Core Domain but Not Identical Fulfillment

Use one catalog model with format-specific validation and fulfillment behavior.

## Realtime Must Not Replace Persistence

Chat and notifications must be stored in the database. Realtime only improves delivery and UX.

## Role Security Must Be Enforced at Database and Server Layers

Do not depend on client-side checks only.

## Storage Must Be Separated by Asset Type

Use separate storage strategies for avatars, covers, and ebook files.

---

# 8. Suggested Shared Database Domains

These are the high-level domains that will likely exist across phases:

* profiles
* roles
* libraries
* library_staff_memberships
* books
* authors
* genres
* publishers
* listings
* inventory
* pricing
* assets
* ai_generation_requests
* search_index
* follows
* notifications
* chat_threads
* chat_messages
* carts
* coupons
* orders
* fulfillment
* audit_logs

This list is conceptual and should be refined during planning per phase.

---

# 9. Suggested Shared UI Areas

Build these reusable UI foundations early:

* app shell
* dashboard shell
* forms
* modal/dialog
* drawer/sheet
* table
* card/list layouts
* pagination
* filter controls
* tabs
* status badges
* empty states
* loading states
* error states
* toast notifications

---

# 10. Suggested Testing Strategy by Phase

## Minimum Testing Expectations

Every phase should define:

* unit tests for domain logic
* integration tests for data flow
* permission tests for protected actions
* UI tests for critical forms/pages if appropriate

## Highest Priority Test Areas

* auth and role boundaries
* library ownership boundaries
* file access boundaries
* search transformation and filtering
* coupon validation
* checkout calculations
* ebook entitlement checks
* chat thread authorization
* notification generation idempotency

---

# 11. Suggested AI Usage Rules During Implementation

When using AI to implement phases, enforce these rules:

1. Implement one phase at a time
2. Do not allow AI to redesign earlier completed foundations without explicit reason
3. Require clear file-level changes and migration notes
4. Require tests for every critical business rule
5. Require permission checks for every protected action
6. Require edge-case handling for multilingual and mixed-format product behavior
7. Require separation of domain services from UI components
8. Require explicit out-of-scope respect
9. Require migration-safe database changes
10. Require documentation updates when shared behavior changes

---

# 12. Recommended Delivery Sequence for AI

Use this order during implementation:

1. Foundation
2. Auth and roles
3. Vendor onboarding
4. Catalog core
5. AI content generation
6. Search
7. Commerce
8. Fulfillment
9. Chat
10. Notifications
11. Dashboards
12. Hardening

Reason:

* foundation stabilizes architecture
* auth stabilizes access
* vendor model stabilizes ownership
* catalog stabilizes what is being sold
* AI generation depends on catalog
* search depends on catalog structure
* commerce depends on catalog and seller model
* fulfillment depends on commerce
* chat and notifications depend on user/library interactions
* dashboards should reflect mature workflows
* hardening comes after core flows exist

---

# 13. Final Implementation Advice

## Start Small but Correct

Do not try to build everything together. Build the correct core once, then extend it.

## Protect Boundaries Early

The biggest long-term risks are:

* permission leakage
* mixed concerns in the data model
* weak search design
* insecure ebook delivery
* realtime features without persistence

## Keep Search High Priority

Because search is central to the product, it should be planned and tested like a core business engine.

## Treat Dashboards as Operational Surfaces, Not Just Pages

Dashboards should reflect business responsibilities and permissions, not only navigation.

## Treat AI as Assisted Authoring, Not Autonomous Publishing

This keeps quality, control, and trust high.

---

# 14. Recommended Next Step

Begin with:

* **Phase 0** if the project foundation does not exist yet
* **Phase 1** immediately after the foundation is stable

If implementation is AI-assisted, use this document as the master roadmap and create one Spec Kit feature workflow per phase.