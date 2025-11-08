/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable to prevent Leaflet double initialization
  images: {
    domains: ['lh3.googleusercontent.com', 'platform-lookaside.fbsbx.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Configure geo-tz to work properly in Next.js
      config.externals = config.externals || [];
      config.externals.push({
        'geo-tz': 'commonjs geo-tz',
      });
    }
    return config;
  },
}

module.exports = nextConfig
