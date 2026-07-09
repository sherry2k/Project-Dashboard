import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const limit = parseInt(searchParams.get("limit") || "50");

  let result;
  if (projectId) {
    result = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.projectId, parseInt(projectId)))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  } else {
    result = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  return NextResponse.json(result);
}
