import { db } from "@/db";
import { financeDocuments, financeDocumentItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id);

  const docResult = await db.select().from(financeDocuments).where(eq(financeDocuments.id, docId));
  if (docResult.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await db.select().from(financeDocumentItems).where(eq(financeDocumentItems.documentId, docId));

  return NextResponse.json({ ...docResult[0], items });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id);
  const body = await request.json();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) updateData.status = body.status;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;

  const result = await db
    .update(financeDocuments)
    .set(updateData)
    .where(eq(financeDocuments.id, docId))
    .returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id);

  await db.delete(financeDocumentItems).where(eq(financeDocumentItems.documentId, docId));
  await db.delete(financeDocuments).where(eq(financeDocuments.id, docId));

  return NextResponse.json({ success: true });
}
