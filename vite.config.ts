import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function devTemplateHtmlPlugin(): Plugin {
  const templatePath = path.resolve(__dirname, 'index.template.html');
  return {
    name: 'dev-template-html',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (url === '/' || url === '/index.html') {
          try {
            const rawHtml = fs.readFileSync(templatePath, 'utf-8');
            const html = await server.transformIndexHtml(req.url || '/', rawHtml);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
            return;
          } catch (err) {
            next(err);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [devTemplateHtmlPlugin(), react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.template.html'),
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((n) => n.endsWith('.css'))) {
            return 'assets/app.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
}));
