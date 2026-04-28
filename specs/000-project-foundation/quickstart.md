# Quickstart: Project Foundation

## Prerequisites

- Node.js 20+
- pnpm (package manager)
- A Supabase project (URL + anon key + service role key)

## Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd bookmap
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. Start development server:
   ```bash
   pnpm dev
   ```

6. Open browser at `http://localhost:3000`

## Verification

After starting the dev server, verify:

- [ ] App loads with shell layout (header + navigation + content)
- [ ] Theme toggle switches between dark and light mode
- [ ] Language switch changes between English (LTR) and Arabic (RTL)
- [ ] Toast notification triggers correctly (visit `/en/demo` if available)
- [ ] Production build succeeds: `pnpm build`

## Available Commands

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `pnpm dev`      | Start development server                 |
| `pnpm build`    | Create production build                  |
| `pnpm start`    | Start production server                  |
| `pnpm lint`     | Run ESLint                               |
| `pnpm format`   | Run Prettier                             |
| `pnpm test`     | Run unit tests (Vitest)                  |
| `pnpm test:e2e` | Run E2E tests (Playwright)               |

## Project Structure

```
src/
  app/[locale]/          # Locale-prefixed routes
    (public)/            # Public pages
    (dashboard)/         # Dashboard shell
  components/
    shared/              # Cross-domain components
    ui/                  # shadcn/ui components
      form/              # Button, Input, Select, etc.
      layout/            # Modal, Drawer, Card, etc.
      data/              # Table, Pagination, List
      navigation/        # Tabs, FilterControls
      feedback/          # Badge, Skeleton, EmptyState, etc.
  lib/
    config/              # Environment validation
    supabase/            # Supabase client utilities
    i18n/                # Internationalization config
  providers/             # React context providers
  types/                 # Shared TypeScript types
  schemas/               # Shared Zod schemas
messages/
  en.json                # English translations
  ar.json                # Arabic translations
```
