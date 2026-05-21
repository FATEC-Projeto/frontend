/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",

  turbopack: {},

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Proxy API calls to backend when NEXT_PUBLIC_API_BASE_URL is not set at build time.
  // BACKEND_URL is read at runtime, so set it in the container environment.
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backend) return [];
    return [
      {
        source: "/:path*",
        destination: `${backend}/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
