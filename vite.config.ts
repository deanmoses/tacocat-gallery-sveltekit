import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const staging = false;

const config: UserConfig = {
    plugins: [sveltekit()],
    server: {
        proxy: {
            '/api': {
                target: staging ? 'https://api.staging-pix.tacocat.com/' : 'https://api.pix.tacocat.com/',
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
};

export default config;
