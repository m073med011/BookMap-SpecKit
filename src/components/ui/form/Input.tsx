"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  helperText?: string;
  label?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, helperText, label, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="grid gap-2">
        {label ? (
          <label
            className="text-foreground text-sm font-medium"
            htmlFor={inputId}
          >
            {label}
          </label>
        ) : null}
        <input
          className={cn(
            "border-input bg-background ring-offset-background flex h-10 w-full rounded-md border py-2 ps-3 pe-3 text-sm",
            "placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-destructive" : null,
            className,
          )}
          id={inputId}
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

Input.displayName = "Input";
