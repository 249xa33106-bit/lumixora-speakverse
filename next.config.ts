import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'installing-incidence-vpn-similarly.trycloudflare.com',
    '*.trycloudflare.com',
    'lumixora.in',
    '*.lumixora.in',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  // Three.js requires transpilation in some cases
  transpilePackages: ['three'],
  experimental: {
    // Required for R3F with Next.js App Router
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
