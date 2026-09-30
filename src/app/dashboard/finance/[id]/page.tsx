"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import type { FinanceDocument, DocType } from "@/lib/types";
import { format } from "date-fns";

interface UserInfo {
  role: string;
}

function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function threeDigits(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
      str += ones[n] ? ones[n] : "";
    } else if (n >= 10) {
      str += teens[n - 10];
    } else if (n > 0) {
      str += ones[n];
    }
    return str.trim();
  }

  function wholeNumberToWords(n: number): string {
    if (n === 0) return "Zero";
    let str = "";
    const million = Math.floor(n / 1000000);
    const thousand = Math.floor((n % 1000000) / 1000);
    const rest = n % 1000;

    if (million) str += threeDigits(million) + " Million ";
    if (thousand) str += threeDigits(thousand) + " Thousand ";
    if (rest) str += threeDigits(rest);

    return str.trim();
  }

  const dirhams = Math.floor(num);
  const fils = Math.round((num - dirhams) * 100);

  let result = wholeNumberToWords(dirhams) + " Dirham" + (dirhams !== 1 ? "s" : "");
  if (fils > 0) {
    result += " and " + wholeNumberToWords(fils) + " Fils";
  }
  return result + " Only";
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
    if (doc?.docNumber) {
      document.title = doc.docNumber.replace(/\//g, "-");
    }
  }, [doc]);

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
     <div
  className="max-w-4xl mx-auto my-6 bg-white shadow-sm print:shadow-none print:my-0"
  id="print-area"
>
        <div className="w-full flex justify-center">
  <img src="/images/letterhead.jpg" alt="" style={{ width: "90%", height: "auto" }} />
</div>

        <div className="px-10 py-6" id="print-content">
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
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Client:</p>
              <p className="font-semibold text-slate-800">{doc.clientName}</p>
              {doc.clientAddress && <p className="text-slate-600">{doc.clientAddress}</p>}
              {doc.clientTrn && <p className="text-slate-600">TRN: {doc.clientTrn}</p>}
            </div>
           <div className="text-right">
  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Consultant:</p>
  <p className="font-semibold text-slate-800">Universal Building Engineering Consultants LLC</p>
  <p className="text-slate-600">TRN: 100551545500003</p>
  {doc.paymentMethod && (
    <p className="text-slate-600 mt-1">Payment: {doc.paymentMethod}</p>
  )}
</div>
          </div>

          <table className="w-full text-sm mb-6">
  <thead>
    <tr className="bg-[#5E9E3A] text-left">
      <th className="py-2.5 px-3 text-white font-semibold w-12">No.</th>
      <th className="py-2.5 px-3 text-white font-semibold">Description</th>
      <th className="py-2.5 px-3 text-white font-semibold text-right w-32">Amount</th>
    </tr>
  </thead>
  <tbody>
    {doc.items?.map((item, i) => (
      <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
        <td className="py-2.5 px-3 text-slate-500">{i + 1}</td>
        <td className="py-2.5 px-3 text-slate-700">{item.description}</td>
        <td className="py-2.5 px-3 text-slate-700 text-right">{formatMoney(item.amount)}</td>
      </tr>
    ))}
  </tbody>
</table>

          <div className="flex justify-end mb-3">
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

          <div className="flex justify-end mb-8">
            <p className="w-64 text-xs text-slate-500 italic text-right">
              {numberToWords(doc.totalAmount / 100)}
            </p>
          </div>

                             <div className="mb-8 text-sm">
  <p className="font-semibold text-slate-800 mb-1">Bank Account Details:</p>
  <div className="space-y-0.5 text-slate-600">
    <p><span className="font-medium text-slate-700">Account Name:</span> Universal Building Engineering Consultants</p>
    <p><span className="font-medium text-slate-700">Bank Name:</span> ADIB</p>
    <p><span className="font-medium text-slate-700">Account Number:</span> 18758331</p>
    <p><span className="font-medium text-slate-700">IBAN:</span> AE640500000000018758331</p>
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

       <div className="w-full flex justify-center mt-4">
  <img src="/images/footer.jpg" alt="" style={{ width: "90%", height: "auto" }} />
</div>
    </div>
       </div>
  );
}
