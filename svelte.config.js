import adapter from '@sveltejs/adapter-static';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // For info on preprocessors, see https://github.com/sveltejs/svelte-preprocess
    preprocess: sveltePreprocess(),

    kit: {
        adapter: adapter({
            fallback: 'index.html',
        }),
    },
};

export default config;
