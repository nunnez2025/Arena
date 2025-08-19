const isGithubPages = process.env.GITHUB_PAGES === 'true'
const repoName = process.env.REPO_NAME || 'Arena'

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
  ...(isGithubPages
    ? {}
    : {
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
      }),
  output: 'export',
}

if (isGithubPages) {
  nextConfig.basePath = `/${repoName}`
  nextConfig.assetPrefix = `/${repoName}`
  nextConfig.trailingSlash = true
}

module.exports = nextConfig