import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CJProduct = Record<string, unknown>;
type NormalizedProduct = {
  supplier: string; supplierId: string; name: string; type: string;
  price: string; priceAmount: number; image: string; tag: string; cost: number;
  active: boolean; syncedAt: Date; updatedAt: Date;
};

function textValue(item: CJProduct, keys: string[]): string {
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

function isRelevantForStore(name: string, category: string): boolean {
  const value = `${name} ${category}`.toLowerCase();
  // Keep the storefront focused on women's fashion, beauty, accessories, gifts and small personal tech.
  return /women|woman|ladies|female|dress|skirt|blouse|shirt|top\b|pants|trousers|jeans|leggings|coat|jacket|cardigan|sweater|hoodie|fashion|clothing|apparel|lingerie|bra\b|briefs|underwear|sleepwear|pajama|nightwear|handbag|shoulder bag|tote bag|clutch|purse|wallet|crossbody|backpack|jewell|necklace|earring|bracelet|ring\b|watch|perfume|fragrance|makeup|cosmetic|skincare|beauty|lipstick|mascara|foundation|hair clip|hairbrush|hair care|lotion|body care|nail polish|phone case|phone holder|earbuds|headphone|jewelry box|gift|sunglasses|scarf|belt|shoe|sandal|heel|slipper|swimwear|sports bra|yoga wear/.test(value);
}

function extractProducts(payload: unknown): { items: CJProduct[]; totalPages: number } {
  if (!payload || typeof payload !== "object") return { items: [], totalPages: 1 };
  const root = payload as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
  const candidates = [data.list, data.products, data.items, data.records, data.content, root.list];
  let items: CJProduct[] = [];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const flattened = candidate.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const record = entry as Record<string, unknown>;
      return Array.isArray(record.productList) ? record.productList : [entry];
    });
    if (flattened.length) {
      items = flattened.filter((entry): entry is CJProduct => !!entry && typeof entry === "object");
      break;
    }
  }
  const pages = Number(data.totalPages ?? data.pageCount ?? 1);
  return { items, totalPages: Number.isFinite(pages) && pages > 0 ? Math.floor(pages) : 1 };
}

async function getUsdPerEur(): Promise<number> {
  const response = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Exchange-rate service is unavailable");
  const xml = await response.text();
  const match = xml.match(/currency=["']USD["']\s+rate=["']([0-9.]+)["']/);
  const rate = match ? Number(match[1]) : NaN;
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("USD/EUR exchange rate could not be verified");
  return rate;
}

function normalize(item: CJProduct, usdPerEur: number, now: Date): NormalizedProduct | null {
  const supplierId = textValue(item, ["pid", "productId", "product_id", "id", "productSku", "sku"]);
  const name = textValue(item, ["productNameEn", "nameEn", "productName", "name", "title"]);
  const image = textValue(item, ["bigImage", "productImage", "image", "imageUrl", "mainImage", "thumbnail"]);
  const sourceCategory = textValue(item, ["categoryName", "categoryNameEn", "category", "productType"]);
  if (!isRelevantForStore(name, sourceCategory)) return null;
  const rawPrice = textValue(item, ["sellPrice", "nowPrice", "price", "retailPrice", "salePrice"]);
  const amount = Number.parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(",", ".").split("-")[0]);
  if (!supplierId || !name || !/^https:\/\/[^\s]+$/i.test(image) || !Number.isFinite(amount) || amount <= 0) return null;
  // CJ's catalog price is treated as USD; never publish an unverified or invalid price.
  const cost = Math.round((amount / usdPerEur) * 100) / 100;
  const priceAmount = Math.ceil(cost * 1.4 * 100) / 100;
  if (!Number.isFinite(priceAmount) || priceAmount <= 0) return null;
  return {
    supplier: "CJdropshipping", supplierId, name: name.slice(0, 240),
    type: categoryOf(name, sourceCategory),
    price: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceAmount),
    priceAmount, image, tag: "CJ COLLECTION", cost,
    active: true, syncedAt: now, updatedAt: now
  };
}

async function runSync(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized or CRON_SECRET is not configured." }, { status: 401 });
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Scheduled supplier sync blocked: DATABASE_URL is missing in the deployment environment.");
    return NextResponse.json({
      success: false,
      code: "DATABASE_URL_MISSING",
      message: "Product sync cannot save products because DATABASE_URL is not configured for this deployment."
    }, { status: 503 });
  }

  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) return NextResponse.json({ success: false, message: "CJ_API_KEY is not configured." }, { status: 503 });

  try {
    const authResponse = await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }), cache: "no-store", signal: AbortSignal.timeout(10000)
    });
    if (!authResponse.ok) throw new Error("CJ authentication request failed");
    const authPayload = await authResponse.json() as { data?: { accessToken?: string }; result?: boolean; success?: boolean; message?: string };
    const token = authPayload.data?.accessToken;
    if (!token || authPayload.result === false || authPayload.success === false) throw new Error("CJ did not issue an access token");

    const usdPerEur = await getUsdPerEur();
    const now = new Date();
    let imported = 0;
    let rejected = 0;
    let page = 1;
    let totalPages = 1;
    const maxPages = 10; // hard cap: at most 1,000 products per scheduled run

    while (page <= totalPages && page <= maxPages) {
      const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/listV2");
      url.searchParams.set("page", String(page));
      url.searchParams.set("size", "100");
      url.searchParams.set("countryCode", "DE");
      url.searchParams.set("features", "enable_category");
      const response = await fetch(url, {
        headers: { "CJ-Access-Token": token, Accept: "application/json" },
        cache: "no-store", signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error(`CJ product page ${page} failed`);
      const payload = await response.json() as { result?: boolean; success?: boolean; code?: number; message?: string };
      if (payload.result === false || payload.success === false || (typeof payload.code === "number" && payload.code !== 200)) {
        throw new Error(`CJ rejected product page ${page}: ${String(payload.message || "API returned an unsuccessful result")}`);
      }
      const extracted = extractProducts(payload);
      totalPages = Math.min(maxPages, extracted.totalPages);
      if (extracted.items.length === 0) break;

      const batch: NormalizedProduct[] = [];
      for (const raw of extracted.items) {
        const product = normalize(raw, usdPerEur, now);
        if (!product) { rejected++; continue; }
        batch.push(product);
      }
      // Keep DB work concurrent but bounded so a 1,000-item sync can finish within the server limit.
      for (let offset = 0; offset < batch.length; offset += 20) {
        const chunk = batch.slice(offset, offset + 20);
        await Promise.all(chunk.map((product) => prisma.storeProduct.upsert({
          where: { supplier_supplierId: { supplier: product.supplier, supplierId: product.supplierId } },
          create: product,
          update: {
            name: product.name, type: product.type, price: product.price,
            priceAmount: product.priceAmount, image: product.image, tag: product.tag,
            cost: product.cost, active: true, syncedAt: now
          }
        })));
        imported += chunk.length;
      }
      page++;
      if (page <= totalPages) await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    return NextResponse.json({
      success: true, supplier: "CJdropshipping", imported, rejected,
      pagesProcessed: Math.min(page - 1, maxPages), maxProductsPerRun: 1000,
      syncedAt: now.toISOString(),
      note: imported === 0 ? "No valid products were returned. Verify CJ API access and catalog response." : "Products saved to the persistent database."
    });
  } catch (error) {
    console.error("Supplier product sync failed:", error);
    return NextResponse.json({ success: false, message: "Supplier sync failed. Check server logs and supplier credentials." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  return runSync(request);
}

export async function POST(request: Request) {
  return runSync(request);
}
