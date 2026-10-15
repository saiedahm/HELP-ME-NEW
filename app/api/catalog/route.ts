import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RawProduct = Record<string, unknown>;
type StoreProduct = { id: number; name: string; type: string; price: string; priceAmount: number; image: string; tag: string; supplier: string; supplierId: string; cost: number };

function firstText(item: RawProduct, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}
function stableId(source: string): number {
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) | 0;
  return Math.abs(hash) || 1;
}
const APPROVED_TYPES = ["Women's Fashion", "Lingerie", "Perfume", "Cosmetics"] as const;

function categoryOf(name: string, category: string, tags = ""): string | null {
  const value = (name + " " + category + " " + tags).normalize("NFKC").toLowerCase();
  // Any clear non-boutique signal overrides positive matches.
  if (/\\b(men|mens|men's|male|boys|boy|unisex|electronics?|hardware|construction|tools?|drill|screw|bolt|plumbing|pipe|appliance|refrigerator|fridge|washing machine|phone|wireless|headphones?|earbuds?|charger|battery|toy|pet|kitchen|car accessory)\\b/.test(value)) return null;
  if (/perfume|parfum|fragrance|eau de parfum|eau de toilette|body mist/.test(value)) return "Perfume";
  if (/makeup|cosmetic|skincare|skin care|lipstick|mascara|foundation|concealer|eyeliner|blush|serum|moisturizer|moisturiser|face cream|nail polish/.test(value)) return "Cosmetics";
  if (/lingerie|\\bbra\\b|bras\\b|briefs|panties|underwear|nightwear|nightgown|sleepwear|pajama|pyjama/.test(value) && /women|woman|ladies|female|lingerie|underwear|nightwear|sleepwear|pajama|pyjama/.test(value)) return "Lingerie";
  if (/women'?s clothing|women'?s fashion|women|woman|ladies|female/.test(value) && /dress|skirt|blouse|\\btop\\b|trousers|pants|jeans|leggings|coat|jacket|cardigan|sweater|fashion|clothing|apparel|shirt|swimwear/.test(value)) return "Women's Fashion";
  return null;
}
function normalize(item: RawProduct, supplier: string, usdToEur?: number): StoreProduct | null {
  const supplierId = firstText(item, ["pid", "id", "productId", "product_id", "sku", "productSku", "variantSku", "reference"]);
  const name = firstText(item, ["productNameEn", "nameEn", "name", "title", "productName", "product_name"]);
  const image = firstText(item, ["bigImage", "productImage", "image", "imageUrl", "image_url", "mainImage", "thumbnail", "picture"]);
  const sourceCategory = firstText(item, ["categoryName", "category", "categoryNameEn", "productType", "twoCategoryName", "threeCategoryName"]);
  const sourceTags = firstText(item, ["tags", "tag", "keywords", "attributes", "description"]);
  const productType = categoryOf(name, sourceCategory, sourceTags);
  if (!productType) return null;
  const rawPrice = firstText(item, ["sellPrice", "nowPrice", "price", "retailPrice", "retail_price", "salePrice", "priceMin"]);
  const rawAmount = Number.parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(",", ".").split("-")[0]);
  if (!supplierId || !name || !/^https?:\/\//i.test(image) || !Number.isFinite(rawAmount) || rawAmount <= 0) return null;

  let costEur = rawAmount;
  if (supplier === "CJdropshipping") {
    if (!usdToEur || usdToEur <= 0) return null;
    costEur = rawAmount / usdToEur;
  } else {
    const currency = (firstText(item, ["currency", "currencyCode", "priceCurrency"]) || process.env.BRANDSGATEWAY_CURRENCY || "").toUpperCase();
    if (currency !== "EUR") return null;
  }
  const priceAmount = Math.ceil(costEur * 1.4 * 100) / 100;
  return {
    id: stableId(`${supplier}:${supplierId}`),
    name,
    type: productType,
    price: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceAmount),
    priceAmount,
    image,
    tag: supplier === "CJdropshipping" ? "CJ COLLECTION" : "BRANDSGATEWAY COLLECTION",
    supplier,
    supplierId,
    cost: Math.round(costEur * 100) / 100
  };
}
function productList(payload: unknown): RawProduct[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
  if (Array.isArray(data.content)) {
    const nested = data.content.flatMap((entry) => entry && typeof entry === "object" && Array.isArray((entry as Record<string, unknown>).productList)
      ? ((entry as Record<string, unknown>).productList as unknown[])
      : []);
    if (nested.length) return nested.filter((item): item is RawProduct => !!item && typeof item === "object");
  }
  for (const value of [data.list, data.products, data.items, data.records, root.content, root.products]) {
    if (Array.isArray(value)) return value.filter((item): item is RawProduct => !!item && typeof item === "object");
  }
  if (Array.isArray(root.data)) return root.data.filter((item): item is RawProduct => !!item && typeof item === "object");
  return [];
}
async function getUsdToEur(): Promise<number> {
  const response = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error("Could not retrieve the daily USD/EUR reference rate");
  const xml = await response.text();
  const match = xml.match(/currency=["']USD["']\s+rate=["']([0-9.]+)["']/);
  const usdPerEur = match ? Number(match[1]) : NaN;
  if (!Number.isFinite(usdPerEur) || usdPerEur <= 0) throw new Error("Daily USD/EUR reference rate was unavailable");
  return usdPerEur;
}
async function loadCJ(page: number, size: number): Promise<{ products: StoreProduct[]; hasMore: boolean }> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) return { products: [], hasMore: false };
  const authResponse = await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
    cache: "no-store"
  });
  if (!authResponse.ok) throw new Error("CJ authentication failed");
  const authPayload = await authResponse.json() as { data?: { accessToken?: string }; success?: boolean; result?: boolean };
  const accessToken = authPayload.data?.accessToken;
  if (!accessToken || authPayload.success === false || authPayload.result === false) throw new Error("CJ did not issue an access token");
  await new Promise((resolve) => setTimeout(resolve, 1050));
  const query = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/listV2");
  query.searchParams.set("page", String(page));
  query.searchParams.set("size", String(size));
  query.searchParams.set("countryCode", "DE");
  const response = await fetch(query, { headers: { "CJ-Access-Token": accessToken }, cache: "no-store" });
  if (!response.ok) throw new Error("CJ catalog request failed");
  const payload = await response.json() as { data?: { totalPages?: number; totalRecords?: number } };
  const rate = await getUsdToEur();
  const products = productList(payload).map((item) => normalize(item, "CJdropshipping", rate)).filter((item): item is StoreProduct => item !== null);
  const totalPages = Number(payload.data?.totalPages ?? 1);
  return { products, hasMore: Number.isFinite(totalPages) && totalPages > page };
}
async function loadBrandsGateway(page: number, size: number): Promise<{ products: StoreProduct[]; hasMore: boolean }> {
  const endpoint = process.env.BRANDSGATEWAY_CATALOG_URL;
  const token = process.env.BRANDSGATEWAY_API_TOKEN;
  if (!endpoint || !token) return { products: [], hasMore: false };
  const response = await fetch(new URL(endpoint), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) throw new Error("BrandsGateway catalog request failed");
  const payload = await response.json();
  const allProducts = productList(payload).map((item) => normalize(item, "BrandsGateway")).filter((item): item is StoreProduct => item !== null);
  const offset = (page - 1) * size;
  return { products: allProducts.slice(offset, offset + size), hasMore: allProducts.length > offset + size };
}

export async function GET(request: Request) {
  const errors: string[] = [];
  // Prefer the persistent catalog populated by the scheduled supplier sync.
  try {
    const stored = await prisma.storeProduct.findMany({
      where: { active: true, type: { in: [...APPROVED_TYPES] } },
      orderBy: { updatedAt: "desc" },
      take: 1000
    });
    if (stored.length > 0) {
      const url = new URL(request.url);
      const requestedPage = Math.min(10, Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1));
      const offset = (requestedPage - 1) * 200;
      const approved = stored.filter((item) => {
        const type = categoryOf(item.name, item.type, item.tag);
        return Boolean(type && APPROVED_TYPES.includes(type as typeof APPROVED_TYPES[number]) && Number.isFinite(item.priceAmount) && item.priceAmount > 0 && /^https?:\\/\\//i.test(item.image));
      });
      const products = approved.slice(offset, offset + 200).map((item) => ({
        id: stableId(`${item.supplier}:${item.supplierId}`),
        name: item.name,
        type: categoryOf(item.name, item.type, item.tag)!,
        price: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(item.priceAmount),
        priceAmount: item.priceAmount,
        image: item.image,
        tag: item.tag,
        supplier: item.supplier,
        supplierId: item.supplierId,
        cost: item.cost
      }));
      return NextResponse.json({
        products, count: products.length, page: requestedPage, pageSize: 200,
        hasMore: offset + products.length < approved.length,
        source: "database", totalStored: approved.length,
        suppliers: {
          cj: { configured: Boolean(process.env.CJ_API_KEY), imported: approved.filter((item) => item.supplier === "CJdropshipping").length },
          brandsGateway: { configured: Boolean(process.env.BRANDSGATEWAY_CATALOG_URL && process.env.BRANDSGATEWAY_API_TOKEN && process.env.BRANDSGATEWAY_CURRENCY === "EUR"), imported: approved.filter((item) => item.supplier === "BrandsGateway").length }
        },
        errors: []
      }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch (error) {
    console.error("Persistent product catalog unavailable; trying live supplier feed:", error);
    errors.push("Persistent database catalog is unavailable");
  }
  const url = new URL(request.url);
  const page = Math.min(10, Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1));
  const size = 100;
  const results = await Promise.allSettled([loadCJ(page, size), loadBrandsGateway(page, size)]);
  const cj = results[0].status === "fulfilled" ? results[0].value : (errors.push("CJdropshipping connection failed or its USD/EUR rate could not be verified"), { products: [], hasMore: false });
  const bg = results[1].status === "fulfilled" ? results[1].value : (errors.push("BrandsGateway connection failed"), { products: [], hasMore: false });
  const products = [...cj.products, ...bg.products].slice(0, 1000);
  return NextResponse.json({
    products,
    count: products.length,
    page,
    pageSize: size * 2,
    hasMore: page < 10 && (cj.hasMore || bg.hasMore),
    suppliers: {
      cj: { configured: Boolean(process.env.CJ_API_KEY), imported: cj.products.length },
      brandsGateway: { configured: Boolean(process.env.BRANDSGATEWAY_CATALOG_URL && process.env.BRANDSGATEWAY_API_TOKEN && process.env.BRANDSGATEWAY_CURRENCY === "EUR"), imported: bg.products.length }
    },
    errors
  }, { headers: { "Cache-Control": "no-store" } });
}
