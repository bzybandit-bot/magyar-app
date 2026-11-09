import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/magyar-app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Magyar",
        short_name: "Magyar",
        description: "Hungarian immersion. Menus in English. Words, sentences, and conversation stay Hungarian.",
        lang: "en",
        dir: "ltr",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#f3eee4",
        theme_color: "#0e6b52",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest,woff2}"],
        navigateFallback: "index.html",
      },
    }),
    {
      name: "github-pages-404",
      apply: "build",
      writeBundle() {
        const from = resolve("dist/index.html");
        const to = resolve("dist/404.html");
        if (existsSync(from)) copyFileSync(from, to);
      },
    },
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
