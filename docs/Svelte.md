# Svelte 5 & TypeScript Patterns

This document defines the patterns and conventions used in this SvelteKit photo gallery application. These patterns should be enforced in code reviews.

## Store Architecture

### State Transition vs Service Methods

All store classes (`.svelte.ts` files) strictly separate two types of methods:

**State Transition Methods (public):**

- Synchronous, return `void`
- Only way to update state
- May fire-and-forget async work (call private method without await)
- Use `$state` and `$derived`

**Service Methods (private, `#` prefix):**

- Async, return `Promise<void>` or `Promise<T>`
- Do actual work (fetch, save)
- Call state transition methods when complete
- Never mutate state directly

```typescript
class AlbumStore {
    #loading = $state(false);
    loading = $derived(this.#loading);

    // State transition method (public, sync, void)
    fetch(path: string): void {
        this.#loading = true;
        this.#fetchFromServer(path); // fire and forget - no await
    }

    // Service method (private, async)
    async #fetchFromServer(path: string): Promise<void> {
        const response = await fetch(`/api/album${path}`);
        const data = await response.json();
        this.#setAlbum(data); // calls state transition method
    }

    // State transition method
    #setAlbum(album: Album): void {
        this.#loading = false;
        this.#album = album;
    }
}
```

### Private Field Naming

Use the `#` prefix for all private fields and methods. Never use `_` prefix or `private` keyword.

```typescript
// GOOD
#isAdmin = $state(false);
async #fetchUserStatus(): Promise<void> { }

// BAD
private _isAdmin = false;
private async fetchUserStatusInternal(): Promise<void> { }
```

### State and Derived Exposure

- Use `$state()` for mutable internal state
- Never expose `$state` fields directly
- Always expose via `$derived()` for public read access

```typescript
// GOOD
#isAdmin = $state(false);
isAdmin = $derived(this.#isAdmin);

// BAD - exposes mutable state
isAdmin = $state(false); // public mutable!
```

### Collections with SvelteMap

Use `SvelteMap` from `svelte/reactivity` for reactive key-value collections, not plain `Map` or objects.

```typescript
import { SvelteMap } from 'svelte/reactivity';

// GOOD
albums = $state(new SvelteMap<string, AlbumEntry>());

// BAD - not reactive
albums = $state(new Map<string, AlbumEntry>());
```

## Error Handling

### instanceof Error Guard

Always use `instanceof Error` guard when catching unknown errors:

```typescript
// GOOD
catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    this.#handleError(msg);
}

// BAD - assumes e is Error
catch (e) {
    this.#handleError(e.message);
}
```

### Error Context

Include contextual information (paths, IDs, status codes) in error messages:

```typescript
// GOOD
throw new Error(`Invalid album path [${path}]`);
throw new Error(`Album [${path}] not found`);

// BAD
throw new Error('Invalid path');
throw new Error('Not found');
```

### HTTP Response Handling

Extract error messages from JSON before falling back to statusText:

```typescript
if (!response.ok) {
    const msg = (await response.json()).errorMessage || response.statusText;
    throw new Error(msg);
}
```

## Path Validation

Always use validation functions from `galleryPathUtils.ts`. Never hand-craft path validation regex.

```typescript
import { isValidAlbumPath, isValidImagePath } from '$lib/utils/galleryPathUtils';

// GOOD
if (!isValidAlbumPath(path)) {
    throw new Error(`Invalid album path [${path}]`);
}

// BAD - custom regex
if (!/^\/(\d{4}\/)?((\d{2}-\d{2})\/)?$/.test(path)) {
    throw new Error('Invalid path');
}
```

Key validators (see `galleryPathUtils.ts` for complete list):

- `isValidPath()`, `isValidAlbumPath()`, `isValidImagePath()`
- `isValidYearAlbumName()`, `isValidDayAlbumName()`
- `isValidImageName()`, `isValidImageNameStrict()`

## Type Organization

### File Locations

- **UI contracts** (`GalleryItemInterfaces.ts`): Use `interface` keyword
- **Server responses** (`impl/server.ts`): Use `type` keyword
- **State structures** (`album.ts`): Enums and state types

### Factory Functions

Use factory functions for converting server JSON to domain models:

```typescript
// AlbumCreator.ts
export default function toAlbum(json: AlbumRecord): Album {
    if (!json) throw new Error('No JSON object received');
    const type = getAlbumType(json.path);
    switch (type) {
        case AlbumType.ROOT:
            return new AlbumRootImpl(json);
        // ...
    }
}
```

### Enum Conventions

Enum members use SCREAMING_SNAKE_CASE:

```typescript
export enum AlbumLoadStatus {
    NOT_LOADED = 'NOT_LOADED',
    LOADING = 'LOADING',
    ERROR_LOADING = 'ERROR_LOADING',
}
```

## Immutability with Immer

Use Immer's `produce()` for complex nested state updates:

```typescript
import { produce } from 'immer';

// GOOD - immutable update
const newEntry = produce(albumEntry, (draft) => {
    draft.loadStatus = AlbumLoadStatus.LOADED;
    draft.album = album;
});
albums.set(path, newEntry);

// Simple scalar updates can be direct
this.#loading = false;
```

## Return Type Conventions

- **State transition methods**: `void` (synchronous, fire-and-forget)
- **Service methods**: `Promise<void>` or `Promise<T>` (always typed)
- **Query methods**: `Promise<boolean>` or `Promise<T>`

```typescript
// State transition - void
fetch(path: string): void { }

// Service - Promise<void>
async #fetchFromServer(path: string): Promise<void> { }

// Query - Promise<T>
async albumExists(path: string): Promise<boolean> { }
```

## Validation Pattern

Validate inputs at the start of methods before any state changes:

```typescript
fetch(path: string): void {
    if (!isValidAlbumPath(path)) {
        throw new Error(`Invalid album path [${path}]`);
    }
    // ... rest of logic
}
```
