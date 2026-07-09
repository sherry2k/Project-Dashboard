import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Engineering Consultancy - Project Dashboard",
  description: "Professional Project Management Dashboard for Engineering Consultancy",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F1F5F9] text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
