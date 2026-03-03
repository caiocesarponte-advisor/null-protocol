/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@null-protocol/engine", "@null-protocol/scenario-kit"]
};

export default nextConfig;
