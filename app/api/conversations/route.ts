import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Sign in to view saved conversations." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        memberships: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { organizationId: true }
        }
      }
    });
    const organizationId = user?.memberships[0]?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No workspace is connected to this account." }, { status: 403 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true }
        }
      }
    });

    return NextResponse.json({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title || "Untitled conversation",
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation._count.messages,
        latestMessage: conversation.messages[0] ?? null
      }))
    });
  } catch (error) {
    console.error("Conversation history retrieval failed:", error);
    return NextResponse.json({ error: "Conversation history is temporarily unavailable." }, { status: 500 });
  }
}
