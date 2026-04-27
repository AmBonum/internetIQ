#!/usr/bin/env node
// Build-time sitemap generator. Run via `npm run sitemap` (also runs as
// part of `npm run build`). Writes public/sitemap.xml so Vite copies it
// into dist/client/sitemap.xml during the build.
//
// Static routes are hard-coded; course routes are loaded from the
// content registry so adding a new course updates the sitemap
// automatically on the next build.

import { writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ORIGIN = "https://subenai.lvtesting.eu";
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/test", priority: "0.9", changefreq: "monthly" },
  { loc: "/skolenia", priority: "0.9", changefreq: "weekly" },
  { loc: "/cookies", priority: "0.3", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/o-projekte", priority: "0.5", changefreq: "monthly" },
  { loc: "/podpora", priority: "0.6", changefreq: "monthly" },
];

async function loadSlugs(dirRel) {
  // Use a quick TS-aware loader path. We can't import the TS file directly
  // from Node without a transpiler — but we know each module exports a
  // constant with `slug` + `updatedAt`. Grep slugs from file system.
  const { readdir, readFile } = await import("node:fs/promises");
  const dir = resolve(ROOT, dirRel);
  const files = await readdir(dir);
  const items = [];
  for (const file of files) {
    if (!file.endsWith(".ts") || file.startsWith("_") || file === "index.ts") continue;
    const src = await readFile(resolve(dir, file), "utf8");
    const slugMatch = src.match(/slug:\s*['"`]([a-z0-9-]+)['"`]/);
    const updatedMatch = src.match(/updatedAt:\s*['"`](\d{4}-\d{2}-\d{2})/);
    if (slugMatch) {
      items.push({
        slug: slugMatch[1],
        lastmod: updatedMatch ? updatedMatch[1] : TODAY,
      });
    }
  }
  return items;
}

const courses = await loadSlugs("src/content/courses");
const packs = await loadSlugs("src/content/test-packs");

const urls = [
  ...STATIC_ROUTES.map((r) => ({ ...r, lastmod: TODAY })),
  ...courses.map((c) => ({
    loc: `/skolenia/${c.slug}`,
    priority: "0.8",
    changefreq: "monthly",
    lastmod: c.lastmod,
  })),
  ...packs.map((p) => ({
    loc: `/test/firma/${p.slug}`,
    priority: "0.85",
    changefreq: "monthly",
    lastmod: p.lastmod,
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${ORIGIN}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

await writeFile(resolve(ROOT, "public/sitemap.xml"), xml, "utf8");
console.log(
  `Sitemap written: ${urls.length} URLs (${courses.length} courses, ${packs.length} packs)`,
);

// Allow being invoked via `node scripts/generate-sitemap.mjs` directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // already executed top-level
}
