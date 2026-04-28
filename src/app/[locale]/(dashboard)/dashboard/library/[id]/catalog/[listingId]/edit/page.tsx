import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui";
import { BookMetadataEditor } from "@/features/catalog/components/BookMetadataEditor";
import { getVendorListingDetails } from "@/features/catalog/actions/queries";
import { Link } from "@/lib/i18n/routing";

type ListingEditPageProps = {
  params: Promise<{ id: string; listingId: string; locale: string }>;
};

export default async function ListingEditPage({ params }: ListingEditPageProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {listing.libraryName ?? "Library catalog"}
          </p>
          <h1 className="text-3xl font-semibold">Edit {listing.book.title}</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/library/${id}/catalog/${listing.id}`}>
            Back to listing
          </Link>
        </Button>
      </div>
      <BookMetadataEditor book={listing.book} />
    </div>
  );
}
