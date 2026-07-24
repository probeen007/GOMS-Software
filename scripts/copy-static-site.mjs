// Copies auto/static (the plain HTML/CSS/JS public marketing site) into
// dist/site as part of `npm run build`, for Vercel deployment.
//
// Why a separate "site" namespace instead of dist root: Vercel rewrites are
// pattern-based with no fallback chaining (unlike Express's static
// middleware), so a wildcard rewrite for e.g. "/assets/*" would also hijack
// the React SPA's own hashed JS/CSS chunks, which Vite also outputs under
// dist/assets. Namespacing under /site/ avoids that collision entirely —
// vercel.json only needs exact-path rewrites for the site's known pages,
// and its own asset references (rewritten below to start with /site/) are
// then just plain files Vercel serves directly, no rewrite needed.
//
// The traditional Express server (server.js) does NOT use this output — it
// serves auto/static directly from the source tree, live, in both dev and
// production. This script exists only for the Vercel deployment path.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'auto/static');
const destDir = path.join(root, 'dist/site');

if (!fs.existsSync(srcDir)) {
  console.warn('[copy-static-site] auto/static not found, skipping.');
  process.exit(0);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.cpSync(srcDir, destDir, { recursive: true });

// Local page/asset references to prefix with /site/ so they resolve
// correctly once served from the /site/ namespace on Vercel. Order matters:
// longer/more-specific patterns first so a page name doesn't accidentally
// get double-prefixed via a broader match.
const REWRITES = [
  [/(href|src)="css\//g, '$1="/site/css/'],
  [/(href|src)="js\//g, '$1="/site/js/'],
  [/(href|src)="assets\//g, '$1="/site/assets/'],
  [/(href|src)="logo\.png"/g, '$1="/site/logo.png"'],
  [/href="index\.html"/g, 'href="/site/index.html"'],
  [/href="about\.html"/g, 'href="/site/about.html"'],
  [/href="services\.html"/g, 'href="/site/services.html"'],
  [/href="gallery\.html"/g, 'href="/site/gallery.html"'],
  [/href="contact\.html"/g, 'href="/site/contact.html"'],
  [/href="book\.html"/g, 'href="/site/book.html"'],
];

const htmlFiles = fs.readdirSync(destDir).filter((f) => f.endsWith('.html'));
for (const file of htmlFiles) {
  const filePath = path.join(destDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [pattern, replacement] of REWRITES) {
    content = content.replace(pattern, replacement);
  }
  fs.writeFileSync(filePath, content);
}

console.log(`[copy-static-site] Copied auto/static -> dist/site (${htmlFiles.length} pages rewritten).`);
