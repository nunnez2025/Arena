/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/batalha',
        destination: '/batalha/',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/batalha/',
        destination: '/batalha/index.html',
      },
    ]
  },
}

module.exports = nextConfig