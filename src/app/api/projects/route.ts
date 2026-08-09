import { db, pool } from "@/db";
import { projects } from "@/db/schema";
import { eq, desc, ilike, or, and, notInArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Statuses that are NOT considered "active" work */
const INACTIVE_STATUSES = ["Project Cancelled", "Completed", "On Hold"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const location = searchParams.get("location") || "";
  const noc = searchParams.get("noc") || "";
  const architecture = searchParams.get("architecture") || "";
  const structure = searchParams.get("structure") || "";
  const showArchived = searchParams.get("archived") === "true";
  const activeOnly = searchParams.get("activeOnly") === "true";

  const conditions = [];

  if (!showArchived) {
    conditions.push(eq(projects.archived, 0));
  }

  // "Active Projects" stat card → everything that is still being worked on
  if (activeOnly) {
    conditions.push(notInArray(projects.status, INACTIVE_STATUSES));
  }

  if (search) {
    conditions.push(
      or(
        ilike(projects.ownerName, `%${search}%`),
        ilike(projects.projectNo, `%${search}%`),
        ilike(projects.plotNo, `%${search}%`),
        ilike(projects.contractor, `%${search}%`),
        ilike(projects.remarks, `%${search}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(projects.status, status));
  }
  if (location) {
    conditions.push(eq(projects.projectLocation, location));
  }
  if (noc) {
    conditions.push(eq(projects.noc, noc));
  }
  if (architecture) {
    conditions.push(eq(projects.architecture, architecture));
  }
  if (structure) {
    conditions.push(eq(projects.structure, structure));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(projects)
    .where(where)
    .orderBy(desc(projects.createdAt));

  // Latest editor per (project, field) so each cell can show who touched it
  const editorMap: Record<number, Record<string, string>> = {};
  try {
    const editorRows = await pool.query<{
      project_id: number;
      field: string;
      edited_by: string;
    }>(
      `SELECT DISTINCT ON (project_id, field) project_id, field, edited_by
       FROM audit_logs
       ORDER BY project_id, field, created_at DESC`
    );
    for (const r of editorRows.rows) {
      if (!editorMap[r.project_id]) editorMap[r.project_id] = {};
      editorMap[r.project_id][r.field] = r.edited_by;
    }
  } catch {
    // audit table may not exist yet — ignore
  }

  const result = rows.map((p) => ({
    ...p,
    fieldEditors: editorMap[p.id] || {},
  }));

  // Get stats
  const allProjects = await db.select().from(projects).where(eq(projects.archived, 0));
  const stats = {
    total: allProjects.length,
    active: allProjects.filter((p) => !INACTIVE_STATUSES.includes(p.status)).length,
    permitIssued: allProjects.filter((p) => p.status === "Permit Issued").length,
    waitingOwner: allProjects.filter((p) => p.status === "Waiting Owner").length,
    waitingSoilReport: allProjects.filter((p) => p.status === "Waiting Soil Report").length,
    waitingTender: allProjects.filter((p) => p.status === "Waiting Tender").length,
    waitingPayment: allProjects.filter((p) => p.noc === "Waiting Payment").length,
    projectCancelled: allProjects.filter((p) => p.status === "Project Cancelled").length,
    completed: allProjects.filter((p) => p.status === "Completed").length,
    inProgress: allProjects.filter((p) => p.status === "In Progress").length,
  };

  return NextResponse.json({ projects: result, stats });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const editedBy = body.editedBy || "Admin";
  const result = await db
    .insert(projects)
    .values({
      ownerName: body.ownerName || "",
      projectNo: body.projectNo || "",
      plotNo: body.plotNo || "",
      projectLocation: body.projectLocation || "Abu Dhabi",
      noc: body.noc || "Pending",
      perspective3d: body.perspective3d || "Pending",
      architecture: body.architecture || "Pending",
      structure: body.structure || "Pending",
      status: body.status || "In Progress",
      contractor: body.contractor || "",
      remarks: body.remarks || "",
      lastEditedBy: body.editedBy || "Admin",
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
