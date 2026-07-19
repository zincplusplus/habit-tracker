<script>
	import {
		debugLog,
		isValidCSSColor,
		buildGraphCellStyle,
		computeHabitRenderedDays,
	} from './utils'

	import {onDestroy} from 'svelte'
	import {parseYaml, TFile} from 'obsidian'
	import {
		parseISO,
		format,
		startOfWeek,
		addDays,
		isBefore,
		isAfter,
		isSameDay,
		isToday,
	} from 'date-fns'

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
	let cellStyle = ''
	let savingChanges = false
	// Keep graph streak badges aligned with default mode behavior (only meaningful multi-day streaks).
	const STREAK_BADGE_THRESHOLD = 2

	$: {
		const resolvedColor =
			frontmatter.color || userSettings.color || globalSettings.defaultColor
		if (resolvedColor && isValidCSSColor(resolvedColor)) {
			customColor = resolvedColor
		} else {
			customColor = ''
		}
	}

	$: cellStyle = customColor ? buildGraphCellStyle(customColor) : ''

	// Build the contribution graph grid: rows = days of week (Mon-Sun), columns = weeks
	$: graph = (() => {
		if (!dates || dates.length === 0) return {weeks: [], monthLabels: []}
		const firstDate = parseISO(dates[0])
		const lastDate = parseISO(dates[dates.length - 1])

		// Always align the visual grid to Monday so rows correctly correspond to days of the week,
		// regardless of the tracked data range.
		const weekStart = startOfWeek(firstDate, {weekStartsOn: 1})

		const weeks = []
		const monthStarts = []

		let currentDate = weekStart
		let weekIndex = 0
		let previousColumnMonth = ''

		while (
			isBefore(currentDate, lastDate) ||
			isSameDay(currentDate, lastDate)
		) {
			const week = []
			const inRangeDates = []

			for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
				const cellDate = addDays(currentDate, dayOfWeek)
				const dateStr = format(cellDate, 'yyyy-MM-dd')
				const isInRange =
					!isBefore(cellDate, firstDate) && !isAfter(cellDate, lastDate)
				const renderedDay = renderedDates.byDate.get(dateStr)
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
						renderedDay.streakCount >= STREAK_BADGE_THRESHOLD,
					streakCount: renderedDay?.streakCount || 0,
					isInRange,
				})
			}

			if (inRangeDates.length > 0) {
				const columnMonth = format(inRangeDates[0], 'MMM')
				if (weekIndex === 0 || columnMonth !== previousColumnMonth) {
					monthStarts.push({weekIndex, label: columnMonth})
					previousColumnMonth = columnMonth
				}
			}

			weeks.push(week)
			currentDate = addDays(currentDate, 7)
			weekIndex++
		}

		const monthLabels = monthStarts.map((monthStart, index) => ({
			...monthStart,
			endWeekIndex:
				index < monthStarts.length - 1
					? monthStarts[index + 1].weekIndex
					: weeks.length,
		}))

		return {weeks, monthLabels}
	})()

	$: showStreaks =
		userSettings.showStreaks !== undefined
			? userSettings.showStreaks
			: globalSettings.showStreaks

	$: renderedDates = (() => {
		const maxGap = Number(frontmatter.maxGap) || 0
		const days = computeHabitRenderedDays({dates, entries, maxGap})

		return {days, byDate: new Map(days.map((day) => [day.date, day]))}
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
		const file = app.vault.getAbstractFileByPath(path)
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

		app.fileManager.processFrontMatter(file, (frontmatter) => {
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
	<div
		class="contribution-graph__body"
		on:scroll={(e) => onGraphScroll(e.currentTarget)}
	>
		<div
			class="contribution-graph__grid-wrapper"
			style="--graph-weeks: {graph.weeks.length}"
		>
			<div class="contribution-graph__month-labels">
				{#each graph.monthLabels as monthLabel}
					<div
						class="contribution-graph__month-label"
						style="grid-column: {monthLabel.weekIndex +
							1} / {monthLabel.endWeekIndex + 1}"
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
							style={cell.ticked || cell.gap || cell.deadline || cell.today
								? cellStyle
								: ''}
							title={cell.isInRange ? cell.date : ''}
							on:click={() => cell.isInRange && toggleHabit(cell.date)}
						>
							{#if cell.streakEnd}
								<span class="contribution-graph__streak-count"
									>{cell.streakCount}</span
								>
							{/if}
						</div>
					{/each}
				{/each}
			</div>
		</div>
	</div>
</div>
