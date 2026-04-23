"use client";

import { startTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/routing";
import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { signInAction } from "@/features/auth/actions/sign-in";

type SignInFormProps = {
  locale: "en" | "ar";
};

function getSignInErrorMessage(
  code: string | undefined,
  t: ReturnType<typeof useTranslations<"auth">>,
) {
  switch (code) {
    case "EMAIL_NOT_VERIFIED":
      return t("signIn.errors.emailNotVerified");
    case "ACCOUNT_SUSPENDED":
      return t("signIn.errors.accountSuspended");
    case "RATE_LIMITED":
      return t("signIn.errors.rateLimited");
    default:
      return t("signIn.errors.invalidCredentials");
  }
}

export function SignInForm({ locale }: SignInFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setIsPending(true);

    const result = await signInAction(formData);

    setIsPending(false);

    if ("error" in result) {
      setError(getSignInErrorMessage(result.code, t));
      return;
    }

    router.push(result.redirectTo);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsPending(true);

    const supabase = createClient();
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
      provider: "google",
    });

    if (oauthError) {
      setError(t("signIn.errors.invalidCredentials"));
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
        <h1 className="text-2xl font-semibold">{t("signIn.title")}</h1>
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
          label={t("signIn.email")}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <Input
          label={t("signIn.password")}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <div className="space-y-3">
          <Button className="w-full" loading={isPending} type="submit">
            {t("signIn.submitButton")}
          </Button>
          <Button
            className="w-full"
            onClick={handleGoogleSignIn}
            type="button"
            variant="outline"
          >
            {t("signIn.googleButton")}
          </Button>
        </div>
      </form>
      <div className="space-y-2 text-center text-sm">
        <a className="text-primary font-medium" href={`/${locale}/auth/forgot-password`}>
          {t("signIn.forgotPassword")}
        </a>
        <p className="text-muted-foreground">
          {t("signIn.noAccount")}{" "}
          <a className="text-primary font-medium" href={`/${locale}/auth/sign-up`}>
            {t("signIn.noAccountLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
