// Usage: node scripts/extract-design.mjs <dist-dir>
// Reads Claude Design *.dc.html bundles, writes images to public/images,
// and cleaned per-page HTML fragments to design-extracted/.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const distDir = process.argv[2];
if (!distDir) {
  console.error("Usage: node scripts/extract-design.mjs <dist-dir>");
  process.exit(1);
}

const IMG_DIR = "public/images";
const OUT_DIR = "design-extracted";
mkdirSync(IMG_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "image/gif": "gif" };

// Map the design's cross-page links to Next routes.
const ROUTES = {
  "JETAASE Home.dc.html": "/",
  "JETAASE Who We Are.dc.html": "/who-we-are",
  "JETAASE Events.dc.html": "/events",
  "JETAASE Join.dc.html": "/join",
  "JETAASE Subchapters.dc.html": "/subchapters",
  "JETAASE Resources.dc.html": "/resources",
};

function scriptJson(html, type) {
  const re = new RegExp(`<script type="${type}">([\\s\\S]*?)</script>`);
  const m = html.match(re);
  return m ? JSON.parse(m[1]) : null;
}

for (const file of readdirSync(distDir).filter((f) => f.endsWith(".dc.html"))) {
  const html = readFileSync(join(distDir, file), "utf8");
  const manifest = scriptJson(html, "__bundler/manifest") || {};
  let tpl = scriptJson(html, "__bundler/template");
  if (typeof tpl !== "string") { console.warn("skip (no template):", file); continue; }

  // Write image assets; build uuid -> public path map. Drop js/font assets.
  const assetPath = {};
  for (const [uuid, a] of Object.entries(manifest)) {
    const ext = EXT[a.mime];
    if (!ext || a.compressed) continue; // images are uncompressed; skip js/fonts
    const outName = `${uuid}.${ext}`;
    writeFileSync(join(IMG_DIR, outName), Buffer.from(a.data, "base64"));
    assetPath[uuid] = `/images/${outName}`;
  }

  // Extract <body> inner HTML.
  const bodyMatch = tpl.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : tpl;

  // Strip Claude Design wrappers and the <helmet> head block (fonts come from next/font).
  body = body.replace(/<\/?x-dc[^>]*>/gi, "");
  body = body.replace(/<helmet>[\s\S]*?<\/helmet>/gi, "");
  // Drop bundler runtime script tags referencing asset uuids.
  body = body.replace(/<script[^>]*src="[0-9a-f-]{36}"[^>]*>\s*<\/script>/gi, "");

  // Rewrite asset uuids (in src="..." and url(...)) to public paths.
  for (const [uuid, path] of Object.entries(assetPath)) {
    body = body.split(uuid).join(path);
  }
  // Rewrite cross-page links to Next routes.
  for (const [dc, route] of Object.entries(ROUTES)) {
    body = body.split(`"${dc}"`).join(`"${route}"`);
  }

  const outName = (ROUTES[file] || "/" + basename(file)).replace(/^\//, "") || "home";
  const safe = outName === "" ? "home" : outName.replace(/\//g, "_");
  writeFileSync(join(OUT_DIR, `${safe || "home"}.html`), body.trim());
  console.log("extracted", file, "->", `${OUT_DIR}/${safe || "home"}.html`,
    `(${Object.keys(assetPath).length} images)`);
}
