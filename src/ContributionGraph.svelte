<script>
	import {debugLog, isValidCSSColor} from './utils'

	import {onDestroy} from 'svelte'
	import {parseYaml, TFile} from 'obsidian'
	import {parseISO, format, getDay, startOfWeek, addDays, isBefore, isAfter, isSameDay} from 'date-fns'

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
	let customColor = ''
	let savingChanges = false

	$: {
		const resolvedColor =
			frontmatter.color || userSettings.color || globalSettings.defaultColor
		if (resolvedColor && isValidCSSColor(resolvedColor)) {
			customColor = resolvedColor
		} else {
			customColor = ''
		}
	}

	// Build the contribution graph grid: rows = days of week (Mon-Sun), columns = weeks
	$: graph = (() => {
		if (!dates || dates.length === 0) return {weeks: [], monthLabels: [], dayLabels: []}

		const entrySet = new Set(entries)
		const firstDate = parseISO(dates[0])
		const lastDate = parseISO(dates[dates.length - 1])

		// Start from the Monday of the week containing the first date
		const weekStart = startOfWeek(firstDate, {weekStartsOn: 1}) // 1 = Monday

		const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
		const weeks = []
		const monthLabels = []

		let currentDate = weekStart
		let weekIndex = 0

		while (isBefore(currentDate, lastDate) || isSameDay(currentDate, lastDate)) {
			const week = []
			let weekMonthLabel = ''

			for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
				const cellDate = addDays(currentDate, dayOfWeek)
				const dateStr = format(cellDate, 'yyyy-MM-dd')
				const isInRange = !isBefore(cellDate, firstDate) && !isAfter(cellDate, lastDate)
				const ticked = isInRange && entrySet.has(dateStr)

				// Show month label on the first week, or when a new month starts
				if (weekIndex === 0 && dayOfWeek === 0) {
					weekMonthLabel = format(cellDate, 'MMM')
				} else if (format(cellDate, 'd') === '1') {
					weekMonthLabel = format(cellDate, 'MMM')
				}

				week.push({
					date: dateStr,
					ticked,
					isInRange,
				})
			}

			if (weekMonthLabel && monthLabels[monthLabels.length - 1]?.label !== weekMonthLabel) {
				monthLabels.push({weekIndex, label: weekMonthLabel})
			}

			weeks.push(week)
			currentDate = addDays(currentDate, 7)
			weekIndex++
		}

		return {weeks, monthLabels, dayLabels}
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
	<div class="contribution-graph__body">
		<div class="contribution-graph__day-labels">
			{#each graph.dayLabels as label, i}
				<div class="contribution-graph__day-label" class:contribution-graph__day-label--hidden={i % 2 === 1}>
					{label}
				</div>
			{/each}
		</div>
		<div class="contribution-graph__grid-wrapper">
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
			<div
				class="contribution-graph__grid"
				style="--graph-weeks: {graph.weeks.length}"
			>
				{#each graph.weeks as week}
					{#each week as cell}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="contribution-graph__cell"
							class:contribution-graph__cell--ticked={cell.ticked}
							class:contribution-graph__cell--empty={!cell.isInRange}
							style={cell.ticked && customColor ? `--graph-cell-color: ${customColor}` : ''}
							title={cell.isInRange ? cell.date : ''}
							on:click={() => cell.isInRange && toggleHabit(cell.date)}
						></div>
					{/each}
				{/each}
			</div>
		</div>
	</div>
</div>
