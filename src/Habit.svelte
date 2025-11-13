<script>
	import {debugLog} from './utils'

	import {parseYaml, TFile} from 'obsidian'
	import {getDateAsString, getDayOfTheWeek} from './utils'
	import {addDays, parseISO} from 'date-fns'

	export let app
	export let name
	export let path
	export let dates
	export let debug
	export let pluginName

	let entries = []
	let frontmatter = {}
	let habitName = name
	$: entriesInRange = dates.reduce((acc, date) => {
		const ticked = entries.includes(date)
		acc[date] = {
			ticked,
			streak: findStreak(date),
		}
		return acc
	}, {})

	let savingChanges = false

	$: getClasses = function (date) {
		let classes = [
			'habit-tracker__cell',
			`habit-tracker__cell--${getDayOfTheWeek(date)}`,
			'habit-tick',
		]

		if (entriesInRange[date].ticked) {
			classes.push('habit-tick--ticked')
		}
		const streak = entriesInRange[date].streak
		if (streak) {
			classes.push('habit-tick--streak')
		}
		if (streak == 1) {
			classes.push('habit-tick--streak-start')
		}

		let isNextDayTicked = false
		const nextDate = getDateAsString(addDays(parseISO(date), 1))
		if (date === dates.at(-1)) {
			// last in the dates in range
			isNextDayTicked = entries.includes(nextDate)
		} else {
			isNextDayTicked = entriesInRange[nextDate].ticked
		}

		if (entriesInRange[date].ticked && !isNextDayTicked) {
			classes.push('habit-tick--streak-end')
		}

		return classes.join(' ')
	}

	const findStreak = function (date) {
		let currentDate = parseISO(date)
		let streak = 0

		while (entries.includes(getDateAsString(currentDate))) {
			streak++
			currentDate.setDate(currentDate.getDate() - 1)
		}

		return streak
	}

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

					if (!frontmatter) return {}

					return parseYaml(frontmatter)
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

		// TODO though this looks to be performing ok, i think i should set the watchers more efficiently
		app.vault.on('modify', (file) => {
			if (file.path === path) {
				if (!savingChanges) {
					console.log('oh shit, i was modified')
					init()
				}
				savingChanges = false
			}
		})
	}

	const toggleHabit = function (date) {
		const file = this.app.vault.getAbstractFileByPath(path)
		if (!file || !(file instanceof TFile)) {
			new Notice(`${pluginName}: file missing while trying to toggle habit`)
			return
		}

		let newEntries = [...entries]
		if (entriesInRange[date].ticked) {
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
</script>

<!-- <div bind:this={rootElement}> -->
<div class="habit-tracker__row">
	<div class="habit-tracker__cell--name habit-tracker__cell">
		<a
			href={path}
			aria-label={path}
			class="internal-link">{habitName}</a
		>
	</div>
	{#if Object.keys(entriesInRange).length}
		{#each dates as date}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class={getClasses(date)}
				ticked={entriesInRange[date].ticked}
				streak={entriesInRange[date].streak}
				on:click={() => toggleHabit(date)}
			></div>
		{/each}
	{/if}
</div>
