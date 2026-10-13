import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RawProduct = Record<string, unknown>;
type StoreProduct = { id: number; name: string; type: string; price: string; image: string; tag: string; supplier: string; supplierId: string; cost: number };

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
function normalize(item: RawProduct, supplier: string): StoreProduct | null {
  const supplierId = firstText(item, ["pid", "id", "productId", "product_id", "sku", "productSku", "variantSku", "reference"]);
  const name = firstText(item, ["productNameEn", "nameEn", "name", "title", "productName", "product_name"]);
  const image = firstText(item, ["bigImage", "productImage", "image", "imageUrl", "image_url", "mainImage", "thumbnail", "picture"]);
  const rawPrice = firstText(item, ["sellPrice", "nowPrice", "price", "retailPrice", "retail_price", "salePrice", "priceMin"]);
  const numericPrice = Number.parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(",", ".").split("-")[0]);
  if (!supplierId || !name || !image || !Number.isFinite(numericPrice) || numericPrice <= 0) return null;
  const sellingPrice = Math.ceil(numericPrice * 1.4 * 100) / 100;
  return {
    id: stableId(`${supplier}:${supplierId}`),
    name,
    type: categoryOf(name, firstText(item, ["categoryName", "category", "categoryNameEn", "productType"])),
    price: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(sellingPrice),
    image,
    tag: supplier === "CJdropshipping" ? "CJ COLLECTION" : "BRANDSGATEWAY COLLECTION",
    supplier,
    supplierId,
    cost: numericPrice
  };
}
function productList(payload: unknown): RawProduct[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;
  const possible = [data.content, data.list, data.products, data.items, data.records, root.content, root.products];
  for (const value of possible) {
    if (Array.isArray(value)) return value.filter((item): item is RawProduct => !!item && typeof item === "object");
  }
  if (Array.isArray(root.data)) return root.data.filter((item): item is RawProduct => !!item && typeof item === "object");
  return [];
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
  const response = await fetch(query, { headers: { "CJ-Access-Token": accessToken }, cache: "no-store" });
  if (!response.ok) throw new Error("CJ catalog request failed");
  const payload = await response.json();
  return productList(payload).map((item) => normalize(item, "CJdropshipping")).filter((item): item is StoreProduct => item !== null);
}
async function loadBrandsGateway(): Promise<StoreProduct[]> {
  const endpoint = process.env.BRANDSGATEWAY_CATALOG_URL;
  const token = process.env.BRANDSGATEWAY_API_TOKEN;
  if (!endpoint || !token) return [];
  const url = new URL(endpoint);
  const response = await fetch(url, {
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
  const cj = results[0].status === "fulfilled" ? results[0].value : (errors.push("CJdropshipping connection failed"), []);
  const bg = results[1].status === "fulfilled" ? results[1].value : (errors.push("BrandsGateway connection failed"), []);
  const products = [...cj, ...bg].slice(0, 1000);
  return NextResponse.json({
    products,
    count: products.length,
    suppliers: {
      cj: { configured: Boolean(process.env.CJ_API_KEY), imported: cj.length },
      brandsGateway: { configured: Boolean(process.env.BRANDSGATEWAY_CATALOG_URL && process.env.BRANDSGATEWAY_API_TOKEN), imported: bg.length }
    },
    errors
  }, { headers: { "Cache-Control": "no-store" } });
}
