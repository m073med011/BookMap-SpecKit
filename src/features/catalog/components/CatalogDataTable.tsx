"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { Link } from "@/lib/i18n/routing";
import type { ListingFormatType, ListingStatus } from "../schemas";
import type { VendorCatalogRow } from "../types";

type CatalogDataTableProps = {
  libraryId: string;
  rows: VendorCatalogRow[];
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    style: "currency",
  }).format(price);
}

function statusVariant(status: ListingStatus) {
  if (status === "published") {
    return "success" as const;
  }

  if (status === "pending_review") {
    return "warning" as const;
  }

  if (status === "draft") {
    return "info" as const;
  }

  return "default" as const;
}

export function CatalogDataTable({ libraryId, rows }: CatalogDataTableProps) {
  const [status, setStatus] = useState<"all" | ListingStatus>("all");
  const [format, setFormat] = useState<"all" | ListingFormatType>("all");
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const statusMatches = status === "all" || row.status === status;
        const formatMatches =
          format === "all" || row.formats.includes(format);

        return statusMatches && formatMatches;
      }),
    [format, rows, status],
  );

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <CardTitle>Catalog</CardTitle>
        <div className="flex flex-wrap gap-3">
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            onChange={(event) =>
              setStatus(event.target.value as "all" | ListingStatus)
            }
            value={status}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending review</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="archived">Archived</option>
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            onChange={(event) =>
              setFormat(event.target.value as "all" | ListingFormatType)
            }
            value={format}
          >
            <option value="all">All formats</option>
            <option value="physical">Physical</option>
            <option value="ebook">Ebook</option>
          </select>
          <Button asChild>
            <Link href={`/dashboard/library/${libraryId}/catalog/create`}>
              New listing
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRows.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No catalog listings found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Formats</TableHead>
                <TableHead>Price from</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {row.coverImageUrl ? (
                        <img
                          alt=""
                          className="h-14 w-10 rounded-sm border object-cover"
                          src={row.coverImageUrl}
                        />
                      ) : (
                        <div className="bg-muted h-14 w-10 rounded-sm border" />
                      )}
                      <span className="font-medium">{row.bookTitle}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={row.status.replace("_", " ")}
                      variant={statusVariant(row.status)}
                    />
                  </TableCell>
                  <TableCell className="capitalize">
                    {row.formats.join(", ")}
                  </TableCell>
                  <TableCell>{formatPrice(row.minPrice)}</TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/dashboard/library/${libraryId}/catalog/${row.id}`}
                        >
                          View
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          href={`/dashboard/library/${libraryId}/catalog/${row.id}/edit`}
                        >
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
