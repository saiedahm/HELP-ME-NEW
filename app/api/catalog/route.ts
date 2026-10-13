import { NextResponse } from "next/server";

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
function categoryOf(name: string, category: string): string {
  const value = `${name} ${category}`.toLowerCase();
  if (/lingerie|bra|brief|underwear|sleepwear/.test(value)) return "Lingerie";
  if (/bag|handbag|purse|wallet/.test(value)) return "Bags";
  if (/watch|jewell|jewel|necklace|earring|bracelet|ring/.test(value)) return /watch/.test(value) ? "Watches" : "Jewelry";
  if (/perfume|fragrance|makeup|cosmetic|skincare|beauty|cream/.test(value)) return "Beauty";
  if (/hair|shampoo|conditioner/.test(value)) return "Hair Care";
  if (/body care|lotion|soap/.test(value)) return "Body Care";
  if (/phone|wireless|headphone|electronic|tech/.test(value)) return "Technology";
  if (/gift/.test(value)) return "Gifts";
  return "Fashion";
}
function normalize(item: RawProduct, supplier: string, usdToEur?: number): StoreProduct | null {
  const supplierId = firstText(item, ["pid", "id", "productId", "product_id", "sku", "productSku", "variantSku", "reference"]);
  const name = firstText(item, ["productNameEn", "nameEn", "name", "title", "productName", "product_name"]);
  const image = firstText(item, ["bigImage", "productImage", "image", "imageUrl", "image_url", "mainImage", "thumbnail", "picture"]);
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
    type: categoryOf(name, firstText(item, ["categoryName", "category", "categoryNameEn", "productType", "twoCategoryName", "threeCategoryName"])),
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
async function loadCJ(): Promise<StoreProduct[]> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) return [];
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
  const query = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/listV2");
  query.searchParams.set("page", "1");
  query.searchParams.set("size", "100");
  query.searchParams.set("countryCode", "DE");
  const response = await fetch(query, { headers: { "CJ-Access-Token": accessToken }, cache: "no-store" });
  if (!response.ok) throw new Error("CJ catalog request failed");
  const payload = await response.json();
  const rate = await getUsdToEur();
  return productList(payload).map((item) => normalize(item, "CJdropshipping", rate)).filter((item): item is StoreProduct => item !== null);
}
async function loadBrandsGateway(): Promise<StoreProduct[]> {
  const endpoint = process.env.BRANDSGATEWAY_CATALOG_URL;
  const token = process.env.BRANDSGATEWAY_API_TOKEN;
  if (!endpoint || !token) return [];
  const response = await fetch(new URL(endpoint), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) throw new Error("BrandsGateway catalog request failed");
  const payload = await response.json();
  return productList(payload).map((item) => normalize(item, "BrandsGateway")).filter((item): item is StoreProduct => item !== null);
}

export async function GET() {
  const errors: string[] = [];
  const results = await Promise.allSettled([loadCJ(), loadBrandsGateway()]);
  const cj = results[0].status === "fulfilled" ? results[0].value : (errors.push("CJdropshipping connection failed or its USD/EUR rate could not be verified"), []);
  const bg = results[1].status === "fulfilled" ? results[1].value : (errors.push("BrandsGateway connection failed"), []);
  const products = [...cj, ...bg].slice(0, 1000);
  return NextResponse.json({
    products,
    count: products.length,
    suppliers: {
      cj: { configured: Boolean(process.env.CJ_API_KEY), imported: cj.length },
      brandsGateway: { configured: Boolean(process.env.BRANDSGATEWAY_CATALOG_URL && process.env.BRANDSGATEWAY_API_TOKEN && process.env.BRANDSGATEWAY_CURRENCY === "EUR"), imported: bg.length }
    },
    errors
  }, { headers: { "Cache-Control": "no-store" } });
}
