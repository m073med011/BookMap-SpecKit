# Tasks: Project Foundation and Architecture

**Input**: Design documents from `specs/001-project-foundation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/component-api.md, quickstart.md

**Tests**: No test tasks — tests not explicitly requested in the feature specification. Test runner configuration is included as infrastructure.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js App Router)**: `src/app/`, `src/components/`, `src/lib/`, `src/providers/`, `src/types/`, `src/schemas/`
- **Messages**: `messages/` at repository root
- **Tests**: `tests/` at repository root
- **Config files**: repository root

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize the Next.js project, install all dependencies, configure TypeScript strict mode, and set up the base config files. After this phase, `pnpm dev` runs without errors showing the default Next.js page.

- [X] T001 Initialize Next.js project with TypeScript and pnpm. Run `pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` from the repository root. If the directory already has files, create in a temp folder and move the generated files. Ensure `package.json` exists with Next.js, React, and TypeScript as dependencies. Ensure `tsconfig.json` has `"strict": true`. Ensure `src/app/layout.tsx` and `src/app/page.tsx` exist. Verify the app starts with `pnpm dev`.

- [X] T002 Install all required dependencies. Run these exact commands from the repository root:
  ```
  pnpm add next-intl next-themes goey-toast class-variance-authority clsx tailwind-merge zod @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-slot @supabase/supabase-js @supabase/ssr
  ```
  ```
  pnpm add -D vitest @vitejs/plugin-react playwright @playwright/test husky lint-staged prettier prettier-plugin-tailwindcss @typescript-eslint/parser @typescript-eslint/eslint-plugin
  ```
  Verify `package.json` contains all listed packages. Do NOT install packages one at a time — use the exact batch commands above.

- [X] T003 [P] Configure TypeScript strict mode in `tsconfig.json`. Open `tsconfig.json` and ensure these compiler options are set: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"forceConsistentCasingInFileNames": true`. Ensure `"paths"` has `"@/*": ["./src/*"]`. Do NOT change any other settings that Next.js generated.

- [X] T004 [P] Create `.env.example` at repository root with these exact contents:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  ```
  Also create `.env.local` by copying `.env.example`. Add `.env.local` to `.gitignore` if not already present. Do NOT add `.env.example` to `.gitignore`.

- [X] T005 [P] Create the full directory structure. Run these mkdir commands from repository root:
  ```
  mkdir -p src/app/[locale]/(public)
  mkdir -p src/app/[locale]/(auth)
  mkdir -p src/app/[locale]/(dashboard)
  mkdir -p src/components/shared/app-shell
  mkdir -p src/components/ui/form
  mkdir -p src/components/ui/layout
  mkdir -p src/components/ui/data
  mkdir -p src/components/ui/navigation
  mkdir -p src/components/ui/feedback
  mkdir -p src/features
  mkdir -p src/lib/config
  mkdir -p src/lib/supabase
  mkdir -p src/lib/i18n
  mkdir -p src/lib/utils
  mkdir -p src/providers
  mkdir -p src/types
  mkdir -p src/schemas
  mkdir -p messages
  mkdir -p tests/unit
  mkdir -p tests/e2e
  mkdir -p tests/integration
  ```
  Place a `.gitkeep` file inside `src/features/` so the empty directory is tracked by git.

**Checkpoint**: `pnpm dev` starts successfully. `pnpm build` passes. TypeScript strict mode is active. All directories exist.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story work. This includes environment validation, utility functions, Supabase client wrappers, i18n configuration, theme provider, toast provider, and the root layout structure.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Create the `cn` utility function in `src/lib/utils/cn.ts`. This file exports a single function called `cn` that merges Tailwind CSS classes. It combines `clsx` for conditional classes and `twMerge` for deduplication. The exact implementation:
  ```typescript
  import { type ClassValue, clsx } from "clsx";
  import { twMerge } from "tailwind-merge";

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```
  This function is used by every UI component. Export it as a named export.

- [X] T007 [P] Create the Zod environment schema in `src/schemas/env.ts`. Define a Zod object schema called `envSchema` that validates:
  - `NEXT_PUBLIC_SUPABASE_URL`: `z.string().url()` with error message "NEXT_PUBLIC_SUPABASE_URL must be a valid URL"
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `z.string().min(1)` with error message "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"
  - `SUPABASE_SERVICE_ROLE_KEY`: `z.string().min(1)` with error message "SUPABASE_SERVICE_ROLE_KEY is required"
  Export the schema and its inferred TypeScript type as `EnvConfig`.

- [X] T008 Create the environment validation module in `src/lib/config/env.ts`. Import `envSchema` from `@/schemas/env`. Create a function `validateEnv()` that calls `envSchema.safeParse(process.env)`. If parsing fails, throw an error listing ALL missing/invalid variables (not just the first one). Format the error as: `"❌ Invalid environment variables:\n  - FIELD_NAME: error message\n  - FIELD_NAME: error message"`. If parsing succeeds, return the typed result. Export a const `env` that calls `validateEnv()` at module load time so the app fails fast on import. Also export the `validateEnv` function for testing.

- [X] T009 [P] Create shared TypeScript types in `src/types/index.ts`. Define and export these types:
  ```typescript
  export type Locale = "en" | "ar";
  export type Direction = "ltr" | "rtl";
  export type Theme = "light" | "dark" | "system";

  export const localeDirection: Record<Locale, Direction> = {
    en: "ltr",
    ar: "rtl",
  };

  export const locales: Locale[] = ["en", "ar"];
  export const defaultLocale: Locale = "en";
  ```

- [X] T010 Create the next-intl routing configuration in `src/lib/i18n/routing.ts`. Use `defineRouting` from `next-intl/routing` to configure:
  - `locales`: `["en", "ar"]`
  - `defaultLocale`: `"en"`
  Export the routing config as default. Also create and export `Link`, `redirect`, `usePathname`, and `useRouter` from `createNavigation(routing)` so all locale-aware navigation uses these instead of Next.js defaults.

- [X] T011 Create the next-intl request configuration in `src/lib/i18n/request.ts`. Use `getRequestConfig` from `next-intl/server`. The function receives `{ requestLocale }`, awaits it, validates it against the supported locales array, falls back to `"en"` if invalid, and returns `{ locale, messages: (await import(\`../../../messages/${locale}.json\`)).default }`. Export as default.

- [X] T012 [P] Create English translation file at `messages/en.json`. Include these translation keys organized by namespace:
  ```json
  {
    "common": {
      "appName": "BookMap",
      "loading": "Loading...",
      "error": "Something went wrong",
      "retry": "Try again",
      "close": "Close",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "search": "Search",
      "noResults": "No results found",
      "backToHome": "Back to home"
    },
    "theme": {
      "light": "Light",
      "dark": "Dark",
      "system": "System",
      "toggleTheme": "Toggle theme"
    },
    "locale": {
      "switchTo": "Switch to {locale}",
      "en": "English",
      "ar": "Arabic"
    },
    "nav": {
      "home": "Home",
      "dashboard": "Dashboard"
    },
    "errors": {
      "notFound": "Page not found",
      "notFoundDescription": "The page you are looking for does not exist.",
      "sectionError": "This section encountered an error.",
      "sectionErrorDescription": "The rest of the page is still working. Try refreshing this section."
    },
    "empty": {
      "title": "Nothing here yet",
      "description": "There is no content to display at this time."
    }
  }
  ```

- [X] T013 [P] Create Arabic translation file at `messages/ar.json`. Include the same keys as `messages/en.json` but with Arabic text:
  ```json
  {
    "common": {
      "appName": "بوك ماب",
      "loading": "جاري التحميل...",
      "error": "حدث خطأ ما",
      "retry": "حاول مجدداً",
      "close": "إغلاق",
      "save": "حفظ",
      "cancel": "إلغاء",
      "delete": "حذف",
      "edit": "تعديل",
      "search": "بحث",
      "noResults": "لا توجد نتائج",
      "backToHome": "العودة للرئيسية"
    },
    "theme": {
      "light": "فاتح",
      "dark": "داكن",
      "system": "النظام",
      "toggleTheme": "تبديل المظهر"
    },
    "locale": {
      "switchTo": "التبديل إلى {locale}",
      "en": "الإنجليزية",
      "ar": "العربية"
    },
    "nav": {
      "home": "الرئيسية",
      "dashboard": "لوحة التحكم"
    },
    "errors": {
      "notFound": "الصفحة غير موجودة",
      "notFoundDescription": "الصفحة التي تبحث عنها غير موجودة.",
      "sectionError": "حدث خطأ في هذا القسم.",
      "sectionErrorDescription": "بقية الصفحة تعمل بشكل طبيعي. حاول تحديث هذا القسم."
    },
    "empty": {
      "title": "لا يوجد شيء هنا بعد",
      "description": "لا يوجد محتوى لعرضه في الوقت الحالي."
    }
  }
  ```

- [X] T014 Create the locale middleware in `src/middleware.ts`. Import `createMiddleware` from `next-intl/middleware` and the routing config from `@/lib/i18n/routing`. Create and export default the middleware using `createMiddleware(routing)`. Also export a `config` object with `matcher` set to `["/((?!api|_next|_vercel|.*\\..*).*)"]` to exclude API routes, Next.js internals, and static files from locale processing.

- [X] T015 Create the ThemeProvider in `src/providers/ThemeProvider.tsx`. This is a client component (`"use client"`). Import `ThemeProvider as NextThemesProvider` from `next-themes`. Create and export a `ThemeProvider` component that wraps children with `NextThemesProvider` configured with: `attribute="class"`, `defaultTheme="system"`, `enableSystem={true}`, `disableTransitionOnChange={true}`. Accept `children: React.ReactNode` as the only prop.

- [X] T016 [P] Create the ToastProvider in `src/providers/ToastProvider.tsx`. This is a client component (`"use client"`). Import the toast container component from `goey-toast`. Create and export a `ToastProvider` component that renders the goey-toast container. It should accept `children: React.ReactNode` and render both the children and the toast container. Position toasts at `"top-right"`. If goey-toast uses a different API pattern, adapt accordingly — the key requirement is that calling `toast.success()` / `toast.error()` etc. works globally after this provider is mounted.

- [X] T017 [P] Create the Supabase browser client utility in `src/lib/supabase/client.ts`. This is a client-side module. Import `createBrowserClient` from `@supabase/ssr`. Create and export a function `createClient()` that returns `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`. The function creates a new client each time it is called (no singleton — per Supabase SSR best practices).

- [X] T018 [P] Create the Supabase server client utility in `src/lib/supabase/server.ts`. This is a server-side module. Import `createServerClient` from `@supabase/ssr` and `cookies` from `next/headers`. Create and export an async function `createClient()` that: (1) gets the cookie store via `await cookies()`, (2) creates and returns a Supabase server client with cookie get/set/remove handlers that delegate to the Next.js cookie store. Follow the official Supabase SSR pattern for Next.js App Router.

- [X] T019 Configure Tailwind CSS for dark mode and RTL in `src/app/globals.css`. Replace the default globals.css content with:
  - Tailwind directives: `@import "tailwindcss"`
  - CSS variable definitions in `@theme` block for semantic colors. Define variables for: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`.
  - Light mode values as defaults in `:root`
  - Dark mode overrides in `.dark` selector
  - Base styles: `body` uses `var(--background)` and `var(--foreground)`
  - Ensure all colors use the oklch or hsl color space for consistency with shadcn/ui patterns.
  Also update `tailwind.config.ts` (or equivalent Tailwind v4 config) to set `darkMode: "class"` if using Tailwind v3, or ensure the `dark:` variant works with class-based toggling in v4.

- [X] T020 Create the root layout in `src/app/layout.tsx`. This is a server component. It renders the outermost `<html>` and `<body>` tags. The `<html>` tag MUST have `suppressHydrationWarning` attribute (required by next-themes). Import and apply `globals.css`. Set metadata: `title: "BookMap"`, `description: "Multi-vendor book marketplace"`. Accept `children` and `params` props. The `children` will be the `[locale]` segment. Do NOT wrap with providers here — providers go in the locale layout. Apply a base font (use `next/font/google` to import Inter or a similar font). Body should have classes: `min-h-screen bg-background font-sans antialiased`.

- [X] T021 Create the locale layout in `src/app/[locale]/layout.tsx`. This is a server component. It receives `params: { locale: string }` and `children`. It MUST: (1) validate locale against supported locales, redirect to default if invalid, (2) import `NextIntlClientProvider` from `next-intl` and `getMessages` from `next-intl/server`, (3) await `getMessages()` to load translations, (4) determine direction from locale (`ar` → `rtl`, `en` → `ltr`), (5) set `dir` and `lang` attributes on a wrapper div or update the html element, (6) wrap children with `NextIntlClientProvider` passing `messages`, (7) wrap with `ThemeProvider`, (8) wrap with `ToastProvider`. Provider nesting order (outermost to innermost): `NextIntlClientProvider` → `ThemeProvider` → `ToastProvider` → `{children}`.

- [X] T022 [P] Configure ESLint in `eslint.config.mjs` (or `.eslintrc.json`). Extend from `next/core-web-vitals` and `next/typescript`. Add rule: `"no-console": "warn"` to discourage console.log in production. Add rule: `"@typescript-eslint/no-explicit-any": "error"` to forbid `any` type. Ensure the config works with `pnpm lint`.

- [X] T023 [P] Configure Prettier. Create `.prettierrc` at repository root with: `{ "semi": true, "singleQuote": false, "tabWidth": 2, "trailingComma": "all", "plugins": ["prettier-plugin-tailwindcss"] }`. Create `.prettierignore` with: `node_modules`, `.next`, `dist`, `pnpm-lock.yaml`. Add scripts to `package.json`: `"format": "prettier --write ."`, `"format:check": "prettier --check ."`.

- [X] T024 [P] Configure Husky and lint-staged. Run `pnpm exec husky init` to create the `.husky/` directory. Create `.husky/pre-commit` with content: `pnpm exec lint-staged`. Add to `package.json` a `"lint-staged"` key: `{ "*.{ts,tsx}": ["eslint --fix", "prettier --write"], "*.{json,md,css}": ["prettier --write"] }`.

- [X] T025 [P] Configure Vitest in `vitest.config.ts` at repository root. Import `defineConfig` from `vitest/config` and `react` from `@vitejs/plugin-react`. Configure: `plugins: [react()]`, `test: { environment: "jsdom", include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"], globals: true }`, `resolve: { alias: { "@": "./src" } }`. Add scripts to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [X] T026 [P] Configure Playwright in `playwright.config.ts` at repository root. Import `defineConfig` from `@playwright/test`. Configure: `testDir: "tests/e2e"`, `baseURL: "http://localhost:3000"`, `webServer: { command: "pnpm dev", port: 3000, reuseExistingServer: true }`. Add script to `package.json`: `"test:e2e": "playwright test"`.

**Checkpoint**: Foundation ready. `pnpm dev` starts, locale routing works (`/en` and `/ar` URLs), theme provider is mounted, toast provider is mounted, env vars are validated. All user story phases can now begin.

---

## Phase 3: User Story 1 - Developer Starts the Application (Priority: P1) MVP

**Goal**: A developer can clone, install, start the app, and see a working shell layout with header, navigation, and content area. The app builds for production without errors.

**Independent Test**: Run `pnpm dev`, open `http://localhost:3000/en`, verify the app shell renders with header, main content area, and footer. Run `pnpm build` and verify it completes.

### Implementation for User Story 1

- [X] T027 [US1] Create the section-level ErrorFallback component in `src/components/shared/app-shell/ErrorFallback.tsx`. This is a client component (`"use client"`). It receives props: `error: Error`, `reset: () => void`, and optionally `sectionName?: string`. It renders a styled container with: (1) an error icon or emoji, (2) a translated error title from `errors.sectionError`, (3) a translated description from `errors.sectionErrorDescription`, (4) a "Try again" button that calls `reset()`. Use `useTranslations` from `next-intl` for translated strings. Style with Tailwind classes that work in both light and dark mode. Use `cn()` for class merging. The container should have: `rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center`.

- [X] T028 [US1] Create the Header component in `src/components/shared/app-shell/Header.tsx`. This is a server component (no `"use client"` — unless you need client interactivity, in which case mark as client). It renders a `<header>` with: (1) the app name "BookMap" (translated via `common.appName`) linked to home, (2) a placeholder navigation area (empty `<nav>` for future use), (3) a right-side area that will hold ThemeToggle and LocaleSwitcher (add empty placeholder `<div>` with `id="header-actions"` for now — the actual toggles are added in US2 and US3). Style: `sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur`. Use flexbox with `items-center justify-between` and padding `px-4 py-3`. The header MUST use logical properties (`ps-4 pe-4` instead of `pl-4 pr-4`) for RTL support.

- [X] T029 [US1] Create the Footer component in `src/components/shared/app-shell/Footer.tsx`. Server component. Renders a `<footer>` with: (1) copyright text "© 2026 BookMap" (translated), (2) centered alignment. Style: `border-t bg-background py-6 text-center text-sm text-muted-foreground`. Use logical properties for padding.

- [X] T030 [US1] Create the public route group layout in `src/app/[locale]/(public)/layout.tsx`. Server component. This layout wraps all public-facing pages. It renders: (1) `<Header />` wrapped in an error boundary, (2) `<main className="flex-1">` wrapping `{children}`, wrapped in an error boundary, (3) `<Footer />` wrapped in an error boundary. The overall container uses `flex min-h-screen flex-col`. Import the error boundary from React (`ErrorBoundary` from `react-error-boundary` or use Next.js error.tsx pattern). For section-level error boundaries, wrap each section (header, main, footer) individually so one crashing section does not take down the others. Use the `ErrorFallback` component as the fallback for each boundary.

- [X] T031 [US1] Create the public home page in `src/app/[locale]/(public)/page.tsx`. Server component. This is the placeholder home page. It renders a centered container with: (1) the translated app name as an `<h1>` heading, (2) a short description paragraph: "Multi-vendor book marketplace" (translated — add this key to both message files as `common.tagline`), (3) a placeholder section with text "Coming soon" (translated — add as `common.comingSoon`). Style the heading as `text-4xl font-bold` and center everything with `flex flex-col items-center justify-center gap-4 py-20`. Add the new translation keys to both `messages/en.json` and `messages/ar.json`.

- [X] T032 [US1] Create the route-level error page in `src/app/[locale]/error.tsx`. This is a client component (`"use client"`). It receives `error: Error & { digest?: string }` and `reset: () => void`. Renders a full-page error display with: (1) translated error title from `errors.sectionError`, (2) error description, (3) a "Try again" button that calls `reset()`, (4) a "Back to home" link. Style as a centered full-page layout.

- [X] T033 [US1] Create the route-level loading page in `src/app/[locale]/loading.tsx`. Server component. Renders a centered loading spinner or skeleton. Use a simple animated spinner: a `<div>` with `h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent`. Center it on the page with `flex min-h-[50vh] items-center justify-center`.

- [X] T034 [US1] Create the 404 page in `src/app/[locale]/not-found.tsx`. Server component. Renders: (1) large "404" text, (2) translated title from `errors.notFound`, (3) translated description from `errors.notFoundDescription`, (4) a link back to home. Style as centered full-page.

- [X] T035 [US1] Verify the application runs end-to-end. Start the dev server with `pnpm dev`. Open `http://localhost:3000` — it should redirect to `/en`. Verify the shell layout appears with header (showing "BookMap"), main content area (showing placeholder), and footer. Navigate to `/ar` and verify the page loads (even if toggles aren't wired yet). Run `pnpm build` and confirm it completes without errors. Fix any TypeScript or build errors encountered.

**Checkpoint**: User Story 1 complete. App runs, shell layout visible, production build passes.

---

## Phase 4: User Story 2 - Theme Switching (Priority: P1)

**Goal**: User can toggle between dark and light themes. Theme persists across page refreshes. First load respects OS preference.

**Independent Test**: Load `/en`, toggle theme, verify colors change. Refresh page, verify theme persists.

### Implementation for User Story 2

- [X] T036 [US2] Create the ThemeToggle component in `src/components/shared/ThemeToggle.tsx`. This is a client component (`"use client"`). Import `useTheme` from `next-themes`. Import `useTranslations` from `next-intl`. The component renders a button that cycles through themes: system → light → dark → system. Display the current theme with an icon: sun icon for light, moon icon for dark, monitor icon for system (use simple SVG inline or unicode characters: ☀️/🌙/🖥️ — or better, create small SVG components). Show translated tooltip text from `theme.toggleTheme`. On click, call `setTheme()` with the next theme in the cycle. Handle the mounted state: `useTheme` returns `undefined` for `theme` during SSR, so render a placeholder button until mounted (use a `useState` + `useEffect` pattern to detect mount). Style the button as: `inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-sm hover:bg-accent hover:text-accent-foreground`. Use `cn()` for class merging.

- [X] T037 [US2] Integrate ThemeToggle into the Header. Edit `src/components/shared/app-shell/Header.tsx`. Replace the empty placeholder `<div id="header-actions">` with an actual flex container holding the `<ThemeToggle />` component. If the Header is a server component, you may need to either: (a) make it a client component, or (b) extract the header-actions area into a separate client component `HeaderActions.tsx` that renders `ThemeToggle`. Preferred approach: create `src/components/shared/app-shell/HeaderActions.tsx` as a client component that renders the action buttons, and import it into the server Header. Style the actions area: `flex items-center gap-2`.

- [ ] T038 [US2] Verify theme switching works. Start the dev server. Open `/en`. Click the theme toggle — verify the page switches between light and dark. Check that the `<html>` element gets a `class="dark"` when dark mode is active. Refresh the page — verify the theme persists (no flash of wrong theme). Open browser devtools, go to Application > Cookies or Local Storage, confirm a theme preference is stored. Test in an incognito window — verify it defaults to the OS preference.

**Checkpoint**: User Story 2 complete. Theme toggle works, persists, and respects OS default.

---

## Phase 5: User Story 3 - Language and Direction Switching (Priority: P1)

**Goal**: User can switch between Arabic (RTL) and English (LTR). Switching changes all text and layout direction. Persists across navigation.

**Independent Test**: Load `/en`, switch to Arabic, verify URL changes to `/ar`, text is Arabic, layout is RTL. Switch back, verify LTR.

### Implementation for User Story 3

- [X] T039 [US3] Create the LocaleSwitcher component in `src/components/shared/LocaleSwitcher.tsx`. This is a client component (`"use client"`). Import `useLocale` and `useTranslations` from `next-intl`. Import `useRouter` and `usePathname` from `@/lib/i18n/routing`. The component renders a button or small dropdown that shows the current language and allows switching. When clicked, it navigates to the same path but with the other locale. Implementation: (1) get current locale with `useLocale()`, (2) determine target locale (`en` ↔ `ar`), (3) on click call `router.replace(pathname, { locale: targetLocale })`, (4) display the target locale label (e.g., "العربية" when current is English, "English" when current is Arabic). Style as a button matching ThemeToggle dimensions: `inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground`.

- [X] T040 [US3] Integrate LocaleSwitcher into HeaderActions. Edit `src/components/shared/app-shell/HeaderActions.tsx`. Add `<LocaleSwitcher />` next to `<ThemeToggle />` inside the flex container. Order: LocaleSwitcher first, then ThemeToggle (so language switch is more prominent).

- [X] T041 [US3] Ensure the locale layout sets the correct `dir` attribute. Edit `src/app/[locale]/layout.tsx`. After determining the direction from the locale, ensure the `dir` attribute is set on a wrapping `<div>` or propagated to the `<html>` element. The recommended approach for next-intl with App Router: wrap the entire content in a `<div dir={direction} lang={locale}>` so all child components inherit the correct direction. Alternatively, use a client component that sets `document.documentElement.dir` on locale change. Ensure the `dir` attribute is also set on the `<html>` tag in the root layout if possible (this may require dynamic params).

- [ ] T042 [US3] Verify language and direction switching. Start the dev server. Navigate to `/en` — verify all text is English, layout is LTR. Click the LocaleSwitcher — verify URL changes to `/ar`, all text changes to Arabic, layout becomes RTL (check that the header actions move to the left side, text aligns right). Click the switcher again — verify it returns to `/en` with LTR. Navigate between pages — verify the language persists. Open a new tab and go to `/` — verify it redirects to the correct locale based on browser language or cookie.

**Checkpoint**: User Story 3 complete. Language switches, direction changes, and preference persists.

---

## Phase 6: User Story 4 - Shared UI Component Library (Priority: P2)

**Goal**: All 18 shared UI components from FR-005 are implemented, following the contracts in `contracts/component-api.md`. They work in all 4 theme/direction combinations.

**Independent Test**: Each component can be imported and rendered. All work in dark-LTR, dark-RTL, light-LTR, light-RTL.

### Implementation for User Story 4

**Form Components (can all be built in parallel — different files, no dependencies between them)**:

- [X] T043 [P] [US4] Create Button component in `src/components/ui/form/Button.tsx`. Client component. Use CVA for variants. Define variants per contract: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `sm`, `lg`, `icon`. Accept all standard HTML button attributes plus `variant`, `size`, `disabled`, `loading` (shows a spinner and disables click), and `asChild` (uses Radix Slot to render as child element). When `loading` is true, show a small spinner before the label and set `disabled`. Use `cn()` for class merging. Export both the component and the `buttonVariants` CVA function. The component MUST use `React.forwardRef` for ref forwarding. Use Radix `@radix-ui/react-slot` for `asChild` support. Use logical padding (`ps-4 pe-4`) not `pl-4 pr-4`.

- [X] T044 [P] [US4] Create Input component in `src/components/ui/form/Input.tsx`. Client component. Use `React.forwardRef`. Accept standard HTML input attributes plus `error?: string`, `label?: string`, `helperText?: string`. Render: (1) `<label>` if provided, (2) `<input>` with styling, (3) error message in red if `error` is truthy, (4) helper text in muted if `helperText` is provided and no error. Input styling: `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`. When `error` is truthy, add `border-destructive` class. Use logical padding.

- [X] T045 [P] [US4] Create Textarea component in `src/components/ui/form/Textarea.tsx`. Client component. Use `React.forwardRef`. Accept standard HTML textarea attributes plus `error?: string`, `label?: string`. Same pattern as Input but renders `<textarea>`. Style: `flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`. Add error display like Input.

- [X] T046 [P] [US4] Create Select component in `src/components/ui/form/Select.tsx`. Client component. Use Radix `@radix-ui/react-select`. Create sub-components: `Select` (root), `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`. The trigger styled like Input. Content rendered in a popover with `bg-popover text-popover-foreground shadow-md rounded-md border`. Items highlight on hover with `bg-accent text-accent-foreground`. Accept `error?: string` and `label?: string` on the root wrapper. All sub-components use `React.forwardRef`.

- [X] T047 [P] [US4] Create Checkbox component in `src/components/ui/form/Checkbox.tsx`. Client component. Use Radix `@radix-ui/react-checkbox`. Accept `checked`, `onCheckedChange`, `disabled`, `label`. Render a styled checkbox indicator (checkmark SVG or unicode ✓ when checked). Size: `h-4 w-4`. Style: `rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`. Render label as `<label>` next to the checkbox with `gap-2` spacing.

- [X] T048 [P] [US4] Create Radio component in `src/components/ui/form/Radio.tsx`. Client component. Use Radix `@radix-ui/react-radio-group`. Create `RadioGroup` and `RadioGroupItem` components. RadioGroup accepts `value`, `onValueChange`, `disabled`, and renders children. RadioGroupItem renders a circular indicator. Style: `h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`. Accept `options` array with `{ value, label, disabled? }` for a convenience wrapper.

**Layout Components (can all be built in parallel)**:

- [X] T049 [P] [US4] Create Dialog (Modal) component in `src/components/ui/layout/Dialog.tsx`. Client component. Use Radix `@radix-ui/react-dialog`. Create: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`. Content has an overlay (`fixed inset-0 z-50 bg-black/80`) and a centered panel (`fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-background rounded-lg border shadow-lg p-6`). Include a close X button in the top corner using logical positioning (`end-4 top-4`). All sub-components use `React.forwardRef` and `cn()`.

- [X] T050 [P] [US4] Create Modal component in `src/components/ui/layout/Modal.tsx`. This is a convenience wrapper around Dialog. It accepts `open`, `onOpenChange`, `title`, `description`, `children`, and optional `footer`. It renders `Dialog` with `DialogContent` containing `DialogHeader` (with `DialogTitle` and `DialogDescription`), the children, and an optional `DialogFooter`. This simplifies usage for common modal patterns.

- [X] T051 [P] [US4] Create Drawer/Sheet component in `src/components/ui/layout/Drawer.tsx` and `src/components/ui/layout/Sheet.tsx`. Client components. Use Radix Dialog as the base (or a dedicated drawer library if preferred). Sheet slides in from a specified side: `left`, `right`, `top`, `bottom`. Create: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `SheetClose`. SheetContent uses CSS transitions to slide from the specified side. For RTL support: when `side="left"` or `side="right"`, use logical properties so the sheet mirrors correctly. Default side: `"right"` (which becomes left in RTL). Include overlay like Dialog. Width for side sheets: `w-3/4 max-w-sm`. Height for top/bottom: `h-auto max-h-[85vh]`.

- [X] T052 [P] [US4] Create Card component in `src/components/ui/layout/Card.tsx`. Server component (no interactivity needed). Create: `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`. Card base style: `rounded-lg border bg-card text-card-foreground shadow-sm`. CardHeader: `flex flex-col gap-1.5 p-6`. CardContent: `p-6 pt-0`. CardFooter: `flex items-center p-6 pt-0`. Accept `variant` prop: `"default"` (with shadow) or `"outline"` (no shadow, more prominent border). Use `React.forwardRef` and `cn()`.

**Data Components (can all be built in parallel)**:

- [X] T053 [P] [US4] Create Table component in `src/components/ui/data/Table.tsx`. Server-compatible component. Create: `Table` (wrapper), `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`. Table base style: `w-full caption-bottom text-sm`. TableRow: `border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted`. TableHead: `h-12 px-4 text-start font-medium text-muted-foreground` (note: `text-start` not `text-left` for RTL). TableCell: `p-4 align-middle`. Also create a higher-level `DataTable` component that accepts `columns: { key, header, cell?, sortable?, align? }[]`, `data: Record<string, unknown>[]`, `loading?: boolean`, `emptyMessage?: string` and renders the full table with optional loading skeleton and empty state.

- [X] T054 [P] [US4] Create Pagination component in `src/components/ui/data/Pagination.tsx`. Client component. Accepts `currentPage: number`, `totalPages: number`, `onPageChange: (page: number) => void`, `pageSize?: number`. Renders: previous button, page numbers (with ellipsis for large ranges), next button. Disable previous on first page, next on last page. Show max 5 page buttons with ellipsis. Style buttons like `Button` with `variant="outline" size="icon"`. Use chevron icons (< >) for prev/next. Use logical flex direction so buttons mirror in RTL.

- [X] T055 [P] [US4] Create List component in `src/components/ui/data/List.tsx`. Generic component. Accepts `items: T[]`, `renderItem: (item: T, index: number) => React.ReactNode`, `loading?: boolean`, `emptyMessage?: string`. When loading, show 3 skeleton items. When items is empty, show `EmptyState` with the provided message. Otherwise map items through `renderItem`. Style as a vertical list with `divide-y` between items.

**Navigation Components (can be built in parallel)**:

- [X] T056 [P] [US4] Create Tabs component in `src/components/ui/navigation/Tabs.tsx`. Client component. Use Radix `@radix-ui/react-tabs`. Create: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`. TabsList: `inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground`. TabsTrigger: `inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm disabled:pointer-events-none disabled:opacity-50`. TabsContent: `mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`.

- [X] T057 [P] [US4] Create FilterControls component in `src/components/ui/navigation/FilterControls.tsx`. Client component. Accepts `filters: { key: string, label: string, options: { value: string, label: string }[] }[]`, `activeFilters: Record<string, string[]>`, `onFilterChange: (key: string, values: string[]) => void`, `onReset: () => void`. Renders each filter as a group of checkboxes or a multi-select dropdown. Include a "Reset all" button that calls `onReset()`. Style with flex wrap and gap spacing. Each filter group has a label and its options.

**Feedback Components (can be built in parallel)**:

- [X] T058 [P] [US4] Create StatusBadge component in `src/components/ui/feedback/StatusBadge.tsx`. Server component. Use CVA for variants: `default`, `success`, `warning`, `error`, `info`. Accept `variant` and `label` props. Style: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors`. Variant colors: default (border only), success (green bg), warning (yellow bg), error (red bg), info (blue bg). Ensure colors work in both light and dark mode using semantic CSS variables.

- [X] T059 [P] [US4] Create EmptyState component in `src/components/ui/feedback/EmptyState.tsx`. Server component. Accept `icon?: React.ReactNode`, `title: string`, `description: string`, `action?: { label: string, onClick: () => void }`. Render a centered container with: the optional icon (large, muted), the title as `<h3>`, the description as `<p>` in muted color, and an optional action button. Style: `flex flex-col items-center justify-center gap-4 py-12 text-center`. If no props are given, use default translated messages from `empty.title` and `empty.description`.

- [X] T060 [P] [US4] Create LoadingSkeleton component in `src/components/ui/feedback/LoadingSkeleton.tsx`. Server component. Accept `variant: "text" | "card" | "table" | "avatar"` and `lines?: number` (for text variant). Render animated placeholder shapes using `animate-pulse bg-muted rounded`. Text variant: horizontal bars of varying width. Card variant: a card-shaped rectangle. Table variant: header row + body rows. Avatar variant: a circle. Default lines for text: 3.

- [X] T061 [P] [US4] Create ErrorBoundary component in `src/components/ui/feedback/ErrorBoundary.tsx`. Client component (`"use client"`). This is a React class component (error boundaries require class components). Accept `fallback?: React.ReactNode`, `onError?: (error: Error) => void`, `onReset?: () => void`, `children: React.ReactNode`. In `componentDidCatch`, call `onError` if provided. In `render`, if `hasError` state is true, render the `fallback` or the default `ErrorFallback` component from `@/components/shared/app-shell/ErrorFallback`. Provide a `reset` method that clears the error state and calls `onReset`. Also export a convenience wrapper: `withErrorBoundary(Component, fallback?)` HOC.

- [X] T062 [US4] Create barrel export files for each UI category. Create these index files that re-export all components from their directory:
  - `src/components/ui/form/index.ts` — exports Button, Input, Textarea, Select (and sub-components), Checkbox, Radio
  - `src/components/ui/layout/index.ts` — exports Dialog (and sub-components), Modal, Sheet (and sub-components), Drawer, Card (and sub-components)
  - `src/components/ui/data/index.ts` — exports Table (and sub-components), DataTable, Pagination, List
  - `src/components/ui/navigation/index.ts` — exports Tabs (and sub-components), FilterControls
  - `src/components/ui/feedback/index.ts` — exports StatusBadge, EmptyState, LoadingSkeleton, ErrorBoundary
  - `src/components/ui/index.ts` — re-exports everything from all category index files
  This allows importing like `import { Button, Input } from "@/components/ui"`.

**Checkpoint**: All 18+ shared UI components are implemented. Each can be imported from `@/components/ui`. They render in both themes and both directions.

---

## Phase 7: User Story 5 - Toast Notifications (Priority: P2)

**Goal**: Global toast system works. Success, error, warning, and info toasts render correctly in all theme/direction combinations.

**Independent Test**: Call `toast.success("message")` and see a green toast. Call `toast.error("message")` and see a red toast. Verify in dark mode and RTL.

### Implementation for User Story 5

- [X] T063 [US5] Wire up goey-toast in the ToastProvider. Edit `src/providers/ToastProvider.tsx`. Ensure the goey-toast container is correctly configured. If goey-toast requires a specific provider/container pattern, follow its API. The toast container MUST: (1) render toasts in the top-right corner (or top-left in RTL), (2) stack multiple toasts vertically, (3) auto-dismiss after the configured duration (default 5000ms), (4) support success/error/warning/info types with distinct styling. If goey-toast does not support RTL positioning natively, add a CSS override that checks `[dir=rtl]` and mirrors the position. Export a `toast` object or function that can be imported anywhere: `import { toast } from "goey-toast"` (or create a wrapper `src/lib/utils/toast.ts` that re-exports the toast functions).

- [X] T064 [US5] Create a toast demo/test mechanism. Create a temporary demo page at `src/app/[locale]/(public)/demo/page.tsx` (client component) that has four buttons: "Success Toast", "Error Toast", "Warning Toast", "Info Toast". Each button calls the corresponding toast function with a sample message. This page is used for manual verification during development. Add `"demo"` translations to both message files: `"demo": { "success": "Operation successful!", "error": "Something went wrong!", "warning": "Please be careful.", "info": "Here is some information." }` and Arabic equivalents. This page can be removed before production.

- [ ] T065 [US5] Verify toast notifications in all 4 combinations. Start the dev server. Navigate to `/en/demo`. Click each toast button — verify toasts appear with correct styling (green/red/yellow/blue). Switch to dark mode — verify toast colors are appropriate. Navigate to `/ar/demo` — verify toasts appear with RTL text and correct positioning. Verify multiple simultaneous toasts stack without overlapping. Verify auto-dismissal after the configured duration.

**Checkpoint**: User Story 5 complete. Toast system works globally in all theme/direction combinations.

---

## Phase 8: User Story 6 - Environment Validation (Priority: P3)

**Goal**: App fails fast with clear error messages when required env vars are missing or malformed.

**Independent Test**: Remove `NEXT_PUBLIC_SUPABASE_URL` from `.env.local`, restart app, see a clear error naming the missing variable.

### Implementation for User Story 6

- [ ] T066 [US6] Verify environment validation works on startup. The env validation was created in T008. Now verify it works correctly: (1) Remove `NEXT_PUBLIC_SUPABASE_URL` from `.env.local`, run `pnpm dev`, verify the error message clearly names the missing variable. (2) Set `NEXT_PUBLIC_SUPABASE_URL` to an invalid non-URL string, verify it reports invalid format. (3) Restore all variables, verify the app starts normally. If the current implementation does not trigger on dev server start (because `env.ts` is only imported on first request), add an import of `@/lib/config/env` to the root layout or a shared server module so it validates immediately.

- [X] T067 [US6] Ensure environment validation runs in production build. Run `pnpm build` with a missing env var. Verify the build fails or the first request fails with the clear error. If environment vars are only available at runtime (not build time), document this behavior in `quickstart.md`. Update the error format if needed to be more developer-friendly.

**Checkpoint**: User Story 6 complete. Missing or invalid env vars produce clear, actionable error messages.

---

## Phase 9: User Story 8 - Dashboard Shell (Priority: P2 — from FR-008)

**Goal**: A base dashboard shell layout exists with sidebar, header, and content area. It is a skeleton ready for future role-specific content.

**Independent Test**: Navigate to `/en/dashboard`, see the dashboard layout with sidebar and content area, distinct from the public layout.

### Implementation for Dashboard Shell

- [X] T068 [US8] Create the Sidebar component in `src/components/shared/app-shell/Sidebar.tsx`. Client component (needs interactivity for collapse/expand). Renders a vertical sidebar with: (1) app logo/name at the top, (2) placeholder navigation items (Home, Dashboard — using translated labels from `nav` namespace), (3) a collapse/expand toggle at the bottom. Style: `flex h-screen w-64 flex-col border-e bg-background` (note: `border-e` is logical for RTL). When collapsed, width shrinks to `w-16` and only icons show. Use a `useState` for collapsed state. Navigation items are `<a>` or `<Link>` elements with icon placeholders and labels. Use logical properties throughout (`ps-4`, `pe-4`).

- [X] T069 [US8] Create the dashboard layout in `src/app/[locale]/(dashboard)/layout.tsx`. Server component. Renders a flex row layout: (1) `<Sidebar />` on the inline-start side, (2) a main area that contains a dashboard header and content region. The main area: `flex flex-1 flex-col`. Dashboard header: a top bar with breadcrumb placeholder and user actions placeholder (simpler than the public header). Content: `<main className="flex-1 overflow-y-auto p-6">{children}</main>`. Wrap Sidebar and main content area each in section-level error boundaries using `ErrorBoundary`.

- [X] T070 [US8] Create the dashboard home page in `src/app/[locale]/(dashboard)/page.tsx`. Server component. Renders a placeholder: "Dashboard" heading and "Welcome to BookMap dashboard" description. Add translation keys: `"dashboard": { "title": "Dashboard", "welcome": "Welcome to BookMap dashboard" }` (and Arabic equivalents) to both message files.

- [ ] T071 [US8] Verify the dashboard layout. Start the dev server. Navigate to `/en/dashboard` — verify the dashboard layout appears with a sidebar and content area, visually distinct from the public layout. Navigate to `/ar/dashboard` — verify sidebar appears on the right (RTL), content on the left. Toggle theme — verify dashboard layout works in dark mode.

**Checkpoint**: Dashboard shell complete. Sidebar + content area working in all 4 theme/direction combinations.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and production readiness checks.

- [X] T072 [P] Create the auth layout skeleton in `src/app/[locale]/(auth)/layout.tsx`. Server component. A simple centered layout for future auth pages. Renders a centered container: `flex min-h-screen items-center justify-center`. Wrap children in a `Card` component with max width `max-w-md w-full`. This is a structural skeleton only — no auth logic.

- [X] T073 [P] Run `pnpm lint` and fix all ESLint errors across the entire codebase. Address every error. Warnings for `no-console` can be left as warnings in dev code (demo page) but should not appear in production code.

- [X] T074 [P] Run `pnpm format` to format all files with Prettier. Verify no files have formatting issues by running `pnpm format:check` afterward.

- [ ] T075 Run full production build verification. Execute `pnpm build`. Fix any TypeScript errors, module resolution issues, or build failures. After successful build, run `pnpm start` and verify the production app works correctly: navigate to `/en`, `/ar`, `/en/dashboard`, `/ar/dashboard`. Verify theme toggle and locale switch work in production mode.

- [X] T076 Create a component showcase page at `src/app/[locale]/(public)/components/page.tsx` (client component) that renders every shared UI component with sample props. This page serves as visual verification that all components render correctly. Group components by category (Form, Layout, Data, Navigation, Feedback). Include at least one example of each variant for components with variants (e.g., all Button variants, all StatusBadge variants). Add translation keys `"components": { "title": "Component Showcase", "description": "Visual reference for all shared UI components" }` to both message files. This page may be removed or hidden before production.

- [ ] T077 Final manual verification checklist. Go through every item in the quickstart.md verification section:
  - [ ] App loads with shell layout (header + navigation + content)
  - [ ] Theme toggle switches between dark and light mode without flash
  - [ ] Language switch changes between English (LTR) and Arabic (RTL) correctly
  - [ ] Toast notifications work for all 4 types
  - [ ] Dashboard layout shows sidebar + content area
  - [ ] All shared components render on the showcase page
  - [ ] Production build completes without errors
  - [ ] All 4 combinations work: dark-LTR, dark-RTL, light-LTR, light-RTL
  Document any issues found and fix them before marking complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 - App Shell (Phase 3)**: Depends on Phase 2 — builds the visible structure
- **US2 - Theme (Phase 4)**: Depends on Phase 3 (needs Header to add toggle)
- **US3 - Locale (Phase 5)**: Depends on Phase 4 (needs HeaderActions to add switcher)
- **US4 - Components (Phase 6)**: Depends on Phase 2 only (parallel with US1-3 if desired, but easier after US1)
- **US5 - Toasts (Phase 7)**: Depends on Phase 2 (ToastProvider already mounted)
- **US6 - Env Validation (Phase 8)**: Depends on Phase 2 (env module already created)
- **Dashboard Shell (Phase 9)**: Depends on Phase 3 (reuses app-shell components)
- **Polish (Phase 10)**: Depends on all previous phases

### Recommended Sequential Order

```
Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (US5) → Phase 8 (US6) → Phase 9 (Dashboard) → Phase 10 (Polish)
```

### Parallel Opportunities

Within each phase, tasks marked `[P]` can run in parallel:
- **Phase 1**: T003, T004, T005 (after T001+T002)
- **Phase 2**: T007+T009+T012+T013+T016+T017+T018+T022+T023+T024+T025+T026 (after T006)
- **Phase 6**: ALL component tasks T043–T061 (all different files, no cross-dependencies)
- **Phase 10**: T072, T073, T074

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: App shell renders, build passes
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → App shell visible → Validate
3. US2 → Theme switching → Validate
4. US3 → Locale switching → Validate
5. US4 → Full component library → Validate
6. US5 → Toast system → Validate
7. US6 → Env validation hardened → Validate
8. Dashboard shell → Validate
9. Polish → Production ready

