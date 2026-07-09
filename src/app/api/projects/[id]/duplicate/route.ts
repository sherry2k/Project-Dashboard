import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const current = await db
    .select()
    .from(projects)
    .where(eq(projects.id, parseInt(id)));

  if (current.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const p = current[0];
  const result = await db
    .insert(projects)
    .values({
      ownerName: p.ownerName,
      projectNo: p.projectNo + " (Copy)",
      plotNo: p.plotNo,
      projectLocation: p.projectLocation,
      noc: p.noc,
      perspective3d: p.perspective3d,
      architecture: p.architecture,
      structure: p.structure,
      status: p.status,
      contractor: p.contractor,
      remarks: p.remarks,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
