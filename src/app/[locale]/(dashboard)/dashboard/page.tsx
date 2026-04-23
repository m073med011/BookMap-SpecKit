import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{t("welcome")}</p>
      </CardContent>
    </Card>
  );
}
