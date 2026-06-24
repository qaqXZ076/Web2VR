import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-0ef8de45-0413-4793-93a8-060a8a028e19.space-z.ai',
    '.space-z.ai',
  ],
};

export default nextConfig;
