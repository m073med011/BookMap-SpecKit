"use client";

import { startTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/routing";
import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  signUpAction,
  type SignUpActionResult,
} from "@/features/auth/actions/sign-up";
import { PasswordStrengthIndicator } from "@/features/auth/components/PasswordStrengthIndicator";

type SignUpFormProps = {
  locale: "en" | "ar";
};

function getSignUpErrorMessage(
  code: string | undefined,
  t: ReturnType<typeof useTranslations<"auth">>,
) {
  switch (code) {
    case "EMAIL_TAKEN":
      return t("signUp.errors.emailTaken");
    case "WEAK_PASSWORD":
      return t("signUp.errors.weakPassword");
    case "RATE_LIMITED":
      return t("signUp.errors.rateLimited");
    default:
      return t("signUp.errors.unknown");
  }
}

export function SignUpForm({ locale }: SignUpFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setIsPending(true);

    const nextEmail = String(formData.get("email") ?? "");
    const result = (await signUpAction(formData)) as SignUpActionResult;

    setIsPending(false);

    if ("error" in result) {
      setError(getSignUpErrorMessage(result.code, t));
      return;
    }

    router.push(
      `/${locale}/auth/verify-email?email=${encodeURIComponent(nextEmail)}`,
    );
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsPending(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/${locale}/auth/callback`;
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      options: {
        redirectTo,
      },
      provider: "google",
    });

    if (oauthError) {
      setError(t("signUp.errors.unknown"));
      setIsPending(false);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setIsPending(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{t("signUp.title")}</h1>
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
          label={t("signUp.email")}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <div className="space-y-3">
          <Input
            label={t("signUp.password")}
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
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <div className="space-y-3">
          <Button className="w-full" loading={isPending} type="submit">
            {t("signUp.submitButton")}
          </Button>
          <Button
            className="w-full"
            onClick={handleGoogleSignUp}
            type="button"
            variant="outline"
          >
            {t("signUp.googleButton")}
          </Button>
        </div>
      </form>
      <p className="text-muted-foreground text-center text-sm">
        {t("signUp.hasAccount")}{" "}
        <a className="text-primary font-medium" href={`/${locale}/auth/sign-in`}>
          {t("signUp.hasAccountLink")}
        </a>
      </p>
    </div>
  );
}
