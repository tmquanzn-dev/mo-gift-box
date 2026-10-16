"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/text";

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export function Accordion({ items, defaultOpen = [], className }: { items: AccordionItem[]; defaultOpen?: string[]; className?: string }) {
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen));
  const baseId = useId();
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={cn("divide-y divide-border rounded-card border border-border bg-surface", className)}>
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const buttonId = `${baseId}-${item.id}-btn`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-text hover:text-primary"
              >
                <span>{item.title}</span>
                <ChevronDown className={cn("size-5 shrink-0 text-primary transition-transform duration-200", isOpen && "rotate-180")} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-5 text-body text-text-muted [&_a]:font-medium [&_a]:text-primary [&_a]:underline"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
