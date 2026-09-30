import { db } from "@/db";
import { financeDocuments, financeDocumentItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const docType = searchParams.get("docType");

  const rows = docType
    ? await db.select().from(financeDocuments).where(eq(financeDocuments.docType, docType)).orderBy(desc(financeDocuments.createdAt))
    : await db.select().from(financeDocuments).orderBy(desc(financeDocuments.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const items: { description: string; quantity: number; unitPrice: number }[] = body.items || [];
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const vatPercent = body.vatPercent ?? 5;
  const vatAmount = Math.round((subtotal * vatPercent) / 100);
  const totalAmount = subtotal + vatAmount;

  const result = await db
    .insert(financeDocuments)
    .values({
      docNumber: body.docNumber,
      docType: body.docType,
      projectId: body.projectId || null,
      clientName: body.clientName || "",
      clientAddress: body.clientAddress || "",
      clientTrn: body.clientTrn || "",
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      subtotal,
      vatPercent,
      vatAmount,
      totalAmount,
      status: body.status || "draft",
      paymentMethod: body.paymentMethod || "",
      notes: body.notes || "",
      createdBy: body.createdBy || "Admin",
    })
    .returning();

  const doc = result[0];

  if (items.length > 0) {
    await db.insert(financeDocumentItems).values(
      items.map((it, i) => ({
        documentId: doc.id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.quantity * it.unitPrice,
        sortOrder: i,
      }))
    );
  }

  return NextResponse.json(doc, { status: 201 });
}
