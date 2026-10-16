import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Display";
import { getPolicy, POLICIES } from "@/data/policies";
import { cn } from "@/lib/text";

export const dynamicParams = false;

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/chinh-sach/[slug]">): Promise<Metadata> {
  const policy = getPolicy((await params).slug);
  if (!policy) return {};
  return { title: policy.title, description: policy.description, alternates: { canonical: `/chinh-sach/${policy.slug}` } };
}

/** Làm nổi bật các chỗ [[...]] để chủ shop dễ thấy cần điền. */
function Fillable({ text }: { text: string }) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[[") ? (
          <mark key={i} className="rounded bg-warning-bg px-1 text-warning">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default async function PolicyPage({ params }: PageProps<"/chinh-sach/[slug]">) {
  const policy = getPolicy((await params).slug);
  if (!policy) notFound();
  return (
    <div className="container-page pt-6 pb-16">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Chính sách" }, { label: policy.title }]} />
      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Các chính sách" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ul className="scrollbar-none flex gap-2 overflow-x-auto lg:flex-col">
            {POLICIES.map((p) => (
              <li key={p.slug} className="shrink-0">
                <Link
                  href={`/chinh-sach/${p.slug}`}
                  aria-current={p.slug === policy.slug ? "page" : undefined}
                  className={cn(
                    "block rounded-box px-4 py-2.5 text-small font-medium",
                    p.slug === policy.slug ? "bg-primary text-on-dark" : "bg-surface text-text hover:bg-primary-soft",
                  )}
                >
                  {p.title.replace("Chính sách ", "").replace(/^./, (c) => c.toUpperCase())}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-3xl rounded-card bg-surface p-6 shadow-soft sm:p-10">
          <h1 className="text-h1 font-bold">{policy.title}</h1>
          <p className="mt-2 text-small text-text-muted">
            Cập nhật lần cuối: <Fillable text={policy.updatedAt} />
          </p>
          <div className="mt-8 flex flex-col gap-8">
            {policy.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="mb-3 font-sans text-h3 font-semibold">{s.heading}</h2>
                {s.paragraphs?.map((p) => (
                  <p key={p} className="mb-3 text-body text-text-muted">
                    <Fillable text={p} />
                  </p>
                ))}
                {s.bullets && (
                  <ul className="flex list-disc flex-col gap-2 pl-5 text-body text-text-muted marker:text-secondary">
                    {s.bullets.map((b) => (
                      <li key={b}>
                        <Fillable text={b} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
