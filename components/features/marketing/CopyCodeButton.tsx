"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/Toaster";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Trình duyệt chặn clipboard: chọn tạm bằng textarea ẩn
      const el = document.createElement("textarea");
      el.value = code;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    toast.success(`Đã sao chép mã ${code}`, { description: "Dán mã ở bước giỏ hàng để được giảm giá nhé." });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex h-14 items-center gap-3 rounded-full border-2 border-dashed border-on-dark/70 bg-on-dark/10 pr-2 pl-6 font-mono text-h3 font-bold tracking-widest text-on-dark hover:bg-on-dark/20"
      aria-label={`Sao chép mã giảm giá ${code}`}
    >
      {code}
      <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface px-4 font-sans text-small font-semibold tracking-normal text-primary">
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {copied ? "Đã chép" : "Sao chép"}
      </span>
    </button>
  );
}
