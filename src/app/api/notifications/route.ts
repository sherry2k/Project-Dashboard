import { pool } from "@/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns the most recent project modifications made by ANY user so the
 * header bell can highlight when somebody changed something.
 *
 * Query params:
 *  - limit: max rows to return (default 30, max 100)
 *  - since: ISO timestamp; only changes newer than this are returned
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  const searchParams = request.nextUrl.searchParams;

  const rawLimit = parseInt(searchParams.get("limit") || "30", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;
  const since = searchParams.get("since");

  const serverTime = new Date().toISOString();

  try {
    const values: unknown[] = [];
    let whereClause = "";

    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        values.push(sinceDate.toISOString());
        whereClause = `WHERE a.created_at > $${values.length}`;
      }
    }

    values.push(limit);

    const { rows } = await pool.query<{
      id: number;
      project_id: number;
      field: string;
      old_value: string;
      new_value: string;
      edited_by: string;
      created_at: Date;
      project_no: string | null;
      owner_name: string | null;
    }>(
      `SELECT a.id, a.project_id, a.field, a.old_value, a.new_value,
              a.edited_by, a.created_at,
              p.project_no, p.owner_name
         FROM audit_logs a
         LEFT JOIN projects p ON p.id = a.project_id
         ${whereClause}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT $${values.length}`,
      values
    );

    const currentUser = (session?.username || "").toLowerCase();

    const notifications = rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      projectNo: r.project_no || `#${r.project_id}`,
      ownerName: r.owner_name || "",
      field: r.field,
      oldValue: r.old_value || "",
      newValue: r.new_value || "",
      editedBy: r.edited_by || "unknown",
      createdAt:
        r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      byOther: (r.edited_by || "").toLowerCase() !== currentUser,
    }));

    return NextResponse.json({ notifications, serverTime });
  } catch {
    // audit_logs table may not exist yet — behave as "no notifications"
    return NextResponse.json({ notifications: [], serverTime });
  }
}
