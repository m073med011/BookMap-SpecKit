"use client";

import { startTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/routing";
import { Button, Input } from "@/components/ui";
import { resetPasswordAction } from "@/features/auth/actions/reset-password";
import { PasswordStrengthIndicator } from "@/features/auth/components/PasswordStrengthIndicator";

type ResetPasswordFormProps = {
  code: string;
  locale: "en" | "ar";
};

function getResetPasswordErrorMessage(
  code: string | undefined,
  t: ReturnType<typeof useTranslations<"auth">>,
) {
  switch (code) {
    case "EXPIRED_TOKEN":
      return t("resetPassword.errors.expiredToken");
    case "WEAK_PASSWORD":
      return t("resetPassword.errors.weakPassword");
    default:
      return t("resetPassword.errors.invalidToken");
  }
}

export function ResetPasswordForm({
  code,
  locale,
}: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError(t("resetPassword.errors.mismatch"));
      return;
    }

    setIsPending(true);
    const result = await resetPasswordAction(formData);
    setIsPending(false);

    if ("error" in result) {
      setError(getResetPasswordErrorMessage(result.code, t));
      return;
    }

    setMessage(t("resetPassword.success"));
    router.push(`/${locale}/auth/sign-in`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{t("resetPassword.title")}</h1>
      </div>
      <form
        action={(formData) => {
          startTransition(async () => {
            await handleSubmit(formData);
          });
        }}
        className="space-y-4"
      >
        <input name="code" type="hidden" value={code} />
        <Input
          label={t("resetPassword.newPassword")}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <PasswordStrengthIndicator
          mediumLabel={t("passwordStrength.medium")}
          password={password}
          strongLabel={t("passwordStrength.strong")}
          weakLabel={t("passwordStrength.weak")}
        />
        <Input
          label={t("resetPassword.confirmPassword")}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        <Button className="w-full" loading={isPending} type="submit">
          {t("resetPassword.submitButton")}
        </Button>
      </form>
    </div>
  );
}
