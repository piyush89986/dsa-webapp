import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongodb', 'bcryptjs', 'openai', '@anthropic-ai/sdk'],
};

export default nextConfig;
