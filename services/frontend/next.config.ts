import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      // User / Auth → port 3001
      { source: "/api/auth/:path*",       destination: "http://user-service:3001/api/auth/:path*" },
      { source: "/api/users/:path*",      destination: "http://user-service:3001/api/users/:path*" },
      // Product / Categories → port 3002
      { source: "/api/products/:path*",   destination: "http://product-service:3002/api/products/:path*" },
      { source: "/api/categories/:path*", destination: "http://product-service:3002/api/categories/:path*" },
      // Cart → port 3003
      { source: "/api/cart/:path*",       destination: "http://cart-service:3003/api/cart/:path*" },
      // Orders → port 3004
      { source: "/api/orders/:path*",     destination: "http://order-service:3004/api/orders/:path*" },
      // Payments → port 3005
      { source: "/api/payments/:path*",   destination: "http://payment-service:3005/api/payments/:path*" },
    ];
  },
};

export default nextConfig;
