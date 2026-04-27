import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default function AdminDashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Administrative tools will appear here.
        </p>
      </CardContent>
    </Card>
  );
}
