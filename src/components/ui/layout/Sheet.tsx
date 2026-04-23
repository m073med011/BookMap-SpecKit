"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/types";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn("fixed inset-0 z-50 bg-black/60", className)}
    ref={ref}
    {...props}
  />
));

SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

type SheetContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  side?: "left" | "right" | "top" | "bottom";
};

const sideClasses: Record<NonNullable<SheetContentProps["side"]>, string> = {
  bottom:
    "bottom-0 left-0 right-0 w-full max-h-[85vh] rounded-t-lg data-[state=closed]:translate-y-full",
  left: "start-0 top-0 h-full w-3/4 max-w-sm data-[state=closed]:-translate-x-full",
  right:
    "end-0 top-0 h-full w-3/4 max-w-sm data-[state=closed]:translate-x-full",
  top: "left-0 right-0 top-0 w-full max-h-[85vh] rounded-b-lg data-[state=closed]:-translate-y-full",
};

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ children, className, side = "right", ...props }, ref) => {
  const locale = useLocale() as Locale;
  const resolvedSide =
    locale === "ar"
      ? side === "left"
        ? "right"
        : side === "right"
          ? "left"
          : side
      : side;

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          "bg-background fixed z-50 border p-6 shadow-lg transition-transform duration-300 ease-out data-[state=open]:translate-x-0 data-[state=open]:translate-y-0",
          sideClasses[resolvedSide],
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
        <SheetClose className="text-muted-foreground hover:text-foreground absolute end-4 top-4 rounded-sm transition-colors">
          <span className="sr-only">Close</span>x
        </SheetClose>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});

SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 text-start", className)}
    {...props}
  />
);

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    className={cn("text-lg font-semibold", className)}
    ref={ref}
    {...props}
  />
));

SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    className={cn("text-muted-foreground text-sm", className)}
    ref={ref}
    {...props}
  />
));

SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
