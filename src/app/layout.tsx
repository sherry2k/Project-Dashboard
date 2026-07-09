import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "UBEC - Project Dashboard | Universal Building Engineering Consultants",
  description: "Professional Project Management Dashboard for Universal Building Engineering Consultants",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo.png" />
      </head>
      <body className="bg-[#F1F5F9] text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
