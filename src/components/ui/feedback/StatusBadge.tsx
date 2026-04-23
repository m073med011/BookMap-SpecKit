import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        error: "border-destructive/20 bg-destructive/10 text-destructive",
        info: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  className?: string;
  label: string;
};

export function StatusBadge({ className, label, variant }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ className, variant }))}>
      {label}
    </span>
  );
}
