import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  
  // Only admins can view all users
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      approved: users.approved,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return NextResponse.json(result);
}

