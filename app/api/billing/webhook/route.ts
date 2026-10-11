import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  const rawBody = await request.text();
  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId || session.client_reference_id;
      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
      if (organizationId && subscriptionId && session.mode === "subscription") {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const plan = subscription.metadata.plan || session.metadata?.plan || "business";
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          create: {
            organizationId,
            stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
            stripeSubscriptionId: subscription.id,
            plan,
            status: subscription.status,
            currentPeriodEnd: subscriptionCurrentPeriodEnd(subscription)
          },
          update: {
            organizationId,
            stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
            plan,
            status: subscription.status,
            currentPeriodEnd: subscriptionCurrentPeriodEnd(subscription)
          }
        });
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata.organizationId;
      if (organizationId) {
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          create: {
            organizationId,
            stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
            stripeSubscriptionId: subscription.id,
            plan: subscription.metadata.plan || "business",
            status: subscription.status,
            currentPeriodEnd: subscriptionCurrentPeriodEnd(subscription)
          },
          update: {
            organizationId,
            stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
            plan: subscription.metadata.plan || "business",
            status: subscription.status,
            currentPeriodEnd: subscriptionCurrentPeriodEnd(subscription)
          }
        });
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

function subscriptionCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const end = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  return typeof end === "number" ? new Date(end * 1000) : null;
}
