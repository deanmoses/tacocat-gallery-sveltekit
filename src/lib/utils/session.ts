import { checkAuthenticationUrl } from './config';

/**
 * Response header on which the API's read endpoints report what they made of
 * the auth cookie: `none`, `valid`, or `invalid` for a token that failed
 * verification, usually because it expired.
 */
export const AUTH_STATUS_HEADER = 'X-Auth-Status';

let refreshInFlight: Promise<boolean> | undefined;

/**
 * Ask the auth service to refresh the session cookies. Resolves to whether it
 * could; false means the session has truly expired and the user must log in.
 *
 * Concurrent callers share one request: an album load and the session check
 * both fire on page load, and a refresh token must not be spent twice.
 */
export function refreshSession(): Promise<boolean> {
    if (!refreshInFlight) {
        refreshInFlight = fetch(checkAuthenticationUrl(), { cache: 'no-store', credentials: 'include' })
            .then((response) => response.ok)
            .catch(() => false)
            .finally(() => {
                refreshInFlight = undefined;
            });
    }
    return refreshInFlight;
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
