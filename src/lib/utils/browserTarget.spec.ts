import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, resolveConfig } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BROWSER_TARGET } from './browserTarget';

type LoweringCase = {
    feature: string;
    /** The form Safari 15.6 cannot parse, as it appears in a build that keeps it */
    unlowered: RegExp;
    /** What the pinned build emits in its place */
    lowered: RegExp;
};

// Every row is something Vite's default target leaves as written, so the second
// table is the proof that the pin changes the output rather than restating the
// default. A lookbehind has no older spelling; the RegExp() call is what Vite
// emits in its place, and it throws wherever it runs.
const CASES: LoweringCase[] = [
    { feature: 'class static block', unlowered: /static\s*\{/, lowered: /static-block-ran/ },
    { feature: 'regex lookbehind', unlowered: /\/\(\?<=a\)b\//, lowered: /RegExp\(/ },
    { feature: 'range media query', unlowered: />=\s*600px/, lowered: /min-width:\s*600px/ },
];

const FIXTURE = {
    'index.html':
        '<!doctype html><html><head><link rel="stylesheet" href="./style.css"></head>' +
        '<body><script type="module" src="./main.js"></script></body></html>',
    'main.js':
        'export class Config { static { globalThis.marker = "static-block-ran"; } }\n' +
        'globalThis.lookbehind = /(?<=a)b/.test("ab");\n',
    'style.css': '@media (width >= 600px) { body { color: green; } }\n',
};

/** Builds the fixture with only the given target, and returns every emitted file as text */
async function buildFixture(root: string, target: string[] | undefined): Promise<string> {
    // configFile: false keeps the project's own config, SvelteKit plugin and all, out of it
    const result = await build({ configFile: false, root, logLevel: 'silent', build: { write: false, target } });
    if (Array.isArray(result) || !('output' in result)) throw new Error('expected a single build output');
    return result.output
        .map((file) =>
            file.type === 'chunk'
                ? file.code
                : typeof file.source === 'string'
                  ? file.source
                  : new TextDecoder().decode(file.source),
        )
        .join('\n');
}

const PROJECT_CONFIG = fileURLToPath(new URL('../../../vite.config.ts', import.meta.url));

describe('BROWSER_TARGET', () => {
    let root: string;
    let pinned: string;
    let viteDefault: string;

    beforeAll(async () => {
        root = await mkdtemp(join(tmpdir(), 'browser-target-'));
        await Promise.all(Object.entries(FIXTURE).map(([name, text]) => writeFile(join(root, name), text)));
        [pinned, viteDefault] = await Promise.all([buildFixture(root, BROWSER_TARGET), buildFixture(root, undefined)]);
    });

    afterAll(async () => {
        await rm(root, { recursive: true, force: true });
    });

    it.each(CASES)('lowers a $feature to what Safari 15.6 parses', ({ unlowered, lowered }) => {
        expect(pinned).not.toMatch(unlowered);
        expect(pinned).toMatch(lowered);
    });

    it.each(CASES)("keeps a $feature as written under Vite's default target", ({ unlowered }) => {
        expect(viteDefault).toMatch(unlowered);
    });

    // SvelteKit's plugin adds a target of its own for its server build and Vite
    // merges the two into one list, so the check is containment rather than
    // equality. An extra entry can only lower more, never less.
    it('is what the project config builds the client and its CSS with', async () => {
        const { environments } = await resolveConfig({ configFile: PROJECT_CONFIG, logLevel: 'silent' }, 'build');

        expect(environments.client.build.target).toStrictEqual(expect.arrayContaining(BROWSER_TARGET));
        expect(environments.client.build.cssTarget).toStrictEqual(expect.arrayContaining(BROWSER_TARGET));
    });
});
