/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/uploads/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "nxnukzawitjgnropmmgh.supabase.co",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "**",
      },
    ],
    domains: [
      "localhost",
    ],
  },

  // Increase body size limit for server actions to handle product images
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb", // 10MB
    },
  },
};

module.exports = nextConfig;
