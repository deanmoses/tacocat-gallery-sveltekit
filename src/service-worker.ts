/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;

// name of the cache of the application's static assets,
// meaning all the bundler-generated files as well as
// everything in the `static` directory
const STATIC_ASSETS_CACHE_NAME = `cache${version}`;

// name of the cache for everything else
// only used when user is offline
const OFFLINE_CACHE_NAME = `offline${version}`;

// `build` is an array of all the files generated by the bundler
// `files` is an array of everything in the `static` directory
const staticAssets = new Set(build.concat(files));

const to_cache = Array.from(staticAssets);

worker.addEventListener('install', (event) => {
    // cache all static assets
    event.waitUntil(
        caches
            .open(STATIC_ASSETS_CACHE_NAME)
            .then((cache) => cache.addAll(to_cache))
            .then(() => {
                worker.skipWaiting();
            }),
    );
});

worker.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(async (keys) => {
            // delete old caches
            // i.e., any cache that's not my new static asset cache
            for (const key of keys) {
                if (key !== STATIC_ASSETS_CACHE_NAME) await caches.delete(key);
            }
            worker.clients.claim();
        }),
    );
});

/**
 * Fetch asset from network and store in cache.
 * Fall back to cache if user is offline.
 */
async function fetchAndCache(request: Request) {
    const cache = await caches.open(OFFLINE_CACHE_NAME);

    try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    } catch (err) {
        const response = await cache.match(request);
        if (response) return response;
        throw err;
    }
}

worker.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || event.request.headers.has('range')) return;

    const url = new URL(event.request.url);

    // don't try to handle non-http URIs such as `data:`
    const isHttp = url.protocol.startsWith('http');
    if (!isHttp) return;

    // don't try to handle requests when in development
    const isDevServerRequest = url.hostname === self.location.hostname && url.port !== self.location.port;
    if (isDevServerRequest) return;

    // is it one of the application's assets?
    const isStaticAsset = url.host === self.location.host && staticAssets.has(url.pathname);

    // is the request asking for it to not be cached?
    const skipBecauseUncached =
        !isStaticAsset && (event.request.cache === 'only-if-cached' || event.request.cache === 'no-store');
    if (skipBecauseUncached) return;

    // is it a request for an image that isn't one of the application's assets?
    const isImageRequest = !isStaticAsset && event.request.destination === 'image';
    if (!isImageRequest) return;

    event.respondWith(
        (async () => {
            // always serve static files and bundler-generated assets from cache.
            // if your application has other URLs with data that will never change,
            // set this variable to true for them and they will only be fetched once.
            const cachedAsset = isStaticAsset && (await caches.match(event.request));

            return cachedAsset || fetchAndCache(event.request);
        })(),
    );
});
