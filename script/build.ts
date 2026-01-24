import { build as esbuild, Plugin } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import path from "path";

// Plugin to replace vite.config import with a stub in production
const viteConfigStubPlugin: Plugin = {
  name: "vite-config-stub",
  setup(build) {
    // Intercept imports to vite.config
    build.onResolve({ filter: /vite\.config/ }, (args) => {
      return {
        path: path.resolve("script/vite-config-stub.ts"),
        namespace: "vite-config-stub",
      };
    });

    build.onLoad({ filter: /.*/, namespace: "vite-config-stub" }, () => {
      return {
        contents: `export default { plugins: [], resolve: { alias: {} } };`,
        loader: "ts",
      };
    });
  },
};

// Plugin to fix import.meta.dirname for CJS format
const fixImportMetaPlugin: Plugin = {
  name: "fix-import-meta",
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, async (args) => {
      const fs = await import("fs/promises");
      let contents = await fs.readFile(args.path, "utf8");
      
      // Replace import.meta.dirname with __dirname equivalent for CJS
      if (contents.includes("import.meta.dirname")) {
        contents = contents.replace(
          /import\.meta\.dirname/g,
          "__dirname"
        );
        return { contents, loader: "ts" };
      }
      return null; // Let esbuild handle normally
    });
  },
};

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Dev-only packages that should always be external in production
const devOnlyPackages = [
  "@replit/vite-plugin-runtime-error-modal",
  "@replit/vite-plugin-cartographer",
  "@replit/vite-plugin-dev-banner",
  "vite",
  "@vitejs/plugin-react",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  // Filter out allowlisted packages and add dev-only packages to externals
  const externals = [
    ...allDeps.filter((dep) => !allowlist.includes(dep)),
    ...devOnlyPackages,
  ];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
    plugins: [fixImportMetaPlugin, viteConfigStubPlugin],
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
