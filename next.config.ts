
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
        protocol: 'https'
        ,
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
   // This is to proxy WebSocket connections from the Next.js dev server to our custom WebSocket server.
   // It's only for development and has no effect on the production build.
  async rewrites() {
    return [
      {
        source: '/socket.io',
        destination: 'http://localhost:8081/socket.io',
      },
    ]
  },
};

export default nextConfig;
