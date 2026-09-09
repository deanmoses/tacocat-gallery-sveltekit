import type { Config } from 'prettier';

const config: Config = {
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 120,
    proseWrap: 'preserve',
    tabWidth: 4,
    plugins: ['prettier-plugin-svelte'],
    overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
};

export default config;
