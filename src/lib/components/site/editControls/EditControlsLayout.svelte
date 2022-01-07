<!--
  @component

  The layout for the image and album editing controls
-->

<style>
	.editing-controls {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 1em;
		padding: .5em;
		border-bottom: 1px solid black;
		background-color: rgb(65, 64, 64);
		color: rgb(211, 211, 211);
	}

	.left {
		margin-right: auto;
		display: flex;
		align-items: center;
		gap: 1em;
	}
</style>

<div class="editing-controls">
	<div class="left">
		<slot name="leftControls" />
		<div>
			<slot name="status" />
		</div>
	</div>
	<slot name="rightControls" />
</div>