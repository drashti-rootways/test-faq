import { defineConfig } from "vite";
import vercel from "@vercel/remix"; // ✅ Only use the default export
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import { installGlobals } from "@remix-run/node";

installGlobals({ nativeFetch: true });

// Handle Shopify app URL logic
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
    remix(),      // ✅ REQUIRED: Remix vite plugin
    vercel,          // ✅ This is all you need from @vercel/remix
    tsconfigPaths(),   // Optional: resolves `tsconfig.json` paths
  ],
  optimizeDeps: {
    include: ["@shopify/app-bridge-react", "@shopify/polaris"],
  },
  build: {
    assetsInlineLimit: 0,
  },
});
