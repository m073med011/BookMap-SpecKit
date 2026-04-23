"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils/cn";

export type RadioOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

export const RadioGroup = RadioGroupPrimitive.Root;

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    className={cn(
      "border-primary text-primary ring-offset-background aspect-square h-4 w-4 rounded-full border",
      "focus-visible:ring-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="block h-2 w-2 rounded-full bg-current" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

type RadioProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
> & {
  options: RadioOption[];
};

export function Radio({ className, options, ...props }: RadioProps) {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-3", className)}
      {...props}
    >
      {options.map((option) => (
        <label
          className="text-foreground flex items-center gap-2 text-sm font-medium"
          key={option.value}
        >
          <RadioGroupItem disabled={option.disabled} value={option.value} />
          <span>{option.label}</span>
        </label>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
