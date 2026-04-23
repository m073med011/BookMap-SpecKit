import { cn } from "@/lib/utils/cn";

type LoadingSkeletonProps = {
  className?: string;
  lines?: number;
  variant: "text" | "card" | "table" | "avatar";
};

export function LoadingSkeleton({
  className,
  lines = 3,
  variant,
}: LoadingSkeletonProps) {
  if (variant === "avatar") {
    return (
      <div
        className={cn(
          "bg-muted h-12 w-12 animate-pulse rounded-full",
          className,
        )}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "bg-muted/60 h-40 w-full animate-pulse rounded-lg border",
          className,
        )}
      />
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="bg-muted/70 h-10 rounded-md" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="bg-muted/60 h-12 rounded-md" key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          className={cn(
            "bg-muted h-4 animate-pulse rounded",
            index === lines - 1 ? "w-2/3" : "w-full",
          )}
          key={index}
        />
      ))}
    </div>
  );
}
