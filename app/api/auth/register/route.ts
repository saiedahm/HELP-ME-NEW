import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const organizationName = typeof body?.organization === "string" ? body.organization.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!name || name.length > 100 || !organizationName || organizationName.length > 120)
      return NextResponse.json({ error: "Enter a valid name and workspace name." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 10 || password.length > 128)
      return NextResponse.json({ error: "Password must be between 10 and 128 characters." }, { status: 400 });
    if (body?.privacyAccepted !== true || body?.termsAccepted !== true)
      return NextResponse.json({ error: "Accept the privacy notice and terms to continue." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const passwordHash = await hash(password, 12);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, privacyAcceptedAt: new Date(), termsAcceptedAt: new Date() },
        select: { id: true }
      });
      const organization = await tx.organization.create({ data: { name: organizationName }, select: { id: true } });
      await tx.membership.create({ data: { userId: user.id, organizationId: organization.id, role: "OWNER" } });
      await tx.chatbot.create({ data: { organizationId: organization.id, name: "HELP-ME Assistant" } });
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
