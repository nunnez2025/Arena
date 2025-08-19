const isGithubPages = process.env.GITHUB_PAGES === 'true'
const repoName = 'Arena'

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
    ...(isGithubPages ? { unoptimized: true } : {}),
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

if (isGithubPages) {
  nextConfig.output = 'export'
  nextConfig.basePath = `/${repoName}`
  nextConfig.assetPrefix = `/${repoName}`
  nextConfig.trailingSlash = true
}

module.exports = nextConfig