import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Please sign in before choosing a plan." }, { status: 401 });
  }

  let plan: "business" | "pro";
  try {
    const body = await request.json();
    plan = body?.plan;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (plan !== "business" && plan !== "pro") {
    return NextResponse.json({ error: "Choose a valid subscription plan." }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = plan === "business" ? process.env.STRIPE_PRICE_BUSINESS : process.env.STRIPE_PRICE_PRO;
  if (!secretKey || !priceId) {
    return NextResponse.json({
      error: "Online billing is not configured yet. Please contact the HELP-ME team."
    }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      memberships: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { role: true, organizationId: true, organization: { select: { name: true } } }
      }
    }
  });
  const membership = user?.memberships[0];
  if (!user || !membership) {
    return NextResponse.json({ error: "Your workspace could not be found." }, { status: 404 });
  }
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Only a workspace owner or admin can change the plan." }, { status: 403 });
  }

  const configuredBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  const origin = configuredBase ? new URL(configuredBase).origin : new URL(request.url).origin;
  const stripe = new Stripe(secretKey);
  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: membership.organizationId,
      metadata: {
        userId: user.id,
        organizationId: membership.organizationId,
        plan
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          organizationId: membership.organizationId,
          plan
        }
      },
      success_url: `${origin}/dashboard?billing=success`,
      cancel_url: `${origin}/dashboard?billing=cancelled`
    });
    if (!checkout.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout link." }, { status: 502 });
    }
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Stripe checkout creation failed:", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again later." }, { status: 502 });
  }
}
