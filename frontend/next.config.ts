import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '../'
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
