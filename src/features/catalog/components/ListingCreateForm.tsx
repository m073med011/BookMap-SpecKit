"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Input } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { useRouter } from "@/lib/i18n/routing";
import { createListingAction } from "../actions/listings";
import { createListingSchema } from "../schemas";
import { useBookContext } from "./BookProvider";

type ListingCreateFormProps = {
  libraryId: string;
};

type FormState = {
  bookId: string;
  ebookFilePath: string;
  ebookPrice: string;
  includeEbook: boolean;
  includePhysical: boolean;
  physicalPrice: string;
  stockQuantity: string;
};

const initialState: FormState = {
  bookId: "",
  ebookFilePath: "",
  ebookPrice: "",
  includeEbook: false,
  includePhysical: true,
  physicalPrice: "",
  stockQuantity: "0",
};

export function ListingCreateForm({ libraryId }: ListingCreateFormProps) {
  const router = useRouter();
  const { activeBookId } = useBookContext();
  const [formState, setFormState] = useState<FormState>(initialState);
  const [isPending, startTransition] = useTransition();
  const selectedBookId = activeBookId ?? formState.bookId.trim();

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
    const formats = [];

    if (formState.includePhysical) {
      formats.push({
        price: Number(formState.physicalPrice),
        stock_quantity: Number(formState.stockQuantity || 0),
        type: "physical" as const,
      });
    }

    if (formState.includeEbook) {
      formats.push({
        ebook_file_path: formState.ebookFilePath || undefined,
        price: Number(formState.ebookPrice),
        type: "ebook" as const,
      });
    }

    const validation = createListingSchema.safeParse({
      book_id: selectedBookId,
      formats,
      library_id: libraryId,
    });

    if (!validation.success) {
      toast.error(
        validation.error.issues[0]?.message ?? "Invalid listing data.",
      );
      return;
    }

    startTransition(async () => {
      const result = await createListingAction(validation.data);

      if ("success" in result && result.success) {
        toast.success("Listing saved as draft.");
        router.push(`/dashboard/library/${libraryId}/catalog/${result.listing_id}`);
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
        <CardTitle>Create listing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Input
          helperText={
            activeBookId
              ? "Using the book you just saved."
              : "Paste an existing catalog book ID."
          }
          label="Book ID"
          onChange={(event) => updateField("bookId", event.target.value)}
          readOnly={Boolean(activeBookId)}
          value={activeBookId ?? formState.bookId}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <Checkbox
              checked={formState.includePhysical}
              label="Physical"
              onCheckedChange={(checked) =>
                updateField("includePhysical", checked === true)
              }
            />
            <div className="mt-4 grid gap-4">
              <Input
                disabled={!formState.includePhysical}
                label="Physical price"
                min="0"
                onChange={(event) =>
                  updateField("physicalPrice", event.target.value)
                }
                step="0.01"
                type="number"
                value={formState.physicalPrice}
              />
              <Input
                disabled={!formState.includePhysical}
                label="Stock quantity"
                min="0"
                onChange={(event) =>
                  updateField("stockQuantity", event.target.value)
                }
                type="number"
                value={formState.stockQuantity}
              />
            </div>
          </div>

          <div className="rounded-md border p-4">
            <Checkbox
              checked={formState.includeEbook}
              label="Ebook"
              onCheckedChange={(checked) =>
                updateField("includeEbook", checked === true)
              }
            />
            <div className="mt-4 grid gap-4">
              <Input
                disabled={!formState.includeEbook}
                label="Ebook price"
                min="0"
                onChange={(event) =>
                  updateField("ebookPrice", event.target.value)
                }
                step="0.01"
                type="number"
                value={formState.ebookPrice}
              />
              <Input
                disabled={!formState.includeEbook}
                helperText="You can upload the file on the listing page after saving."
                label="Ebook file path"
                onChange={(event) =>
                  updateField("ebookFilePath", event.target.value)
                }
                value={formState.ebookFilePath}
              />
            </div>
          </div>
        </div>

        <Button loading={isPending} onClick={handleSubmit} type="button">
          Save draft listing
        </Button>
      </CardContent>
    </Card>
  );
}
