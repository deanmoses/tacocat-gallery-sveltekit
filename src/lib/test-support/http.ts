import { vi } from 'vitest';

/**
 * A JSON body carrying the content-type header. Spelling out `new Response()`
 * in a spec gets `text/plain`, which SessionStore rejects outright.
 */
export function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export function notFound(): Response {
    return new Response(null, { status: 404, statusText: 'Not Found' });
}

export function serverError(statusText = 'Internal Server Error'): Response {
    return new Response(null, { status: 500, statusText });
}

/** A reply, or a function that produces one -- a thrown error stands for the network being down */
export type Reply = Response | (() => Response);

export type Call = { method: string; pathname: string; body: unknown };

type Routes = {
    get: (pathname: string, ...replies: Reply[]) => void;
    head: (pathname: string, ...replies: Reply[]) => void;
    post: (pathname: string, ...replies: Reply[]) => void;
    put: (pathname: string, ...replies: Reply[]) => void;
    patch: (pathname: string, ...replies: Reply[]) => void;
    delete: (pathname: string, ...replies: Reply[]) => void;
    /** Every call the code made, in order */
    calls: Call[];
};

/**
 * Stands in for the gallery API.
 *
 * Replies are keyed by method and pathname, so what the code gets back is
 * decided by the URL it asked for rather than by the order the spec happens to
 * run in. Give a route several replies to answer a sequence of calls: the last
 * one stands for every call after it, so a route registered once answers a
 * retry without the spec having to say so twice.
 *
 * A route the spec never registered throws, naming the URL. That is deliberate:
 * a spec that forgets to stub something fails loudly rather than reaching the
 * live API, which under node resolves to production rather than staging.
 */
export function fakeServer(): Routes {
    const routes = new Map<string, Reply[]>();
    const calls: Call[] = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        const method = init?.method ?? 'GET';
        const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
        calls.push({ method, pathname: url.pathname, body });

        const replies = routes.get(`${method} ${url.pathname}`);
        const reply = replies?.length && replies.length > 1 ? replies.shift() : replies?.[0];
        if (!reply) throw new Error(`No route registered for ${method} ${url.href}`);
        // Cloned so a reply registered once can be read by more than one call
        return typeof reply === 'function' ? reply() : reply.clone();
    });

    const route =
        (method: string) =>
        (pathname: string, ...replies: Reply[]): void => {
            routes.set(`${method} ${pathname}`, replies);
        };

    return {
        get: route('GET'),
        head: route('HEAD'),
        post: route('POST'),
        put: route('PUT'),
        patch: route('PATCH'),
        delete: route('DELETE'),
        calls,
    };
}
