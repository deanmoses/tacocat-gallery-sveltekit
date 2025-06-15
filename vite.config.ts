import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { emulateProdOnLocalhost } from './src/lib/utils/settings';
import devtoolsJson from 'vite-plugin-devtools-json';

const config = defineConfig({
    plugins: [sveltekit(), devtoolsJson()],
    server: {
        proxy: {
            '/api': {
                target: emulateProdOnLocalhost
                    ? 'https://api.pix.tacocat.com/'
                    : 'https://api.staging-pix.tacocat.com/',
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
        },
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.{test,spec}.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/playwright.config.ts', '**/*.playwright.spec.ts'],
        globals: true
    }
});

export default config;
