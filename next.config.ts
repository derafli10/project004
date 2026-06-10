import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Core Configuration */
  reactStrictMode: true,
  poweredByHeader: false,
  
  /* TypeScript */
  typescript: {
    // Fail build on TypeScript errors
    ignoreBuildErrors: false,
  },
  
  /* ESLint */
  eslint: {
    // Fail build on ESLint errors
    ignoreDuringBuilds: false,
  },
  
  /* TypeScript Features */
  typedRoutes: true,
  
  /* Experimental Features */
  experimental: {
    // Enable React Server Actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
