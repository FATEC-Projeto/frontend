/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { 
    turbo: true, // opcional, como você já tinha
  },
  eslint: {
    // Não deixa o build falhar por causa de erro de ESLint no Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
