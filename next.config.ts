import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [new URL("https://fakestoreapi.com/img/**")],
    maximumRedirects: 0,
  },
};

export default config;
