"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: string;
    helperText?: string;
    label?: string;
  };

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, id, label, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="grid gap-2">
        {label ? (
          <label
            className="text-foreground text-sm font-medium"
            htmlFor={textareaId}
          >
            {label}
          </label>
        ) : null}
        <textarea
          className={cn(
            "border-input bg-background ring-offset-background flex min-h-[80px] w-full rounded-md border py-2 ps-3 pe-3 text-sm",
            "placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-destructive" : null,
            className,
          )}
          id={textareaId}
          ref={ref}
          {...props}
        />
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : helperText ? (
          <p className="text-muted-foreground text-sm">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
