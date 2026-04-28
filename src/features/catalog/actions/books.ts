"use server";

import { logAuditEvent } from "@/features/auth/services/audit-service";
import { requireLibraryStaff } from "@/features/roles/services/authorize";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import {
  createBookSchema,
  updateBookMetadataSchema,
} from "../schemas";

type ActionError = {
  code: string;
  error: string;
};

type BookActionSuccess = {
  book_id: string;
  success: true;
  warnings?: string[];
};

type BookInsert = Database["public"]["Tables"]["books"]["Insert"];
type BookUpdate = Database["public"]["Tables"]["books"]["Update"];

function normalizeOptionalText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeIsbn(value?: string | null): string | null {
  const normalized = value?.replace(/[-\s]/g, "").toUpperCase();
  return normalized ? normalized : null;
}

function uniqueNames(values: string[]): string[] {
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

async function getOrCreatePublisherId(
  publisherName?: string,
): Promise<string | null> {
  const name = normalizeOptionalText(publisherName);

  if (!name) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase
    .from("publishers")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("publishers")
    .insert({ name })
    .select("id")
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from("publishers")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (retry) {
      return retry.id;
    }

    throw new Error(error.message);
  }

  return created.id;
}

async function getOrCreateAuthorIds(authorNames: string[]): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const authorIds: string[] = [];

  for (const name of uniqueNames(authorNames)) {
    const { data: existing } = await supabase
      .from("authors")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (existing) {
      authorIds.push(existing.id);
      continue;
    }

    const { data: created, error } = await supabase
      .from("authors")
      .insert({ name })
      .select("id")
      .single();

    if (error) {
      const { data: retry } = await supabase
        .from("authors")
        .select("id")
        .ilike("name", name)
        .maybeSingle();

      if (retry) {
        authorIds.push(retry.id);
        continue;
      }

      throw new Error(error.message);
    }

    authorIds.push(created.id);
  }

  return authorIds;
}

async function getOrCreateGenreIds(
  genreIds: string[],
  genreNames: string[],
): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const ids = new Set(genreIds);

  for (const name of uniqueNames(genreNames)) {
    const { data: existing } = await supabase
      .from("genres")
      .select("id")
      .is("parent_id", null)
      .ilike("name", name)
      .maybeSingle();

    if (existing) {
      ids.add(existing.id);
      continue;
    }

    const { data: created, error } = await supabase
      .from("genres")
      .insert({ name, parent_id: null })
      .select("id")
      .single();

    if (error) {
      const { data: retry } = await supabase
        .from("genres")
        .select("id")
        .is("parent_id", null)
        .ilike("name", name)
        .maybeSingle();

      if (retry) {
        ids.add(retry.id);
        continue;
      }

      throw new Error(error.message);
    }

    ids.add(created.id);
  }

  return Array.from(ids);
}

async function getDuplicateIsbnWarnings(
  isbn: string | null,
  bookId?: string,
): Promise<string[]> {
  if (!isbn) {
    return [];
  }

  const supabase = createServiceRoleClient();
  let query = supabase.from("books").select("id").eq("isbn", isbn).limit(1);

  if (bookId) {
    query = query.neq("id", bookId);
  }

  const { data } = await query;

  return data && data.length > 0
    ? ["ISBN already exists for another book record."]
    : [];
}

async function replaceBookJoins(
  bookId: string,
  authorIds: string[],
  genreIds: string[],
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase.from("book_authors").delete().eq("book_id", bookId);
  await supabase.from("book_genres").delete().eq("book_id", bookId);

  const { error: authorError } = await supabase.from("book_authors").insert(
    authorIds.map((authorId) => ({
      author_id: authorId,
      book_id: bookId,
    })),
  );

  if (authorError) {
    throw new Error(authorError.message);
  }

  const { error: genreError } = await supabase.from("book_genres").insert(
    genreIds.map((genreId) => ({
      book_id: bookId,
      genre_id: genreId,
    })),
  );

  if (genreError) {
    throw new Error(genreError.message);
  }
}

export async function createBookAction(
  input: unknown,
): Promise<BookActionSuccess | ActionError> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      code: "UNAUTHORIZED",
      error: "You must be signed in.",
    };
  }

  const validation = createBookSchema.safeParse(input);

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid book data.",
    };
  }

  try {
    await requireLibraryStaff(validation.data.library_id);
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to manage this library catalog.",
    };
  }

  const serviceSupabase = createServiceRoleClient();
  const isbn = normalizeIsbn(validation.data.isbn);

  try {
    const [publisherId, authorIds, genreIds, warnings] = await Promise.all([
      getOrCreatePublisherId(validation.data.publisher_name),
      getOrCreateAuthorIds(validation.data.author_names),
      getOrCreateGenreIds(
        validation.data.genre_ids,
        validation.data.genre_names,
      ),
      getDuplicateIsbnWarnings(isbn),
    ]);

    const payload: BookInsert = {
      isbn,
      language: validation.data.language.trim(),
      library_id: validation.data.library_id,
      publication_year: validation.data.publication_year ?? null,
      publisher_id: publisherId,
      subtitle: normalizeOptionalText(validation.data.subtitle),
      title: validation.data.title.trim(),
    };

    const { data: createdBook, error: createError } = await serviceSupabase
      .from("books")
      .insert(payload)
      .select("id")
      .single();

    if (createError || !createdBook) {
      return {
        code: "CREATE_FAILED",
        error: createError?.message ?? "Unable to create the book.",
      };
    }

    await replaceBookJoins(createdBook.id, authorIds, genreIds);

    await logAuditEvent({
      action: "catalog_book_created",
      metadata: {
        isbn,
        libraryId: validation.data.library_id,
      },
      targetId: createdBook.id,
      targetType: "book",
      userId: user.id,
    });

    return {
      book_id: createdBook.id,
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      code: "CREATE_FAILED",
      error:
        error instanceof Error ? error.message : "Unable to create the book.",
    };
  }
}

export async function updateBookMetadataAction(
  input: unknown,
): Promise<BookActionSuccess | ActionError> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      code: "UNAUTHORIZED",
      error: "You must be signed in.",
    };
  }

  const validation = updateBookMetadataSchema.safeParse(input);

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid book data.",
    };
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: existingBook, error: lookupError } = await serviceSupabase
    .from("books")
    .select("id, library_id")
    .eq("id", validation.data.book_id)
    .maybeSingle();

  if (lookupError || !existingBook) {
    return {
      code: "NOT_FOUND",
      error: "Book not found.",
    };
  }

  try {
    await requireLibraryStaff(existingBook.library_id);
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to edit this book.",
    };
  }

  const isbn = normalizeIsbn(validation.data.isbn);

  try {
    const [publisherId, authorIds, genreIds, warnings] = await Promise.all([
      getOrCreatePublisherId(validation.data.publisher_name),
      getOrCreateAuthorIds(validation.data.author_names),
      getOrCreateGenreIds(
        validation.data.genre_ids,
        validation.data.genre_names,
      ),
      getDuplicateIsbnWarnings(isbn, validation.data.book_id),
    ]);

    const payload: BookUpdate = {
      isbn,
      language: validation.data.language.trim(),
      publication_year: validation.data.publication_year ?? null,
      publisher_id: publisherId,
      subtitle: normalizeOptionalText(validation.data.subtitle),
      title: validation.data.title.trim(),
    };

    const { error: updateError } = await serviceSupabase
      .from("books")
      .update(payload)
      .eq("id", validation.data.book_id);

    if (updateError) {
      return {
        code: "UPDATE_FAILED",
        error: updateError.message,
      };
    }

    await replaceBookJoins(validation.data.book_id, authorIds, genreIds);

    await logAuditEvent({
      action: "catalog_book_updated",
      metadata: {
        isbn,
        libraryId: existingBook.library_id,
      },
      targetId: validation.data.book_id,
      targetType: "book",
      userId: user.id,
    });

    return {
      book_id: validation.data.book_id,
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      code: "UPDATE_FAILED",
      error:
        error instanceof Error ? error.message : "Unable to update the book.",
    };
  }
}
