import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile workspace packages so Next.js can process TypeScript sources
  transpilePackages: ["@eop/access", "@eop/core", "@eop/db"],

  // Handle .js → .ts extension resolution for workspace packages
  // that use ESM convention (.js extensions in TypeScript imports).
  // Required because @eop/db uses `from './client.js'` to import `./client.ts`.
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },

  // Silence Turbopack warning — we intentionally use webpack for builds
  // due to .js extension alias requirements from workspace packages.
  turbopack: {},
};

export default nextConfig;
