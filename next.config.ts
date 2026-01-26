import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Empty turbopack config to silence the warning
  // We use webpack for WASM support required by XMTP
  turbopack: {},

  // Required for XMTP browser SDK WASM support
  webpack: (config, { isServer, webpack }) => {
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

      // Handle optional peer dependencies from @wagmi/connectors
      // The @reown/appkit-adapter-wagmi package uses @wagmi/connectors which has
      // optional peer dependencies for various wallet SDKs. These need to be
      // aliased to false to prevent webpack from trying to resolve them.
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@coinbase/wallet-sdk': false,
          '@gemini-wallet/core': false,
          '@metamask/sdk': false,
          '@safe-global/safe-apps-provider': false,
          '@safe-global/safe-apps-sdk': false,
          'pino-pretty': false,
        },
        fallback: {
          ...config.resolve?.fallback,
          'porto': false,
          'porto/internal': false,
        },
      };

      // Replace the porto module with an empty module to suppress warnings
      config.plugins = [
        ...config.plugins,
        new webpack.NormalModuleReplacementPlugin(
          /^porto(\/.*)?$/,
          require.resolve('path').replace('path', 'next/dist/compiled/path-browserify')
        ),
      ];
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
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
