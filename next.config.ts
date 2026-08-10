import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the sandbox/preview host to load dev resources (HMR, etc.)
  allowedDevOrigins: ["*.sandbox.novita.ai", "*.e2b.dev"],
};

export default nextConfig;
