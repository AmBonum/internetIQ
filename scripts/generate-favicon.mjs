#!/usr/bin/env node
// Converts public/favicon.svg → optimised PNG favicons:
//   public/favicon.png       192×192  (Google SERP krúžok, apple-touch-icon)
//   public/favicon-32.png     32×32   (browser tab, fallback)
// Run once after changing favicon.svg, commit both results.
// Requires: sharp (devDependency)

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(resolve(__dirname, "../public/favicon.svg"));

await sharp(svg)
  .resize(192, 192)
  .png({ compressionLevel: 9, palette: false })
  .toFile(resolve(__dirname, "../public/favicon.png"));

await sharp(svg)
  .resize(32, 32)
  .png({ compressionLevel: 9, palette: false })
  .toFile(resolve(__dirname, "../public/favicon-32.png"));

console.log("favicon.png (192×192) + favicon-32.png (32×32) written");
