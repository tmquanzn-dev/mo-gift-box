"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useRef, useState, type MouseEvent } from "react";
import { IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { cn } from "@/lib/text";

const ANGLE_LABELS = ["hộp đóng", "hộp mở", "cận cảnh món bên trong"];

/** Gallery ảnh: vuốt ngang trên mobile (scroll-snap), di chuột để phóng to trên desktop, bấm để xem toàn màn hình. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const alt = (i: number) => `${name} – ${ANGLE_LABELS[i] ?? `ảnh ${i + 1}`}`;

  const goTo = (i: number) => {
    const next = (i + images.length) % images.length;
    setIndex(next);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index) setIndex(i);
  };

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div className="flex flex-col gap-3" aria-roledescription="thư viện ảnh" aria-label={`Ảnh ${name}`}>
      <div className="relative overflow-hidden rounded-card bg-surface shadow-soft">
        <div ref={trackRef} onScroll={onScroll} className="scrollbar-none flex aspect-square snap-x snap-mandatory overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightbox(true)}
              onMouseMove={i === index ? onMove : undefined}
              onMouseLeave={() => setZoom(null)}
              className="relative aspect-square w-full shrink-0 snap-center cursor-zoom-in overflow-hidden"
              aria-label={`Phóng to ảnh ${i + 1}: ${ANGLE_LABELS[i] ?? ""}`}
            >
              <Image
                src={src}
                alt={alt(i)}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-200"
                style={
                  zoom && i === index
                    ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                    : undefined
                }
              />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <IconButton aria-label="Ảnh trước" variant="surface" onClick={() => goTo(index - 1)} className="absolute top-1/2 left-3 hidden -translate-y-1/2 md:inline-flex">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </IconButton>
            <IconButton aria-label="Ảnh tiếp theo" variant="surface" onClick={() => goTo(index + 1)} className="absolute top-1/2 right-3 hidden -translate-y-1/2 md:inline-flex">
              <ChevronRight className="size-5" aria-hidden="true" />
            </IconButton>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden" aria-hidden="true">
              {images.map((src, i) => (
                <span key={src} className={cn("h-1.5 rounded-full bg-primary transition-all", i === index ? "w-5" : "w-1.5 opacity-40")} />
              ))}
            </div>
          </>
        )}
        <span className="pointer-events-none absolute top-3 right-3 flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-caption font-medium text-text-muted">
          <ZoomIn className="size-3.5" aria-hidden="true" />
          Bấm để phóng to
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3" role="tablist" aria-label="Chọn ảnh">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Xem ảnh ${ANGLE_LABELS[i] ?? i + 1}`}
            onClick={() => goTo(i)}
            className={cn("relative aspect-square overflow-hidden rounded-box border-2 bg-surface transition-colors", i === index ? "border-primary" : "border-transparent hover:border-secondary")}
          >
            <Image src={src} alt="" fill sizes="120px" className="object-cover" />
          </button>
        ))}
      </div>

      <Modal open={lightbox} onClose={() => setLightbox(false)} title={alt(index)} hideTitle className="sm:max-w-3xl">
        <div className="relative -mx-5 -my-4 aspect-square bg-surface">
          <Image src={images[index]} alt={alt(index)} fill sizes="(min-width: 768px) 768px, 100vw" className="object-contain" />
          {images.length > 1 && (
            <>
              <IconButton aria-label="Ảnh trước" variant="surface" onClick={() => goTo(index - 1)} className="absolute top-1/2 left-3 -translate-y-1/2">
                <ChevronLeft className="size-5" aria-hidden="true" />
              </IconButton>
              <IconButton aria-label="Ảnh tiếp theo" variant="surface" onClick={() => goTo(index + 1)} className="absolute top-1/2 right-3 -translate-y-1/2">
                <ChevronRight className="size-5" aria-hidden="true" />
              </IconButton>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
