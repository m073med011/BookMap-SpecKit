/* eslint-disable @next/next/no-img-element */

import { Card, CardContent, StatusBadge } from "@/components/ui";
import type { CatalogListing } from "../types";

type PublicProductViewProps = {
  listing: CatalogListing;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    style: "currency",
  }).format(price);
}

export function PublicProductView({ listing }: PublicProductViewProps) {
  const authors = listing.book.authors.map((author) => author.name).join(", ");
  const genres = listing.book.genres.map((genre) => genre.name).join(", ");

  return (
    <div className="mx-auto grid max-w-6xl gap-8 py-8 lg:grid-cols-[minmax(260px,360px)_1fr]">
      <div>
        {listing.book.coverImageUrl ? (
          <img
            alt={listing.book.title}
            className="aspect-[3/4] w-full rounded-lg border object-cover shadow-sm"
            src={listing.book.coverImageUrl}
          />
        ) : (
          <div className="bg-muted flex aspect-[3/4] w-full items-center justify-center rounded-lg border text-muted-foreground">
            No cover
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {listing.libraryName ?? "Bookmap library"}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            {listing.book.title}
          </h1>
          {listing.book.subtitle ? (
            <p className="text-xl text-muted-foreground">
              {listing.book.subtitle}
            </p>
          ) : null}
          <p className="text-muted-foreground">{authors}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {listing.formats.map((format) => {
            const outOfStock =
              format.formatType === "physical" &&
              format.inventory?.stockQuantity === 0;

            return (
              <Card key={format.id} variant="outline">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium capitalize">
                      {format.formatType}
                    </p>
                    <StatusBadge
                      label={outOfStock ? "Out of stock" : "Available"}
                      variant={outOfStock ? "warning" : "success"}
                    />
                  </div>
                  <p className="text-2xl font-semibold">
                    {formatPrice(format.price)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <dl className="grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Language</dt>
            <dd className="font-medium">{listing.book.language.toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Publication year</dt>
            <dd className="font-medium">
              {listing.book.publicationYear ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Publisher</dt>
            <dd className="font-medium">{listing.book.publisher?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Genres</dt>
            <dd className="font-medium">{genres || "-"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
