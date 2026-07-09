import { db } from "@/db";
import { projects, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, parseInt(id)));

  if (result.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const projectId = parseInt(id);

  // Fetch current project for audit log
  const current = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (current.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const currentProject = current[0];

  // Create audit log entries for changed fields
  const editableFields = [
    "ownerName",
    "projectNo",
    "plotNo",
    "projectLocation",
    "noc",
    "perspective3d",
    "architecture",
    "structure",
    "status",
    "contractor",
    "remarks",
    "archived",
  ] as const;

  type EditableField = typeof editableFields[number];

  for (const field of editableFields) {
    if (body[field] !== undefined && body[field] !== (currentProject as Record<string, unknown>)[field]) {
      await db.insert(auditLogs).values({
        projectId,
        field,
        oldValue: String((currentProject as Record<string, unknown>)[field] ?? ""),
        newValue: String(body[field]),
        editedBy: body.editedBy || "Admin",
      });
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  for (const field of editableFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const result = await db
    .update(projects)
    .set(updateData)
    .where(eq(projects.id, projectId))
    .returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(projects).where(eq(projects.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
