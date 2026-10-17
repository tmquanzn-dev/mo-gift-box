"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyCodeInline({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* trình duyệt chặn clipboard – khách vẫn đọc được mã */
        }
      }}
      aria-label={`Sao chép mã đơn ${code}`}
      data-tooltip={copied ? "Đã sao chép" : "Bấm để sao chép mã đơn"}
      className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-5 py-2 font-mono text-h3 font-bold tracking-wider text-primary hover:bg-secondary/30"
    >
      {code}
      {copied ? <Check className="size-5" aria-hidden="true" /> : <Copy className="size-5" aria-hidden="true" />}
      <span className="sr-only" aria-live="polite">
        {copied ? "Đã sao chép" : ""}
      </span>
    </button>
  );
}
