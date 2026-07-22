"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, Loader2 } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const checkApproval = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      
      if (data.user?.approved === 1) {
        router.push("/dashboard");
      }
    } catch {
      // Ignore
    }
    setChecking(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  useEffect(() => {
    // Check every 30 seconds if approved
    const interval = setInterval(checkApproval, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5E9E3A] to-[#4a8230] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
            <img
              src="/images/logo.png"
              alt="UBEC Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Account Pending</h1>
          <p className="text-green-100 mt-1">Universal Building Engineering Consultants</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-amber-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Waiting for Approval</h2>
          
          <p className="text-slate-600 mb-6">
            Your account has been created successfully. Please wait for an administrator to approve your account before you can access the dashboard.
          </p>

          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-500">
              This page will automatically check your status. You can also click the button below to check manually.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={checkApproval}
              disabled={checking}
              className="w-full bg-[#5E9E3A] hover:bg-[#4a8230] text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {checking ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Check Approval Status"
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        <p className="text-center text-green-100 text-sm mt-6">
          Contact your administrator if this takes too long.
        </p>
      </div>
    </div>
  );
}

