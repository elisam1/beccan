import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const publicHtmlDir = path.join(rootDir, 'public_html');

if (!fs.existsSync(distDir)) {
  console.error('dist/ directory not found. Run "npm run build" first.');
  process.exit(1);
}

const preservedTopLevel = new Set(['api', 'uploads', '.htaccess']);

// Remove previous Vite build artifacts in public_html without touching api/, uploads/, or .htaccess
for (const entry of fs.readdirSync(publicHtmlDir)) {
  if (preservedTopLevel.has(entry)) continue;
  fs.rmSync(path.join(publicHtmlDir, entry), { recursive: true, force: true });
}

// Copy dist/ contents into public_html/
fs.cpSync(distDir, publicHtmlDir, { recursive: true, force: true });

console.log('Prepared public_html/ with latest React production build alongside api/ and uploads/.');
