"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import type { DocType, FinanceDocument } from "@/lib/types";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number; // AED, not fils
}

interface UserInfo {
  username: string;
  role: string;
}

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: "invoice", label: "Invoice" },
  { value: "receipt_voucher", label: "Receipt Voucher" },
  { value: "tax_invoice", label: "Tax Invoice" },
];

export default function EditFinanceDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [docType, setDocType] = useState<DocType>("invoice");
  const [docNumber, setDocNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientTrn, setClientTrn] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [vatPercent, setVatPercent] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const [contractValue, setContractValue] = useState(0);
  const [previouslyInvoiced, setPreviouslyInvoiced] = useState(0);

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
      .then((data: FinanceDocument) => {
        setDocType(data.docType);
        setDocNumber(data.docNumber);
        setClientName(data.clientName);
        setClientAddress(data.clientAddress);
        setClientTrn(data.clientTrn);
        setProjectDetails(data.projectDetails || "");
        setIssueDate(data.issueDate.slice(0, 10));
        setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : "");
        setVatPercent(data.vatPercent);
        setPaymentMethod(data.paymentMethod);
        setContractValue(data.contractValue / 100);
        setPreviouslyInvoiced(data.previouslyInvoiced / 100);
        setNotes(data.notes);
        if (data.items && data.items.length > 0) {
          setItems(data.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice / 100, // fils → AED
          })));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const vatAmount = Math.round((subtotal * vatPercent) / 100 * 100) / 100;
  const total = subtotal + vatAmount;

  const handleSave = async () => {
    if (!clientName.trim()) {
      alert("Client name is required");
      return;
    }
    if (items.length === 0 || items.every((it) => !it.description.trim())) {
      alert("Add at least one line item");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/finance/documents/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientAddress,
          clientTrn,
          projectDetails,
          issueDate,
          dueDate: dueDate || null,
          vatPercent,
          paymentMethod,
          notes,
          contractValue,
          previouslyInvoiced,
          items: items
            .filter((it) => it.description.trim())
            .map((it) => ({
              description: it.description,
              quantity: it.quantity,
              unitPrice: Math.round(it.unitPrice * 100), // AED → fils
            })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }

      router.push(`/dashboard/finance/${params.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save document. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#5E9E3A]" />
      </div>
    );
  }

  if (notFound) {
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
      <div className="bg-gradient-to-r from-[#5E9E3A] to-[#4a8230] px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/finance/${params.id}`)}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Edit {docNumber}</h1>
        </div>
      </div>

      <main className="px-6 py-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
            <div className="flex gap-2">
              {DOC_TYPE_OPTIONS.map((opt) => (
                <span
                  key={opt.value}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                    docType === opt.value
                      ? "bg-[#5E9E3A] text-white border-[#5E9E3A]"
                      : "bg-slate-50 text-slate-400 border-slate-200"
                  }`}
                >
                  {opt.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">Document type cannot be changed after creation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Name *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Client TRN</label>
              <input
                type="text"
                value={clientTrn}
                onChange={(e) => setClientTrn(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Address</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Details</label>
              <textarea
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contract Value (AED)</label>
  <input
    type="number"
    min={0}
    step={0.01}
    value={contractValue}
    onChange={(e) => setContractValue(Number(e.target.value))}
    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
  />
</div>
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1.5">Previously Invoiced (AED)</label>
  <input
    type="number"
    min={0}
    step={0.01}
    value={previouslyInvoiced}
    onChange={(e) => setPreviouslyInvoiced(Number(e.target.value))}
    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
  />
</div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {docType === "receipt_voucher" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Line Items</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-slate-100 items-center">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="Item description"
                    className="col-span-6 border border-slate-200 rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                    className="col-span-2 border border-slate-200 rounded px-2 py-1.5 text-sm text-right"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                    className="col-span-2 border border-slate-200 rounded px-2 py-1.5 text-sm text-right"
                  />
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <Plus size={14} /> Add Line
            </button>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>AED {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  VAT
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={vatPercent}
                    onChange={(e) => setVatPercent(Number(e.target.value))}
                    className="w-14 border border-slate-200 rounded px-1.5 py-0.5 text-xs"
                  />
                  %
                </span>
                <span>AED {vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-800 border-t border-slate-200 pt-2">
                <span>Total</span>
                <span>AED {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => router.push(`/dashboard/finance/${params.id}`)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-[#5E9E3A] rounded-lg hover:bg-[#5E9E3A]/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
