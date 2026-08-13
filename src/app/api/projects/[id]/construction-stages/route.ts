import { db } from "@/db";
import { constructionStages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await db
    .select()
    .from(constructionStages)
    .where(eq(constructionStages.projectId, parseInt(id)))
    .orderBy(asc(constructionStages.sortOrder));
  return NextResponse.json(result);
}

/** Replace the full stage list for a project (used when configuring which stages apply + their weights) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseInt(id);
  const body = await request.json();
  const stages: { stageName: string; weight: number }[] = body.stages || [];

  await db.delete(constructionStages).where(eq(constructionStages.projectId, projectId));

  if (stages.length > 0) {
    await db.insert(constructionStages).values(
      stages.map((s, i) => ({
        projectId,
        stageName: s.stageName,
        weight: s.weight,
        status: "pending" as const,
        subPercent: 0,
        sortOrder: i,
      }))
    );
  }

  const result = await db
    .select()
    .from(constructionStages)
    .where(eq(constructionStages.projectId, projectId))
    .orderBy(asc(constructionStages.sortOrder));

  return NextResponse.json(result);
}
