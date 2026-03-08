<script>
	import {debugLog, isValidCSSColor} from './utils'

	import {onDestroy} from 'svelte'
	import {parseYaml, TFile} from 'obsidian'
	import {getDayOfTheWeek} from './utils'
	import {differenceInCalendarDays, parseISO, format} from 'date-fns'

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
	$: renderedDates = (() => {
		const maxGap = Number(frontmatter.maxGap) || 0
		const entrySet = new Set(entries)
		const showStreaks =
			userSettings.showStreaks !== undefined
				? userSettings.showStreaks
				: globalSettings.showStreaks
		const gapStyle =
			userSettings.gapStyle !== undefined
				? userSettings.gapStyle
				: globalSettings.gapStyle

		// Pass 1 — mark each date
		const days = dates.map((date) => {
			const ticked = entrySet.has(date)
			let gap = false
			if (!ticked && maxGap > 0) {
				// Gap only between consecutive entries whose gap ≤ maxGap
				const parsed = parseISO(date)
				for (let i = 0; i < entries.length - 1; i++) {
					const prev = parseISO(entries[i])
					const next = parseISO(entries[i + 1])
					if (
						differenceInCalendarDays(parsed, prev) > 0 &&
						differenceInCalendarDays(next, parsed) > 0
					) {
						if (differenceInCalendarDays(next, prev) - 1 <= maxGap) {
							gap = true
						}
						break
					}
				}
			}
			return {
				date,
				ticked,
				gap,
				deadline: false,
				title: '',
				streakStart: false,
				streakEnd: false,
				streakCount: 0,
				classes: '',
			}
		})

		// Pass 2 — identify streak boundaries and counts
		let streakStartIdx = -1
		for (let i = 0; i <= days.length; i++) {
			const inStreak = i < days.length && (days[i].ticked || days[i].gap)
			if (inStreak && streakStartIdx === -1) {
				streakStartIdx = i
			} else if (!inStreak && streakStartIdx !== -1) {
				// Streak just ended at i-1
				const endIdx = i - 1

				// Find first and last ticked dates in this visible run
				let firstTickDate = null
				let lastTickDate = null
				for (let j = streakStartIdx; j <= endIdx; j++) {
					if (days[j].ticked) {
						if (!firstTickDate) firstTickDate = days[j].date
						lastTickDate = days[j].date
					}
				}

				// streakStart: only if the streak truly begins here
				// (no entry within maxGap before the first visible date)
				if (firstTickDate) {
					const firstTickIdx = entries.indexOf(firstTickDate)
					const prevEntry = firstTickIdx > 0 ? entries[firstTickIdx - 1] : null
					const continuesFromBefore =
						prevEntry &&
						differenceInCalendarDays(
							parseISO(firstTickDate),
							parseISO(prevEntry),
						) -
							1 <=
							maxGap
					if (!continuesFromBefore) {
						days[streakStartIdx].streakStart = true
					}
				} else {
					days[streakStartIdx].streakStart = true
				}

				// streakEnd: only if the streak truly ends within the visible range
				if (lastTickDate) {
					const lastTickIdx = entries.indexOf(lastTickDate)
					const nextEntry =
						lastTickIdx < entries.length - 1 ? entries[lastTickIdx + 1] : null
					const continuesAfter =
						nextEntry &&
						differenceInCalendarDays(
							parseISO(nextEntry),
							parseISO(lastTickDate),
						) -
							1 <=
							maxGap
					if (!continuesAfter) {
						days[endIdx].streakEnd = true
					}
				} else {
					days[endIdx].streakEnd = true
				}

				// Count: walk backward through entries from the last visible tick
				let count = 0
				if (lastTickDate) {
					const anchorIdx = entries.indexOf(lastTickDate)
					if (anchorIdx !== -1) {
						count = 1
						for (let j = anchorIdx; j > 0; j--) {
							const gapDays =
								differenceInCalendarDays(
									parseISO(entries[j]),
									parseISO(entries[j - 1]),
								) - 1
							if (gapDays > maxGap) break
							count++
						}
					}
				}

				days[endIdx].streakCount = count

				streakStartIdx = -1
			}
		}

		// Pass 3 — ghost dot on the last day of the gap (deadline to keep streak alive)
		if (maxGap > 0 && entries.length > 0) {
			const today = format(new Date(), 'yyyy-MM-dd')
			const lastEntry = entries[entries.length - 1]
			const deadlineDate = format(
				new Date(parseISO(lastEntry).getTime() + (maxGap + 1) * 86400000),
				'yyyy-MM-dd',
			)
			if (deadlineDate >= today) {
				const ghostDay = days.find((d) => d.date === deadlineDate)
				if (ghostDay && !ghostDay.ticked) {
					ghostDay.deadline = true
				}
			}
		}

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
					cls.push(gapStyle === 'faded' ? 'habit-tick--gap-faded' : 'habit-tick--gap-default')
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
			const file = this.app.vault.getAbstractFileByPath(path)

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
				return await this.app.vault.read(file).then((result) => {
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
		entries = frontmatter.entries
		entries = entries.sort()
		habitName = frontmatter.title || habitName

		debugLog(`Habit "${habitName}": Found ${entries.length} entries`, debug)
		debugLog(entries, debug, undefined, pluginName)
	}

	const toggleHabit = function (date) {
		const file = this.app.vault.getAbstractFileByPath(path)
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

		this.app.fileManager.processFrontMatter(file, (frontmatter) => {
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
				<span
					class="habit-tick__inner"
				>{#if day.streakEnd && day.streakCount > 1}{day.streakCount}{/if}</span>
			</div>
		{/each}
	{/if}
</div>
