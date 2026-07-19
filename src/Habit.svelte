<script>
	import {
		debugLog,
		isValidCSSColor,
		getDayOfTheWeek,
		computeHabitRenderedDays,
	} from './utils'

	import {onDestroy} from 'svelte'
	import {parseYaml, TFile} from 'obsidian'

	export let app
	export let name
	export let path
	export let dates
	export let debug
	export let pluginName
	export let userSettings
	export let globalSettings

	let entries = []
	let frontmatter = {}
	let habitName = name
	let customStyles = ''
	let savingChanges = false // this helps the file change listner know if we made a change. if not, it reloads the data for the habit

	// Reactive color resolution - updates whenever frontmatter, userSettings, or globalSettings change
	$: {
		const resolvedColor =
			frontmatter.color || userSettings.color || globalSettings.defaultColor
		if (resolvedColor && isValidCSSColor(resolvedColor)) {
			customStyles = `--habit-bg-ticked: ${resolvedColor}`
		} else {
			customStyles = ''
		}
	}
	$: showStreaks =
		userSettings.showStreaks !== undefined
			? userSettings.showStreaks
			: globalSettings.showStreaks

	$: renderedDates = (() => {
		const maxGap = Number(frontmatter.maxGap) || 0
		const gapStyle =
			userSettings.gapStyle !== undefined
				? userSettings.gapStyle
				: globalSettings.gapStyle

		const days = computeHabitRenderedDays({dates, entries, maxGap}).map(
			(day) => ({
				...day,
				classes: '',
			}),
		)

		// Build classes
		for (const day of days) {
			const cls = [
				'habit-tracker__cell',
				`habit-tracker__cell--${getDayOfTheWeek(day.date)}`,
				'habit-tick',
			]
			if (day.ticked) cls.push('habit-tick--ticked')
			if (showStreaks) {
				const inStrk = day.ticked || day.gap
				if (inStrk) cls.push('habit-tick--streak')
				if (day.gap && !day.ticked) {
					cls.push('habit-tick--streak-gap')
					cls.push(
						gapStyle === 'faded'
							? 'habit-tick--gap-faded'
							: 'habit-tick--gap-default',
					)
				}
				if (day.streakStart) cls.push('habit-tick--streak-start')
				if (day.streakEnd) cls.push('habit-tick--streak-end')
				if (day.streakCount > 0 && !day.streakEnd)
					cls.push('habit-tick--streak-count')
				if (day.deadline) cls.push('habit-tick--streak-deadline')
			}
			day.classes = cls.join(' ')
		}

		return days
	})()

	const init = async function () {
		debugLog(`Loading habit ${habitName}`, debug, undefined, pluginName)

		const getFrontmatter = async function (path) {
			const file = app.vault.getAbstractFileByPath(path)

			if (!file || !(file instanceof TFile)) {
				debugLog(
					`No file found for path: ${path}`,
					debug,
					undefined,
					pluginName,
				)
				return {}
			}

			try {
				return await app.vault.read(file).then((result) => {
					const frontmatter = result.split('---')[1]

					if (!frontmatter) {
						return {entries: []}
					}
					const fmParsed = parseYaml(frontmatter)
					if (fmParsed['entries'] == undefined) {
						fmParsed['entries'] = []
					}

					return fmParsed
				})
			} catch (error) {
				debugLog(
					`Error in habit ${habitName}: error.message`,
					debug,
					undefined,
					pluginName,
				)
				return {}
			}
		}

		frontmatter = await getFrontmatter(path)
		debugLog(`Frontmatter for ${path} ↴`, debug)
		debugLog(frontmatter, debug)
		entries = frontmatter.entries || []
		entries = entries.sort()
		habitName = frontmatter.title || habitName

		debugLog(`Habit "${habitName}": Found ${entries.length} entries`, debug)
		debugLog(entries, debug, undefined, pluginName)
	}

	const toggleHabit = function (date) {
		const file = app.vault.getAbstractFileByPath(path)
		if (!file || !(file instanceof TFile)) {
			new Notice(`${pluginName}: file missing while trying to toggle habit`)
			return
		}

		let newEntries = [...entries]
		if (entries.includes(date)) {
			newEntries = newEntries.filter((e) => e !== date)
		} else {
			newEntries.push(date)
		}
		entries = newEntries.sort()

		savingChanges = true

		app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter['entries'] = entries
		})
	}

	init()

	let tooltipEl = null

	function showTooltip(e, day) {
		if (!day.deadline) return
		hideTooltip()
		const rect = e.currentTarget.getBoundingClientRect()

		tooltipEl = document.body.createDiv({
			cls: 'ht21-tooltip',
			text: 'Last day to keep your streak alive!',
		})
		tooltipEl.style.left = `${rect.left + rect.width / 2}px`
		tooltipEl.style.top = `${rect.top - 4}px`
	}

	function hideTooltip() {
		if (tooltipEl) {
			tooltipEl.remove()
			tooltipEl = null
		}
	}

	const modifyRef = app.vault.on('modify', (file) => {
		if (file.path === path) {
			if (!savingChanges) {
				console.log('oh shit, i was modified')
				init()
			}
			savingChanges = false
		}
	})

	onDestroy(() => {
		app.vault.offref(modifyRef)
		hideTooltip()
	})
</script>

<!-- <div bind:this={rootElement}> -->
<div
	class="habit-tracker__row"
	style={customStyles}
>
	<div class="habit-tracker__cell--name habit-tracker__cell">
		<a
			href={path}
			aria-label={path}
			class="internal-link">{habitName}</a
		>
	</div>
	{#if renderedDates.length}
		{#each renderedDates as day}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class={day.classes}
				ticked={day.ticked}
				on:mouseenter={(e) => showTooltip(e, day)}
				on:mouseleave={hideTooltip}
				on:click={() => toggleHabit(day.date)}
			>
				<span class="habit-tick__inner"
					>{#if showStreaks && day.streakEnd && day.streakCount > 1}{day.streakCount}{/if}</span
				>
			</div>
		{/each}
	{/if}
</div>
