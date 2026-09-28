import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongodb', 'bcryptjs', '@anthropic-ai/sdk'],
};

export default nextConfig;
