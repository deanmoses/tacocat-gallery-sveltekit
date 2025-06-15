// @ts-check

import eslint from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default typescriptEslint.config(
    eslint.configs.recommended,
    typescriptEslint.configs.recommended,
    // @ts-expect-error - Type mismatch between ESLint and TypeScript ESLint configs
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
            '**/*.d.ts',
            '**/.svelte-kit/**',
            '**/build/**',
            '**/dist/**',
        ],
    },
);
