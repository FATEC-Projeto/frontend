/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Turbopack novo estilo (Next 15)
  turbopack: {
    // se quiser, pode pôr configs aqui depois
  },

  eslint: {
    // não quebrar o build por causa de ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
