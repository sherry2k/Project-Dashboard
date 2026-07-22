import { db } from "@/db";
import { projects, auditLogs } from "@/db/schema";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const location = searchParams.get("location") || "";
  const noc = searchParams.get("noc") || "";
  const architecture = searchParams.get("architecture") || "";
  const structure = searchParams.get("structure") || "";
  const showArchived = searchParams.get("archived") === "true";

  const conditions = [];

  if (!showArchived) {
    conditions.push(eq(projects.archived, 0));
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

  const result = await db
    .select()
    .from(projects)
    .where(where)
    .orderBy(desc(projects.createdAt));

  // Get stats
  const allProjects = await db.select().from(projects).where(eq(projects.archived, 0));
  const stats = {
    total: allProjects.length,
    active: allProjects.filter((p) => !["Project Cancelled", "Completed", "On Hold"].includes(p.status)).length,
    permitIssued: allProjects.filter((p) => p.status === "Permit Issued").length,
    waitingOwner: allProjects.filter((p) => p.status === "Waiting Owner").length,
    waitingSoilReport: allProjects.filter((p) => p.status === "Waiting Soil Report").length,
    waitingPayment: allProjects.filter((p) => p.noc === "Waiting Payment").length,
    projectCancelled: allProjects.filter((p) => p.status === "Project Cancelled").length,
    completed: allProjects.filter((p) => p.status === "Completed").length,
    inProgress: allProjects.filter((p) => p.status === "In Progress").length,
  };

  return NextResponse.json({ projects: result, stats });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
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
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
