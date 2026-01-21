<!--
  @component
  
  On hover, display buttons to get into edit mode, delete, etc 
-->
<script lang="ts">
    import EditButton from './toggle_buttons/EditButton.svelte';
    import CropButton from './toggle_buttons/CropButton.svelte';
    import RenameDayAlbumButton from './toggle_buttons/RenameDayAlbumButton.svelte';
    import RenameMediaButton from './toggle_buttons/RenameMediaButton.svelte';
    import NewYearAlbumButton from './toggle_buttons/NewYearAlbumButton.svelte';
    import NewDayAlbumButton from './toggle_buttons/NewDayAlbumButton.svelte';
    import UploadMediaItemButton from './toggle_buttons/UploadMediaItemButton.svelte';
    import UploadMediaItemsButton from './toggle_buttons/UploadMediaItemsButton.svelte';
    import SetYearThumbnailButton from './toggle_buttons/SetYearThumbnailButton.svelte';
    import DeleteAlbumButton from './toggle_buttons/DeleteAlbumButton.svelte';
    import DeleteMediaButton from './toggle_buttons/DeleteMediaButton.svelte';
</script>

<div>
    <nav class="editing-controls">
        <EditButton />
        <CropButton />
        <RenameMediaButton />
        <RenameDayAlbumButton />
        <NewYearAlbumButton />
        <NewDayAlbumButton />
        <UploadMediaItemsButton />
        <UploadMediaItemButton />
        <SetYearThumbnailButton />
        <DeleteAlbumButton />
        <DeleteMediaButton />
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
