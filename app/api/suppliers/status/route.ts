import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    suppliers: {
      cj: { configured: Boolean(process.env.CJ_API_KEY), requirements: ["CJ_API_KEY"] },
      brandsGateway: { configured: Boolean(process.env.BRANDSGATEWAY_CATALOG_URL && process.env.BRANDSGATEWAY_API_TOKEN && process.env.BRANDSGATEWAY_CURRENCY === "EUR"), requirements: ["BRANDSGATEWAY_CATALOG_URL", "BRANDSGATEWAY_API_TOKEN"] }
    },
    pricing: { markupPercent: 40 },
    catalogLimit: 1000,
    livePaymentsEnabled: false
  }, { headers: { "Cache-Control": "no-store" } });
}
