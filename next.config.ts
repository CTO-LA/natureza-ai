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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
   env: {
    // IMPORTANT: Replace 'YOUR_MAPBOX_ACCESS_TOKEN_HERE' with your actual Mapbox token
    // It's recommended to use environment variables for sensitive keys.
    // For local development, you can create a .env.local file with:
    // NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_actual_token
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },
};

export default nextConfig;
