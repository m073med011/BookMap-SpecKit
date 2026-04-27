import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

type LibraryDashboardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LibraryDashboardPage({
  params,
}: LibraryDashboardPageProps) {
  const { id } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Library dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Library scope: {id}
        </p>
      </CardContent>
    </Card>
  );
}
