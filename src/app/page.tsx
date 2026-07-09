"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          // Logged in → go to dashboard
          router.push("/dashboard");
        } else {
          // Not logged in → go to login
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5E9E3A] to-[#4a8230] flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={48} className="animate-spin text-white mx-auto mb-4" />
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}
