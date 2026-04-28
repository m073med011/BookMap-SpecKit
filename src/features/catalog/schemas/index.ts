import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

function uniqueTrimmedValues(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();

    if (normalized && !seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }

  return result;
}

const requiredNameArray = z
  .array(z.string().trim().min(1).max(200))
  .min(1)
  .transform(uniqueTrimmedValues);

const optionalNameArray = (max: number) =>
  z
    .array(z.string().trim().min(1).max(max))
    .default([])
    .transform(uniqueTrimmedValues);

const bookMetadataFields = {
  author_names: requiredNameArray,
  genre_ids: z.array(z.uuid()).default([]),
  genre_names: optionalNameArray(120),
  isbn: optionalTrimmedString(20).refine(
    (value) =>
      !value ||
      /^(?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dXx]$/.test(
        value.replace(/\s+/g, ""),
      ),
    "Enter a valid ISBN-10 or ISBN-13.",
  ),
  language: z.string().trim().min(2).max(12),
  publication_year: z.coerce
    .number()
    .int()
    .min(0)
    .max(new Date().getFullYear() + 2)
    .optional(),
  publisher_name: optionalTrimmedString(200),
  subtitle: optionalTrimmedString(500),
  title: z.string().trim().min(1).max(300),
};

function requireAtLeastOneGenre(
  value: {
    genre_ids: string[];
    genre_names: string[];
  },
  ctx: z.RefinementCtx,
) {
  if (value.genre_ids.length === 0 && value.genre_names.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Add at least one genre.",
      path: ["genre_names"],
    });
  }
}

export const CATALOG_COVER_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const CATALOG_EBOOK_MAX_SIZE_BYTES = 100 * 1024 * 1024;

export const CATALOG_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const CATALOG_EBOOK_MIME_TYPES = [
  "application/pdf",
  "application/epub+zip",
] as const;

export const listingStatusSchema = z.enum([
  "draft",
  "pending_review",
  "published",
  "unpublished",
  "archived",
]);

export const listingFormatTypeSchema = z.enum(["physical", "ebook"]);

export const createBookSchema = z
  .object({
    ...bookMetadataFields,
    library_id: z.uuid(),
  })
  .superRefine(requireAtLeastOneGenre);

export const updateBookMetadataSchema = z
  .object({
    ...bookMetadataFields,
    book_id: z.uuid(),
  })
  .superRefine(requireAtLeastOneGenre);

export const listingFormatInputSchema = z
  .object({
    ebook_file_path: optionalTrimmedString(1000),
    price: z.coerce.number().min(0).max(999999),
    stock_quantity: z.coerce.number().int().min(0).max(999999).optional(),
    type: listingFormatTypeSchema,
  })
  .superRefine((value, ctx) => {
    if (value.type === "physical" && value.stock_quantity === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Stock quantity is required for physical books.",
        path: ["stock_quantity"],
      });
    }
  });

export const createListingSchema = z.object({
  book_id: z.uuid(),
  formats: z
    .array(listingFormatInputSchema)
    .min(1)
    .refine(
      (formats) =>
        new Set(formats.map((format) => format.type)).size === formats.length,
      "Each listing format can only be added once.",
    ),
  library_id: z.uuid(),
});

export const updateListingStatusSchema = z.object({
  listing_id: z.uuid(),
  new_status: listingStatusSchema,
});

export const updateInventorySchema = z.object({
  adjustment: z.coerce.number().int().min(-999999).max(999999),
  listing_format_id: z.uuid(),
});

export const catalogAssetUploadSchema = z.object({
  bookId: z.uuid().optional(),
  libraryId: z.uuid(),
  listingFormatId: z.uuid().optional(),
});

export const vendorCatalogFilterSchema = z.object({
  format: listingFormatTypeSchema.optional(),
  status: listingStatusSchema.optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type ListingStatus = z.infer<typeof listingStatusSchema>;
export type ListingFormatType = z.infer<typeof listingFormatTypeSchema>;
