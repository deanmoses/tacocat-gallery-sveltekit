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
        // Type-aware linting. Unlocks rules that need a type checker, and also
        // makes already-enabled rules that degrade gracefully without types
        // (e.g. svelte/require-event-prefix) actually do their job.
        languageOptions: {
            parserOptions: {
                projectService: {
                    // Config files and the service worker sit outside the
                    // SvelteKit tsconfig's `include`, so they need the fallback
                    // project to be parsed at all
                    allowDefaultProject: [
                        'eslint.config.mjs',
                        'svelte.config.js',
                        'playwright.config.ts',
                        'scripts/*.mjs',
                        'src/service-worker.ts',
                    ],
                },
                tsconfigRootDir: import.meta.dirname,
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

            // Bug classes the type checker can't see
            'array-callback-return': 'error',
            'no-constructor-return': 'error',
            'no-self-compare': 'error',
            'no-template-curly-in-string': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unreachable-loop': 'error',
            'require-atomic-updates': 'error',

            // Legacy JS constructs with better modern equivalents
            'logical-assignment-operators': 'error',
            'no-array-constructor': 'error',
            'no-multi-assign': 'error',
            'no-new': 'error',
            'no-object-constructor': 'error',
            'no-sequences': 'error',
            'no-undef-init': 'error',
            'no-useless-concat': 'error',
            'no-useless-rename': 'error',
            'prefer-arrow-callback': 'error',
            'prefer-exponentiation-operator': 'error',
            'prefer-object-spread': 'error',
            'prefer-regex-literals': 'error',
            'prefer-spread': 'error',
            radix: 'error',
            'symbol-description': 'error',
            'default-case-last': 'error',

            // Footguns that should never appear
            'no-caller': 'error',
            'no-extend-native': 'error',
            'no-labels': 'error',
            'no-lone-blocks': 'error',
            'no-new-func': 'error',
            'no-new-wrappers': 'error',
            'no-proto': 'error',
            'no-script-url': 'error',

            // Type-level consistency
            '@typescript-eslint/adjacent-overload-signatures': 'error',
            '@typescript-eslint/ban-tslint-comment': 'error',
            '@typescript-eslint/consistent-generic-constructors': 'error',
            '@typescript-eslint/consistent-indexed-object-style': 'error',
            '@typescript-eslint/default-param-last': 'error',
            '@typescript-eslint/no-confusing-non-null-assertion': 'error',
            '@typescript-eslint/no-dupe-class-members': 'error',
            '@typescript-eslint/no-empty-object-type': 'error',
            '@typescript-eslint/no-extraneous-class': 'error',
            '@typescript-eslint/no-import-type-side-effects': 'error',
            '@typescript-eslint/no-loop-func': 'error',
            '@typescript-eslint/no-require-imports': 'error',
            '@typescript-eslint/no-unnecessary-parameter-property-assignment': 'error',
            '@typescript-eslint/no-unnecessary-type-constraint': 'error',
            '@typescript-eslint/no-unsafe-declaration-merging': 'error',
            '@typescript-eslint/no-useless-constructor': 'error',
            '@typescript-eslint/no-useless-empty-export': 'error',
            '@typescript-eslint/prefer-for-of': 'error',
            '@typescript-eslint/prefer-function-type': 'error',
            '@typescript-eslint/prefer-literal-enum-member': 'error',
        },
    },
    {
        // Type-aware rules. Scoped to files the TS project actually covers;
        // config files and scripts are linted without type information.
        files: ['**/*.ts', '**/*.svelte', '**/*.svelte.ts'],
        rules: {
            // Async correctness: the highest-value reason to run type-aware
            // linting in a codebase built on fire-and-forget service methods
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-unsafe-unary-minus': 'error',
            'prefer-promise-reject-errors': 'off',
            '@typescript-eslint/prefer-promise-reject-errors': 'error',

            // Runtime errors the checker can prove
            '@typescript-eslint/no-array-delete': 'error',
            '@typescript-eslint/no-base-to-string': 'error',
            '@typescript-eslint/no-for-in-array': 'error',
            '@typescript-eslint/no-implied-eval': 'error',
            '@typescript-eslint/no-misused-spread': 'error',
            '@typescript-eslint/no-mixed-enums': 'error',
            '@typescript-eslint/restrict-plus-operands': 'error',
            '@typescript-eslint/unbound-method': 'error',

            // Guardrail against silently inheriting `any` from a dependency
            '@typescript-eslint/no-unsafe-return': 'error',

            // Catches use of APIs deprecated by a dependency bump
            '@typescript-eslint/no-deprecated': 'error',

            // Dead type-level code
            '@typescript-eslint/no-generated-empty-object-type': 'error',
            '@typescript-eslint/no-redundant-type-constituents': 'error',
            '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
            '@typescript-eslint/no-unnecessary-type-arguments': 'error',
            '@typescript-eslint/no-unnecessary-type-conversion': 'error',
            '@typescript-eslint/no-unnecessary-type-parameters': 'error',

            // Modern stdlib usage
            'dot-notation': 'off',
            '@typescript-eslint/dot-notation': 'error',
            '@typescript-eslint/prefer-find': 'error',
            '@typescript-eslint/prefer-includes': 'error',
            '@typescript-eslint/prefer-reduce-type-parameter': 'error',
            '@typescript-eslint/prefer-regexp-exec': 'error',
            '@typescript-eslint/prefer-return-this-type': 'error',
            '@typescript-eslint/prefer-string-starts-ends-with': 'error',
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
            'svelte/no-conflicting-module-names': 'error',
            'svelte/no-nested-style-tag': 'error',
            'svelte/valid-style-parse': 'error',
            'svelte/require-optimized-style-attribute': 'error',
            'svelte/prefer-class-directive': 'error',
            'svelte/prefer-attribute-interpolation': 'error',
            // Legacy-store guardrails: this codebase is all runes, so these
            // exist to keep it that way rather than to fix anything today
            'svelte/derived-has-same-inputs-outputs': 'error',
            'svelte/prefer-destructured-store-props': 'error',
            'svelte/require-store-callbacks-use-set-param': 'error',
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
        // Vitest unit tests only; tests/ holds Playwright e2e specs.
        // The plugin's recommended config is destructured rather than spread as
        // a whole, so a future version of it can't clobber `files` and leak
        // test-only rules into the rest of the repo.
        files: ['src/**/*.spec.ts'],
        plugins: { vitest },
        // Tells the plugin it may consult the type checker, which the
        // type-aware config above already makes available. Four rules change
        // behaviour, all of them for the better: expect-expect and valid-expect
        // stop treating `expectTypeOf`/`assertType` as non-assertions (this
        // config already pushes toward them via prefer-expect-type-of), and
        // valid-title and prefer-describe-function-title start resolving a
        // describe title that is a function reference instead of guessing from
        // the identifier's name.
        settings: { vitest: { typecheck: true } },
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

            // `test` at top level, `it` inside `describe`, which is how this
            // project's test names are phrased. Stated explicitly rather than
            // leaning on the rule's defaults, so a plugin bump can't silently
            // change what the codebase is held to.
            'vitest/consistent-test-it': ['error', { fn: 'test', withinDescribe: 'it' }],
            'vitest/consistent-test-filename': ['error', { pattern: String.raw`.*\.spec\.ts$` }],

            // Ties a describe title to the function under test, so renaming the
            // function renames the suite instead of leaving a stale string
            'vitest/prefer-describe-function-title': 'error',

            // Globals are not enabled in vite.config.ts, so a bare `describe`
            // would be undefined at runtime. This keeps the imports honest, and
            // keeps `vi` and `vitest` from being used interchangeably.
            'vitest/prefer-importing-vitest-globals': 'error',
            'vitest/consistent-vitest-vi': 'error',

            // Test structure: no conditionally-defined tests, no callback-style
            // async, hooks first and in lifecycle order
            'vitest/no-conditional-tests': 'error',
            'vitest/no-done-callback': 'error',
            'vitest/prefer-hooks-on-top': 'error',
            'vitest/prefer-hooks-in-order': 'error',
            'vitest/max-nested-describe': 'error',
            'vitest/prefer-each': 'error',
            'vitest/consistent-each-for': 'error',

            // More mocking correctness
            'vitest/require-mock-type-parameters': 'error',
            'vitest/prefer-import-in-mock': 'error',
            'vitest/prefer-mock-return-shorthand': 'error',
            'vitest/prefer-called-once': 'error',
            'vitest/prefer-expect-resolves': 'error',

            // Snapshot guardrails. This codebase has no snapshots; these exist
            // to keep unreviewable ones from creeping in.
            'vitest/no-large-snapshots': 'error',
            'vitest/prefer-snapshot-hint': 'error',
            'vitest/prefer-todo': 'error',

            // The vitest variant additionally understands `expect(obj.method)`,
            // so it supersedes the core rule inside test files
            '@typescript-eslint/unbound-method': 'off',
            'vitest/unbound-method': 'error',
        },
    },
    {
        ignores: ['build/**', '.svelte-kit/**', 'package/**'],
    },
);
