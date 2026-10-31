import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  turbopack: isDev
    ? {
        rules: {
          "*.css": {
            loaders: ["@tailwindcss/turbopack"],
            as: "*.css",
          },
        },
      }
    : {},
  images: {
    domains: [],
  },
};

export default nextConfig;
