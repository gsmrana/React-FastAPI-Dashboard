import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backendTarget = env.VITE_BACKEND_PROXY || 'http://localhost:8000';
    
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        server: {
            port: 5173,
            proxy: {
                '/api': { target: backendTarget, changeOrigin: true, secure: false },
                '/health': { target: backendTarget, changeOrigin: true, secure: false },
            },
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
        },
    };
});
