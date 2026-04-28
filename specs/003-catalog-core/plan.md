# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

## Summary

The Catalog Core phase implements the foundational products for the marketplace. It establishes a canonical `books` table (for global metadata) and a separated `listings` table (owned by vendors) allowing multi-vendor sales of both physical and ebook formats. Metadata is enriched via joining tables for authors, publishers, and a single-level nested genre system. Cover images are handled via public storage while ebooks are secured via private storage and RLS. Strict state transition flows govern listing lifecycles.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript / Next.js
**Primary Dependencies**: Tailwind CSS, Supabase (Postgres, Auth, Storage), Zod, goey-toast
**Storage**: Supabase Postgres & Storage (Public `book_covers`, Private `ebook_files`)
**Testing**: Jest / Playwright
**Target Platform**: Web application (Desktop/Mobile responsive)
**Project Type**: Multi-vendor marketplace
**Performance Goals**: Catalog views must load < 300ms.
**Constraints**: All reads/writes must enforce Supabase RLS. File storage max formats defined (5MB covers, 100MB ebooks).
**Scale/Scope**: Dozens of vendors, thousands of listings. 

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Domain-Driven**: Catalog entities and UI live in `src/features/catalog/`.
- [x] **Type Safety**: Zod schemas defined for all forms and actions in `/contracts/`.
- [x] **Security**: Supabase RLS controls staff mutations and secure ebook access.
- [x] **Migration-Safe**: New schema tables added additively.
- [x] No constitution violations found.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/
│   └── (dashboard)/library/catalog/          # UI routes
├── features/
│   └── catalog/
│       ├── components/                       # Shared catalog components
│       ├── schemas/                          # Zod schemas
│       └── actions/                          # Server actions for catalog logic
└── lib/
    ├── supabase/                             # Reusable clients if touched
    └── actions/                              # Root generic actions
```

**Structure Decision**: Using Domain-Driven Modular Architecture (Option 1 equivalent for Next.js App Router). All logic is grouped in `src/features/catalog/` while routes live in `src/app/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
