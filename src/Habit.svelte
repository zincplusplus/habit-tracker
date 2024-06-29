<script>
	// TODO ADD TypeScript
	import {PLUGIN_NAME} from './main'
	import { debugLog } from "./utils";

	import {parseYaml, TFile} from 'obsidian'
	import { getDateAsString, getDayOfTheWeek } from './utils'
	import { addDays } from 'date-fns'

	export let app;
	export let name;
	export let path;
	export let dates;
	export let debug;

	let entries = [];
	$: entriesInRange = dates.reduce((acc, date) => {
		const ticked = entries.includes(date);
		acc[date] = {
			ticked,
			streak: findStreak(date)
		};
		return acc;
	}, {});

	let savingChanges = false;

	// const addStreakInfo(entriesInRage) {
	// 	Object.keys(entriesInRange).forEach(date=> {

	// 	})
	// }


	$: getClasses = function(date) {
		let classes = [
		'habit-tracker__cell',
		`habit-tracker__cell--${getDayOfTheWeek(date)}`,
		'habit-tick'
		];

		if (entriesInRange[date].ticked) {
			classes.push('habit-tick--ticked')
		}
		const streak = entriesInRange[date].streak
		if (streak) {
			classes.push('habit-tick--streak');
		}
		if (streak == 1) {
			classes.push('habit-tick--streak-start');
		}

		let isNextDayTicked = false;
		const nextDate = getDateAsString(addDays(date,1));
		if(date === dates.at(-1)) {
			// last in the dates in range
			isNextDayTicked = entries.includes(nextDate);
		} else {
			isNextDayTicked = entriesInRange[nextDate].ticked
		}

		if(entriesInRange[date].ticked && !isNextDayTicked) {
			classes.push('habit-tick--streak-end');
		}

		return classes.join(' ');
	}

	const findStreak = function(date){
		let currentDate = new Date(date);
		let streak = 0

		while (entries.includes(getDateAsString(currentDate))) {
			streak++
			currentDate.setDate(currentDate.getDate() - 1)
		}

		return streak;
	}

	const init = async function() {

		debugLog(`[${PLUGIN_NAME}] Loading habit ${name}`, debug);

		const getFrontmatter = async function(path) {
			const file = this.app.vault.getAbstractFileByPath(path)

			if (!file || !(file instanceof TFile) ) {
				debugLog(`[${PLUGIN_NAME}] No file found for path: ${path}`, debug)
				return {}
			}

			try {
				return await this.app.vault.read(file).then((result) => {
					const frontmatter = result.split('---')[1]

					if (!frontmatter) return {}

					return parseYaml(frontmatter)
				})
			} catch (error) {
				debugLog(`[${PLUGIN_NAME}] Error in habit ${name}: error.message`, debug);
				return {}
			}

		}
		const getHabitEntries = async function(path) {
			let fm = await getFrontmatter(path);

			return fm.entries || [];
		}


		entries = await getHabitEntries(path);

		debugLog(`[${PLUGIN_NAME}] Habit "${name}": Found ${entries.length} entries`, debug);
		debugLog(entries, debug);

		// TODO though this looks to be performing ok, i think i should set the watchers more efficiently
		app.vault.on('modify', (file)=> {
			if(file.path === path) {
				if(!savingChanges) {
					console.log('oh shit, i was modified');
					init();
				}
				savingChanges = false;
			}

		})
	}

	const toggleHabit = function(date) {
		const file = this.app.vault.getAbstractFileByPath(path)
		if (!file ||!(file instanceof TFile)) {
			new Notice(`${PLUGIN_NAME}: file missing while trying to toggle habit`)
			return
		}

		let newEntries = [...entries];
		if(entriesInRange[date].ticked) {
			newEntries = newEntries.filter((e) => e!== date)
		} else {
			newEntries.push(date);
		}
		entries = newEntries;

		savingChanges = true;
		this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter['entries'] = entries
		})

	}

	init();
</script>

<!-- <div bind:this={rootElement}> -->
<div class="habit-tracker__row">
	<div class="habit-tracker__cell--name habit-tracker__cell">
		<a href="{path}" aria-label="{path}" class="internal-link">{name}</a>
	</div>
	{#if Object.keys(entriesInRange).length}
	{#each dates as date}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
	class="{getClasses(date)}"
	ticked="{entriesInRange[date].ticked}"
	streak="{entriesInRange[date].streak}"
	on:click={() => toggleHabit(date)}
	></div>
	{/each}
	{/if}
</div>
