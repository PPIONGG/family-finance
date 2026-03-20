import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/', destination: '/installments', permanent: false },
      { source: '/dashboard', destination: '/installments', permanent: true },
      { source: '/reports', destination: '/installments', permanent: true },
    ];
  },
};

export default nextConfig;
