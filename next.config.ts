import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  reactStrictMode: true,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://future-os.vercel.app',
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
