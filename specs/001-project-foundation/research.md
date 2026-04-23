# Research: Project Foundation and Architecture

**Date**: 2026-04-23
**Branch**: `001-project-foundation`

## 1. Internationalization & RTL Strategy

**Decision**: Use `next-intl` with URL prefix routing (`/en`, `/ar`) and middleware-based locale detection.

**Rationale**: `next-intl` is the leading i18n library for Next.js App Router (2025-2026). It provides:
- Native App Router support with server components
- Message compilation and type-safe translation keys
- Middleware for automatic locale detection and redirect
- Built-in support for `dir` attribute switching based on locale

**Alternatives considered**:
- `next-i18next`: Designed for Pages Router; App Router support is an afterthought. Rejected.
- Built-in Next.js i18n: Removed in App Router; only existed for Pages Router. Not applicable.
- Cookie-only routing (no URL prefix): Rejected because URL-based locales are better for SEO, shareable links, and SSR cache keying.

**RTL/LTR switching**: Use Tailwind CSS built-in `rtl:` variant (available since Tailwind v3.3+). The `dir` attribute on `<html>` is set by the locale layout, and Tailwind's `rtl:` modifier handles directional styles. Use logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) as defaults; use `rtl:` only when logical properties are insufficient.

**Locale persistence**: Cookie (`NEXT_LOCALE`) set by middleware. URL prefix is the source of truth; cookie is used for default redirect on `/` only.

**Structure**:
```
messages/
  en.json
  ar.json
src/
  i18n/
    request.ts      # next-intl server config
    routing.ts      # locale routing config
  middleware.ts      # locale detection + redirect
```

## 2. Theme System

**Decision**: Use `next-themes` with cookie-based persistence and Tailwind `dark:` class strategy + CSS variables for semantic tokens.

**Rationale**: `next-themes` is the de facto standard for Next.js theme management. It handles:
- SSR-safe theme detection (no hydration mismatch)
- Flash prevention via inline `<script>` injection before first paint
- System preference detection and override
- Cookie persistence for server-side access

**Implementation pattern**:
- Set `attribute="class"` so Tailwind `dark:` variants work
- Set `suppressHydrationWarning` on `<html>`
- Define semantic CSS variables in `:root` and `.dark` selectors
- Store preference in cookie for SSR awareness + localStorage fallback

**Alternatives considered**:
- Custom implementation: Requires significant effort to handle FOIT, hydration, and SSR. Rejected for Phase 0.
- CSS `prefers-color-scheme` media query only: Doesn't support user override. Rejected.
- localStorage only: Breaks SSR theme matching, causing flash. Rejected.

## 3. Shared Component Library

**Decision**: Use `shadcn/ui` (copy-paste components built on Radix UI + Tailwind) with `class-variance-authority` (CVA) for variant management.

**Rationale**: shadcn/ui provides:
- Full ownership of component code (no library lock-in)
- Built on Radix UI primitives (accessible, unstyled headless components)
- Tailwind-native styling
- Covers all required components from FR-005
- Active ecosystem with regular updates
- CVA provides type-safe variant management

**RTL considerations**:
- Radix UI components respect `dir` attribute on parent elements
- Manual audit needed for directional components (Drawer, Sheet, Tabs)
- Use logical CSS properties in component overrides
- Test all components in both LTR and RTL

**Directory structure**: Grouped by semantic category for discoverability:
```
src/components/ui/
  form/        # Button, Input, Textarea, Select, Checkbox, Radio
  layout/      # Modal, Dialog, Drawer, Sheet, Card
  data/        # Table, Pagination, List
  navigation/  # Tabs, FilterControls
  feedback/    # Badge, EmptyState, Skeleton, ErrorBoundary, LoadingSpinner
```

**Alternatives considered**:
- Radix UI directly (no shadcn): More boilerplate for styling. Rejected.
- Build from scratch: Too slow; solved problem. Rejected.
- Material UI / Chakra UI: Heavier runtime, harder to customize for RTL. Rejected.

## 4. Project Structure

**Decision**: Domain-driven modular architecture per constitution Principle I.

**Rationale**: The PLAN.md defines 12 phases with distinct business domains. Organizing by domain from Phase 0 ensures each phase adds to its own isolated directory without touching shared foundations.

**Structure**:
```
src/
  app/                    # Next.js App Router pages
    [locale]/             # Locale-prefixed routes
      (public)/           # Public route group
      (auth)/             # Auth route group (Phase 1)
      (dashboard)/        # Dashboard route group
        layout.tsx        # Dashboard shell
      layout.tsx          # Root locale layout
      page.tsx            # Home page
    layout.tsx            # Root layout (html, body, providers)
  components/
    shared/               # Cross-domain reusable components
    ui/                   # shadcn/ui component library
  features/               # Domain modules (empty in Phase 0)
  lib/                    # Shared utilities
    config/               # Environment validation
    i18n/                 # Internationalization setup
    utils/                # General utilities
  types/                  # Shared TypeScript types
  schemas/                # Shared Zod schemas
  providers/              # React context providers
messages/                 # i18n translation files
  en.json
  ar.json
```

## 5. Environment Validation

**Decision**: Use Zod for environment variable validation in a centralized `src/lib/config/env.ts` module.

**Rationale**: Per constitution Principle III (Type Safety First), Zod schemas validate all external boundaries. Environment variables are an external boundary. A centralized module:
- Fails fast at startup with descriptive errors
- Provides typed access to all env vars
- Prevents scattered `process.env` access

**Required variables for Phase 0**:
- `NEXT_PUBLIC_SUPABASE_URL` (URL format)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (non-empty string)
- `SUPABASE_SERVICE_ROLE_KEY` (non-empty string, server-only)

## 6. Code Quality Tooling

**Decision**: ESLint + Prettier + Husky + lint-staged for pre-commit enforcement.

**Rationale**: Per constitution quality gates, code MUST pass linting and formatting before commit. Husky Git hooks + lint-staged ensure this automatically.

**Configuration**:
- ESLint: `next/core-web-vitals` + `@typescript-eslint/strict`
- Prettier: Tailwind plugin for class sorting
- Husky: Pre-commit hook running lint-staged
- lint-staged: ESLint fix + Prettier format on staged files

## 7. Testing Configuration

**Decision**: Vitest for unit tests + Playwright for E2E tests.

**Rationale**: Vitest is faster than Jest, natively supports TypeScript and ESM, and integrates well with the Vite ecosystem. Playwright handles cross-browser E2E testing including RTL layout verification.

**Test structure**:
```
tests/
  unit/          # Vitest unit tests
  e2e/           # Playwright E2E tests
  integration/   # Integration tests
```
