import { toast } from '@zerodevx/svelte-toast';
import { goto } from '$app/navigation';
import { SvelteSet } from 'svelte/reactivity';

/**
 * State machine for "I'm Feeling Lucky" feature
 */
class FeelingLuckyMachine {
    //
    // STATE
    //

    /**
     * Active "I'm Feeling Lucky" requests
     */
    ongoingRequests = new SvelteSet<number>();

    //
    // STATE TRANSITION METHODS
    // These mutate the machine's state.
    //
    // Characteristics:
    //  - These are the ONLY way to update this store's state.
    //    These should be the only public methods on this store.
    //  - These ONLY update state.
    //    If they have to do any work, like making a server call, they invoke it in an
    //    event-like fire-and-forget fashion, meaning invoke async methods *without* await.
    //  - These are synchronous.
    //    They expectation is that they return near-instantly.
    //  - These return void.
    //    To read this store's state, use one of the public $derived() fields
    //

    /**
     * Trigger fetching and navigating to a random image
     *
     * @returns {number} Unique ID that can be used to get the status of this request
     */
    start(): number {
        const requestId = Math.random();
        this.ongoingRequests.add(requestId);
        this.#fetch(requestId); // fire and forget
        return requestId;
    }

    /**
     * Handle successful fetch and navigate to the image
     *
     * @param requestId Unique ID for this request
     * @param imagePath Path to the lucky image
     */
    #success(requestId: number, imagePath: string): void {
        this.ongoingRequests.delete(requestId);
        goto(imagePath, {
            state: { arrivedViaLucky: true },
        });
    }

    /**
     * Handle fetch error and show user notification
     *
     * @param requestId Unique ID for this request
     * @param errorMessage The error message to display
     */
    #error(requestId: number, errorMessage: string): void {
        this.ongoingRequests.delete(requestId);
        toast.push(`I wasn't so lucky: ${errorMessage}`);
    }

    //
    // SERVICE METHODS
    // These 'do work', like making a server call.
    //

    /**
     * Fetch the path of a random image
     *
     * @param requestId Unique ID for this request
     */
    async #fetch(requestId: number): Promise<void> {
        try {
            // TODO: Replace with real API call
            const imagePath = await this.#mockFetchRandomImagePath();

            // Only update if this is still an active request
            if (this.ongoingRequests.has(requestId)) {
                this.#success(requestId, imagePath);
            }
        } catch (error) {
            // Only update if this is still an active request
            if (this.ongoingRequests.has(requestId)) {
                const msg = error instanceof Error ? error.message : 'Failed to fetch random image';
                this.#error(requestId, msg);
            }
        }
    }

    /**
     * Mock implementation of fetching a random image path
     * TODO: Replace with real API call
     *
     * @returns Promise resolving to a random image path
     */
    async #mockFetchRandomImagePath(): Promise<string> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000)); // 1-2 second delay

        //throw new Error('Mock fetch failed'); // Simulate a failure for testing

        // Image paths
        const mockImages = [
            '/2024/12-17/deck_the_halls3.jpg',
            '/2024/12-07/img_2528.jpg',
            '/2023/12-10/gifformat.gif',
            '/2025/01-11/new_year_michele4.jpg',
            '/2025/01-02/burns_night.jpg',
        ];

        const randomPath = mockImages[Math.floor(Math.random() * mockImages.length)];
        return randomPath;
    }
}

export const feelingLuckyMachine = new FeelingLuckyMachine();
