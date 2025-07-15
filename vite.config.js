// import { vitePlugin as remix } from "@remix-run/dev";
// import { installGlobals } from "@remix-run/node";
// import { defineConfig } from "vite";
// import tsconfigPaths from "vite-tsconfig-paths";
// import { vercelPreset } from "@vercel/remix/vite";

// installGlobals({ nativeFetch: true });

// // Workaround for Remix CLI env var collision
// if (
//   process.env.HOST &&
//   (!process.env.SHOPIFY_APP_URL || process.env.SHOPIFY_APP_URL === process.env.HOST)
// ) {
//   process.env.SHOPIFY_APP_URL = process.env.HOST;
//   delete process.env.HOST;
// }

// // Ensure the app URL is valid and extract hostname
// const appUrl = process.env.SHOPIFY_APP_URL || "http://localhost";
// const host = new URL(appUrl).hostname;

// // Detect dev mode
// const isDev = process.env.NODE_ENV !== "production";

// // HMR config depending on environment
// const hmrConfig = host === "localhost"
//   ? {
//       protocol: "ws",
//       host: "localhost",
//       port: 64999,
//       clientPort: 64999,
//     }
//   : {
//       protocol: "wss",
//       host,
//       port: parseInt(process.env.FRONTEND_PORT) || 8002,
//       clientPort: 443,
//     };

// export default defineConfig({
//   server: {
//     port: Number(process.env.PORT || 3000),
//     hmr: hmrConfig,
//     fs: {
//       allow: ["app", "node_modules"],
//     },
//     // ✅ Don't define allowedHosts in dev to support tunnels (e.g. trycloudflare)
//     ...(isDev ? {} : { allowedHosts: [host] }),
//   },
//   plugins: [
//     remix({
//       ignoredRouteFiles: ["**/.*"],
//       presets: [vercelPreset()],
//       future: {
//         v3_fetcherPersist: true,
//         v3_relativeSplatPath: true,
//         v3_throwAbortReason: true,
//         v3_lazyRouteDiscovery: true,
//         v3_singleFetch: false,
//         v3_routeConfig: true,
//       },
//     }),
//     tsconfigPaths(),
//   ],
//   build: {
//     assetsInlineLimit: 0,
//   },
// });
import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { vercelPreset } from "@vercel/remix/vite";

installGlobals({ nativeFetch: true });

// Fix for Remix CLI HOST override
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL || process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

// ✅ Ensure SHOPIFY_APP_URL is valid before parsing it as a URL
function ensureValidUrl(input) {
  if (!input) return "http://localhost";
  if (!input.startsWith("http://") && !input.startsWith("https://")) {
    return "https://" + input;
  }
  return input;
}

const rawUrl = process.env.SHOPIFY_APP_URL;
const fullUrl = ensureValidUrl(rawUrl); // ✅ key fix
const host = new URL(fullUrl).hostname;

const isDev = process.env.NODE_ENV !== "production";

const hmrConfig = host === "localhost"
  ? {
      protocol: "ws",
      host: "localhost",
      port: 64999,
      clientPort: 64999,
    }
  : {
      protocol: "wss",
      host,
      port: parseInt(process.env.FRONTEND_PORT) || 8002,
      clientPort: 443,
    };

export default defineConfig({
  server: {
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      allow: ["app", "node_modules"],
    },
    ...(isDev ? {} : { allowedHosts: [host] }),
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
  build: {
    assetsInlineLimit: 0,
  },
});
