#!/usr/bin/env node

import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entryPoint = path.join(__dirname, "src", "index.ts");
const outdir = path.join(__dirname, "dist");

// Ensure dist directory exists
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === "production";

console.log(`Building API for ${isProduction ? "production" : "development"}...`);

build({
  entryPoints: [entryPoint],
  outdir,
  bundle: false,
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: !isProduction,
  minify: isProduction,
  external: [
    "express",
    "pino",
    "pino-http",
    "pino-pretty",
    "zod",
    "@superhostos/db",
  ],
  define: {
    "process.env.NODE_ENV": `"${process.env.NODE_ENV || "development"}"`,
  },
})
  .then(() => {
    console.log("✓ API build complete");
    console.log(`Output directory: ${outdir}`);
  })
  .catch((err) => {
    console.error("✗ Build failed:", err);
    process.exit(1);
  });
