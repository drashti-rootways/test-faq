import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { vercelPreset } from '@vercel/remix/vite';

import tsconfigPaths from "vite-tsconfig-paths";
import { installGlobals } from "@remix-run/node";

// // Load `vercelPreset` from CommonJS via dynamic import
// import vercelCJS from "@vercel/remix";
// const vercelPreset = vercelCJS?.vercelPreset ?? (() => ({})); // fallback to empty config if missing

installGlobals({ nativeFetch: true });

function ensureValidUrl(input) {
  if (!input) return "http://localhost";
  if (!input.startsWith("http://") && !input.startsWith("https://")) {
    return "https://" + input;
  }
  return input;
}

const rawUrl = process.env.SHOPIFY_APP_URL;
const fullUrl = ensureValidUrl(rawUrl);
const host = new URL(fullUrl).hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  // ...vercelPreset(), // ✅ Important for SSR on Vercel
  server: {
    allowedHosts: [host],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      presets: [vercelPreset()],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: false,
        v3_routeConfig: true,
      },
    }),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: ["@shopify/app-bridge-react", "@shopify/polaris"],
  },
  build: {
    assetsInlineLimit: 0,
  },
});
