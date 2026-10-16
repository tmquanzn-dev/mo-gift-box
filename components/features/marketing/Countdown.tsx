"use client";

import { useEffect, useState } from "react";
import { useIsClient } from "@/lib/hooks";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

/** Đếm ngược đến một mốc thời gian (ISO). Chỉ chạy trên trình duyệt để tránh lệch giờ server. */
export function Countdown({ target, label }: { target: string; label: string }) {
  const isClient = useIsClient();
  const time = new Date(target).getTime();
  const [parts, setParts] = useState(() => diff(time));
  useEffect(() => {
    const id = setInterval(() => setParts(diff(time)), 1000);
    return () => clearInterval(id);
  }, [time]);

  const units = [
    { value: parts.days, label: "ngày" },
    { value: parts.hours, label: "giờ" },
    { value: parts.minutes, label: "phút" },
    { value: parts.seconds, label: "giây" },
  ];
  return (
    <div role="timer" aria-label={isClient ? `${label}: ${parts.days} ngày ${parts.hours} giờ` : label}>
      <p className="mb-2 text-caption font-semibold tracking-wide text-text-muted uppercase">{label}</p>
      <div className="flex gap-2" aria-hidden="true">
        {units.map((u) => (
          <span key={u.label} className="flex min-w-14 flex-col items-center rounded-box bg-primary-soft px-2 py-1.5">
            <span className="font-display text-h3 font-bold text-primary tabular-nums">{isClient ? String(u.value).padStart(2, "0") : "--"}</span>
            <span className="text-caption text-text-muted">{u.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
