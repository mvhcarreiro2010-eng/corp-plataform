import type { NextConfig } from 'next'

const securityHeaders = [
  // Block MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking — deny embedding in iframes
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // XSS auditor (legacy browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Control referrer info sent on navigation
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not needed by the app
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // HSTS — force HTTPS for 1 year (enable only after confirming HTTPS is stable)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
