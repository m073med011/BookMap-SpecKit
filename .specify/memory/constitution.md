<!--
  Sync Impact Report
  ==================================================
  Version change: 0.0.0 → 1.0.0 (MAJOR — initial ratification)
  
  Modified Principles: N/A (first version)
  
  Added Sections:
    - Core Principles (8 principles)
    - Technology Stack & Constraints
    - Development Workflow & Quality Gates
    - Governance
  
  Removed Sections: N/A
  
  Templates Requiring Updates:
    - .specify/templates/plan-template.md — Constitution Check section
      will reference these principles ✅ (compatible as-is; gates
      filled per feature)
    - .specify/templates/spec-template.md — Requirements section
      references FR/SC patterns ✅ (compatible)
    - .specify/templates/tasks-template.md — Phase structure
      aligns with constitution workflow ✅ (compatible)
  
  Follow-up TODOs: None
  ==================================================
-->

# BookMap Marketplace Constitution

## Core Principles

### I. Domain-Driven Modular Architecture

All code MUST be organized by business domain, not by technical
layer alone. Each domain (auth, catalog, commerce, chat,
notifications) MUST have its own directory containing models,
services, types, schemas, and components scoped to that domain.
Shared utilities live in dedicated `lib/` and `components/shared/`
directories. Cross-domain imports MUST flow through explicit public
interfaces, never internal module paths.

**Rationale**: A multi-vendor marketplace with 12 phases of
incremental delivery requires boundaries that prevent coupling
between independent feature areas. Domain isolation enables
parallel development, independent testing, and safe refactoring.

### II. SOLID Principles & Clean Code (NON-NEGOTIABLE)

All implementation code MUST adhere to SOLID principles:

- **Single Responsibility**: Each module, class, and function MUST
  have one reason to change.
- **Open/Closed**: Domain services MUST be extensible through
  composition and interfaces, not modification of existing code.
- **Liskov Substitution**: Subtypes MUST be substitutable for their
  base types without altering program correctness.
- **Interface Segregation**: Consumers MUST NOT depend on methods
  they do not use. Prefer small, focused interfaces.
- **Dependency Inversion**: High-level domain logic MUST NOT depend
  on low-level infrastructure directly. Use typed abstractions
  (e.g., repository interfaces, service contracts).

Functions MUST be short, named clearly, and free of side effects
where possible. No dead code, no commented-out code in production.

### III. Type Safety First (NON-NEGOTIABLE)

TypeScript strict mode MUST be enabled (`strict: true`). All
function signatures, return types, props, and API boundaries MUST
have explicit type annotations. `any` is FORBIDDEN except in
third-party type shims with a justifying comment. Zod schemas MUST
validate all external boundaries: API inputs, form submissions,
environment variables, and Supabase query results. Database types
MUST be generated from the Supabase schema and kept in sync.

**Rationale**: A marketplace handling payments, ebook access, and
multi-role permissions cannot tolerate runtime type errors. Static
types catch integration mismatches before deployment.

### IV. Security by Design (NON-NEGOTIABLE)

- All authorization MUST be enforced at the database layer via
  Supabase RLS policies. Client-side checks are UX conveniences,
  never security boundaries.
- Every server action and API route MUST validate the caller's role
  and ownership before performing mutations.
- Ebook files MUST be stored in private buckets with signed URL
  access tied to verified entitlements.
- User input MUST be validated and sanitized at system boundaries.
  No raw interpolation into queries or HTML.
- Secrets and credentials MUST never appear in client bundles,
  logs, or version control.
- OWASP Top 10 vulnerabilities (XSS, CSRF, SQL injection, broken
  access control) MUST be actively prevented in every phase.

### V. Separation of Concerns

- UI components MUST NOT contain data-fetching or business logic.
  Data flows through server actions, API routes, or dedicated
  service modules.
- Server/client boundary MUST be explicit. Files using Supabase
  admin or server-only APIs MUST NOT be importable from client
  components.
- Database access MUST be wrapped in typed repository or service
  functions. No raw Supabase queries in page or component files.
- Presentation, domain logic, and infrastructure MUST occupy
  distinct layers within each domain module.

### VI. Internationalization & Accessibility from Day One

- All user-facing text MUST be externalized for Arabic and English
  from the first implementation.
- Layout MUST support RTL and LTR switching without conditional
  CSS hacks; use logical CSS properties (`inline-start`,
  `inline-end`) and Tailwind RTL utilities.
- Theme system MUST support dark and light modes via CSS variables
  and Tailwind `dark:` variants.
- Interactive elements MUST be keyboard accessible and use semantic
  HTML or appropriate ARIA attributes.

### VII. Realtime with Durable Persistence

All data displayed to users (chat messages, notifications, order
statuses) MUST be persisted to the database as the source of truth
BEFORE any realtime broadcast. Supabase Realtime subscriptions are
delivery optimizations, never primary storage. Clients MUST
hydrate from database on mount and treat realtime events as
incremental updates. Missed messages during disconnection MUST be
recoverable from the database.

### VIII. Migration-Safe Incremental Delivery

Each phase MUST be deliverable on its own branch with:

- Forward-compatible database migrations (additive columns,
  new tables; no destructive changes to existing schemas without
  an explicit migration plan).
- No dependency on unimplemented phases. Feature flags or graceful
  degradation MUST handle missing downstream features.
- Backward-compatible API contracts. Existing endpoints MUST NOT
  break when new phases are merged.

## Technology Stack & Constraints

**Framework**: Next.js (App Router) with TypeScript  
**Styling**: Tailwind CSS with CSS variables for theming  
**Backend/Database**: Supabase (PostgreSQL, Auth, Storage, Realtime)  
**Validation**: Zod for schema validation at all boundaries  
**Notifications**: goey-toast for client-side toast messages  
**Languages**: Arabic (RTL) and English (LTR)  
**Roles**: User, Library Staff, Admin, Superadmin  

**Constraints**:

- All Supabase access MUST go through typed client utilities; no
  direct `createClient()` calls in feature code.
- Storage buckets MUST be separated by asset type: avatars, book
  covers (public), ebook files (private).
- Database migrations MUST follow sequential naming:
  `YYYYMMDDHHMMSS_descriptive_name.sql`.
- Environment variables MUST be validated at startup via a
  centralized config module.
- No feature MUST bypass the phase order defined in the master
  plan (PLAN.md) without explicit justification.

## Development Workflow & Quality Gates

**Phase Workflow** (per Spec Kit):

1. `specify` — write feature specification
2. `clarify` — resolve ambiguities
3. `plan` — design implementation approach
4. `tasks` — generate ordered task list
5. `analyze` — cross-artifact consistency check
6. `implement` — execute tasks

**Quality Gates**:

- Every phase MUST pass a constitution compliance check before
  implementation begins.
- Every protected action MUST have a corresponding permission
  test.
- Every database migration MUST be reviewed for backward
  compatibility.
- Every domain service MUST have unit tests for core business
  rules.
- Integration tests MUST cover: auth flows, role boundaries,
  file access policies, checkout calculations, and chat thread
  authorization.
- Code MUST pass linting (ESLint) and formatting (Prettier) checks
  before commit.
- No `console.log` in production code; use structured logging.

**Code Review Expectations**:

- Verify SOLID compliance and domain boundary respect.
- Verify RLS policy coverage for new tables.
- Verify type completeness (no implicit `any`).
- Verify i18n coverage for new user-facing strings.

## Governance

This constitution is the highest-authority document for the
BookMap Marketplace project. All implementation decisions, code
reviews, and architectural choices MUST comply with the principles
defined here.

**Amendment Procedure**:

1. Propose amendment with rationale and impact assessment.
2. Document which principles, templates, or phases are affected.
3. Update constitution with new version number.
4. Propagate changes to dependent templates and active specs.
5. Record amendment in the Sync Impact Report header.

**Versioning Policy**: Semantic versioning (MAJOR.MINOR.PATCH).
MAJOR for principle removals or redefinitions. MINOR for new
principles or materially expanded guidance. PATCH for
clarifications and typo fixes.

**Compliance Review**: Every phase implementation MUST include a
constitution check in its plan.md. Violations MUST be documented
in the Complexity Tracking table with justification.

**Version**: 1.0.0 | **Ratified**: 2026-04-23 | **Last Amended**: 2026-04-23
