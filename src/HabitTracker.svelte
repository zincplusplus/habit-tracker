<script lang="ts">
	import {
		addDays,
		formatISO,
		getDate,
		getISODay,
		isSameDay,
		isSaturday,
		isSunday,
		isToday,
		subDays,
	} from 'date-fns'
	import {Notice, TFile, type Plugin} from 'obsidian'
	import {NewHabitModal} from './NewHabitModal'
	import {PLUGIN_NAME} from './main'
	import {onMount} from 'svelte'

	export let app: Plugin['app']
	export let userSettings: Partial<{
		path: string
		lastDisplayedDate: Date
		daysToShow: number
		dateToHighlight: Date | undefined
		showWeekdays: boolean
		showNewHabitButton: boolean
		showEmptyHabits: boolean
	}>

	const {
		path = 'Habits/',
		lastDisplayedDate = new Date(),
		daysToShow = 21,
		dateToHighlight = undefined,
		showWeekdays = false,
		showNewHabitButton = true,
		showEmptyHabits = true,
	} = userSettings

	const getDateId = (date: Date) => formatISO(date, {representation: 'date'})

	const dates: Date[] = []
	for (let i = 0; i < daysToShow; i++) {
		dates.unshift(subDays(lastDisplayedDate, i))
	}
	let innerWidth: number
	$: datesToDisplay = innerWidth > 400 ? dates : dates.slice(-7)

	let habits: Array<{
		file: TFile
		entries: string[]
	}> = []
	function updateHabits() {
		habits = app.vault
			.getMarkdownFiles()
			.filter((file) => file.path.includes(path))
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((file) => {
				app.fileManager.processFrontMatter(file, (frontmatter) => {
					const habit = habits.find((h) => h.file === file)

					if (habit) habit.entries = frontmatter.entries || []
					habits = habits
				})

				return {
					file,
					entries: habits.find((h) => h.file === file)?.entries || [],
				}
			})
	}
	updateHabits()
	$: habitsToDisplay = showEmptyHabits
		? habits
		: habits.filter((habit) => {
				for (const date of datesToDisplay) {
					if (habit.entries.includes(getDateId(date))) {
						return true
					}
				}
				return false
			})

	function toggleHabit(habit: (typeof habits)[number], date: Date) {
		const dateString = getDateId(date)
		const checked = habit.entries.contains(dateString)
		app.fileManager.processFrontMatter(habit.file, (frontmatter) => {
			let entries: string[] = frontmatter['entries'] || []
			if (checked) {
				entries = entries.filter((e: string) => e !== dateString)
			} else {
				entries.push(dateString)
				entries.sort()
			}
			frontmatter['entries'] = entries
			habit.entries = entries
			habits = habits
		})
	}

	function countStreak(entries: string[], date: Date) {
		let streak = 0
		while (entries.includes(getDateId(date))) {
			streak++
			date = subDays(date, 1)
		}
		return streak
	}

	function handleNewHabit() {
		new NewHabitModal(app, async (name) => {
			try {
				await app.vault.createFolder(path)
			} catch {
				/* nothing to do */
			}
			const fileName = path.endsWith('/')
				? `${path}${name}.md`
				: `${path}/${name}.md`
			try {
				const file = await app.vault.create(fileName, '')
				habits.push({file, entries: []})
				habits = habits
			} catch (e) {
				new Notice(`${PLUGIN_NAME} ${e}`)
			}
		}).open()
	}

	onMount(function autoUpdateHabits() {
		const interval = setInterval(updateHabits, 5000)
		return () => clearInterval(interval)
	})
</script>

<svelte:window bind:innerWidth />

<table style:--datesToDisplay={datesToDisplay.length}>
	<tr>
		<th>
			{#if showNewHabitButton}
				<button
					class="newHabitButton"
					on:click={handleNewHabit}
				>
					➕
				</button>
			{/if}
		</th>
		{#each datesToDisplay as date}
			<th
				class="days"
				class:weekend={isSaturday(date) || isSunday(date)}
				class:today={isToday(date)}
				class:highlighted={dateToHighlight
					? isSameDay(date, dateToHighlight)
					: undefined}
			>
				{#if showWeekdays}
					{[undefined, 'M', 'T', 'W', 'T', 'F', 'S', 'S'][getISODay(date)]}
				{:else}
					{getDate(date)}
				{/if}
			</th>
		{/each}
	</tr>

	{#each habitsToDisplay as habit}
		{@const habitName = habit.file.name.replace('.md', '')}
		<tr>
			<th>
				<a
					class="internal-link"
					href={habit.file.path}
				>
					{habitName}
				</a>
			</th>
			{#each datesToDisplay as date}
				{@const checked = habit.entries.contains(getDateId(date))}
				{@const previousDayChecked = habit.entries.contains(
					getDateId(subDays(date, 1)),
				)}
				{@const nextDayChecked = habit.entries.contains(
					getDateId(addDays(date, 1)),
				)}
				{@const isStreakEnd = previousDayChecked && checked && !nextDayChecked}
				<td
					class:today={isToday(date)}
					class:weekend={isSaturday(date) || isSunday(date)}
					class:highlighted={dateToHighlight
						? isSameDay(date, dateToHighlight)
						: undefined}
					class:checked
					class:previousDayChecked
					class:nextDayChecked
				>
					<button on:click={() => toggleHabit(habit, date)}>
						{checked ? 'Uncheck' : 'Check'}
						{habitName}
					</button>
					{#if isStreakEnd}
						<span class="streak">
							{countStreak(habit.entries, date)}
						</span>
					{/if}
				</td>
			{/each}
		</tr>
	{/each}
</table>

{#if habits.length === 0}
	<p>
		No habits found under {path}.
	</p>

	<button
		class="newHabitButton"
		on:click={handleNewHabit}
	>
		➕ Add a new habit
	</button>
{/if}

<style>
	:global(
			.cm-preview-code-block.markdown-rendered:has(.block-language-habittracker)
		) {
		width: fit-content;
	}

	table {
		display: grid;
		grid-template-columns: minmax(8rem, 1fr) repeat(
				var(--datesToDisplay),
				minmax(16px, 1fr)
			);
	}

	tr {
		display: contents;
	}

	td,
	th {
		padding: 0;
		min-width: 0;
		border: none;
		border-bottom: var(--table-border-width) solid var(--table-border-color);
	}

	.newHabitButton {
		padding: var(--size-4-1);
		aspect-ratio: 1/1;
	}

	.days {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.weekend {
		background-color: var(--color-base-05);
	}

	.highlighted {
		background-color: var(--color-base-20);
	}

	.today {
		background-color: hsla(var(--interactive-accent-hsl), 10%);
	}

	tr:has(td:hover) th,
	tr:has(td:hover) td {
		background-color: var(--color-base-10);
	}
	tr:has(td:hover) td:hover {
		background-color: var(--color-base-30);
	}

	td {
		position: relative;
	}

	td > button {
		width: 100%;
		height: 100%;
		position: absolute;
		opacity: 0;
		cursor: pointer;
		overflow: hidden;
	}

	td.checked::before {
		position: absolute;
		content: '';
		display: inline-block;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		height: 80%;
		width: 100%;
		border-radius: 1rem;
		background: var(--interactive-accent);
	}

	td:hover.checked::before {
		background-color: hsla(var(--interactive-accent-hsl), 50%);
	}

	td.checked.previousDayChecked::before {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	td.checked.nextDayChecked::before {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	.streak {
		position: absolute;
		pointer-events: none;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 0.8rem;
	}
</style>
