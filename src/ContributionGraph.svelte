<script>
	import {debugLog, isValidCSSColor} from './utils'

	import {onDestroy} from 'svelte'
	import {parseYaml, TFile} from 'obsidian'
	import {parseISO, format, getDate, startOfWeek, addDays, isBefore, isAfter, isSameDay, differenceInCalendarDays, isToday} from 'date-fns'

	export let app
	export let name
	export let path
	export let dates
	export let debug
	export let pluginName
	export let userSettings
	export let globalSettings
	export let onGraphScroll = () => {}

	let entries = []
	let frontmatter = {}
	let habitName = name
	let customColor = ''
	let savingChanges = false
	// Keep graph streak badges aligned with default mode behavior (only meaningful multi-day streaks).
	const MIN_STREAK_COUNT_FOR_BADGE = 2

	$: {
		const resolvedColor =
			frontmatter.color || userSettings.color || globalSettings.defaultColor
		if (resolvedColor && isValidCSSColor(resolvedColor)) {
			customColor = resolvedColor
		} else {
			customColor = ''
		}
	}

	$: renderedDatesByDate = new Map(renderedDates.map((day) => [day.date, day]))

	// Build the contribution graph grid: rows = days of week (Mon-Sun), columns = weeks
	$: graph = (() => {
		if (!dates || dates.length === 0) return {weeks: [], monthLabels: []}
		const firstDate = parseISO(dates[0])
		const lastDate = parseISO(dates[dates.length - 1])

		// Start from the Monday of the week containing the first date
		const weekStart = startOfWeek(firstDate, {weekStartsOn: 1}) // 1 = Monday

		const weeks = []
		const monthLabels = []

		let currentDate = weekStart
		let weekIndex = 0

		while (isBefore(currentDate, lastDate) || isSameDay(currentDate, lastDate)) {
			const week = []
			const inRangeDates = []

			for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
				const cellDate = addDays(currentDate, dayOfWeek)
				const dateStr = format(cellDate, 'yyyy-MM-dd')
				const isInRange = !isBefore(cellDate, firstDate) && !isAfter(cellDate, lastDate)
				const renderedDay = renderedDatesByDate.get(dateStr)
				if (isInRange) inRangeDates.push(cellDate)

				week.push({
					date: dateStr,
					ticked: isInRange && !!renderedDay?.ticked,
					gap: isInRange && showStreaks && !!renderedDay?.gap,
					deadline: isInRange && showStreaks && !!renderedDay?.deadline,
					today: isInRange && isToday(cellDate),
					streakEnd:
						isInRange &&
						showStreaks &&
						!!renderedDay?.streakEnd &&
						renderedDay.streakCount >= MIN_STREAK_COUNT_FOR_BADGE,
					streakCount: renderedDay?.streakCount || 0,
					isInRange,
				})
			}

			const monthStartDate = inRangeDates.find((date) => getDate(date) === 1)
			if (monthStartDate) {
				monthLabels.push({weekIndex, label: format(monthStartDate, 'MMM')})
			} else if (weekIndex === 0 && inRangeDates.length > 0) {
				monthLabels.push({weekIndex, label: format(inRangeDates[0], 'MMM')})
			}

			weeks.push(week)
			currentDate = addDays(currentDate, 7)
			weekIndex++
		}

		return {weeks, monthLabels}
	})()

	$: showStreaks =
		userSettings.showStreaks !== undefined
			? userSettings.showStreaks
			: globalSettings.showStreaks

	$: renderedDates = (() => {
		const maxGap = Number(frontmatter.maxGap) || 0
		const entrySet = new Set(entries)

		const days = dates.map((date) => ({
			date,
			ticked: entrySet.has(date),
			gap: false,
			deadline: false,
			streakEnd: false,
			streakCount: 0,
		}))

		for (const day of days) {
			if (day.ticked || maxGap === 0) continue
			const parsed = parseISO(day.date)
			for (let i = 0; i < entries.length - 1; i++) {
				const prev = parseISO(entries[i])
				const next = parseISO(entries[i + 1])
				if (
					differenceInCalendarDays(parsed, prev) > 0 &&
					differenceInCalendarDays(next, parsed) > 0
				) {
					if (differenceInCalendarDays(next, prev) - 1 <= maxGap) {
						day.gap = true
					}
					break
				}
			}
		}

		let streakStartIdx = -1
		for (let i = 0; i <= days.length; i++) {
			const inStreak = i < days.length && (days[i].ticked || days[i].gap)
			if (inStreak && streakStartIdx === -1) {
				streakStartIdx = i
			} else if (!inStreak && streakStartIdx !== -1) {
				const endIdx = i - 1
				let lastTickDate = null
				for (let j = streakStartIdx; j <= endIdx; j++) {
					if (days[j].ticked) lastTickDate = days[j].date
				}

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

				days[endIdx].streakEnd = true
				days[endIdx].streakCount = count
				streakStartIdx = -1
			}
		}

		if (maxGap > 0 && entries.length > 0) {
			const today = format(new Date(), 'yyyy-MM-dd')
			const lastEntry = entries[entries.length - 1]
			const deadlineDate = format(
				addDays(parseISO(lastEntry), maxGap + 1),
				'yyyy-MM-dd',
			)
			if (deadlineDate >= today) {
				const ghostDay = days.find((d) => d.date === deadlineDate)
				if (ghostDay && !ghostDay.ticked) ghostDay.deadline = true
			}
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
					`Error in habit ${habitName}: ${error.message}`,
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

	const modifyRef = app.vault.on('modify', (file) => {
		if (file.path === path) {
			if (!savingChanges) {
				init()
			}
			savingChanges = false
		}
	})

	onDestroy(() => {
		app.vault.offref(modifyRef)
	})
</script>

<div class="contribution-graph">
	<div class="contribution-graph__header">
		<a
			href={path}
			aria-label={path}
			class="internal-link contribution-graph__name">{habitName}</a
		>
	</div>
	<div class="contribution-graph__body" on:scroll={(e) => onGraphScroll(e.currentTarget)}>
		<div class="contribution-graph__grid-wrapper" style="--graph-weeks: {graph.weeks.length}">
			<div class="contribution-graph__month-labels">
				{#each graph.monthLabels as monthLabel}
					<div
						class="contribution-graph__month-label"
						style="grid-column: {monthLabel.weekIndex + 1}"
					>
						{monthLabel.label}
					</div>
				{/each}
			</div>
			<div class="contribution-graph__grid">
				{#each graph.weeks as week}
					{#each week as cell}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="contribution-graph__cell"
							class:contribution-graph__cell--ticked={cell.ticked}
							class:contribution-graph__cell--gap={cell.gap}
							class:contribution-graph__cell--deadline={cell.deadline}
							class:contribution-graph__cell--today={cell.today}
							class:contribution-graph__cell--streak-end={cell.streakEnd}
							class:contribution-graph__cell--empty={!cell.isInRange}
							style={cell.ticked && customColor ? `--graph-cell-color: ${customColor}` : ''}
							title={cell.isInRange ? cell.date : ''}
							on:click={() => cell.isInRange && toggleHabit(cell.date)}
						>
							{#if cell.streakEnd}
								<span class="contribution-graph__streak-count">{cell.streakCount}</span>
							{/if}
						</div>
					{/each}
				{/each}
			</div>
		</div>
	</div>
</div>
