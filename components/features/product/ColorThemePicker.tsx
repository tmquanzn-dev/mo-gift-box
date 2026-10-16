"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import { COLOR_THEMES } from "@/lib/catalog";
import { cn } from "@/lib/text";
import type { ColorThemeId } from "@/types";

export function ColorThemePicker({
  options,
  value,
  onChange,
  label = "Chủ đề màu",
}: {
  options: ColorThemeId[];
  value: ColorThemeId;
  onChange: (value: ColorThemeId) => void;
  label?: string;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-2 text-small font-semibold text-text">
        {label}: <span className="font-normal text-text-muted">{COLOR_THEMES[value]?.label}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((id) => {
          const theme = COLOR_THEMES[id];
          const checked = value === id;
          return (
            <label
              key={id}
              className={cn(
                "flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 bg-surface pr-4 pl-1.5 text-small font-medium transition-colors",
                "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20",
                checked ? "border-primary" : "border-border hover:border-secondary",
              )}
            >
              <input type="radio" name={name} value={id} checked={checked} onChange={() => onChange(id)} className="sr-only" />
              <span className="flex size-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.swatch }}>
                {checked && <Check className="size-4 text-white drop-shadow" aria-hidden="true" />}
              </span>
              {theme.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
