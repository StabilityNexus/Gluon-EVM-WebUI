/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // The custom domain serves this export at its root, without the repository path.
  basePath: "",
  assetPrefix: "",
  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,

      // Optional dependencies used only by environments outside this browser WebUI.
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
    }

    return config
  },
}

export default nextConfig
