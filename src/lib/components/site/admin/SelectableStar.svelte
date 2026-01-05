<!--
  @component 
  
  Star that allows for selection.  Meant to be used in a thumbnail
-->
<script lang="ts">
    import EmptyStarIcon from '../icons/EmptyStarIcon.svelte';
    import FilledStarIcon from '../icons/FilledStarIcon.svelte';
    import TransitionStarIcon from '../icons/TransitionStarIcon.svelte';

    interface Props {
        path: string;
        albumThumbPath: string | undefined;
        onSelected?: (path: string) => void;
    }

    let { path, albumThumbPath, onSelected }: Props = $props();

    let selected: boolean = $derived(path === albumThumbPath);

    let selecting: boolean = $state(false);
    $effect(() => {
        // Reference 'selected' so that $effect is triggered every time it changes
        void selected;
        selecting = false;
    });

    function onEmptyStarClick() {
        selecting = true;
        if (onSelected) {
            onSelected(path);
        }
    }
</script>

{#if selected}
    <div class="selected"><FilledStarIcon height="2em" width="2em" /></div>
{:else if selecting}
    <div class="selecting"><TransitionStarIcon onclick={onEmptyStarClick} /></div>
{:else}
    <div class="notSelected"><EmptyStarIcon onclick={onEmptyStarClick} /></div>
{/if}

<style>
    div {
        position: absolute;
        top: 10px;
        left: 10px;
    }
    .selected,
    .selecting {
        color: yellow;
    }
    .notSelected {
        color: white;
        display: none;
    }
    .notSelected:hover {
        color: yellow;
    }
</style>
