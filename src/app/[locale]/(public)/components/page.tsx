"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  FilterControls,
  Input,
  List,
  LoadingSkeleton,
  Modal,
  Pagination,
  Radio,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components/ui";

const tableColumns = [
  { key: "title", header: "Title" },
  { key: "format", header: "Format" },
  { align: "end" as const, key: "stock", header: "Stock" },
];

const tableData = [
  { format: "Ebook", stock: 24, title: "The Cairo Stack" },
  { format: "Print", stock: 7, title: "RTL by Design" },
];

export default function ComponentsShowcasePage() {
  const t = useTranslations("components");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [page, setPage] = useState(2);
  const [filters, setFilters] = useState<Record<string, string[]>>({
    format: ["ebook"],
  });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form</CardTitle>
          <CardDescription>Inputs, choices, and actions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input
            helperText="Helper text"
            label="Book title"
            placeholder="Search title"
          />
          <Textarea label="Description" placeholder="Short summary" />
          <Select defaultValue="ebook" label="Format">
            <SelectTrigger>
              <SelectValue placeholder="Choose a format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ebook">Ebook</SelectItem>
              <SelectItem value="print">Print</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <Checkbox defaultChecked label="Featured listing" />
            <Radio
              defaultValue="public"
              options={[
                { label: "Public", value: "public" },
                { label: "Private", value: "private" },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="button">Default</Button>
            <Button type="button" variant="secondary">
              Secondary
            </Button>
            <Button type="button" variant="outline">
              Outline
            </Button>
            <Button type="button" variant="ghost">
              Ghost
            </Button>
            <Button loading type="button">
              Loading
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout</CardTitle>
          <CardDescription>Overlays and panels.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                Open dialog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog title</DialogTitle>
                <DialogDescription>
                  Dialog content for shared layout patterns.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setDialogOpen(false)} type="button">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => setModalOpen(true)}
            type="button"
            variant="outline"
          >
            Open modal
          </Button>
          <Modal
            description="A convenience wrapper around the dialog component."
            footer={
              <Button onClick={() => setModalOpen(false)} type="button">
                Done
              </Button>
            }
            onOpenChange={setModalOpen}
            open={modalOpen}
            title="Modal title"
          >
            <p className="text-muted-foreground text-sm">
              Modal content lives here.
            </p>
          </Modal>

          <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
            <Button
              onClick={() => setSheetOpen(true)}
              type="button"
              variant="outline"
            >
              Open sheet
            </Button>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet title</SheetTitle>
                <SheetDescription>
                  Side panels adapt to RTL and LTR.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Tables, lists, and navigation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <DataTable columns={tableColumns} data={tableData} />
          <Pagination
            currentPage={page}
            onPageChange={setPage}
            totalPages={9}
          />
          <List
            items={tableData}
            renderItem={(item) => (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-sm">{item.format}</p>
                </div>
                <StatusBadge label={`${item.stock} available`} variant="info" />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
          <CardDescription>Tabs and filter patterns.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="one">
            <TabsList>
              <TabsTrigger value="one">Overview</TabsTrigger>
              <TabsTrigger value="two">Inventory</TabsTrigger>
            </TabsList>
            <TabsContent value="one">
              <p className="text-muted-foreground text-sm">
                Overview tab content.
              </p>
            </TabsContent>
            <TabsContent value="two">
              <p className="text-muted-foreground text-sm">
                Inventory tab content.
              </p>
            </TabsContent>
          </Tabs>

          <FilterControls
            activeFilters={filters}
            filters={[
              {
                key: "format",
                label: "Format",
                options: [
                  { label: "Ebook", value: "ebook" },
                  { label: "Print", value: "print" },
                ],
              },
            ]}
            onFilterChange={(key, values) =>
              setFilters((current) => ({ ...current, [key]: values }))
            }
            onReset={() => setFilters({})}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>Badges, empties, and skeletons.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <StatusBadge label="Default" variant="default" />
            <StatusBadge label="Success" variant="success" />
            <StatusBadge label="Warning" variant="warning" />
            <StatusBadge label="Error" variant="error" />
            <StatusBadge label="Info" variant="info" />
          </div>
          <EmptyState description="No shared components are missing from this page." />
          <div className="grid gap-4 md:grid-cols-4">
            <LoadingSkeleton variant="avatar" />
            <LoadingSkeleton variant="text" />
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="table" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
