import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {

	// For info on preprocessors, see https://github.com/sveltejs/svelte-preprocess 
	preprocess: preprocess(),

	kit: {
		adapter: adapter({
			fallback: 'index.html'
		})
	}
};

export default config;
