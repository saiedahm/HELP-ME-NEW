import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function getWorkspace() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { memberships: { orderBy: { createdAt: "asc" }, take: 1, select: { organizationId: true } } }
  });
  return user?.memberships[0]?.organizationId ?? null;
}

export async function GET() {
  try {
    const organizationId = await getWorkspace();
    if (!organizationId) return NextResponse.json({ error: "Sign in to view your knowledge base." }, { status: 401 });
    const items = await prisma.knowledgeDocument.findMany({
      where: { organizationId },
      select: { id: true, title: true, content: true, type: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Knowledge retrieval failed:", error);
    return NextResponse.json({ error: "Knowledge base is temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const organizationId = await getWorkspace();
    if (!organizationId) return NextResponse.json({ error: "Sign in to manage your knowledge base." }, { status: 401 });
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!title || title.length > 160 || !content || content.length > 12000)
      return NextResponse.json({ error: "Enter a title (max 160 characters) and content (max 12,000 characters)." }, { status: 400 });
    const item = await prisma.knowledgeDocument.create({
      data: { organizationId, title, content, type: "FAQ" },
      select: { id: true, title: true, content: true, type: true, createdAt: true }
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Knowledge save failed:", error);
    return NextResponse.json({ error: "Could not save this knowledge item." }, { status: 500 });
  }
}
