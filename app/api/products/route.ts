import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/services/product.service";
import { checkRateLimit, handleServiceError } from "@/server/http";

/** GET /api/products?q=hoa – gợi ý tìm kiếm nhanh trên header. */
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "search", 60);
  if (limited) return limited;
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ ok: true, items: [] });
  try {
    const items = await searchProducts(q, 6);
    return NextResponse.json({
      ok: true,
      items: items.map((p) => ({ slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null })),
    });
  } catch (error) {
    return handleServiceError(error);
  }
}
