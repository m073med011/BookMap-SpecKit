import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/ui/feedback/LoadingSkeleton";

type ListProps<T> = {
  emptyMessage?: string;
  items: T[];
  loading?: boolean;
  renderItem: (item: T, index: number) => ReactNode;
};

export function List<T>({
  emptyMessage,
  items,
  loading = false,
  renderItem,
}: ListProps<T>) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <LoadingSkeleton key={index} variant="card" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div className="divide-border divide-y">
      {items.map((item, index) => (
        <div className="py-4" key={index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
