import { notFound } from "next/navigation";
import { PublicProductView } from "@/features/catalog/components/PublicProductView";
import { getPublicListingDetails } from "@/features/catalog/actions/queries";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const listing = await getPublicListingDetails(id);

  if (!listing) {
    notFound();
  }

  return <PublicProductView listing={listing} />;
}
