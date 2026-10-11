import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { aiProvider } from "@/lib/ai/runtime";

const MONTHLY_MESSAGE_LIMITS: Record<string, number> = {
  free: 100,
  starter: 100,
  business: 1000,
  pro: 5000
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.email
      ? (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id
      : null;
    if (!userId) return NextResponse.json({ error: "Sign in to save conversations." }, { status: 401 });

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;
    if (!message || message.length > 4000)
      return NextResponse.json({ error: "Enter a message up to 4,000 characters." }, { status: 400 });

    const membership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { organizationId: true }
    });
    if (!membership) return NextResponse.json({ error: "No workspace is connected to this account." }, { status: 403 });

    const subscription = await prisma.subscription.findFirst({
      where: { organizationId: membership.organizationId, status: { in: ["active", "trialing"] } },
      orderBy: { updatedAt: "desc" },
      select: { plan: true }
    });
    const planKey = (subscription?.plan || "free").toLowerCase();
    const monthlyLimit = MONTHLY_MESSAGE_LIMITS[planKey] ?? MONTHLY_MESSAGE_LIMITS.free;
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const usedThisMonth = await prisma.message.count({
      where: {
        role: "user",
        createdAt: { gte: monthStart },
        conversation: { organizationId: membership.organizationId }
      }
    });
    if (usedThisMonth >= monthlyLimit) {
      return NextResponse.json({
        error: "Your workspace has reached its monthly message limit. Upgrade your plan or try again next month.",
        code: "MONTHLY_USAGE_LIMIT",
        usage: { used: usedThisMonth, limit: monthlyLimit, plan: planKey }
      }, { status: 429 });
    }

    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, organizationId: membership.organizationId },
        select: { id: true }
      });
      if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    } else {
      const chatbot = await prisma.chatbot.findFirst({
        where: { organizationId: membership.organizationId, status: "ACTIVE" },
        select: { id: true, name: true }
      });
      if (!chatbot) return NextResponse.json({ error: "No active assistant is configured." }, { status: 409 });
      conversation = await prisma.conversation.create({
        data: { organizationId: membership.organizationId, chatbotId: chatbot.id, title: message.slice(0, 80) },
        select: { id: true }
      });
    }

    await prisma.message.create({ data: { conversationId: conversation.id, role: "user", content: message } });
    const knowledge = await prisma.knowledgeDocument.findMany({
      where: { organizationId: membership.organizationId },
      select: { title: true, content: true },
      take: 10
    });
    const contextItems = knowledge.map(item => item.title + ": " + item.content.slice(0, 1500));
    const previousMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { role: true, content: true }
    });
    const messages = previousMessages.reverse().map(item => ({
      role: item.role === "assistant" ? "assistant" as const : "user" as const,
      content: item.content
    }));
    // The newest user message has already been saved and is included in history.
    const reply = await aiProvider.generateReply({
      messages,
      context: { botName: "HELP-ME", knowledge: contextItems }
    });
    await prisma.message.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });
    return NextResponse.json({
      reply,
      provider: process.env.OPENAI_API_KEY ? "openai" : "mock",
      conversationId: conversation.id,
      usage: { used: usedThisMonth + 1, limit: monthlyLimit, plan: planKey }
    });
  } catch (error) {
    console.error("Chat request failed:", error);
    return NextResponse.json({ error: "The assistant is temporarily unavailable." }, { status: 500 });
  }
}
