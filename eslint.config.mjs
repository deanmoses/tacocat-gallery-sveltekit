// @ts-check

import eslint from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginSvelte from 'eslint-plugin-svelte';

export default typescriptEslint.config(
    eslint.configs.recommended,
    typescriptEslint.configs.recommended,
    eslintPluginSvelte.configs['flat/prettier'],
    eslintPluginPrettierRecommended,
    {
        ignores: [
            '.DS_Store',
            'node_modules',
            '/build',
            '/.svelte-kit',
            '/package',
            '.env',
            '.env.*',
            '!.env.example',
            'pnpm-lock.yaml',
            'package-lock.json',
            'yarn.lock',
        ],
    },
);
