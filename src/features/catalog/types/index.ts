import type {
  ListingFormatType,
  ListingStatus,
} from "../schemas";

export type CatalogAuthor = {
  id: string;
  name: string;
};

export type CatalogGenre = {
  id: string;
  name: string;
  parentId: string | null;
};

export type CatalogPublisher = {
  id: string;
  name: string;
};

export type CatalogBook = {
  authors: CatalogAuthor[];
  coverImagePath: string | null;
  coverImageUrl: string | null;
  genres: CatalogGenre[];
  id: string;
  isbn: string | null;
  language: string;
  libraryId: string;
  publicationYear: number | null;
  publisher: CatalogPublisher | null;
  subtitle: string | null;
  title: string;
};

export type CatalogListingFormat = {
  ebookFilePath: string | null;
  formatType: ListingFormatType;
  id: string;
  inventory: {
    id: string;
    stockQuantity: number;
  } | null;
  price: number;
};

export type CatalogListing = {
  approvalRequired: boolean;
  book: CatalogBook;
  createdAt: string;
  formats: CatalogListingFormat[];
  id: string;
  libraryId: string;
  libraryName: string | null;
  status: ListingStatus;
  updatedAt: string;
};

export type VendorCatalogRow = {
  bookTitle: string;
  coverImageUrl: string | null;
  createdAt: string;
  formats: ListingFormatType[];
  id: string;
  minPrice: number;
  status: ListingStatus;
  updatedAt: string;
};
