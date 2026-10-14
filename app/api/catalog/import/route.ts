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
function categoryOf(name: string, category: string): string {
  const value = `${name} ${category}`.toLowerCase();
  if (/lingerie|bra|brief|underwear|sleepwear/.test(value)) return "Lingerie";
  if (/bag|handbag|purse|wallet/.test(value)) return "Bags";
  if (/watch/.test(value)) return "Watches";
  if (/jewell|necklace|earring|bracelet|ring/.test(value)) return "Jewelry";
  if (/perfume|fragrance|makeup|cosmetic|skincare|beauty|cream/.test(value)) return "Beauty";
  if (/hair|shampoo|conditioner/.test(value)) return "Hair Care";
  if (/body care|lotion|soap/.test(value)) return "Body Care";
  if (/phone|wireless|headphone|electronic|tech/.test(value)) return "Technology";
  if (/gift/.test(value)) return "Gifts";
  return "Fashion";
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
    const now = new Date();
    let imported = 0;
    let rejected = 0;
    for (const raw of input) {
      if (!raw || typeof raw !== "object") { rejected++; continue; }
      const item = raw as InputProduct;
      const supplierId = pick(item, ["id", "pid", "productId", "product_id", "sku", "productSku"]);
      const name = pick(item, ["title", "productNameEn", "productName", "name"]);
      const image = pick(item, ["image", "productImage", "bigImage", "imageUrl"]);
      const rawPrice = pick(item, ["price", "sellPrice", "nowPrice", "retailPrice"]);
      const amount = Number.parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(",", ".").split("-")[0]);
      if (!supplierId || !name || !/^https:\/\/[^\s]+$/i.test(image) || !Number.isFinite(amount) || amount <= 0) { rejected++; continue; }
      const cost = currency === "USD" ? Math.round(amount / usdPerEur * 100) / 100 : Math.round(amount * 100) / 100;
      // Default retail price applies a 40% markup to the converted supplier cost.
      const priceAmount = Math.ceil(cost * 1.4 * 100) / 100;
      const supplier = "CJdropshipping";
      await prisma.storeProduct.upsert({
        where: { supplier_supplierId: { supplier, supplierId } },
        create: {
          supplier, supplierId, name: name.slice(0, 240), type: categoryOf(name, pick(item, ["category", "categoryName"])),
          price: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceAmount),
          priceAmount, image, tag: "CJ COLLECTION", cost, active: true, syncedAt: now, updatedAt: now
        },
        update: {
          name: name.slice(0, 240), type: categoryOf(name, pick(item, ["category", "categoryName"])),
          price: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceAmount),
          priceAmount, image, tag: "CJ COLLECTION", cost, active: true, syncedAt: now, updatedAt: now
        }
      });
      imported++;
    }
    return NextResponse.json({ success: true, imported, rejected, currency, markupPercent: 40, message: "Batch imported into the persistent catalog." });
  } catch (error) {
    console.error("Catalog JSON import failed:", error);
    return NextResponse.json({ success: false, message: "Import failed. Check the JSON format and database connection." }, { status: 500 });
  }
}
