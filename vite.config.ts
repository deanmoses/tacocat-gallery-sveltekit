/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ProxyOptions } from 'vite';
import { emulateProdOnLocalhost } from './src/lib/utils/settings';

// Shared proxy config for both dev server and preview server
const apiProxy: Record<string, ProxyOptions> = {
    '/api': {
        target: emulateProdOnLocalhost ? 'https://api.pix.tacocat.com/' : 'https://api.staging-pix.tacocat.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
                if (200 !== proxyRes.statusCode) {
                    console.log(
                        'Response from AWS:',
                        proxyRes.statusCode,
                        req.url,
                        JSON.stringify(proxyRes.headers, null, 2),
                    );
                }
            });
        },
    },
};

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        include: ['src/**/*.spec.ts'],
    },
    server: {
        proxy: apiProxy,
    },
    preview: {
        proxy: apiProxy,
    },
});
