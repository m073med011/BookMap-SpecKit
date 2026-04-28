"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { updateInventoryAction } from "../actions/inventory";

type InventoryManagerProps = {
  listingFormatId: string;
  stockQuantity: number;
};

export function InventoryManager({
  listingFormatId,
  stockQuantity,
}: InventoryManagerProps) {
  const [quantity, setQuantity] = useState(stockQuantity);
  const [adjustment, setAdjustment] = useState("0");
  const [isPending, startTransition] = useTransition();

  function handleAdjust() {
    const parsedAdjustment = Number(adjustment);

    if (!Number.isInteger(parsedAdjustment)) {
      toast.error("Use a whole number for inventory adjustments.");
      return;
    }

    startTransition(async () => {
      const result = await updateInventoryAction({
        adjustment: parsedAdjustment,
        listing_format_id: listingFormatId,
      });

      if ("success" in result && result.success) {
        setQuantity(result.stock_quantity);
        setAdjustment("0");
        toast.success("Inventory updated.");
        return;
      }

      if ("error" in result) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">Available stock</p>
          <p className="text-3xl font-semibold">{quantity}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Adjustment"
            onChange={(event) => setAdjustment(event.target.value)}
            type="number"
            value={adjustment}
          />
          <Button loading={isPending} onClick={handleAdjust} type="button">
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
