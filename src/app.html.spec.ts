import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { describe, expect, it } from 'vitest';

const template = () => readFileSync(new URL('./app.html', import.meta.url), 'utf-8');

/** The preconnect hints as declared in the template, before build-time substitution */
function hints(): { href: string; crossorigin: string | null }[] {
    return [...template().matchAll(/<link\s+rel="preconnect"([^>]*)>/g)].map((match) => ({
        href: /href="([^"]*)"/.exec(match[1])?.[1] ?? '',
        crossorigin: /crossorigin(?:="([^"]*)")?/.exec(match[1])?.[1] ?? null,
    }));
}

describe('app.html preconnect hints', () => {
    it('warms every cross-origin host the first screen needs', () => {
        expect(hints().map((hint) => hint.href)).toStrictEqual([
            'https://api.%sveltekit.env.PUBLIC_GALLERY_DOMAIN%',
            'https://auth.%sveltekit.env.PUBLIC_GALLERY_DOMAIN%',
            'https://img.%sveltekit.env.PUBLIC_GALLERY_DOMAIN%',
        ]);
    });

    // Chrome keys socket pools partly on privacy mode. All three of these requests carry cookies --
    // the API and auth through credentials: 'include', the thumbnails as ordinary <img> -- so they
    // want the pool a bare preconnect warms. crossorigin="anonymous" warms the cookie-less pool
    // instead, opening connections nothing draws from, with no error anywhere to show for it.
    it.each(hints())('$href carries no crossorigin, so it warms the cookie-carrying pool', ({ crossorigin }) => {
        expect(crossorigin).toBeNull();
    });

    // Only markup present in the initial response reaches the preload scanner, which is the whole
    // reason the hint exists. Building the same links from script measured as doing nothing at all.
    it('declares the hints as markup rather than building them at runtime', () => {
        expect(template()).not.toMatch(/createElement\(['"]link['"]\)/);
    });

    it('places them ahead of the icon and manifest links, which start requests of their own', () => {
        const html = template();

        expect(html.indexOf('rel="preconnect"')).toBeLessThan(html.indexOf('rel="apple-touch-icon"'));
    });

    // Resolved the way the build resolves it: the same call SvelteKit makes to turn
    // %sveltekit.env.PUBLIC_GALLERY_DOMAIN% into a hostname, against the same .env files.
    describe('the domain each mode resolves to', () => {
        const domainFor = (mode: string): string | undefined =>
            loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), '').PUBLIC_GALLERY_DOMAIN;

        // An unset variable substitutes to an empty string, leaving `https://api.` -- a hint that
        // is silently useless rather than a build failure.
        it.each(['production', 'staging', 'development'])('%s resolves to a host', (mode) => {
            expect(domainFor(mode)).toMatch(/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/);
        });

        // Localhost and the preview server are staging clients, so only the build that deploys to
        // prod warms prod's hosts.
        it('sends prod hints to prod alone', () => {
            expect(domainFor('production')).not.toContain('staging');
            expect(domainFor('staging')).toContain('staging');
            expect(domainFor('development')).toContain('staging');
        });
    });
});
