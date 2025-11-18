/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA optimizations
  compress: true,
  poweredByHeader: false,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig

