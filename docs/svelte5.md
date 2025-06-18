# Svelte 5

This project uses Svelte 5 with its new runes API and updated syntax patterns. In particular, it uses the $state and $derived runes instead of Svelte stores.

## Key Changes from Svelte 4

### Reactivity with Runes

**State Management**

```svelte
<!-- Svelte 4 -->
<script>
  let count = 0;
</script>

<!-- Svelte 5 -->
<script>
  let count = $state(0);
</script>
```

**Derived Values**

```svelte
<!-- Svelte 4 -->
<script>
  let count = 0;
  $: double = count * 2;
</script>

<!-- Svelte 5 -->
<script>
  let count = $state(0);
  const double = $derived(count * 2);
</script>
```

**Complex Derivations**

```svelte
<script>
    let numbers = $state([1, 2, 3]);
    let total = $derived.by(() => {
        let total = 0;
        for (const n of numbers) {
            total += n;
        }
        return total;
    });
</script>
```

**Side Effects**

```svelte
<!-- Svelte 4 -->
<script>
  let count = 0;
  $: {
    if (count > 5) {
      alert('Count is too high!');
    }
  }
</script>

<!-- Svelte 5 -->
<script>
  let count = $state(0);
  $effect(() => {
    if (count > 5) {
      alert('Count is too high!');
    }
  });
</script>
```

### Props Declaration

```svelte
<!-- Svelte 4 -->
<script>
  export let optional = 'unset';
  export let required;
  export { klass as class };
</script>

<!-- Svelte 5 -->
<script>
  let { optional = 'unset', required, class: klass, ...rest } = $props();
</script>
```

### Event Handling

```svelte
<!-- Svelte 4 -->
<button on:click={() => count++}>
    clicks: {count}
</button>

<!-- Svelte 5 -->
<button onclick={() => count++}>
    clicks: {count}
</button>
```

### Component Events → Callback Props

```svelte
<!-- Svelte 4: Child Component -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>
<button onclick={() => dispatch('inflate', power)}>inflate</button>

<!-- Svelte 5: Child Component -->
<script>
  let { inflate } = $props();
</script>
<button onclick={() => inflate(power)}>inflate</button>
```

### Snippets Replace Slots

```svelte
<!-- Svelte 5 -->
<script>
    let { header, children } = $props();
</script>

<!-- Svelte 4 -->
<header>
    <slot name="header" />
</header>
<main>
    <slot />
</main>
<header>
    {@render header()}
</header>
<main>
    {@render children?.()}
</main>
```

## Project-Specific Patterns

### State Machine Integration

Our state machines use Svelte 5 runes extensively:

```typescript
// AlbumState.svelte.ts
class AlbumState {
    #albums = $state(new SvelteMap<string, AlbumStateItem>());

    get albums() {
        return this.#albums;
    }

    // Public state transition methods
    fetch(path: string): void {
        // Implementation using $state updates
    }
}
```

### Component Props Patterns

**Layout Components**

```svelte
<!-- src/lib/components/pages/album/BlankAlbumPageLayout.svelte -->
<script>
    let { children } = $props();
</script>

<main>
    {@render children?.()}
</main>
```

**Data-Aware Components**

```svelte
<!-- src/lib/components/data-aware/LatestAlbumThumbnail.svelte -->
<script>
    import { albumState } from '$lib/state/AlbumState.svelte.ts';

    const latestAlbum = $derived(albumState.latestAlbum);
</script>

{#if latestAlbum}
    <AlbumThumbnail album={latestAlbum} />
{/if}
```

**Admin Component Callback Props**

```svelte
<!-- Admin components use callback props for actions -->
<script>
    let { onSave, onCancel, item } = $props();
</script>

<button onclick={() => onSave(item)}>Save</button>
<button onclick={() => onCancel()}>Cancel</button>
```

### Routing Components

```svelte
<!-- AlbumRouting.svelte -->
<script>
    import { albumState } from '$lib/state/AlbumState.svelte.ts';

    let { path } = $props();

    const albumStatus = $derived(albumState.getStatus(path));
    const album = $derived(albumState.get(path));
</script>

{#if albumStatus === 'loading'}
    <AlbumLoadingPage />
{:else if albumStatus === 'error'}
    <AlbumErrorPage />
{:else if album}
    {#snippet loaded()}
        <AlbumPage {album} />
    {/snippet}
    {@render loaded()}
{/if}
```

### Snippet Usage in Layouts

```svelte
<!-- ImagePageLayout.svelte -->
<script>
    let { children, nav, admin } = $props();
</script>

<div class="image-layout">
    <nav>{@render nav?.()}</nav>
    <main>{@render children?.()}</main>
    <aside>{@render admin?.()}</aside>
</div>
```

### No Svelte Stores

This project does **not** use Svelte stores. All reactive state is managed through:

- `$state` runes in state machine classes
- `$derived` for computed values
- `$effect` for side effects

### State Machine Classes

State machines are implemented as classes with `$state` properties:

```typescript
class StateMachine {
    #data = $state(initialValue);

    get data() {
        return this.#data;
    }

    // Only these methods can update state
    updateData(newData: DataType): void {
        this.#data = newData;
    }
}
```

### TypeScript Integration

Props interfaces are defined using TypeScript:

```svelte
<script lang="ts">
    interface Props {
        item: AlbumItem;
        selected?: boolean;
        onSelect?: (item: AlbumItem) => void;
    }

    let { item, selected = false, onSelect }: Props = $props();
</script>
```

### Lazy Loading Admin Components

Admin functionality uses dynamic imports with snippets:

```svelte
{#if isAdmin}
    {#await import('$lib/components/site/admin/EditControls.svelte') then { default: EditControls }}
        <EditControls {item} {onSave} {onCancel} />
    {/await}
{/if}
```

## Best Practices

1. **Use `$state` for all reactive variables**
2. **Use `$derived` instead of `$:` for computed values**
3. **Use callback props instead of `createEventDispatcher`**
4. **Use snippets instead of slots for flexible content**
5. **Keep state management in dedicated state machine classes**
6. **Use TypeScript interfaces for props**
7. **Lazy load admin components to reduce bundle size**
