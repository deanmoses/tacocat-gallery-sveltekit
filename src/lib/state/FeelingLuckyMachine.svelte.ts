import { toast } from '@zerodevx/svelte-toast';
import { goto } from '$app/navigation';

export const FeelingLuckyStatus = {
    IN_PROGRESS: 'IN_PROGRESS',
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
} as const;

type FeelingLuckyStatus = (typeof FeelingLuckyStatus)[keyof typeof FeelingLuckyStatus];

/**
 * State machine for "I'm Feeling Lucky"
 */
export class FeelingLuckyMachine {
    //
    // STATE MACHINE STATE
    //

    status = $state<FeelingLuckyStatus>();
    errorMessage = $state<string | undefined>();

    constructor() {
        this.status = FeelingLuckyStatus.IN_PROGRESS;
        this.#fetch(); // Kick off asynchronous fetch of a random image
    }

    //
    // STATE TRANSITION METHODS
    // These mutate the store's state.
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
     * A lucky image was successfully fetched
     *
     * @param imagePath Path to the lucky image
     */
    #success(imagePath: string): void {
        this.status = FeelingLuckyStatus.SUCCESS;
        goto(imagePath, {
            state: { arrivedViaLucky: true },
        });
    }

    /**
     * There was an error attempting to fetch a lucky image
     *
     * @param errorMessage The error message to display
     */
    #error(errorMessage: string): void {
        this.status = FeelingLuckyStatus.ERROR;
        this.errorMessage = errorMessage;
        toast.push(`I wasn't so lucky: ${errorMessage}`);
    }

    //
    // SERVICE METHODS
    // These 'do work', like making a server call.
    //
    // Characteristics:
    //  - These are private, meant to only be called by STATE TRANSITION METHODS
    //  - These don't mutate state directly; rather, they call STATE TRANSITION METHODS to do it
    //  - These are generally async
    //  - These don't return values; they return void or Promise<void>
    //

    /**
     * Fetch the path of a random image
     */
    async #fetch(): Promise<void> {
        try {
            // TODO: Replace with real API call
            const imagePath = await this.#mockFetchRandomImagePath();
            this.#success(imagePath);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to fetch random image';
            this.#error(msg);
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
