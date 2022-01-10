<!--
  @component

  On hover, display a button to get into edit mode.  
-->

<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { editUrl, isImagePath, isYearAlbumPath} from "$lib/utils/path-utils";
	import Config from "$lib/utils/config";

	let path: string;
	$: path = $page.url.pathname;

	function onEditButtonClick() {
		goto(editUrl(path));
  }

	function onZenButtonClick() {
		const uri = isImagePath(path) 
			? Config.zenphotoImageEditUrl(path)
			: Config.zenphotoAlbumEditUrl(path);

		window.open(uri, "zenedit");
	}

	function onRefreshClick() {
		const uri = Config.refreshAlbumCacheUrl(path);
		window.open(uri, "refresh");
	}
</script>

<div>
	<nav class="editing-controls">
		<button on:click|once={onEditButtonClick}>Edit</button>
		<button on:click|once={onZenButtonClick}>Zenphoto</button>
		{#if isYearAlbumPath(path)}
			<button on:click|once={onRefreshClick}>Refresh</button>
		{/if}
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
		padding: .5em;
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
		0% {opacity:0;}
		100% {opacity:1;}
	}
</style>