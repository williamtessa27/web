import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,   // écoute 0.0.0.0 et ::1
        port: 3008,
        proxy: {
            '/api': {
                target: 'http://localhost:3006',
                changeOrigin: true,
            },
        },
    },
    preview: {
        port: 3008,
        allowedHosts: ['kimifinance.com', 'www.kimifinance.com']
    },
});
