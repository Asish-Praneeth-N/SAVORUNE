import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Trigger.dev runs only in server code; keeping it external avoids bundling
  // its OpenTelemetry worker dependencies into every Next.js build worker.
  serverExternalPackages: ["@trigger.dev/sdk"],
};

export default { ...nextConfig, ...(process.env.NEXEN_DIST_DIR ? { distDir: process.env.NEXEN_DIST_DIR } : {}) };
