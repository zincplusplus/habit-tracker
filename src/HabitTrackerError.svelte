<script lang="ts">
	import {onMount, onDestroy} from 'svelte'
	import HabitTracker from './HabitTracker.svelte'

	export let error
	export let src
	export let pluginName
	export let app
	export let globalSettings

	let prettyError = ''
	let componentContainer: HTMLElement
	let refreshEventListener: (event: CustomEvent) => void

	// TODO show the action bar when there's an error
	function init() {
		const errorPosition = extractErrorPosition(error.message)
		const errorMessage = getFriendlyErrorMessage(
			error.message,
			src,
			errorPosition,
		)
		prettyError = renderJsonWithError(src, errorPosition, errorMessage)
	}

	function extractErrorPosition(errorMessage: string): number {
		const match = errorMessage.match(/position (\d+)/)
		if (match && match[1]) {
			return parseInt(match[1], 10)
		}
		return -1
	}

	function getFriendlyErrorMessage(
		errorMessage: string,
		jsonString: string,
		errorPosition: number,
	): string {
		if (errorMessage.includes('Unexpected token')) {
			if (jsonString[errorPosition - 1] === ',') {
				return 'Error: Trailing comma found. Remove the comma after the last item in the settings.'
			} else {
				return `Error: Unexpected token at position ${errorPosition}. Check for missing commas, braces, or quotes.`
			}
		}
		if (errorMessage.includes('Unexpected string')) {
			return `Error: Missing comma or extra comma at position ${errorPosition}. Check the syntax around this position.`
		}
		if (errorMessage.includes('Unexpected number')) {
			return `Error: Missing comma at position ${errorPosition}. Add a comma between the items.`
		}
		if (errorMessage.includes('Unexpected number')) {
			return `Error: Missing comma at position ${errorPosition}. Add a comma between the items.`
		}
		const errorChar = jsonString.slice(errorPosition, errorPosition + 1)
		if (
			errorMessage.includes(
				'Expected double-quoted property name in JSON at position',
			) &&
			errorChar == '}'
		) {
			return 'Error: Trailing comma found. Remove the comma after the last item in the settings.'
		} else {
			return `Error: ${errorMessage}`
		}
	}

	function renderJsonWithError(
		jsonString: string,
		errorPosition: number,
		errorMessage: string,
	): string {
		const beforeError = jsonString.slice(0, errorPosition)
		const errorChar = jsonString.slice(errorPosition, errorPosition + 1)
		const afterError = jsonString.slice(errorPosition + 1)

		// const highlightedBeforeError = beforeError;
		const highlightedErrorChar = `<span style="background-color: yellow; color: black;">${errorChar}</span>`
		// const highlightedAfterError = afterError;

		return `${errorMessage}<pre><code>user settings: ${beforeError}${highlightedErrorChar}${afterError}</code></pre>`
	}

	function attemptRecovery(updatedGlobalSettings) {
		console.log('[HabitTrackerError] Attempting recovery with new settings:', updatedGlobalSettings);

		try {
			// Parse the user settings again with the updated global settings
			const userSettings = JSON.parse(src);

			// Try to create a new HabitTracker component
			const habitTracker = new HabitTracker({
				target: componentContainer,
				props: {
					app,
					userSettings,
					globalSettings: updatedGlobalSettings,
					pluginName,
				},
			});

			console.log('[HabitTrackerError] Recovery successful! Replacing error component.');
			// If we get here, the component was created successfully
			// The new component will replace this error component in the DOM

		} catch (newError) {
			console.log('[HabitTrackerError] Recovery failed, still have error:', newError.message);
			// Still have an error, update the display with new error if different
			if (newError.message !== error.message) {
				error = newError;
				init(); // Re-render error display with new error
			}
		}
	}

	onMount(() => {
		console.log('[HabitTrackerError] Error component mounted, setting up refresh listener');

		refreshEventListener = (event: CustomEvent) => {
			console.log('[HabitTrackerError] Refresh event received, attempting recovery');
			globalSettings = event.detail.settings;
			attemptRecovery(globalSettings);
		};

		// Listen for refresh events at the document level
		document.addEventListener('habit-tracker-refresh', refreshEventListener);
		console.log('[HabitTrackerError] Refresh event listener added to document');
	});

	onDestroy(() => {
		if (refreshEventListener) {
			document.removeEventListener('habit-tracker-refresh', refreshEventListener);
			console.log('[HabitTrackerError] Refresh event listener removed');
		}
	});

	init()
</script>

<div bind:this={componentContainer}>
	<div>
		<strong>🛑 {pluginName}</strong>
	</div>
	{@html prettyError}
</div>
