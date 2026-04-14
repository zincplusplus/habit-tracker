<script>
	import {debugLog, isValidCSSColor} from './utils'

	import {onDestroy} from 'svelte'
	import {parseYaml, TFile, Modal, Notice} from 'obsidian'
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

	class NumericInputModal extends Modal {
		constructor(app, date, min, max, currentValue, onSubmit, onRemove) {
			super(app)
			this.date = date
			this.min = min
			this.max = max
			this.currentValue = currentValue
			this.onSubmit = onSubmit
			this.onRemove = onRemove
		}
		onOpen() {
			const {contentEl} = this
			contentEl.createEl('p', {text: `${this.date} — enter value (${this.min}–${this.max}):`})
			const input = contentEl.createEl('input')
			input.type = 'number'
			input.min = String(this.min)
			input.max = String(this.max)
			input.style.cssText = 'width:100%;margin-bottom:8px'
			if (this.currentValue !== null) input.value = String(this.currentValue)
			const submit = () => {
				const num = Number(input.value)
				if (!isNaN(num) && input.value !== '') {
					this.close()
					this.onSubmit(num)
				}
			}
			input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit() })
			const btnRow = contentEl.createDiv({attr: {style: 'display:flex;gap:8px'}})
			btnRow.createEl('button', {text: 'Save'}).addEventListener('click', submit)
			if (this.onRemove) {
				btnRow.createEl('button', {text: 'Remove'}).addEventListener('click', () => {
					this.close()
					this.onRemove()
				})
			}
			setTimeout(() => input.focus(), 50)
		}
		onClose() { this.contentEl.empty() }
	}

	let entries = []
	let frontmatter = {}
	let habitName = name
	let customStyles = ''
	let savingChanges = false // this helps the file change listner know if we made a change. if not, it reloads the data for the habit
	let range = null          // [min, max] for numeric habits; null for binary
	let streakThreshold = null // minimum value to count for streak
	let valueMap = {}         // { "2024-11-01": 30 } for numeric habits

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

		// For numeric habits, only threshold-meeting entries count for streaks
		const streakEntries = range
			? entries.filter((d) => valueMap[d] >= streakThreshold)
			: entries

		// Pass 1 — mark each date
		const days = dates.map((date) => {
			const hasValue = range ? date in valueMap : false
			const value = range ? (valueMap[date] ?? null) : null
			const ticked = range
				? hasValue && value >= streakThreshold
				: entrySet.has(date)
			const streakEligible = ticked
			let gap = false
			if (!ticked && maxGap > 0) {
				// Gap only between consecutive streak-eligible entries whose gap ≤ maxGap
				const parsed = parseISO(date)
				for (let i = 0; i < streakEntries.length - 1; i++) {
					const prev = parseISO(streakEntries[i])
					const next = parseISO(streakEntries[i + 1])
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
				value,
				hasValue,
				streakEligible,
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
			const inStreak = i < days.length && (days[i].streakEligible || days[i].gap)
			if (inStreak && streakStartIdx === -1) {
				streakStartIdx = i
			} else if (!inStreak && streakStartIdx !== -1) {
				// Streak just ended at i-1
				const endIdx = i - 1

				// Find first and last streak-eligible dates in this visible run
				let firstTickDate = null
				let lastTickDate = null
				for (let j = streakStartIdx; j <= endIdx; j++) {
					if (days[j].streakEligible) {
						if (!firstTickDate) firstTickDate = days[j].date
						lastTickDate = days[j].date
					}
				}

				// streakStart: only if the streak truly begins here
				// (no eligible entry within maxGap before the first visible date)
				if (firstTickDate) {
					const firstTickIdx = streakEntries.indexOf(firstTickDate)
					const prevEntry = firstTickIdx > 0 ? streakEntries[firstTickIdx - 1] : null
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
					const lastTickIdx = streakEntries.indexOf(lastTickDate)
					const nextEntry =
						lastTickIdx < streakEntries.length - 1 ? streakEntries[lastTickIdx + 1] : null
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

				// Count: walk backward through streakEntries from the last visible eligible tick
				let count = 0
				if (lastTickDate) {
					const anchorIdx = streakEntries.indexOf(lastTickDate)
					if (anchorIdx !== -1) {
						count = 1
						for (let j = anchorIdx; j > 0; j--) {
							const gapDays =
								differenceInCalendarDays(
									parseISO(streakEntries[j]),
									parseISO(streakEntries[j - 1]),
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
		if (maxGap > 0 && streakEntries.length > 0) {
			const today = format(new Date(), 'yyyy-MM-dd')
			const lastEntry = streakEntries[streakEntries.length - 1]
			const deadlineDate = format(
				new Date(parseISO(lastEntry).getTime() + (maxGap + 1) * 86400000),
				'yyyy-MM-dd',
			)
			if (deadlineDate >= today) {
				const ghostDay = days.find((d) => d.date === deadlineDate)
				if (ghostDay && !ghostDay.streakEligible) {
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
			if (range) cls.push('habit-tick--numeric')
			if (showStreaks) {
				const inStrk = day.streakEligible || day.gap
				if (inStrk) cls.push('habit-tick--streak')
				if (day.gap && !day.streakEligible) {
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

		range = frontmatter.range || null
		streakThreshold = frontmatter.streak_threshold ?? (range ? range[0] : null)

		if (range) {
			const newValueMap = {}
			for (const entry of frontmatter.entries || []) {
				if (entry && typeof entry === 'object' && entry.date != null) {
					// parseYaml may return bare dates as Date objects — normalize to string
					const dateStr = entry.date instanceof Date
						? format(entry.date, 'yyyy-MM-dd')
						: String(entry.date)
					newValueMap[dateStr] = entry.value
				}
			}
			valueMap = newValueMap
			entries = Object.keys(valueMap).sort()
		} else {
			entries = (frontmatter.entries || []).sort()
		}

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

	const saveNumericEntries = function (newValueMap) {
		const file = app.vault.getAbstractFileByPath(path)
		if (!file || !(file instanceof TFile)) return
		valueMap = newValueMap
		entries = Object.keys(valueMap).sort()
		savingChanges = true
		app.fileManager.processFrontMatter(file, (fm) => {
			fm['entries'] = Object.entries(newValueMap).map(([d, v]) => ({date: d, value: v}))
		})
	}

	const handleCellClick = function (date) {
		if (range) {
			const currentValue = date in valueMap ? valueMap[date] : null
			const onRemove = currentValue !== null ? () => {
				const newValueMap = {...valueMap}
				delete newValueMap[date]
				saveNumericEntries(newValueMap)
			} : null
			new NumericInputModal(app, date, range[0], range[1], currentValue, (num) => {
				const newValueMap = {...valueMap}
				newValueMap[date] = Math.min(Math.max(num, range[0]), range[1])
				saveNumericEntries(newValueMap)
			}, onRemove).open()
		} else {
			toggleHabit(date)
		}
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
			class="internal-link">{habitName}{range ? ` (${range[0]}–${range[1]})` : ''}</a
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
				on:click={() => handleCellClick(day.date)}
			>
				<span
					class="habit-tick__inner"
				>{#if range && day.hasValue}{day.value}{:else if day.streakEnd && day.streakCount > 1}{day.streakCount}{/if}</span>
			</div>
		{/each}
	{/if}
</div>
