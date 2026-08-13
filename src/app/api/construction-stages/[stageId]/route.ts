import { db } from "@/db";
import { constructionStages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  const { stageId } = await params;
  const body = await request.json();
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.status !== undefined) updateData.status = body.status;
  if (body.subPercent !== undefined) updateData.subPercent = Number(body.subPercent);
  if (body.weight !== undefined) updateData.weight = Number(body.weight);

  const result = await db
    .update(constructionStages)
    .set(updateData)
    .where(eq(constructionStages.id, parseInt(stageId)))
    .returning();

  return NextResponse.json(result[0]);
}
