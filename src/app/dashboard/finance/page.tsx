"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Receipt, FileCheck, Loader2 } from "lucide-react";
import type { FinanceDocument, DocType } from "@/lib/types";
import { format } from "date-fns";

interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  invoice: "Invoice",
  receipt_voucher: "Receipt Voucher",
  tax_invoice: "Tax Invoice",
};

const DOC_TYPE_ICONS: Record<DocType, typeof FileText> = {
  invoice: FileText,
  receipt_voucher: Receipt,
  tax_invoice: FileCheck,
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-700" },
  sent: { bg: "bg-blue-100", text: "text-blue-800" },
  paid: { bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled: { bg: "bg-red-100", text: "text-red-800" },
};

export default function FinancePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<DocType | "all">("all");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.user.role !== "admin") {
            router.push("/dashboard");
            return;
          }
        } else {
          router.push("/login");
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => router.push("/dashboard"));
  }, [router]);

  useEffect(() => {
    if (!authChecked || user?.role !== "admin") return;
    setLoading(true);
    const url = filterType === "all" ? "/api/finance/documents" : `/api/finance/documents?docType=${filterType}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [authChecked, user, filterType]);

  if (!authChecked || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#5E9E3A]" />
      </div>
    );
  }

  const formatMoney = (fils: number) => `AED ${(fils / 100).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <div className="bg-gradient-to-r from-[#5E9E3A] to-[#4a8230] px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-green-100 text-xs uppercase tracking-wider font-semibold mb-1">Finance</p>
            <h1 className="text-2xl font-bold text-white">Invoices & Documents</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/80 hover:text-white text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <main className="px-6 py-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {(["all", "invoice", "receipt_voucher", "tax_invoice"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type ? "bg-[#5E9E3A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {type === "all" ? "All" : DOC_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <button
              onClick={() => router.push("/dashboard/finance/new")}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#5E9E3A] text-white rounded-lg text-sm font-medium hover:bg-[#5E9E3A]/90 transition-colors"
            >
              <Plus size={16} /> New Document
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 size={28} className="animate-spin text-[#5E9E3A] mx-auto" />
            </div>
          ) : documents.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-400">No documents yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Doc Number</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Issue Date</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const Icon = DOC_TYPE_ICONS[doc.docType];
                  const statusColor = STATUS_COLORS[doc.status] || STATUS_COLORS.draft;
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => router.push(`/dashboard/finance/${doc.id}`)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">{doc.docNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon size={14} className="text-slate-400" />
                          {DOC_TYPE_LABELS[doc.docType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{doc.clientName}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(doc.issueDate), "dd MMM yyyy")}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 text-right">{formatMoney(doc.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
