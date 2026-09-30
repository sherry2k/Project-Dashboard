"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import type { FinanceDocument, DocType } from "@/lib/types";
import { format } from "date-fns";

interface UserInfo {
  role: string;
}

const DOC_TYPE_TITLES: Record<DocType, string> = {
  invoice: "INVOICE",
  receipt_voucher: "RECEIPT VOUCHER",
  tax_invoice: "TAX INVOICE",
};

export default function FinanceDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [doc, setDoc] = useState<FinanceDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/dashboard");
        } else {
          setUser(data.user);
        }
      });
  }, [router]);

  useEffect(() => {
    fetch(`/api/finance/documents/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => setDoc(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const formatMoney = (fils: number) => (fils / 100).toLocaleString("en-AE", { minimumFractionDigits: 2 });

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#5E9E3A]" />
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Document not found</p>
          <button
            onClick={() => router.push("/dashboard/finance")}
            className="px-4 py-2 bg-[#5E9E3A] text-white rounded-lg text-sm font-medium"
          >
            Back to Finance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Toolbar — hidden when printing */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/finance")}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Finance
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-[#5E9E3A] text-white rounded-lg text-sm font-medium hover:bg-[#5E9E3A]/90"
          >
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable document */}
      <div className="max-w-4xl mx-auto my-6 bg-white shadow-sm print:shadow-none print:my-0" id="print-area">
        <img src="/images/letterhead.jpg" alt="" className="w-full" />

        <div className="px-10 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-wide text-slate-800">{DOC_TYPE_TITLES[doc.docType]}</h2>
            <div className="text-right text-sm">
              <p className="font-semibold text-slate-700">{doc.docNumber}</p>
              <p className="text-slate-500">Date: {format(new Date(doc.issueDate), "dd MMM yyyy")}</p>
              {doc.dueDate && <p className="text-slate-500">Due: {format(new Date(doc.dueDate), "dd MMM yyyy")}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Bill To</p>
              <p className="font-semibold text-slate-800">{doc.clientName}</p>
              {doc.clientAddress && <p className="text-slate-600">{doc.clientAddress}</p>}
              {doc.clientTrn && <p className="text-slate-600">TRN: {doc.clientTrn}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">From</p>
              <p className="font-semibold text-slate-800">Universal Building Engineering Consultants LLC</p>
              <p className="text-slate-600">TRN: 100551545500003</p>
              {doc.paymentMethod && (
                <p className="text-slate-600 mt-1">Payment: {doc.paymentMethod}</p>
              )}
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-[#5E9E3A] text-left">
                <th className="py-2 text-slate-600 font-semibold">Description</th>
                <th className="py-2 text-slate-600 font-semibold text-right w-16">Qty</th>
                <th className="py-2 text-slate-600 font-semibold text-right w-28">Unit Price</th>
                <th className="py-2 text-slate-600 font-semibold text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {doc.items?.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2.5 text-slate-700">{item.description}</td>
                  <td className="py-2.5 text-slate-700 text-right">{item.quantity}</td>
                  <td className="py-2.5 text-slate-700 text-right">{formatMoney(item.unitPrice)}</td>
                  <td className="py-2.5 text-slate-700 text-right">{formatMoney(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64 text-sm space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>AED {formatMoney(doc.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT ({doc.vatPercent}%)</span>
                <span>AED {formatMoney(doc.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-800 border-t-2 border-slate-800 pt-1.5">
                <span>Total</span>
                <span>AED {formatMoney(doc.totalAmount)}</span>
              </div>
            </div>
          </div>

          {doc.notes && (
            <div className="mb-8 text-sm">
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Notes</p>
              <p className="text-slate-600">{doc.notes}</p>
            </div>
          )}

          <div className="flex justify-end">
            <div className="text-center">
              <img src="/images/stamp.png" alt="" className="w-28 h-28 object-contain mb-1" />
              <p className="text-xs text-slate-400">Authorized Signature</p>
            </div>
          </div>
        </div>

        <img src="/images/footer.jpg" alt="" className="w-full mt-6" />
      </div>
    </div>
  );
}
