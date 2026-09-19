import { checkAuthenticationUrl } from './config';

/**
 * Response header on which the API's read endpoints report what they made of
 * the auth cookie: `none`, `valid`, or `invalid` for a token that failed
 * verification, usually because it expired.
 */
export const AUTH_STATUS_HEADER = 'X-Auth-Status';

let sessionCheck: Promise<Response> | undefined;

/**
 * Ask the auth service whether the session is live, which also refreshes its
 * cookies. Rejects when the service cannot be reached.
 *
 * Concurrent callers share one request and each get their own copy of the
 * response: the session check on page load and an album's retry can coincide,
 * and a refresh token must not be spent twice.
 */
export function checkSession(): Promise<Response> {
    if (!sessionCheck) {
        sessionCheck = fetch(checkAuthenticationUrl(), { cache: 'no-store', credentials: 'include' }).finally(() => {
            sessionCheck = undefined;
        });
    }
    return sessionCheck.then((response) => response.clone());
}

/**
 * Refresh the session cookies. Resolves to whether it could; false means the
 * session has truly expired and the user must log in.
 */
export async function refreshSession(): Promise<boolean> {
    try {
        return (await checkSession()).ok;
    } catch {
        return false;
    }
}

/**
 * Fetch a read endpoint, and if the server could not verify the auth cookie,
 * refresh the session and ask once more. Reads never fail on a bad token, they
 * answer with the public view, so without this an admin whose token had
 * expired would silently see the guest version of an album.
 */
export async function fetchRefreshingSession(url: string, init: RequestInit): Promise<Response> {
    const response = await fetch(url, init);
    if (response.headers.get(AUTH_STATUS_HEADER) !== 'invalid') return response;
    if (!(await refreshSession())) return response;
    return fetch(url, init);
}
