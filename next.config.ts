import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  async redirects() {
    return [
      { source: "/README.md", destination: "/docs", permanent: true },
      { source: "/README-zh.md", destination: "/docs/zh", permanent: true },
      // F19 split-layers removed 2026-10-30; keep indexed links alive.
      { source: "/tools/split-layers", destination: "/tools", permanent: true },
    ];
  },
};
export default nextConfig;
