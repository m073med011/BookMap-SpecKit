"use client";

import { startTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@/components/ui";
import { requestPasswordResetAction } from "@/features/auth/actions/reset-password";

type ForgotPasswordFormProps = {
  locale: "en" | "ar";
};

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    await requestPasswordResetAction(formData);
    setIsPending(false);
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{t("forgotPassword.title")}</h1>
      </div>
      <form
        action={(formData) => {
          startTransition(async () => {
            await handleSubmit(formData);
          });
        }}
        className="space-y-4"
      >
        <input name="locale" type="hidden" value={locale} />
        <Input
          label={t("forgotPassword.email")}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        {isSubmitted ? (
          <p className="text-sm text-emerald-600">{t("forgotPassword.success")}</p>
        ) : null}
        <Button className="w-full" loading={isPending} type="submit">
          {t("forgotPassword.submitButton")}
        </Button>
      </form>
      <p className="text-center text-sm">
        <a className="text-primary font-medium" href={`/${locale}/auth/sign-in`}>
          {t("error.tryAgain")}
        </a>
      </p>
    </div>
  );
}
