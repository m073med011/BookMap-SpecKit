"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/form/Button";
import type { Locale } from "@/types";

type PaginationProps = {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalPages: number;
};

function buildPages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ] as const;
}

export function Pagination({
  currentPage,
  onPageChange,
  totalPages,
}: PaginationProps) {
  const locale = useLocale() as Locale;
  const isRtl = locale === "ar";
  const pages = buildPages(currentPage, totalPages);
  const previousIcon = isRtl ? ">" : "<";
  const nextIcon = isRtl ? "<" : ">";

  return (
    <div className="flex items-center gap-2" dir={isRtl ? "rtl" : "ltr"}>
      <Button
        aria-label="Previous page"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        size="icon"
        type="button"
        variant="outline"
      >
        {previousIcon}
      </Button>
      {pages.map((page, index) =>
        page === "..." ? (
          <span
            className="text-muted-foreground px-2"
            key={`ellipsis-${index}`}
          >
            ...
          </span>
        ) : (
          <Button
            key={page}
            onClick={() => onPageChange(page)}
            size="icon"
            type="button"
            variant={page === currentPage ? "default" : "outline"}
          >
            {page}
          </Button>
        ),
      )}
      <Button
        aria-label="Next page"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        size="icon"
        type="button"
        variant="outline"
      >
        {nextIcon}
      </Button>
    </div>
  );
}
