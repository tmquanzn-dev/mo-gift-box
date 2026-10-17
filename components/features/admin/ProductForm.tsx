"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Overlay";
import { toast } from "@/components/ui/Toaster";
import { postJSON } from "@/lib/api-client";
import { BADGES, COLOR_THEMES, RECIPIENTS } from "@/lib/catalog";
import { cn, slugify } from "@/lib/text";
import type { ProductInput } from "@/lib/validation";
import type { AdminProduct } from "@/services/product.service";
import type { BadgeId, ColorThemeId, RecipientId } from "@/types";

const MANUAL_BADGES: BadgeId[] = ["ban-chay", "moi"];
const MAX_IMAGES = 10;

type ContentRow = { name: string; quantity: string };

/** Ô số tiền: bỏ dấu chấm/khoảng trắng người dùng gõ, "150.000" -> 150000. Để trống -> null. */
const toInt = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[.\s,đ]/g, "")));
const toFloat = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(",", ".")));
const str = (n: number | null | undefined) => (n == null ? "" : String(n));

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-soft">
      <div>
        <h2 className="font-display text-h3 font-bold">{title}</h2>
        {description && <p className="text-small text-text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function ProductForm({ product, occasions }: { product?: AdminProduct; occasions: { slug: string; name: string }[] }) {
  const router = useRouter();
  const isNew = !product;

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  // Sản phẩm mới: đường dẫn tự sinh theo tên cho tới khi admin tự sửa đường dẫn
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [price, setPrice] = useState(str(product?.price));
  const [compareAtPrice, setCompareAtPrice] = useState(str(product?.compareAtPrice));
  const [stock, setStock] = useState(str(product?.stock ?? 20));
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(product?.occasions ?? []);
  const [recipients, setRecipients] = useState<RecipientId[]>(product?.recipients ?? []);
  const [colorThemes, setColorThemes] = useState<ColorThemeId[]>(product?.colorThemes ?? ["kraft"]);
  const [badges, setBadges] = useState<BadgeId[]>(product?.manualBadges ?? []);
  const [length, setLength] = useState(str(product?.dimensions.length ?? 20));
  const [width, setWidth] = useState(str(product?.dimensions.width ?? 20));
  const [height, setHeight] = useState(str(product?.dimensions.height ?? 10));
  const [contents, setContents] = useState<ContentRow[]>(product?.contents.map((c) => ({ name: c.name, quantity: String(c.quantity) })) ?? [{ name: "", quantity: "1" }]);
  const [isCustomizable, setIsCustomizable] = useState(product?.isCustomizable ?? true);
  const [isActive, setIsActive] = useState(product ? product.isActive : true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return toast.error(`Tối đa ${MAX_IMAGES} ảnh cho một sản phẩm.`);
    const picked = Array.from(files).slice(0, room);
    const body = new FormData();
    picked.forEach((f) => body.append("files", f));
    setUploading(true);
    try {
      const res = await fetch("/api/admin/uploads", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Không tải được ảnh lên.");
      setImages((prev) => [...prev, ...(data.urls as string[])]);
      setErrors((e) => ({ ...e, images: "" }));
      if (files.length > room) toast.error(`Chỉ thêm ${room} ảnh vì tối đa ${MAX_IMAGES} ảnh.`);
    } catch (err) {
      toast.error("Không tải được ảnh", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const buildPayload = (): ProductInput =>
    ({
      name,
      slug,
      shortDescription,
      description,
      price: toInt(price),
      compareAtPrice: toInt(compareAtPrice),
      stock: toInt(stock),
      images,
      occasions: selectedOccasions,
      recipients,
      colorThemes,
      badges: badges as ProductInput["badges"],
      dimensions: { length: toFloat(length), width: toFloat(width), height: toFloat(height) },
      contents: contents.filter((c) => c.name.trim() !== "").map((c) => ({ name: c.name, quantity: toInt(c.quantity) })),
      isCustomizable,
      isActive,
    }) as ProductInput;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const res = await postJSON<{ product: AdminProduct }>(isNew ? "/api/admin/products" : `/api/admin/products/${product.id}`, buildPayload(), {
      method: isNew ? "POST" : "PUT",
    });
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error("Chưa lưu được", { description: res.error });
      return;
    }
    toast.success(isNew ? "Đã thêm hộp quà mới" : "Đã lưu thay đổi");
    if (isNew) router.push(`/admin/san-pham/${res.product.id}`);
    router.refresh();
  };

  const remove = async () => {
    if (!product) return;
    setDeleting(true);
    const res = await postJSON(`/api/admin/products/${product.id}`, {}, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) return toast.error("Không xoá được", { description: res.error });
    toast.success(`Đã xoá “${product.name}”`);
    router.push("/admin/san-pham");
    router.refresh();
  };

  const field = (key: string) => errors[key] || undefined;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Section title="Thông tin cơ bản">
            <Field label="Tên hộp quà" required error={field("name")}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} aria-describedby={describedBy} invalid={invalid} value={name} onChange={(e) => onNameChange(e.target.value)} maxLength={120} placeholder="Ví dụ: Hộp quà 20/10 Hồng Pastel" />
              )}
            </Field>
            <Field label="Đường dẫn" required hint={`Trang sản phẩm: /san-pham/${slug || "…"}`} error={field("slug")}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                  onBlur={() => setSlug((s) => slugify(s))}
                  maxLength={120}
                  className="font-mono"
                />
              )}
            </Field>
            <Field label="Mô tả ngắn" required hint="Hiện dưới tên sản phẩm, 1–2 câu." error={field("shortDescription")}>
              {({ id, describedBy, invalid }) => (
                <Textarea id={id} aria-describedby={describedBy} invalid={invalid} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={300} className="min-h-20" />
              )}
            </Field>
            <Field label="Mô tả chi tiết" required error={field("description")}>
              {({ id, describedBy, invalid }) => (
                <Textarea id={id} aria-describedby={describedBy} invalid={invalid} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} className="min-h-40" />
              )}
            </Field>
          </Section>

          <Section title="Ảnh sản phẩm" description={`Ảnh đầu tiên là ảnh chính. JPG, PNG, WEBP – tối đa 5MB/ảnh, ${MAX_IMAGES} ảnh.`}>
            {images.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((src, i) => (
                  <li key={src} className="group relative aspect-square overflow-hidden rounded-box border border-border bg-surface-sunken">
                    <Image src={src} alt={`Ảnh ${i + 1}`} fill sizes="200px" className="object-cover" />
                    {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-caption font-semibold text-on-dark">Ảnh chính</span>}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-text/60 to-transparent p-2">
                      <div className="flex gap-1">
                        <button type="button" aria-label="Đưa lên trước" disabled={i === 0} onClick={() => moveImage(i, i - 1)} className="rounded-full bg-surface p-1.5 text-primary disabled:opacity-40">
                          <ArrowLeft className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Đưa ra sau"
                          disabled={i === images.length - 1}
                          onClick={() => moveImage(i, i + 1)}
                          className="rounded-full bg-surface p-1.5 text-primary disabled:opacity-40"
                        >
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                      <button type="button" aria-label={`Bỏ ảnh ${i + 1}`} onClick={() => setImages((prev) => prev.filter((s) => s !== src))} className="rounded-full bg-surface p-1.5 text-error">
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple className="sr-only" id="product-images" onChange={(e) => upload(e.target.files)} />
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              loading={uploading}
              loadingText="Đang tải ảnh…"
              disabled={images.length >= MAX_IMAGES}
              leftIcon={<ImagePlus className="size-4" aria-hidden="true" />}
              onClick={() => fileRef.current?.click()}
            >
              Tải ảnh lên
            </Button>
            {field("images") && (
              <p role="alert" className="text-small font-medium text-error">
                {field("images")}
              </p>
            )}
          </Section>

          <Section title="Trong hộp có gì" description="Danh sách món hiện ở trang sản phẩm.">
            <ul className="flex flex-col gap-2">
              {contents.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      aria-label={`Tên món ${i + 1}`}
                      invalid={Boolean(field(`contents.${i}.name`))}
                      value={c.name}
                      onChange={(e) => setContents((prev) => prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
                      placeholder="Ví dụ: Nến thơm mini"
                      maxLength={100}
                      className="h-11"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      aria-label={`Số lượng món ${i + 1}`}
                      invalid={Boolean(field(`contents.${i}.quantity`))}
                      value={c.quantity}
                      inputMode="numeric"
                      onChange={(e) => setContents((prev) => prev.map((r, j) => (j === i ? { ...r, quantity: e.target.value } : r)))}
                      className="h-11 text-center"
                    />
                  </div>
                  <button type="button" aria-label={`Xoá món ${i + 1}`} onClick={() => setContents((prev) => prev.filter((_, j) => j !== i))} className="mt-1 rounded-full p-2 text-text-muted hover:bg-error-bg hover:text-error">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" className="w-fit" leftIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setContents((prev) => [...prev, { name: "", quantity: "1" }])}>
              Thêm món
            </Button>
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Giá & tồn kho">
            <Field label="Giá bán (đ)" required error={field("price")}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} aria-describedby={describedBy} invalid={invalid} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="250000" className="tabular-nums" />
              )}
            </Field>
            <Field label="Giá gốc (đ)" optional hint="Nhập nếu muốn hiện giá gạch ngang khi giảm giá." error={field("compareAtPrice")}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} aria-describedby={describedBy} invalid={invalid} value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} inputMode="numeric" className="tabular-nums" />
              )}
            </Field>
            <Field label="Tồn kho" required hint="Về 0 thì sản phẩm tự hiện “Hết hàng”." error={field("stock")}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} aria-describedby={describedBy} invalid={invalid} value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" className="tabular-nums" />
              )}
            </Field>
          </Section>

          <Section title="Hiển thị">
            <Checkbox label="Đang bán" description="Bỏ chọn để ẩn sản phẩm khỏi cửa hàng mà không xoá." checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <Checkbox label="Cho phép cá nhân hoá" description="Khách được ghi tên người nhận, lời chúc, chọn thiệp." checked={isCustomizable} onChange={(e) => setIsCustomizable(e.target.checked)} />
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-small font-semibold">Nhãn</legend>
              {MANUAL_BADGES.map((b) => (
                <Checkbox key={b} label={BADGES[b].label} checked={badges.includes(b)} onChange={() => setBadges((prev) => toggle(prev, b))} />
              ))}
              <p className="text-caption text-text-muted">Nhãn “Sắp hết” tự hiện khi tồn kho thấp.</p>
            </fieldset>
          </Section>

          <Section title="Phân loại">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-small font-semibold">Dịp tặng</legend>
              {occasions.map((o) => (
                <Checkbox key={o.slug} label={o.name} checked={selectedOccasions.includes(o.slug)} onChange={() => setSelectedOccasions((prev) => toggle(prev, o.slug))} />
              ))}
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-small font-semibold">Người nhận</legend>
              {(Object.keys(RECIPIENTS) as RecipientId[]).map((r) => (
                <Checkbox key={r} label={RECIPIENTS[r]} checked={recipients.includes(r)} onChange={() => setRecipients((prev) => toggle(prev, r))} />
              ))}
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-small font-semibold">
                Màu hộp <span className="text-error">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(COLOR_THEMES) as ColorThemeId[]).map((c) => {
                  const on = colorThemes.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setColorThemes((prev) => toggle(prev, c))}
                      className={cn("flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-small", on ? "border-primary bg-primary-soft font-semibold" : "border-border")}
                    >
                      <span className="size-4 rounded-full" style={{ backgroundColor: COLOR_THEMES[c].swatch }} aria-hidden="true" />
                      {COLOR_THEMES[c].label}
                    </button>
                  );
                })}
              </div>
              {field("colorThemes") && (
                <p role="alert" className="text-small font-medium text-error">
                  {field("colorThemes")}
                </p>
              )}
            </fieldset>
          </Section>

          <Section title="Kích thước hộp (cm)">
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["Dài", length, setLength, "dimensions.length"],
                  ["Rộng", width, setWidth, "dimensions.width"],
                  ["Cao", height, setHeight, "dimensions.height"],
                ] as const
              ).map(([label, value, set, key]) => (
                <Field key={key} label={label} error={field(key)}>
                  {({ id, describedBy, invalid }) => (
                    <Input id={id} aria-describedby={describedBy} invalid={invalid} value={value} onChange={(e) => set(e.target.value)} inputMode="decimal" className="tabular-nums" />
                  )}
                </Field>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-card sm:border sm:shadow-soft">
        {!isNew ? (
          <Button variant="ghost" className="text-error hover:bg-error-bg" leftIcon={<Trash2 className="size-4" aria-hidden="true" />} onClick={() => setConfirmDelete(true)}>
            Xoá sản phẩm
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variant="secondary" loading={saving} loadingText="Đang lưu…" disabled={uploading}>
          {isNew ? "Thêm hộp quà" : "Lưu thay đổi"}
        </Button>
      </div>

      {product && (
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="Xoá sản phẩm này?"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Thôi
              </Button>
              <Button variant="secondary" className="bg-error hover:bg-error/90" loading={deleting} onClick={remove}>
                Xoá hẳn
              </Button>
            </div>
          }
        >
          <p className="text-body">
            “{product.name}” sẽ bị xoá vĩnh viễn khỏi cửa hàng. Đơn hàng cũ vẫn giữ nguyên thông tin.
            {product.isActive && " Nếu chỉ muốn tạm ngừng bán, hãy bỏ chọn “Đang bán” rồi lưu."}
          </p>
        </Modal>
      )}
    </form>
  );
}
