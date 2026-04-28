import { describe, expect, it } from "vitest";

import {
  createBookSchema,
  createListingSchema,
  listingStatusSchema,
} from "@/features/catalog/schemas";

const uuidA = "11111111-1111-4111-8111-111111111111";
const uuidB = "22222222-2222-4222-8222-222222222222";

describe("catalog schemas", () => {
  it("requires at least one author and genre when creating a book", () => {
    const result = createBookSchema.safeParse({
      author_names: [],
      genre_ids: [],
      genre_names: [],
      language: "en",
      library_id: uuidA,
      title: "Clean Architecture",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
      "author_names",
    );
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
      "genre_names",
    );
  });

  it("deduplicates names and accepts formatted ISBN values", () => {
    const result = createBookSchema.safeParse({
      author_names: ["Robert Martin", "robert martin", "Robert Martin"],
      genre_ids: [],
      genre_names: ["Software", "software"],
      isbn: "978-0132350884",
      language: "en",
      library_id: uuidA,
      publication_year: "2008",
      title: "Clean Code",
    });

    expect(result.success).toBe(true);
    expect(result.data.author_names).toEqual(["Robert Martin"]);
    expect(result.data.genre_names).toEqual(["Software"]);
    expect(result.data.publication_year).toBe(2008);
  });

  it("requires stock for physical formats and prevents duplicate formats", () => {
    const missingStock = createListingSchema.safeParse({
      book_id: uuidB,
      formats: [{ price: 10, type: "physical" }],
      library_id: uuidA,
    });

    expect(missingStock.success).toBe(false);
    expect(
      missingStock.error?.issues.some((issue) =>
        issue.path.includes("stock_quantity"),
      ),
    ).toBe(true);

    const duplicateFormats = createListingSchema.safeParse({
      book_id: uuidB,
      formats: [
        { price: 10, stock_quantity: 3, type: "physical" },
        { price: 12, stock_quantity: 5, type: "physical" },
      ],
      library_id: uuidA,
    });

    expect(duplicateFormats.success).toBe(false);
  });

  it("accepts the strict listing lifecycle statuses", () => {
    expect(listingStatusSchema.options).toEqual([
      "draft",
      "pending_review",
      "published",
      "unpublished",
      "archived",
    ]);
  });
});
