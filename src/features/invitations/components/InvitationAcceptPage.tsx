"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/routing";
import { Button } from "@/components/ui";
import { acceptInvitationAction } from "@/features/invitations/actions/accept-invitation";

type InvitationAcceptPageProps = {
  locale: "en" | "ar";
  token: string;
};

export function InvitationAcceptPage({
  locale,
  token,
}: InvitationAcceptPageProps) {
  const t = useTranslations("invitations");
  const router = useRouter();
  const [state, setState] = useState<{
    libraryId?: string;
    status: "error" | "loading" | "success";
  }>({
    status: "loading",
  });

  useEffect(() => {
    const formData = new FormData();
    formData.set("token", token);

    void acceptInvitationAction(formData).then((result) => {
      if ("error" in result) {
        setState({
          status: "error",
        });
        return;
      }

      setState({
        libraryId: result.libraryId,
        status: "success",
      });
    });
  }, [token]);

  if (state.status === "loading") {
    return (
      <p className="text-muted-foreground text-sm">{t("accept.processing")}</p>
    );
  }

  if (state.status === "error" || !state.libraryId) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive text-sm">{t("accept.invalid")}</p>
        <a className="text-primary text-sm font-medium" href={`/${locale}`}>
          {t("accept.goToDashboard")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-emerald-600">{t("accept.success")}</p>
      <Button
        onClick={() =>
          router.push(`/${locale}/dashboard/library/${state.libraryId}`)
        }
        type="button"
      >
        {t("accept.goToDashboard")}
      </Button>
    </div>
  );
}
