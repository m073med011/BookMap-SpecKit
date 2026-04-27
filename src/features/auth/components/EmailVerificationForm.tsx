"use client";

import { startTransition, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { verifyEmailAction } from "@/features/auth/actions/verify-email";

type EmailVerificationFormProps = {
  locale: "en" | "ar";
};

function getVerificationErrorMessage(
  code: string | undefined,
  invalidLabel: string,
  expiredLabel: string,
) {
  if (code === "EXPIRED_TOKEN") {
    return expiredLabel;
  }

  return invalidLabel;
}

export function EmailVerificationForm({
  locale,
}: EmailVerificationFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [token, setToken] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((currentValue) => {
        if (currentValue <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setMessage(null);
    setIsPending(true);

    const result = await verifyEmailAction(formData);
    setIsPending(false);

    if ("error" in result) {
      setError(
        getVerificationErrorMessage(
          result.code,
          t("verifyEmail.errors.invalidToken"),
          t("verifyEmail.errors.expiredToken"),
        ),
      );
      return;
    }

    setMessage(t("verifyEmail.success"));
    router.push(`/${locale}/dashboard`);
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsPending(true);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      email,
      type: "signup",
    });

    setIsPending(false);

    if (resendError) {
      setError(t("verifyEmail.errors.invalidToken"));
      return;
    }

    setCooldown(60);
    setMessage(t("verifyEmail.success"));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{t("verifyEmail.title")}</h1>
      </div>
      <form
        action={(formData) => {
          startTransition(async () => {
            await handleSubmit(formData);
          });
        }}
        className="space-y-4"
      >
        <Input
          label={t("verifyEmail.otpLabel")}
          maxLength={6}
          name="token"
          onChange={(event) => setToken(event.target.value)}
          required
          value={token}
        />
        <input name="type" type="hidden" value="otp" />
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        <div className="space-y-3">
          <Button className="w-full" loading={isPending} type="submit">
            {t("verifyEmail.submitButton")}
          </Button>
          <Button
            className="w-full"
            disabled={!email || cooldown > 0}
            onClick={handleResend}
            type="button"
            variant="outline"
          >
            {cooldown > 0
              ? t("verifyEmail.resendCooldown", { seconds: cooldown })
              : t("verifyEmail.resendButton")}
          </Button>
        </div>
      </form>
    </div>
  );
}
