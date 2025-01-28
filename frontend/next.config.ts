import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Setup proxy using rewrites
  async rewrites() {
    return [
      {
        // Matches any request to "/api/*" from your frontend
        source: '/api/:path*',
        // Proxies the request to your backend server at "localhost:8888"
        destination: 'http://localhost:8888/api/:path*', 
      },
    ];
  },
};

export default nextConfig;
