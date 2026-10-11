import Link from "next/link";
import Brand from "../brand";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import KnowledgePanel from "./knowledge-panel";
import SignOutButton from "./sign-out-button";
import BillingPanel from "./billing-panel";
import ConversationsPanel from "./conversations-panel";

const MONTHLY_MESSAGE_LIMITS: Record<string, number> = {
  free: 100,
  starter: 100,
  business: 1000,
  pro: 5000
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true, email: true,
      memberships: {
        orderBy: { createdAt: "asc" }, take: 1,
        select: {
          role: true,
          organization: {
            select: {
              id: true, name: true,
              subscriptions: { orderBy: { updatedAt: "desc" }, take: 1, select: { plan: true, status: true, currentPeriodEnd: true } },
              _count: { select: { conversations: true, knowledge: true, chatbots: true } }
            }
          }
        }
      }
    }
  });
  if (!user) redirect("/login");
  const membership = user.memberships[0];
  const organization = membership?.organization;
  const subscription = organization?.subscriptions[0];
  const subscriptionIsActive = !!subscription && ["active", "trialing"].includes(subscription.status);
  const activePlan = subscriptionIsActive ? subscription.plan.toUpperCase() : "FREE";
  const planKey = (subscriptionIsActive ? subscription.plan : "free").toLowerCase();
  const monthlyLimit = MONTHLY_MESSAGE_LIMITS[planKey] ?? MONTHLY_MESSAGE_LIMITS.free;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const usedThisMonth = organization
    ? await prisma.message.count({
        where: {
          role: "user",
          createdAt: { gte: monthStart },
          conversation: { organizationId: organization.id }
        }
      })
    : 0;
  const usagePercent = Math.min(100, Math.round((usedThisMonth / monthlyLimit) * 100));
  const billingMessage = subscriptionIsActive
    ? "Your workspace plan is connected to the saved subscription status."
    : "Your workspace is currently on the free tier. Choose a paid plan below when billing is configured.";

  return (
    <main className="dashboard-page">
      <nav className="nav shell">
        <Brand />
        <div className="nav-links"><span>{user.email}</span><SignOutButton /></div>
      </nav>
      <section className="dashboard shell">
        <div className="dashboard-head">
          <div><span className="eyebrow">BUSINESS DASHBOARD</span><h1>Welcome, {user.name || "there"}.</h1><p>{organization ? organization.name : "Your workspace"} · Your account overview.</p></div>
          <span className="plan-badge">{activePlan} · {subscriptionIsActive ? subscription.status.toUpperCase() : "FREE PLAN"}</span>
        </div>
        <div className="stats">
          <div><strong>{organization?._count.conversations ?? 0}</strong><span>Saved conversations</span></div>
          <div><strong>{organization?._count.knowledge ?? 0}</strong><span>Knowledge items</span></div>
          <div><strong>{organization?._count.chatbots ?? 0}</strong><span>AI assistants</span></div>
        </div>
        <article className="dashboard-card usage-card">
          <div className="usage-heading"><div><span>MONTHLY USAGE</span><h2>{usedThisMonth.toLocaleString()} / {monthlyLimit.toLocaleString()} messages</h2></div><strong>{usagePercent}%</strong></div>
          <div className="usage-track" role="progressbar" aria-label="Monthly message usage" aria-valuemin={0} aria-valuemax={monthlyLimit} aria-valuenow={Math.min(usedThisMonth, monthlyLimit)}><span style={{ width: usagePercent + "%" }} /></div>
          <p>Usage resets at the start of each UTC calendar month. The limit applies to messages sent by your workspace.</p>
        </article>
        <div className="dashboard-grid">
          <article className="dashboard-card"><span>01</span><h2>AI Assistant</h2><p>Try the assistant and save messages to your workspace.</p><Link href="/chat">Open chat →</Link></article>
          <article className="dashboard-card"><span>02</span><h2>Knowledge Base</h2><p>Add FAQs and service information to guide responses.</p><a href="#knowledge-base">Manage knowledge ↓</a></article>
          <article className="dashboard-card"><span>03</span><h2>Conversations</h2><p>Your saved conversations are counted in this workspace.</p><span>{organization?._count.conversations ?? 0} saved</span></article>
          <article className="dashboard-card"><span>04</span><h2>Account &amp; plan</h2><p>{billingMessage}</p><span>{membership?.role ?? "MEMBER"} · {activePlan}</span></article>
        </div>
        <div id="knowledge-base"><KnowledgePanel /></div>
        <ConversationsPanel />
        <BillingPanel />
      </section>
    </main>
  );
}
