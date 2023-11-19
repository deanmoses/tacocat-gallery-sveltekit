<!--
  @component On hover, display buttons to get into edit mode, delete, etc 
-->
<script lang="ts">
    import UploadButton from './toggle_buttons/UploadButton.svelte';
    import DeleteButton from './toggle_buttons/DeleteButton.svelte';
    import EditButton from './toggle_buttons/EditButton.svelte';
    import RenameDayAlbumButton from './toggle_buttons/RenameDayAlbumButton.svelte';
    import RenameImageButton from './toggle_buttons/RenameImageButton.svelte';
    import NewYearAlbumButton from './toggle_buttons/NewYearAlbumButton.svelte';
    import NewDayAlbumButton from './toggle_buttons/NewDayAlbumButton.svelte';
    import SetYearThumbnailButton from './toggle_buttons/SetYearThumbnailButton.svelte';
</script>

<div>
    <nav class="editing-controls">
        <EditButton />
        <RenameImageButton />
        <RenameDayAlbumButton />
        <NewYearAlbumButton />
        <NewDayAlbumButton />
        <UploadButton />
        <SetYearThumbnailButton />
        <DeleteButton />
    </nav>
</div>

<style>
    div {
        position: fixed;
        top: 0;
        left: 0;
        min-height: 4em;
        min-width: 8em;
    }

    nav {
        width: 100%;
        padding: 0.5em;
        border-bottom: 1px solid black;
        border-bottom-right-radius: 8px;
        background-color: rgb(65, 64, 64);
        color: rgb(211, 211, 211);
        display: none; /* will be overridden on hover */
    }

    div:hover nav {
        display: flex;
        align-items: center;
        gap: 1em;
        animation: fadeIn 1400ms;
    }

    @keyframes fadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
</style>
