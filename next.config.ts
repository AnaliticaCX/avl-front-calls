import type { NextConfig } from "next";

// Solo para desarrollo local: el API Gateway únicamente admite CORS desde el dominio de Vercel,
// así que reenviamos las llamadas desde el servidor de Next y el navegador nunca sale de su origen.
const apiProxyTarget = process.env.API_PROXY_TARGET;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      { source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` },
      { source: "/healthz", destination: `${apiProxyTarget}/healthz` },
    ];
  },
};

export default nextConfig;
