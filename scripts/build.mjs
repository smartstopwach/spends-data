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

execSync('npx tsc -b && npx vite build', { stdio: 'inherit' });

if (fs.existsSync(distTemplateHtml)) {
  fs.renameSync(distTemplateHtml, distIndexHtml);
}

// Also sync built static files to repo root so GitHub Pages (branch root "/") works directly
fs.copyFileSync(distIndexHtml, rootIndexHtml);
fs.rmSync(rootAssets, { recursive: true, force: true });
fs.cpSync(distAssets, rootAssets, { recursive: true });

console.log('✓ Built dist/ AND synced static bundle (index.html + assets/) to repository root for GitHub Pages.');
