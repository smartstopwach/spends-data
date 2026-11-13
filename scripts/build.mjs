import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const distTemplateHtml = path.join(distDir, 'index.template.html');
const distIndexHtml = path.join(distDir, 'index.html');
const rootIndexHtml = path.join(root, 'index.html');
const distAssets = path.join(distDir, 'assets');
const rootAssets = path.join(root, 'assets');

// Clean previous root assets BEFORE build so Tailwind v4 never scans minified JS bundles
fs.rmSync(rootAssets, { recursive: true, force: true });
fs.rmSync(distDir, { recursive: true, force: true });

execSync('npx tsc -b && npx vite build', { stdio: 'inherit' });

if (fs.existsSync(distTemplateHtml)) {
  fs.renameSync(distTemplateHtml, distIndexHtml);
}

// Sync hashed static build to repo root so GitHub Pages ("/") serves fresh assets without cache issues
fs.copyFileSync(distIndexHtml, rootIndexHtml);
fs.cpSync(distAssets, rootAssets, { recursive: true });

console.log('✓ Optimized build complete: synced hashed index.html + assets/ to root and dist/.');
