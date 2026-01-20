import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Empty turbopack config to silence the warning
  // We use webpack for WASM support required by XMTP
  turbopack: {},

  // Required for XMTP browser SDK WASM support
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle WASM files
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };

      // Fix for WASM loading in web workers
      config.output = {
        ...config.output,
        webassemblyModuleFilename: 'static/wasm/[modulehash].wasm',
      };

      // Mock optional wallet connectors and dependencies that aren't installed
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@gemini-wallet/core': false,
          'porto/internal': false,
          'pino-pretty': false,
        },
      };
    }

    return config;
  },

  // Ensure WASM files are served with correct headers
  async headers() {
    return [
      {
        source: '/:path*.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
