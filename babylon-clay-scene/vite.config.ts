import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/PersonalScene/' : '/',
  plugins: [
    tailwindcss(),
    {
      name: 'serve-model-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/models/') || req.url?.startsWith('/vrma/')) {
            const filePath = path.resolve(__dirname, req.url.slice(1));
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/octet-stream');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      },
    },
    {
      name: 'copy-runtime-assets',
      apply: 'build',
      closeBundle() {
        const outputDir = path.resolve(__dirname, 'dist');
        for (const fileName of ['scene.json', 'scene2.json']) {
          fs.copyFileSync(path.resolve(__dirname, fileName), path.join(outputDir, fileName));
        }

        for (const [directory, extension] of [['animations', '.json'], ['audio', '.wav']]) {
          const sourceDir = path.resolve(__dirname, directory);
          if (!fs.existsSync(sourceDir)) continue;

          const targetDir = path.join(outputDir, directory);
          fs.mkdirSync(targetDir, { recursive: true });
          for (const fileName of fs.readdirSync(sourceDir)) {
            if (path.extname(fileName) === extension) {
              fs.copyFileSync(path.join(sourceDir, fileName), path.join(targetDir, fileName));
            }
          }
        }

        const modelsDir = path.resolve(__dirname, 'models');
        if (fs.existsSync(modelsDir)) {
          fs.cpSync(modelsDir, path.join(outputDir, 'models'), { recursive: true });
        }
      },
    },
  ],
  server: {
    port: 3000,
  },
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
  },
  build: {
    target: 'esnext',
  },
}); 
