"use client";

import { cn } from "@/lib/utils/cn";

type PasswordStrengthIndicatorProps = {
  strongLabel: string;
  mediumLabel: string;
  password: string;
  weakLabel: string;
};

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  }

  if (/\d/.test(password)) {
    score += 1;
  }

  if (score <= 1) {
    return {
      color: "bg-destructive",
      label: "weak" as const,
      value: 1,
    };
  }

  if (score === 2) {
    return {
      color: "bg-amber-500",
      label: "medium" as const,
      value: 2,
    };
  }

  return {
    color: "bg-emerald-500",
    label: "strong" as const,
    value: 3,
  };
}

export function PasswordStrengthIndicator({
  mediumLabel,
  password,
  strongLabel,
  weakLabel,
}: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);
  const label =
    strength.label === "strong"
      ? strongLabel
      : strength.label === "medium"
        ? mediumLabel
        : weakLabel;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((step) => (
          <div
            className={cn(
              "h-1.5 rounded-full bg-muted transition-colors",
              step <= strength.value ? strength.color : null,
            )}
            key={step}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
