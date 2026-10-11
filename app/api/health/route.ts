import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "unconfigured" | "error"> = {
    application: "ok",
    database: "unconfigured"
  };
  let status = 200;
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
      status = 503;
    }
  }
  return NextResponse.json({ status: status === 200 ? "ok" : "degraded", checks }, { status });
}