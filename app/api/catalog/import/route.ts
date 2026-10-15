import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type InputProduct = Record<string, unknown>;

function pick(item: InputProduct, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}
const APPROVED_TYPES = ["Women's Fashion", "Lingerie", "Perfume", "Cosmetics"] as const;
function categoryOf(name: string, category: string, tags = ""): string | null {
  const value = (name + " " + category + " " + tags).normalize("NFKC").toLowerCase();
  if (/\\b(men|mens|men's|male|boys|boy|unisex|electronics?|hardware|construction|tools?|drill|screw|bolt|plumbing|pipe|appliance|refrigerator|fridge|washing machine|phone|wireless|headphones?|earbuds?|charger|battery|toy|pet|kitchen|car accessory)\\b/.test(value)) return null;
  if (/perfume|parfum|fragrance|eau de parfum|eau de toilette|body mist/.test(value)) return "Perfume";
  if (/makeup|cosmetic|skincare|skin care|lipstick|mascara|foundation|concealer|eyeliner|blush|serum|moisturizer|moisturiser|face cream|nail polish/.test(value)) return "Cosmetics";
  if (/lingerie|\\bbra\\b|bras\\b|briefs|panties|underwear|nightwear|nightgown|sleepwear|pajama|pyjama/.test(value) && /women|woman|ladies|female|lingerie|underwear|nightwear|sleepwear|pajama|pyjama/.test(value)) return "Lingerie";
  if (/women'?s clothing|women'?s fashion|women|woman|ladies|female/.test(value) && /dress|skirt|blouse|\\btop\\b|trousers|pants|jeans|leggings|coat|jacket|cardigan|sweater|fashion|clothing|apparel|shirt|swimwear/.test(value)) return "Women's Fashion";
  return null;
}
async function getUsdPerEur(): Promise<number> {
  const response = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Exchange rate unavailable");
  const xml = await response.text();
  const match = xml.match(/currency=["']USD["']\s+rate=["']([0-9.]+)["']/);
  const rate = match ? Number(match[1]) : NaN;
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Exchange rate could not be verified");
  return rate;
}
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json() as { products?: unknown; data?: unknown; currency?: unknown };
    const input = Array.isArray(body.products) ? body.products : Array.isArray(body.data) ? body.data : null;
    if (!input) return NextResponse.json({ success: false, message: "Expected products[] or data[] in JSON body." }, { status: 400 });
    if (input.length > 100) return NextResponse.json({ success: false, message: "Send at most 100 products per batch." }, { status: 413 });
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "USD";
    if (!["USD", "EUR"].includes(currency)) return NextResponse.json({ success: false, message: "Currency must be USD or EUR." }, { status: 400 });
    const usdPerEur = currency === "USD" ? await getUsdPerEur() : 1;
    // Purge non-boutique legacy products using the same title/category/tag rules as the feed.
    const existing = await prisma.storeProduct.findMany({ select: { id: true, name: true, type: true, tag: true } });
    const invalidIds = existing.filter((product) => !categoryOf(product.name, product.type, product.tag)).map((product) => product.id);
    const cleanup = invalidIds.length
      ? await prisma.storeProduct.deleteMany({ where: { id: { in: invalidIds } } })
      : { count: 0 };
    const now = new Date();
    let imported = 0;
    let rejected = 0;
    for (const raw of input) {
      if (!raw || typeof raw !== "object") { rejected++; continue; }
      const item = raw as InputProduct;
      const supplierId = pick(item, ["id", "pid", "productId", "product_id", "sku", "productSku"]);
      const name = pick(item, ["title", "productNameEn", "productName", "name"]);
      const image = pick(item, ["image", "productImage", "bigImage", "imageUrl"]);
      const sourceCategory = pick(item, ["category", "categoryName", "categoryNameEn", "productType", "twoCategoryName", "threeCategoryName"]);
      const sourceTags = pick(item, ["tags", "tag", "keywords", "description"]);
      const productType = categoryOf(name, sourceCategory, sourceTags);
      if (!productType) { rejected++; continue; }
      const rawPrice = pick(item, ["price", "sellPrice", "nowPrice", "retailPrice", "priceMin"]);
      const amount = Number.parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(",", ".").split("-")[0]);
      if (!supplierId || !name || !/^https:\/\/[^\s]+$/i.test(image) || !Number.isFinite(amount) || amount <= 0) { rejected++; continue; }
      const cost = currency === "USD" ? Math.round(amount / usdPerEur * 100) / 100 : Math.round(amount * 100) / 100;
      // Default retail price applies a 40% markup to the converted supplier cost.
      const priceAmount = Math.ceil(cost * 1.4 * 100) / 100;
      const supplier = "CJdropshipping";
      await prisma.storeProduct.upsert({
        where: { supplier_supplierId: { supplier, supplierId } },
        create: {
          supplier, supplierId, name: name.slice(0, 240), type: productType,
          price: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceAmount),
          priceAmount, image, tag: "CJ COLLECTION", cost, active: true, syncedAt: now, updatedAt: now
        },
        update: {
          name: name.slice(0, 240), type: productType,
          price: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceAmount),
          priceAmount, image, tag: "CJ COLLECTION", cost, active: true, syncedAt: now, updatedAt: now
        }
      });
      imported++;
    }
    return NextResponse.json({ success: true, imported, rejected, removedIrrelevant: cleanup.count, currency, markupPercent: 40, message: "Batch imported into the filtered boutique catalog." });
  } catch (error) {
    console.error("Catalog JSON import failed:", error);
    return NextResponse.json({ success: false, message: "Import failed. Check the JSON format and database connection." }, { status: 500 });
  }
}
