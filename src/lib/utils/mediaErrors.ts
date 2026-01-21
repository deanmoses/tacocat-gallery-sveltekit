import { mediaErrorsUrl } from './config';

export type MediaErrorsResponse = {
    success: boolean;
    errors?: Record<string, string>;
    error?: string;
};

/**
 * Check the backend for media processing errors.
 * This is called during upload processing to detect if videos or images failed to process.
 *
 * @param paths Array of media paths to check for errors
 * @returns Object with success flag and any errors keyed by path
 */
export async function checkMediaErrors(paths: string[]): Promise<MediaErrorsResponse> {
    if (paths.length === 0) {
        return { success: true };
    }

    try {
        const response = await fetch(mediaErrorsUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ paths }),
        });

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();
        return {
            success: true,
            errors: data.errors,
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}
