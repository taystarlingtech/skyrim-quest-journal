import type { NextConfig } from "next"
import { pagesBasePath } from "./lib/pages-base"

const basePath = pagesBasePath({
  pages: process.env.GITHUB_PAGES,
  repository: process.env.GITHUB_REPOSITORY,
})

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
