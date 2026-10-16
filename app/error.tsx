"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-h1 font-bold">MÓ gặp chút trục trặc</h1>
      <p className="max-w-md text-text-muted">Trang chưa tải được. Bạn thử lại sau vài giây, giỏ hàng của bạn vẫn được giữ nguyên nhé.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={reset} leftIcon={<RotateCcw className="size-4" aria-hidden="true" />}>
          Thử lại
        </Button>
        <ButtonLink href="/" variant="outline">
          Về trang chủ
        </ButtonLink>
      </div>
      {error.digest && <p className="text-caption text-text-muted">Mã lỗi: {error.digest}</p>}
    </div>
  );
}
