import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Avoid flaky/corrupt build artifacts in CI (e.g. missing server chunk modules during "Collecting page data").
  // This forces a clean compilation each build without relying on cached `.next/cache` entries.
  cacheMaxMemorySize: 0,
};

export default nextConfig;
