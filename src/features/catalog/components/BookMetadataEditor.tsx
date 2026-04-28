"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { updateBookMetadataAction } from "../actions/books";
import { updateBookMetadataSchema } from "../schemas";
import type { CatalogBook } from "../types";

type BookMetadataEditorProps = {
  book: CatalogBook;
};

type FormState = {
  authors: string;
  genres: string;
  isbn: string;
  language: string;
  publicationYear: string;
  publisher: string;
  subtitle: string;
  title: string;
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function BookMetadataEditor({ book }: BookMetadataEditorProps) {
  const [formState, setFormState] = useState<FormState>({
    authors: book.authors.map((author) => author.name).join(", "),
    genres: book.genres.map((genre) => genre.name).join(", "),
    isbn: book.isbn ?? "",
    language: book.language,
    publicationYear: book.publicationYear?.toString() ?? "",
    publisher: book.publisher?.name ?? "",
    subtitle: book.subtitle ?? "",
    title: book.title,
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit() {
    const validation = updateBookMetadataSchema.safeParse({
      author_names: splitList(formState.authors),
      book_id: book.id,
      genre_ids: [],
      genre_names: splitList(formState.genres),
      isbn: formState.isbn || undefined,
      language: formState.language,
      publication_year: formState.publicationYear
        ? Number(formState.publicationYear)
        : undefined,
      publisher_name: formState.publisher || undefined,
      subtitle: formState.subtitle || undefined,
      title: formState.title,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Invalid metadata.");
      return;
    }

    startTransition(async () => {
      const result = await updateBookMetadataAction(validation.data);

      if ("success" in result && result.success) {
        setWarnings(result.warnings ?? []);
        toast.success("Book metadata updated.");
        return;
      }

      if ("error" in result) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Title"
            onChange={(event) => updateField("title", event.target.value)}
            value={formState.title}
          />
          <Input
            label="Subtitle"
            onChange={(event) => updateField("subtitle", event.target.value)}
            value={formState.subtitle}
          />
          <Input
            label="Authors"
            onChange={(event) => updateField("authors", event.target.value)}
            value={formState.authors}
          />
          <Input
            label="Genres"
            onChange={(event) => updateField("genres", event.target.value)}
            value={formState.genres}
          />
          <Input
            label="Publisher"
            onChange={(event) => updateField("publisher", event.target.value)}
            value={formState.publisher}
          />
          <Input
            label="ISBN"
            onChange={(event) => updateField("isbn", event.target.value)}
            value={formState.isbn}
          />
          <Input
            label="Language"
            onChange={(event) => updateField("language", event.target.value)}
            value={formState.language}
          />
          <Input
            label="Publication year"
            onChange={(event) =>
              updateField("publicationYear", event.target.value)
            }
            type="number"
            value={formState.publicationYear}
          />
        </div>

        {warnings.length > 0 ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            {warnings.join(" ")}
          </div>
        ) : null}

        <Button loading={isPending} onClick={handleSubmit} type="button">
          Save metadata
        </Button>
      </CardContent>
    </Card>
  );
}
