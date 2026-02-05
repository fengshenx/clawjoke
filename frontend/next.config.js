/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    unsafeTurbo: {
      resolveAlias: {}
    }
  }
};

export default nextConfig;
