"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { useRouter } from "@/lib/i18n/routing";
import type { Library } from "../types";
import { createLibraryAction } from "../actions/create-library";
import { submitLibraryAction } from "../actions/submit-library";
import { updateLibraryAction } from "../actions/update-library";
import { uploadLibraryAssetAction } from "../actions/upload-library-asset";
import { createLibrarySchema } from "../schemas/library";
import { generateLibrarySlug } from "../utils/slug";

type OnboardingWizardProps = {
  library?: Library | null;
  locale: string;
};

type FormState = {
  address: string;
  bannerUrl: string | null;
  contactEmail: string;
  contactPhone: string;
  description: string;
  languages: Array<"en" | "ar">;
  logoUrl: string | null;
  name: string;
  slug: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function buildInitialState(library?: Library | null): FormState {
  return {
    address: library?.address ?? "",
    bannerUrl: library?.bannerUrl ?? null,
    contactEmail: library?.contactEmail ?? "",
    contactPhone: library?.contactPhone ?? "",
    description: library?.description ?? "",
    languages:
      library?.languages.filter(
        (language): language is "en" | "ar" =>
          language === "en" || language === "ar",
      ) ?? ["en"],
    logoUrl: library?.logoUrl ?? null,
    name: library?.name ?? "",
    slug: library?.slug ?? "",
  };
}

export function OnboardingWizard({
  library = null,
}: OnboardingWizardProps) {
  const router = useRouter();
  const t = useTranslations("libraries");
  const [step, setStep] = useState(0);
  const [libraryId, setLibraryId] = useState<string | null>(library?.id ?? null);
  const [formState, setFormState] = useState<FormState>(buildInitialState(library));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [slugEdited, setSlugEdited] = useState(Boolean(library?.slug));
  const [isPending, startTransition] = useTransition();
  const [uploadingType, setUploadingType] = useState<"logo" | "banner" | null>(null);

  const steps = [t("step1Title"), t("step2Title"), t("step3Title")];

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateCurrentStep() {
    const nextErrors: FieldErrors = {};
    const parsed = createLibrarySchema.safeParse({
      address: formState.address || undefined,
      contactEmail: formState.contactEmail || undefined,
      contactPhone: formState.contactPhone || undefined,
      description: formState.description || undefined,
      languages: formState.languages,
      name: formState.name,
      slug: formState.slug || undefined,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string") {
          nextErrors[field as keyof FormState] = issue.message;
        }
      }
    }

    if (step === 0) {
      if (!formState.name.trim()) {
        nextErrors.name = t("validation.nameRequired");
      } else if (formState.name.trim().length < 2) {
        nextErrors.name = t("validation.nameMinLength");
      } else if (formState.name.trim().length > 200) {
        nextErrors.name = t("validation.nameTooLong");
      }

      if (formState.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formState.slug)) {
        nextErrors.slug = t("validation.invalidSlug");
      }
    }

    if (step === 1 && formState.contactEmail) {
      const emailResult = createLibrarySchema.shape.contactEmail.safeParse(
        formState.contactEmail,
      );

      if (!emailResult.success) {
        nextErrors.contactEmail = t("validation.invalidEmail");
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function persistDraft() {
    const payload = {
      address: formState.address || undefined,
      contactEmail: formState.contactEmail || undefined,
      contactPhone: formState.contactPhone || undefined,
      description: formState.description || undefined,
      languages: formState.languages,
      name: formState.name,
      slug: formState.slug || undefined,
    };

    if (!libraryId) {
      const result = await createLibraryAction(payload);

      if ("success" in result && result.success) {
        setLibraryId(result.libraryId);
        router.replace(`/dashboard/libraries/new?draft=${result.libraryId}`);
      }

      return result;
    }

    return updateLibraryAction({
      ...payload,
      libraryId,
    });
  }

  function showActionError(result: { code: string; error: string } | { success: true }) {
    if ("error" in result) {
      toast.error(result.error);
    }
  }

  function handleSaveDraft() {
    startTransition(async () => {
      const result = await persistDraft();

      if ("success" in result && result.success) {
        toast.success(t("savedDraft"));
        return;
      }

      showActionError(result);
    });
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleSubmit() {
    if (!validateCurrentStep()) {
      return;
    }

    startTransition(async () => {
      const saveResult = await persistDraft();

      if (!("success" in saveResult) || !saveResult.success) {
        showActionError(saveResult);
        return;
      }

      const nextLibraryId =
        ("libraryId" in saveResult ? saveResult.libraryId : libraryId) ?? null;

      if (!nextLibraryId) {
        toast.error(t("incompleteFields"));
        return;
      }

      const submitResult = await submitLibraryAction({
        libraryId: nextLibraryId,
      });

      if ("success" in submitResult && submitResult.success) {
        toast.success(t("submitted"));
        router.push(`/dashboard/libraries/${nextLibraryId}`);
        return;
      }

      if ("error" in submitResult) {
        toast.error(submitResult.error);
      }
    });
  }

  function handleAssetUpload(type: "logo" | "banner", file: File | null) {
    if (!file) {
      return;
    }

    if (!libraryId) {
      toast.info(t("saveDraft"));
      return;
    }

    setUploadingType(type);
    startTransition(async () => {
      const payload = new FormData();
      payload.set("file", file);
      payload.set("libraryId", libraryId);
      payload.set("type", type);

      const result = await uploadLibraryAssetAction(payload);
      setUploadingType(null);

      if ("success" in result && result.success) {
        updateField(type === "logo" ? "logoUrl" : "bannerUrl", result.url);
        toast.success(
          type === "logo" ? t("uploadLogo") : t("uploadBanner"),
        );
        return;
      }

      if ("error" in result && typeof result.error === "string") {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("createLibrary")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((label, index) => (
            <button
              className={`rounded-xl border px-4 py-3 text-start text-sm ${
                index === step
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
              key={label}
              onClick={() => setStep(index)}
              type="button"
            >
              <span className="text-muted-foreground block text-xs">
                {index + 1}
              </span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {step === 0 ? (
          <div className="grid gap-4">
            <Input
              error={errors.name}
              label={t("libraryName")}
              onChange={(event) => {
                const nextName = event.target.value;
                updateField("name", nextName);

                if (!slugEdited) {
                  updateField("slug", generateLibrarySlug(nextName));
                }
              }}
              value={formState.name}
            />
            <Input
              error={errors.slug}
              helperText={`${t("slugPreview")}: ${formState.slug || generateLibrarySlug(formState.name) || "-"}`}
              label={t("librarySlug")}
              onChange={(event) => {
                setSlugEdited(true);
                updateField("slug", generateLibrarySlug(event.target.value));
              }}
              value={formState.slug}
            />
            <Textarea
              error={errors.description}
              label={t("description")}
              onChange={(event) => updateField("description", event.target.value)}
              rows={5}
              value={formState.description}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4">
            <Input
              error={errors.contactEmail}
              label={t("contactEmail")}
              onChange={(event) => updateField("contactEmail", event.target.value)}
              type="email"
              value={formState.contactEmail}
            />
            <Input
              error={errors.contactPhone}
              label={t("contactPhone")}
              onChange={(event) => updateField("contactPhone", event.target.value)}
              value={formState.contactPhone}
            />
            <Textarea
              error={errors.address}
              label={t("address")}
              onChange={(event) => updateField("address", event.target.value)}
              rows={3}
              value={formState.address}
            />

            <div className="grid gap-2">
              <span className="text-sm font-medium">{t("languages")}</span>
              <div className="flex flex-wrap gap-3">
                {(["en", "ar"] as const).map((language) => {
                  const checked = formState.languages.includes(language);
                  return (
                    <label
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm"
                      key={language}
                    >
                      <input
                        checked={checked}
                        onChange={() => {
                          updateField(
                            "languages",
                            checked
                              ? formState.languages.filter((entry) => entry !== language)
                              : [...formState.languages, language],
                          );
                        }}
                        type="checkbox"
                      />
                      <span>{language.toUpperCase()}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl border p-4">
              <div>
                <p className="text-muted-foreground text-xs">{t("libraryName")}</p>
                <p className="font-medium">{formState.name || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("librarySlug")}</p>
                <p className="font-medium">{formState.slug || generateLibrarySlug(formState.name) || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("description")}</p>
                <p className="whitespace-pre-wrap">{formState.description || "-"}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">{t("contactEmail")}</p>
                  <p>{formState.contactEmail || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("contactPhone")}</p>
                  <p>{formState.contactPhone || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("address")}</p>
                <p className="whitespace-pre-wrap">{formState.address || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("languages")}</p>
                <p>{formState.languages.join(", ").toUpperCase()}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-3 rounded-2xl border p-4">
                <div className="space-y-2">
                  <p className="font-medium">{t("logo")}</p>
                  {formState.logoUrl ? (
                    <img
                      alt={t("logo")}
                      className="h-28 w-28 rounded-2xl border object-cover"
                      src={formState.logoUrl}
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-28 w-28 items-center justify-center rounded-2xl border text-sm">
                      {t("logo")}
                    </div>
                  )}
                </div>
                <Input
                  accept="image/jpeg,image/png,image/webp"
                  helperText={`${t("validation.invalidFileType")} • ${t("validation.fileTooLarge")}`}
                  onChange={(event) =>
                    handleAssetUpload("logo", event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
              </div>

              <div className="grid gap-3 rounded-2xl border p-4">
                <div className="space-y-2">
                  <p className="font-medium">{t("banner")}</p>
                  {formState.bannerUrl ? (
                    <img
                      alt={t("banner")}
                      className="h-28 w-full rounded-2xl border object-cover"
                      src={formState.bannerUrl}
                    />
                  ) : (
                    <div className="from-primary/15 to-primary/5 flex h-28 w-full items-center justify-center rounded-2xl border bg-gradient-to-br text-sm">
                      {t("banner")}
                    </div>
                  )}
                </div>
                <Input
                  accept="image/jpeg,image/png,image/webp"
                  helperText={`${t("validation.invalidFileType")} • ${t("validation.fileTooLarge")}`}
                  onChange={(event) =>
                    handleAssetUpload("banner", event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex gap-3">
            <Button
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              type="button"
              variant="outline"
            >
              {t("back")}
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} type="button">
                {t("next")}
              </Button>
            ) : (
              <Button loading={isPending} onClick={handleSubmit} type="button">
                {t("submitForReview")}
              </Button>
            )}
          </div>

          <Button
            loading={isPending || uploadingType !== null}
            onClick={handleSaveDraft}
            type="button"
            variant="secondary"
          >
            {uploadingType === "logo"
              ? t("uploadLogo")
              : uploadingType === "banner"
                ? t("uploadBanner")
                : t("saveDraft")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
