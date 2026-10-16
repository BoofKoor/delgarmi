import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // Only for `next dev` and local runs: on the servers nginx sends /api/ straight to Django.
  async rewrites() {
    const api = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:8000';
    return [{ source: '/api/:path*', destination: `${api}/api/:path*` }];
  },
  async headers() {
    // Fonts and photos change rarely; a month in the browser cache saves the repeat download.
    const month = 'public, max-age=2592000';
    return [
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: month }] },
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: month }] },
    ];
  },
};

export default config;
