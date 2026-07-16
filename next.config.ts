import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Acknowledge the webpack config added by next-pwa so Turbopack dev mode
  // doesn't throw an error. The actual build still uses --webpack.
  turbopack: {},
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
  },
})(nextConfig);
