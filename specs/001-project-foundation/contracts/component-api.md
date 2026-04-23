# Component API Contracts: Shared UI Library

**Date**: 2026-04-23

## Overview

This document defines the public API surface for shared UI
components. All components MUST accept these common props in
addition to their specific props.

## Common Props (all components)

```typescript
interface CommonProps {
  className?: string    // Additional Tailwind classes
  "data-testid"?: string // Test identification
}
```

## Form Components

### Button
- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default`, `sm`, `lg`, `icon`
- Props: `variant`, `size`, `disabled`, `loading`, `asChild`

### Input
- Types: `text`, `email`, `password`, `number`, `search`, `tel`, `url`
- Props: `type`, `placeholder`, `disabled`, `error`, `label`, `helperText`

### Textarea
- Props: `placeholder`, `disabled`, `error`, `label`, `rows`, `maxLength`

### Select
- Props: `options`, `value`, `onChange`, `placeholder`, `disabled`, `error`, `label`

### Checkbox
- Props: `checked`, `onCheckedChange`, `disabled`, `label`

### RadioGroup
- Props: `value`, `onValueChange`, `disabled`, `options`

## Layout Components

### Modal / Dialog
- Props: `open`, `onOpenChange`, `title`, `description`, `children`
- Slots: `trigger`, `content`, `footer`

### Drawer / Sheet
- Props: `open`, `onOpenChange`, `side` (`left` | `right` | `top` | `bottom`), `title`
- RTL note: `side` automatically mirrors in RTL context

### Card
- Slots: `header`, `content`, `footer`
- Props: `variant` (`default` | `outline`)

## Data Components

### Table
- Props: `columns`, `data`, `sortable`, `onSort`, `loading`, `emptyMessage`
- Column def: `{ key, header, cell?, sortable?, align? }`

### Pagination
- Props: `currentPage`, `totalPages`, `onPageChange`, `pageSize`

### List
- Props: `items`, `renderItem`, `loading`, `emptyMessage`

## Navigation Components

### Tabs
- Props: `tabs`, `activeTab`, `onTabChange`
- Tab def: `{ value, label, content, disabled? }`

### FilterControls
- Props: `filters`, `activeFilters`, `onFilterChange`, `onReset`

## Feedback Components

### StatusBadge
- Variants: `default`, `success`, `warning`, `error`, `info`
- Props: `variant`, `label`

### EmptyState
- Props: `icon?`, `title`, `description`, `action?`

### LoadingSkeleton
- Props: `variant` (`text` | `card` | `table` | `avatar`), `lines?`

### ErrorBoundary
- Props: `fallback?`, `onError?`, `onReset?`
- Default fallback: section-level error message with retry button

## Toast API (global)

```typescript
toast.success(message: string, options?: ToastOptions)
toast.error(message: string, options?: ToastOptions)
toast.warning(message: string, options?: ToastOptions)
toast.info(message: string, options?: ToastOptions)

interface ToastOptions {
  duration?: number     // ms, default 5000
  description?: string
  action?: { label: string, onClick: () => void }
}
```
