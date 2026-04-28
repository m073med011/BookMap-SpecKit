import { notFound, redirect } from "next/navigation";
import { BookProvider } from "@/features/catalog/components/BookProvider";
import { BookCreateForm } from "@/features/catalog/components/BookCreateForm";
import { ListingCreateForm } from "@/features/catalog/components/ListingCreateForm";
import { getLibrary } from "@/features/libraries/services/library-service";
import { requireLibraryStaff } from "@/features/roles/services/authorize";

type CatalogCreatePageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function CatalogCreatePage({
  params,
}: CatalogCreatePageProps) {
  const { id, locale } = await params;
  const library = await getLibrary(id);

  if (!library) {
    notFound();
  }

  try {
    await requireLibraryStaff(id);
  } catch {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{library.name}</p>
        <h1 className="text-3xl font-semibold">Create catalog item</h1>
      </div>
      <BookProvider>
        <div className="grid gap-6 xl:grid-cols-2">
          <BookCreateForm libraryId={id} />
          <ListingCreateForm libraryId={id} />
        </div>
      </BookProvider>
    </div>
  );
}
