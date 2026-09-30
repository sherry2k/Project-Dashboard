import { db, pool } from "@/db";
import { documentCounters } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

const DOC_CODE: Record<string, string> = {
  invoice: "INV",
  receipt_voucher: "RV",
  tax_invoice: "TAX",
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const docType: string = body.docType;
  const code = DOC_CODE[docType];

  if (!code) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }

  const year = new Date().getFullYear();

  // Atomic increment: insert row if missing, otherwise bump last_number, in one statement
  const result = await pool.query<{ last_number: number }>(
    `INSERT INTO document_counters (doc_type, year, last_number)
     VALUES ($1, $2, 1)
     ON CONFLICT (doc_type, year)
     DO UPDATE SET last_number = document_counters.last_number + 1
     RETURNING last_number`,
    [docType, year]
  );

  const nextNumber = result.rows[0].last_number;
  const padded = String(nextNumber).padStart(4, "0");
  const docNumber = `UBEC/${code}/${year}/${padded}`;

  return NextResponse.json({ docNumber, nextNumber, year });
}
