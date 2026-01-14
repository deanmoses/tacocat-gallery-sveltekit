/**
 * Authenticated API client for admin operations.
 *
 * Provides a simple interface for making authenticated requests to the gallery API.
 * Automatically handles 401 responses by refreshing the auth token and retrying once.
 */

import { checkAuthenticationUrl } from './config';
import { sessionStore } from '$lib/stores/SessionStore.svelte';

/**
 * Low-level fetch wrapper that handles 401 by refreshing the token and retrying once.
 */
async function authFetch(url: string, init: RequestInit): Promise<Response> {
    const response = await fetch(url, { ...init, credentials: 'include' });

    if (response.status !== 401) {
        return response;
    }

    // Try to refresh the token via auth service
    const refreshResponse = await fetch(checkAuthenticationUrl(), {
        cache: 'no-store',
        credentials: 'include',
    });

    if (!refreshResponse.ok) {
        // Refresh failed - user session is truly expired
        sessionStore.fetchUserStatus(); // Updates UI to show logged-out state
        throw new Error('Your session has expired. Please log in again.');
    }

    // Token refreshed - retry the original request
    return fetch(url, { ...init, credentials: 'include' });
}

const JSON_HEADERS = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
};

/**
 * Authenticated API client for admin operations.
 * Includes automatic token refresh on 401, credentials, and JSON headers.
 */
export const adminApi = {
    async get(url: string): Promise<Response> {
        return authFetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: JSON_HEADERS,
        });
    },

    async post(url: string, body: object): Promise<Response> {
        return authFetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: JSON_HEADERS,
            body: JSON.stringify(body),
        });
    },

    async put(url: string, body: object = {}): Promise<Response> {
        return authFetch(url, {
            method: 'PUT',
            credentials: 'include',
            headers: JSON_HEADERS,
            body: JSON.stringify(body),
        });
    },

    async patch(url: string, body: object): Promise<Response> {
        return authFetch(url, {
            method: 'PATCH',
            credentials: 'include',
            headers: JSON_HEADERS,
            body: JSON.stringify(body),
        });
    },

    async delete(url: string): Promise<Response> {
        return authFetch(url, {
            method: 'DELETE',
            credentials: 'include',
            headers: JSON_HEADERS,
        });
    },
};
