"use client";

import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { toast } from "@/lib/utils/toast";

export default function ToastDemoPage() {
  const t = useTranslations("demo");

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Toast Demo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => toast.success(t("success"))} type="button">
            Success Toast
          </Button>
          <Button
            onClick={() => toast.error(t("error"))}
            type="button"
            variant="destructive"
          >
            Error Toast
          </Button>
          <Button
            onClick={() => toast.warning(t("warning"))}
            type="button"
            variant="secondary"
          >
            Warning Toast
          </Button>
          <Button
            onClick={() => toast.info(t("info"))}
            type="button"
            variant="outline"
          >
            Info Toast
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
