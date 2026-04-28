# Phase 3 Catalog Core: Research & Decisions

## Context
The Catalog Core phase requires decisions on listing state transitions, canonical book constraints, publishing requirements, approval defaults, and genre structuring to ensure a stable implementation.

## Decisions

### 1. Listing Status Transitions
- **Decision**: Strict linear workflow (draft → pending review → published → unpublished → archived).
- **Rationale**: Prevents accidental state jumps and ensures review integrity.
- **Alternatives considered**: Flexible transitions (too error-prone), any-to-any (no safety rails).

### 2. Canonical Book Ownership & Uniqueness
- **Decision**: Library-scoped creation with soft ISBN deduplication.
- **Rationale**: Avoids complex shared-editing conflicts. System warns on ISBN duplicates but allows them. Admin merge deferred to a future phase.
- **Alternatives considered**: Shared global catalog (edit conflicts), fully isolated (no warnings).

### 3. Publishing Requirements (Cover Image)
- **Decision**: Cover image is mandatory for transitioning to "published".
- **Rationale**: Ensures quality and is standard for book marketplaces. Drafts can be saved without one.
- **Alternatives considered**: Optional with placeholder (lower quality catalog), warning only (ignored by users).

### 4. Default Listing Approval Policy
- **Decision**: Auto-approve by default, admin-toggleable per-library.
- **Rationale**: Frictionless initial experience for trusted libraries, with the ability to require manual review if flagged.
- **Alternatives considered**: Admin review required for all (bottleneck), trust-tiered (complex for v1).

### 5. Genre/Category Structure
- **Decision**: Single-level grouping (max 2 levels, e.g., "Fiction > Fantasy").
- **Rationale**: Balances simplicity with basic navigation hierarchy without the deep complexity of unlimited nesting.
- **Alternatives considered**: Flat list only (too limited), full tree hierarchy (too complex).
