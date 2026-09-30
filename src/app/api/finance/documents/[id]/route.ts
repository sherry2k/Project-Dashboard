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
  if (body.clientName !== undefined) updateData.clientName = body.clientName;
  if (body.clientAddress !== undefined) updateData.clientAddress = body.clientAddress;
  if (body.clientTrn !== undefined) updateData.clientTrn = body.clientTrn;
  if (body.issueDate !== undefined) updateData.issueDate = new Date(body.issueDate);
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.projectDetails !== undefined) updateData.projectDetails = body.projectDetails;
  if (body.vatPercent !== undefined) updateData.vatPercent = body.vatPercent;

  // If line items are provided, replace them entirely and recompute totals
  if (body.items !== undefined) {
    const items: { description: string; quantity: number; unitPrice: number }[] = body.items;
    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const vatPercent = body.vatPercent ?? updateData.vatPercent ?? 5;
    const vatAmount = Math.round((subtotal * Number(vatPercent)) / 100);
    const totalAmount = subtotal + vatAmount;

    updateData.subtotal = subtotal;
    updateData.vatAmount = vatAmount;
    updateData.totalAmount = totalAmount;

    await db.delete(financeDocumentItems).where(eq(financeDocumentItems.documentId, docId));
    if (items.length > 0) {
      await db.insert(financeDocumentItems).values(
        items.map((it, i) => ({
          documentId: docId,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          amount: it.quantity * it.unitPrice,
          sortOrder: i,
        }))
      );
    }
  }

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
