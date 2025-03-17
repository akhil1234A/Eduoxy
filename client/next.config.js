/** @type {import('next').NextConfig}  */

const nextConfig = {
  swcMinify: true,
  experimental: {
    turbotrace: {
      logLevel: 'error'
    }
  },
 
  webpack: (config, { dev }) => {
   
    if (dev) {
      config.cache = true;
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

module.exports = nextConfig;
