<!--
  @component

  The layout for the image and album editing controls
-->

<style>
	.editing-controls-container {
		background-color: rgb(65, 64, 64);
		border-bottom: 1px solid black;
	}

	.editing-controls {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 1em;
		padding: .5em;
		color: rgb(211, 211, 211);
		animation: fadeIn 600ms;
	}

	@keyframes fadeIn {
		0% {opacity:0;}
		100% {opacity:1;}
	}

	.left {
		margin-right: auto;
		display: flex;
		align-items: center;
		gap: 1em;
	}
</style>

<div class="editing-controls-container">
	<div class="editing-controls">
		<div class="left">
			<slot name="leftControls" />
			<div>
				<slot name="status" />
			</div>
		</div>
		<slot name="rightControls" />
	</div>
</div>