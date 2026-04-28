import { notFound, redirect } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { CoverImageUploader } from "@/features/catalog/components/CoverImageUploader";
import { EbookFileUploader } from "@/features/catalog/components/EbookFileUploader";
import { InventoryManager } from "@/features/catalog/components/InventoryManager";
import { ListingStatusWidget } from "@/features/catalog/components/ListingStatusWidget";
import { getVendorListingDetails } from "@/features/catalog/actions/queries";
import { Link } from "@/lib/i18n/routing";

type ListingPageProps = {
  params: Promise<{ id: string; listingId: string; locale: string }>;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    style: "currency",
  }).format(price);
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id, listingId, locale } = await params;
  let listing = null;

  try {
    listing = await getVendorListingDetails(id, listingId);
  } catch {
    redirect(`/${locale}/dashboard`);
  }

  if (!listing) {
    notFound();
  }

  const ebookFormats = listing.formats.filter(
    (format) => format.formatType === "ebook",
  );
  const ebookFilesReady = ebookFormats.every((format) => format.ebookFilePath);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {listing.libraryName ?? "Library catalog"}
          </p>
          <h1 className="text-3xl font-semibold">{listing.book.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {listing.status === "published" ? (
            <Button asChild variant="outline">
              <Link href={`/product/${listing.id}`}>Public page</Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link href={`/dashboard/library/${id}/catalog/${listing.id}/edit`}>
              Edit metadata
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Listing formats</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {listing.formats.map((format) => (
                <div className="rounded-md border p-4" key={format.id}>
                  <p className="font-medium capitalize">{format.formatType}</p>
                  <p className="text-2xl font-semibold">
                    {formatPrice(format.price)}
                  </p>
                  {format.formatType === "physical" ? (
                    <p className="text-sm text-muted-foreground">
                      Stock: {format.inventory?.stockQuantity ?? 0}
                    </p>
                  ) : (
                    <p className="break-all text-sm text-muted-foreground">
                      {format.ebookFilePath ?? "No ebook file"}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {listing.formats
              .filter((format) => format.formatType === "physical")
              .map((format) => (
                <InventoryManager
                  key={format.id}
                  listingFormatId={format.id}
                  stockQuantity={format.inventory?.stockQuantity ?? 0}
                />
              ))}
            {ebookFormats.map((format) => (
              <EbookFileUploader
                currentPath={format.ebookFilePath}
                key={format.id}
                libraryId={id}
                listingFormatId={format.id}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <ListingStatusWidget
            ebookFilesReady={ebookFilesReady}
            hasCover={Boolean(listing.book.coverImagePath)}
            listingId={listing.id}
            status={listing.status}
          />
          <CoverImageUploader
            bookId={listing.book.id}
            currentUrl={listing.book.coverImageUrl}
            libraryId={id}
          />
        </div>
      </div>
    </div>
  );
}
