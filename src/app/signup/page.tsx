"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, Loader2, Check, AtSign } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRequirements = [
    { met: username.length >= 3, text: "Username at least 3 characters" },
    { met: password.length >= 6, text: "Password at least 6 characters" },
    { met: password === confirmPassword && password.length > 0, text: "Passwords match" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Ensure DB tables exist
      await fetch("/api/setup");

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign up failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5E9E3A] to-[#4a8230] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
            <img
              src="/images/logo.png"
              alt="UBEC Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-green-100 mt-1">Universal Building Engineering Consultants</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Join the team</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmed Al Mansoori"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E9E3A] focus:border-[#5E9E3A] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <AtSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  placeholder="e.g. ahmed.eng"
                  required
                  autoComplete="username"
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E9E3A] focus:border-[#5E9E3A] transition-all"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Lowercase, no spaces. This is what you&apos;ll use to login.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E9E3A] focus:border-[#5E9E3A] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E9E3A] focus:border-[#5E9E3A] transition-all"
              />
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? "bg-[#5E9E3A]" : "bg-slate-200"}`}>
                    {req.met && <Check size={10} className="text-white" />}
                  </div>
                  <span className={req.met ? "text-[#5E9E3A]" : "text-slate-500"}>{req.text}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5E9E3A] hover:bg-[#4a8230] text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-[#5E9E3A] hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-green-100 text-sm mt-6">
          © 2024 Universal Building Engineering Consultants
        </p>
      </div>
    </div>
  );
}
