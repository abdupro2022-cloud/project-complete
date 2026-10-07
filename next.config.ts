import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The app stays a fully dynamic Next.js build so the API routes keep
// working in every deployment. `ABDO_STATIC=1` is retained as a hint for
// hosting platforms that benefit from unoptimized images (e.g. some
// object-store static hosts), but it no longer flips the build output.
  images: { unoptimized: process.env.ABDO_STATIC === "1" },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
