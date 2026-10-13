import { NextResponse } from "next/server";
import Stripe from "stripe";
import { GET as getSupplierCatalog } from "@/app/api/catalog/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CartRequestItem = { id: number; quantity: number };

export async function POST(request: Request) {
  // This endpoint is deliberately test-only until the operator completes business verification.
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_test_") || process.env.STRIPE_STORE_TEST_MODE !== "true") {
    return NextResponse.json({
      error: "Store checkout is test-only. Configure a Stripe test key and STRIPE_STORE_TEST_MODE=true. Live payments are intentionally disabled."
    }, { status: 503 });
  }

  let items: CartRequestItem[];
  try {
    const body = await request.json() as { items?: unknown };
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
      return NextResponse.json({ error: "Your cart is empty or contains too many different items." }, { status: 400 });
    }
    items = body.items.map((item) => {
      if (!item || typeof item !== "object") throw new Error("Invalid cart item.");
      const value = item as Record<string, unknown>;
      if (!Number.isSafeInteger(value.id) || !Number.isSafeInteger(value.quantity) || Number(value.quantity) < 1 || Number(value.quantity) > 10) {
        throw new Error("Each item needs a valid product ID and a quantity from 1 to 10.");
      }
      return { id: Number(value.id), quantity: Number(value.quantity) };
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid checkout request." }, { status: 400 });
  }

  const catalogResponse = await getSupplierCatalog(new Request(new URL("/api/catalog", request.url)));
  if (!catalogResponse.ok) {
    return NextResponse.json({ error: "The live supplier catalog is not available yet. No payment was started." }, { status: 503 });
  }
  const catalog = await catalogResponse.json() as { products?: unknown };
  const products = Array.isArray(catalog.products) ? catalog.products as Record<string, unknown>[] : [];
  const uniqueItems = new Map<number, number>();
  for (const item of items) uniqueItems.set(item.id, (uniqueItems.get(item.id) ?? 0) + item.quantity);
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const [id, quantity] of uniqueItems) {
    const product = products.find((entry) => Number(entry.id) === id);
    const amount = Number(product?.priceAmount);
    const name = typeof product?.name === "string" ? product.name.trim() : "";
    const supplierId = typeof product?.supplierId === "string" ? product.supplierId : "";
    if (!product || !name || !supplierId || !Number.isFinite(amount) || amount < 0.5 || amount > 100000) {
      return NextResponse.json({ error: "One or more cart items are not confirmed real supplier products. No payment was started." }, { status: 409 });
    }
    lineItems.push({
      quantity,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(amount * 100),
        product_data: { name: name.slice(0, 250) }
      }
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (!appUrl) return NextResponse.json({ error: "The storefront URL is not configured." }, { status: 503 });
  let origin: string;
  try { origin = new URL(appUrl).origin; } catch {
    return NextResponse.json({ error: "The storefront URL configuration is invalid." }, { status: 500 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      billing_address_collection: "required",
      metadata: {
        orderType: "helpme_store_test",
        itemCount: String([...uniqueItems.values()].reduce((sum, quantity) => sum + quantity, 0)),
        productIds: [...uniqueItems.keys()].join(",").slice(0, 450)
      },
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`
    });
    if (!checkout.url) return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("HELP-ME test checkout creation failed:", error);
    return NextResponse.json({ error: "Stripe test checkout could not be started. Check the test-mode API key and account settings." }, { status: 502 });
  }
}
