"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { createBookAction } from "../actions/books";
import { createBookSchema } from "../schemas";
import { useBookContext } from "./BookProvider";

type BookCreateFormProps = {
  libraryId: string;
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

const initialState: FormState = {
  authors: "",
  genres: "",
  isbn: "",
  language: "en",
  publicationYear: "",
  publisher: "",
  subtitle: "",
  title: "",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function BookCreateForm({ libraryId }: BookCreateFormProps) {
  const { activeBookId, setActiveBookId, setWarnings, warnings } = useBookContext();
  const [formState, setFormState] = useState<FormState>(initialState);
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
    const payload = {
      author_names: splitList(formState.authors),
      genre_ids: [],
      genre_names: splitList(formState.genres),
      isbn: formState.isbn || undefined,
      language: formState.language,
      library_id: libraryId,
      publication_year: formState.publicationYear
        ? Number(formState.publicationYear)
        : undefined,
      publisher_name: formState.publisher || undefined,
      subtitle: formState.subtitle || undefined,
      title: formState.title,
    };
    const validation = createBookSchema.safeParse(payload);

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Invalid book data.");
      return;
    }

    startTransition(async () => {
      const result = await createBookAction(validation.data);

      if ("success" in result && result.success) {
        setActiveBookId(result.book_id);
        setWarnings(result.warnings ?? []);
        toast.success("Book saved.");
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
        <CardTitle>Create book</CardTitle>
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
            helperText="Separate multiple authors with commas."
            label="Authors"
            onChange={(event) => updateField("authors", event.target.value)}
            value={formState.authors}
          />
          <Input
            helperText="Separate multiple genres with commas."
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
            maxLength={12}
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

        {activeBookId ? (
          <Textarea
            label="Selected book ID"
            readOnly
            rows={2}
            value={activeBookId}
          />
        ) : null}

        <Button loading={isPending} onClick={handleSubmit} type="button">
          Save book
        </Button>
      </CardContent>
    </Card>
  );
}
