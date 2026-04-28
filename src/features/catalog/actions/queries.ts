import "server-only";

import { requireLibraryStaff } from "@/features/roles/services/authorize";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import type {
  CatalogAuthor,
  CatalogBook,
  CatalogGenre,
  CatalogListing,
  CatalogListingFormat,
  CatalogPublisher,
  VendorCatalogRow,
} from "../types";
import type {
  ListingFormatType,
  ListingStatus,
} from "../schemas";

type BookRow = Database["public"]["Tables"]["books"]["Row"];
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ListingFormatRow =
  Database["public"]["Tables"]["listing_formats"]["Row"];
type InventoryRow = Database["public"]["Tables"]["inventory"]["Row"];

type VendorCatalogFilters = {
  format?: ListingFormatType;
  status?: ListingStatus;
};

function coverUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const { data } = supabase.storage.from("book_covers").getPublicUrl(path);
  return data.publicUrl;
}

async function getPublisher(
  publisherId: string | null,
): Promise<CatalogPublisher | null> {
  if (!publisherId) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("publishers")
    .select("id, name")
    .eq("id", publisherId)
    .maybeSingle();

  return data
    ? {
        id: data.id,
        name: data.name,
      }
    : null;
}

async function getBookAuthors(bookId: string): Promise<CatalogAuthor[]> {
  const supabase = createServiceRoleClient();
  const { data: joins } = await supabase
    .from("book_authors")
    .select("author_id")
    .eq("book_id", bookId);

  const authorIds = joins?.map((join) => join.author_id) ?? [];

  if (authorIds.length === 0) {
    return [];
  }

  const { data: authors } = await supabase
    .from("authors")
    .select("id, name")
    .in("id", authorIds)
    .order("name", { ascending: true });

  return (authors ?? []).map((author) => ({
    id: author.id,
    name: author.name,
  }));
}

async function getBookGenres(bookId: string): Promise<CatalogGenre[]> {
  const supabase = createServiceRoleClient();
  const { data: joins } = await supabase
    .from("book_genres")
    .select("genre_id")
    .eq("book_id", bookId);

  const genreIds = joins?.map((join) => join.genre_id) ?? [];

  if (genreIds.length === 0) {
    return [];
  }

  const { data: genres } = await supabase
    .from("genres")
    .select("id, name, parent_id")
    .in("id", genreIds)
    .order("name", { ascending: true });

  return (genres ?? []).map((genre) => ({
    id: genre.id,
    name: genre.name,
    parentId: genre.parent_id,
  }));
}

async function mapBook(row: BookRow): Promise<CatalogBook> {
  const [publisher, authors, genres] = await Promise.all([
    getPublisher(row.publisher_id),
    getBookAuthors(row.id),
    getBookGenres(row.id),
  ]);

  return {
    authors,
    coverImagePath: row.cover_image_path,
    coverImageUrl: coverUrl(row.cover_image_path),
    genres,
    id: row.id,
    isbn: row.isbn,
    language: row.language,
    libraryId: row.library_id,
    publicationYear: row.publication_year,
    publisher,
    subtitle: row.subtitle,
    title: row.title,
  };
}

async function getBook(bookId: string): Promise<CatalogBook | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("books")
    .select(
      "id, library_id, publisher_id, title, subtitle, publication_year, language, isbn, cover_image_path, created_at, updated_at",
    )
    .eq("id", bookId)
    .maybeSingle();

  return data ? mapBook(data) : null;
}

async function getListingFormats(
  listingId: string,
): Promise<CatalogListingFormat[]> {
  const supabase = createServiceRoleClient();
  const { data: formats } = await supabase
    .from("listing_formats")
    .select(
      "id, listing_id, format_type, price, ebook_file_path, created_at, updated_at",
    )
    .eq("listing_id", listingId)
    .order("format_type", { ascending: false });

  const rows = formats ?? [];
  const formatIds = rows.map((format) => format.id);
  let inventories: InventoryRow[] = [];

  if (formatIds.length > 0) {
    const { data } = await supabase
      .from("inventory")
      .select(
        "id, listing_format_id, stock_quantity, created_at, updated_at",
      )
      .in("listing_format_id", formatIds);

    inventories = data ?? [];
  }

  const inventoryByFormatId = new Map(
    inventories.map((inventory) => [inventory.listing_format_id, inventory]),
  );

  return rows.map((format) => {
    const inventory = inventoryByFormatId.get(format.id) ?? null;

    return {
      ebookFilePath: format.ebook_file_path,
      formatType: format.format_type,
      id: format.id,
      inventory: inventory
        ? {
            id: inventory.id,
            stockQuantity: inventory.stock_quantity,
          }
        : null,
      price: Number(format.price),
    };
  });
}

async function buildListing(row: ListingRow): Promise<CatalogListing | null> {
  const supabase = createServiceRoleClient();
  const [book, formats, library] = await Promise.all([
    getBook(row.book_id),
    getListingFormats(row.id),
    supabase
      .from("libraries")
      .select("name")
      .eq("id", row.library_id)
      .maybeSingle(),
  ]);

  if (!book) {
    return null;
  }

  return {
    approvalRequired: row.approval_required,
    book,
    createdAt: row.created_at,
    formats,
    id: row.id,
    libraryId: row.library_id,
    libraryName: library.data?.name ?? null,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function getCatalogGenres(): Promise<CatalogGenre[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("genres")
    .select("id, name, parent_id")
    .order("name", { ascending: true });

  return (data ?? []).map((genre) => ({
    id: genre.id,
    name: genre.name,
    parentId: genre.parent_id,
  }));
}

export async function getVendorCatalogListings(
  libraryId: string,
  filters: VendorCatalogFilters = {},
): Promise<VendorCatalogRow[]> {
  await requireLibraryStaff(libraryId);

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("listings")
    .select("id, library_id, book_id, status, approval_required, created_at, updated_at")
    .eq("library_id", libraryId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data: listings } = await query;
  const rows = listings ?? [];
  const bookIds = Array.from(new Set(rows.map((listing) => listing.book_id)));
  const listingIds = rows.map((listing) => listing.id);

  const [booksResponse, formatsResponse] = await Promise.all([
    bookIds.length > 0
      ? supabase
          .from("books")
          .select("id, title, cover_image_path")
          .in("id", bookIds)
      : Promise.resolve({ data: [] }),
    listingIds.length > 0
      ? supabase
          .from("listing_formats")
          .select("id, listing_id, format_type, price")
          .in("listing_id", listingIds)
      : Promise.resolve({ data: [] }),
  ]);

  const books = new Map(
    (booksResponse.data ?? []).map((book) => [book.id, book]),
  );
  const formatsByListingId = new Map<string, ListingFormatRow[]>();

  for (const format of formatsResponse.data ?? []) {
    const current = formatsByListingId.get(format.listing_id) ?? [];
    current.push(format as ListingFormatRow);
    formatsByListingId.set(format.listing_id, current);
  }

  return rows
    .map((listing) => {
      const formats = formatsByListingId.get(listing.id) ?? [];
      const formatTypes = formats.map((format) => format.format_type);

      if (filters.format && !formatTypes.includes(filters.format)) {
        return null;
      }

      const book = books.get(listing.book_id);
      const prices = formats.map((format) => Number(format.price));

      return {
        bookTitle: book?.title ?? "Untitled book",
        coverImageUrl: coverUrl(book?.cover_image_path ?? null),
        createdAt: listing.created_at,
        formats: formatTypes,
        id: listing.id,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        status: listing.status,
        updatedAt: listing.updated_at,
      } satisfies VendorCatalogRow;
    })
    .filter((row): row is VendorCatalogRow => row !== null);
}

export async function getVendorListingDetails(
  libraryId: string,
  listingId: string,
): Promise<CatalogListing | null> {
  await requireLibraryStaff(libraryId);

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("listings")
    .select("id, library_id, book_id, status, approval_required, created_at, updated_at")
    .eq("id", listingId)
    .eq("library_id", libraryId)
    .maybeSingle();

  return data ? buildListing(data) : null;
}

export async function getPublicListingDetails(
  listingId: string,
): Promise<CatalogListing | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("listings")
    .select("id, library_id, book_id, status, approval_required, created_at, updated_at")
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    return null;
  }

  const { data: library } = await supabase
    .from("libraries")
    .select("id")
    .eq("id", data.library_id)
    .eq("status", "active")
    .maybeSingle();

  if (!library) {
    return null;
  }

  return buildListing(data);
}
