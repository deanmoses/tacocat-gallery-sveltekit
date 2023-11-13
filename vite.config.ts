import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
    plugins: [sveltekit()],
    server: {
        proxy: {
            '/api': {
                target: 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/',
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
