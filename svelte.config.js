import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),

    compilerOptions: {
        // A component that uses no runes at all -- most of the icons, several
        // layouts -- is otherwise compiled in the mode-ambiguous default, where
        // `export let` and `$:` still work. Forcing runes mode makes legacy
        // syntax a compile error instead of a silent per-component mode switch.
        //
        // Dependencies keep the default, because @zerodevx/svelte-toast and
        // svelte-easy-crop ship uncompiled Svelte 4 source. Removable in Svelte 6,
        // once runes mode is the only mode.
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
    },

    kit: {
        adapter: adapter({
            fallback: 'index.html',
        }),
    },
};

export default config;
