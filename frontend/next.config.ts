import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '../'
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cliquealo-blob.sfo3.digitaloceanspaces.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cliquealo-blob.sfo3.cdn.digitaloceanspaces.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
