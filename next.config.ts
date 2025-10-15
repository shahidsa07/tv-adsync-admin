
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // In production, the WebSocket server is on the same host.
    // In development, it's on localhost:9002.
    const websocketDestination =
      process.env.NODE_ENV === 'production'
        ? '/ws'
        : 'http://localhost:9002/ws';

    return [
      {
        source: '/ws',
        destination: websocketDestination,
      },
    ];
  },
};

export default nextConfig;
