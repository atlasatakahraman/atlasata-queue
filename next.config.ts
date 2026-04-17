import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
      {
        protocol: "https",
        hostname: "*.kick.com",
      },
    ],
  },

  // Tree-shake barrel exports for faster builds + smaller bundles
  experimental: {
    optimizePackageImports: ["@dnd-kit/core", "@dnd-kit/sortable", "sonner"],
  },

  // Security + caching headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
    {
      source: "/fonts/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],

  // Compress output
  compress: true,

  // Reduce build output noise
  logging: { fetches: { fullUrl: false } },
};

export default nextConfig;
