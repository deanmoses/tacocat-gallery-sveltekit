// @ts-check

import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';
import vitest from '@vitest/eslint-plugin';

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs['flat/recommended'],
    ...svelte.configs['flat/prettier'], // must come after recommended: turns off formatting rules
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    {
        files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
        languageOptions: {
            parserOptions: {
                extraFileExtensions: ['.svelte'],
                parser: ts.parser,
                svelteConfig,
            },
        },
    },
    {
        // Stale eslint-disable comments are themselves an error, so suppressions
        // can't outlive the problem they were added for
        linterOptions: {
            reportUnusedDisableDirectives: 'error',
        },
        rules: {
            'no-extra-boolean-cast': 'off',

            // This app has no paths.base, so resolve() adds nothing
            'svelte/no-navigation-without-resolve': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            // no-var is already on for *.ts upstream; this widens it to .svelte and .mjs
            'no-var': 'error',
            'no-unneeded-ternary': 'error',
            '@typescript-eslint/method-signature-style': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/array-type': 'error',
            'no-lonely-if': 'error',
        },
    },
    {
        // Svelte 5 correctness rules that sit outside flat/recommended
        files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
        rules: {
            'svelte/block-lang': ['error', { script: 'ts' }],
            'svelte/no-add-event-listener': 'error',
            'svelte/no-at-const-tags': 'error',
            'svelte/no-bind-value-on-checkable-inputs': 'error',
            'svelte/no-dynamic-slot-name': 'error',
            'svelte/no-extra-reactive-curlies': 'error',
            'svelte/no-ignored-unsubscribe': 'error',
            'svelte/no-target-blank': 'error',
            'svelte/no-top-level-browser-globals': 'error',
            // Rune-aware. Core prefer-const is switched off for .svelte.ts below,
            // so rune files are governed by this rule alone.
            'svelte/prefer-const': 'error',
            'svelte/prefer-derived-over-derived-by': 'error',
            'svelte/require-event-prefix': 'error',
            'svelte/require-stores-init': 'error',
            'svelte/valid-compile': 'error',
        },
    },
    {
        // .svelte.ts files can hold module-level runes, which must stay `let`.
        // Core prefer-const (on for **/*.ts via typescript-eslint) is not
        // rune-aware, so svelte/prefer-const governs these files instead.
        files: ['**/*.svelte.ts'],
        rules: {
            'prefer-const': 'off',
        },
    },
    {
        // Vitest unit tests only; tests/ holds Playwright e2e specs
        files: ['src/**/*.spec.ts'],
        ...vitest.configs.recommended,
        rules: {
            ...vitest.configs.recommended.rules,

            // Weak assertions that pass when they shouldn't
            'vitest/require-to-throw-message': 'error',
            'vitest/prefer-called-with': 'error',
            'vitest/no-test-return-statement': 'error',
            'vitest/no-conditional-in-test': 'error',

            // Vitest 5 runtime errors, caught at lint time instead
            'vitest/hoisted-apis-on-top': 'error',
            'vitest/require-awaited-expect-poll': 'error',

            // Mocking correctness
            'vitest/prefer-spy-on': 'error',
            'vitest/prefer-vi-mocked': 'error',
            'vitest/prefer-mock-promise-shorthand': 'error',
            'vitest/no-duplicate-hooks': 'error',

            // Matchers that produce a useful diff on failure
            'vitest/prefer-equality-matcher': 'error',
            'vitest/prefer-comparison-matcher': 'error',
            'vitest/prefer-to-be': 'error',
            'vitest/prefer-to-contain': 'error',
            'vitest/prefer-to-have-length': 'error',
            'vitest/prefer-strict-boolean-matchers': 'error',
            'vitest/prefer-expect-type-of': 'error',

            // Typos and leftovers
            'vitest/no-alias-methods': 'error',
            'vitest/no-test-prefixes': 'error',

            // Default options: `test` at top level, `it` inside `describe`,
            // which is how this project's test names are phrased
            'vitest/consistent-test-it': 'error',
        },
    },
    {
        ignores: ['build/**', '.svelte-kit/**', 'package/**'],
    },
);
