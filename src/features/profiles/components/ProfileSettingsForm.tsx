"use client";

import { startTransition, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { updateProfileAction } from "@/features/profiles/actions/update-profile";
import type { Profile } from "@/features/auth/types";

type ProfileSettingsFormProps = {
  locale: "en" | "ar";
  profile: Profile;
};

export function ProfileSettingsForm({
  locale,
  profile,
}: ProfileSettingsFormProps) {
  const t = useTranslations("profile");
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [preferredLocale, setPreferredLocale] = useState<
    "en" | "ar"
  >(profile.preferredLocale);
  const [isPending, setIsPending] = useState(false);
  const isRtl = locale === "ar";

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    const result = await updateProfileAction(formData);
    setIsPending(false);

    if ("error" in result) {
      toast.error(t("settings.updateError"));
      return;
    }

    toast.success(t("settings.updateSuccess"));
  };

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await handleSubmit(formData);
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t("settings.title")}</h2>
      </div>
      <Input
        label={t("settings.displayName")}
        maxLength={100}
        name="displayName"
        onChange={(event) => setDisplayName(event.target.value)}
        value={displayName}
      />
      <Textarea
        helperText={t("settings.bioCounter", { count: bio.length })}
        label={t("settings.bio")}
        maxLength={500}
        name="bio"
        onChange={(event) => setBio(event.target.value)}
        value={bio}
      />
      <Select
        label={t("settings.preferredLocale")}
        name="preferredLocale"
        onValueChange={(value) => setPreferredLocale(value as "en" | "ar")}
        value={preferredLocale}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align={isRtl ? "end" : "start"}>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ar">العربية</SelectItem>
        </SelectContent>
      </Select>
      <input name="preferredLocale" type="hidden" value={preferredLocale} />
      <Button loading={isPending} type="submit">
        {t("settings.saveButton")}
      </Button>
    </form>
  );
}
