import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
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
