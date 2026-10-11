import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function getWorkspaceId() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { memberships: { orderBy: { createdAt: "asc" }, take: 1, select: { organizationId: true } } }
  });
  return user?.memberships[0]?.organizationId ?? null;
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getWorkspaceId();
    if (!organizationId) return NextResponse.json({ error: "Sign in to manage your knowledge base." }, { status: 401 });
    const { id } = await context.params;
    const result = await prisma.knowledgeDocument.deleteMany({
      where: { id, organizationId }
    });
    if (result.count === 0) return NextResponse.json({ error: "Knowledge item not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Knowledge deletion failed:", error);
    return NextResponse.json({ error: "Could not delete this knowledge item." }, { status: 500 });
  }
}
