import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui";
import { CatalogDataTable } from "@/features/catalog/components/CatalogDataTable";
import { getVendorCatalogListings } from "@/features/catalog/actions/queries";
import { getLibrary } from "@/features/libraries/services/library-service";
import { Link } from "@/lib/i18n/routing";

type CatalogPageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { id, locale } = await params;
  const library = await getLibrary(id);

  if (!library) {
    notFound();
  }

  let rows = [];

  try {
    rows = await getVendorCatalogListings(id);
  } catch {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{library.name}</p>
          <h1 className="text-3xl font-semibold">Catalog</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/libraries/${id}`}>Library overview</Link>
        </Button>
      </div>
      <CatalogDataTable libraryId={id} rows={rows} />
    </div>
  );
}
