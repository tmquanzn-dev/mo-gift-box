"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Overlay";
import { Skeleton } from "@/components/ui/Display";
import { shopHref } from "@/lib/filters";
import { formatVND } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks";

interface Result {
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

const QUICK_TERMS = ["Hoa hồng", "Socola", "Gấu bông", "Thầy cô", "Sinh nhật"];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 250);
  const [state, setState] = useState<{ q: string; items: Result[]; status: "idle" | "loading" | "done" | "error" }>({
    q: "",
    items: [],
    status: "idle",
  });

  useEffect(() => {
    if (debounced.length < 2) return;
    const controller = new AbortController();
    fetch(`/api/products?q=${encodeURIComponent(debounced)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { items: Result[] }) => setState({ q: debounced, items: data.items, status: "done" }))
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setState({ q: debounced, items: [], status: "error" });
      });
    return () => controller.abort();
  }, [debounced]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(shopHref({ q: query.trim() }));
  };

  const showResults = debounced.length >= 2;
  // Kết quả đang hiển thị chưa ứng với từ khoá mới nhất → coi như đang tải
  const status = state.q === debounced ? state.status : "loading";

  return (
    <Modal open={open} onClose={onClose} title="Tìm hộp quà">
      <form role="search" onSubmit={submit}>
        <label htmlFor="site-search" className="sr-only">
          Tìm theo tên hộp quà hoặc món bên trong
        </label>
        <Input
          id="site-search"
          data-autofocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ví dụ: socola, hoa hồng, thầy cô…"
          leftIcon={<Search className="size-5" aria-hidden="true" />}
          autoComplete="off"
          enterKeyHint="search"
        />
      </form>

      <div className="mt-4 min-h-40" aria-live="polite">
        {!showResults && (
          <div>
            <p className="mb-2 text-small text-text-muted">Gợi ý tìm nhanh</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TERMS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="h-9 rounded-full border border-secondary px-4 text-small font-medium hover:bg-primary-soft"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
        {showResults && status === "loading" && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-14" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        )}
        {showResults && status === "error" && <p className="text-small text-error">Không tải được kết quả. Bạn thử lại nhé.</p>}
        {showResults && status === "done" && state.items.length === 0 && (
          <p className="text-small text-text-muted">
            MÓ chưa có hộp quà nào khớp với “{state.q}”. Bạn thử từ khoá khác, hoặc{" "}
            <Link href="/tu-thiet-ke" onClick={onClose} className="font-semibold text-primary underline">
              tự thiết kế hộp quà
            </Link>{" "}
            nhé.
          </p>
        )}
        {showResults && status === "done" && state.items.length > 0 && (
          <ul className="flex flex-col gap-1">
            {state.items.map((item) => (
              <li key={item.slug}>
                <Link href={`/san-pham/${item.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-box p-2 hover:bg-primary-soft">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-box bg-surface-sunken">
                    {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <span className="flex-1 font-medium text-text">{item.name}</span>
                  <span className="text-small font-semibold tabular-nums">{formatVND(item.price)}</span>
                </Link>
              </li>
            ))}
            <li>
              <button type="button" onClick={submit} className="mt-2 w-full rounded-box py-2 text-small font-semibold text-primary hover:bg-primary-soft">
                Xem tất cả kết quả cho “{query.trim()}”
              </button>
            </li>
          </ul>
        )}
      </div>
    </Modal>
  );
}
