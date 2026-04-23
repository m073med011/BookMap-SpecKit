"use client";

import type { CheckedState } from "@radix-ui/react-checkbox";
import { Checkbox } from "@/components/ui/form/Checkbox";
import { Button } from "@/components/ui/form/Button";

type FilterOption = {
  label: string;
  value: string;
};

type FilterDefinition = {
  key: string;
  label: string;
  options: FilterOption[];
};

type FilterControlsProps = {
  activeFilters: Record<string, string[]>;
  filters: FilterDefinition[];
  onFilterChange: (key: string, values: string[]) => void;
  onReset: () => void;
};

export function FilterControls({
  activeFilters,
  filters,
  onFilterChange,
  onReset,
}: FilterControlsProps) {
  const handleCheckedChange = (
    key: string,
    optionValue: string,
    checked: CheckedState,
  ) => {
    const currentValues = activeFilters[key] ?? [];
    const nextValues =
      checked === true
        ? [...currentValues, optionValue]
        : currentValues.filter((value) => value !== optionValue);

    onFilterChange(key, nextValues);
  };

  return (
    <div className="flex flex-wrap items-start gap-6">
      {filters.map((filter) => (
        <div className="grid gap-3" key={filter.key}>
          <p className="text-foreground text-sm font-semibold">
            {filter.label}
          </p>
          <div className="grid gap-2">
            {filter.options.map((option) => (
              <Checkbox
                checked={(activeFilters[filter.key] ?? []).includes(
                  option.value,
                )}
                key={option.value}
                label={option.label}
                onCheckedChange={(checked) =>
                  handleCheckedChange(filter.key, option.value, checked)
                }
              />
            ))}
          </div>
        </div>
      ))}
      <div className="self-end">
        <Button onClick={onReset} type="button" variant="outline">
          Reset all
        </Button>
      </div>
    </div>
  );
}
