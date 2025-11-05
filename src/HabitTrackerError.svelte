<script lang="ts">
	export let error
	export let src
	export let pluginName

	let prettyError = ''

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

	init()
</script>

<div>
	<strong>🛑 {pluginName}</strong>
</div>
{@html prettyError}
