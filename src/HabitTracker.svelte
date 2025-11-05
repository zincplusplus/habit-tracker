<script lang="ts">
	import {debugLog, pluralize} from './utils'

	import Habit from './Habit.svelte'

	import {TFile, TFolder, type Plugin} from 'obsidian'
	import {getDateAsString, getDayOfTheWeek} from './utils.js'
	import {
		eachDayOfInterval,
		format,
		getDate,
		isToday,
		parseISO,
		subDays,
	} from 'date-fns'

	import {PLUGIN_NAME} from './main'
	// import {onMount} from 'svelte'

	// TypeScript interfaces for better state management
	interface HabitTrackerSettings {
		path: string
		lastDisplayedDate: string
		daysToShow: number
		debug: number
		matchLineLength: boolean
	}

	interface HabitData {
		[x: string]: any
		file: TFile
		entries: string[]
	}

	interface ComputedState {
		dates: string[]
		habits: HabitData[]
	}

	interface UIState {
		fatalError: string
		rootElement: HTMLElement | null
		habitSource: TFile | TFolder | null
	}

	interface HabitTrackerState {
		settings: HabitTrackerSettings
		computed: ComputedState
		ui: UIState
	}

	export let app: Plugin['app']
	// TODO: I don't like the name "matchLineLenghth", rename it to something better
	// TODO: Why is matchLineLenght a boolean and debug a number? Make them consistent
	export let userSettings: Partial<{
		path: string
		lastDisplayedDate: Date
		daysToShow: number
		debug: number
		matchLineLength: boolean
	}>

	// Default settings
	const createDefaultSettings = (): HabitTrackerSettings => ({
		path: '',
		lastDisplayedDate: getDateAsString(new Date()),
		daysToShow: 21,
		debug: 0,
		matchLineLength: false,
	})

	// Initialize unified state
	let state: HabitTrackerState = {
		settings: createDefaultSettings(),
		computed: {
			dates: [],
			habits: [],
		},
		ui: {
			fatalError: '',
			rootElement: null,
			habitSource: null,
		},
	}

	const init = async function (userSettings: Partial<HabitTrackerSettings>) {
		// Clean up path (remove trailing slash)
		if (userSettings.path) {
			userSettings.path = userSettings.path.replace(/\/$/, '')
		}

		// Merge user settings with defaults first (let TypeScript handle type safety)
		state.settings = {
			path: userSettings.path || '',
			daysToShow: userSettings.daysToShow || state.settings.daysToShow,
			lastDisplayedDate:
				userSettings.lastDisplayedDate || state.settings.lastDisplayedDate,
			matchLineLength:
				userSettings.matchLineLength || state.settings.matchLineLength,
			debug: userSettings.debug || state.settings.debug,
		}

		// Only validate essential business logic
		try {
			await validateEssentials(state.settings)
		} catch (error) {
			state.ui.fatalError = `Could not start: ${error.message}`
			console.error(`[${PLUGIN_NAME}] ${state.ui.fatalError}`)
			return
		}
		debugLog(`Merged settings:`, state.settings.debug)
		debugLog(state.settings, state.settings.debug)

		const firstDisplayedDate = getDateAsString(
			subDays(state.settings.lastDisplayedDate, state.settings.daysToShow - 1),
		)

		state.computed.dates = eachDayOfInterval({
			start: firstDisplayedDate,
			end: state.settings.lastDisplayedDate,
		}).map((date) => getDateAsString(date))

		debugLog(`Will show habits for the following dates:`, state.settings.debug)
		debugLog(state.computed.dates, state.settings.debug)

		// Load habits
		state.computed.habits = getHabits(state.settings.path)
		if (state.computed.habits && state.computed.habits.length) {
			const count = state.computed.habits.length
			debugLog(
				`Found ${count} ${pluralize(count, 'habit')} at ${state.settings.path}`,
				state.settings.debug,
			)
			debugLog(
				state.computed.habits.map((habit) => habit.path),
				state.settings.debug,
			)
		} else {
			state.ui.fatalError = `No habits found at "${state.settings.path}"`
			debugLog(
				`No habits found at ${state.settings.path}`,
				state.settings.debug,
			)
			return
		}

		debugLog(`Initialization completed successfully`, state.settings.debug)
	}

	const scrollToEnd = function () {
		if (!state.ui.rootElement) {
			debugLog(
				`scrollToEnd: rootElement is null, cannot scroll`,
				state.settings.debug,
			)
			return
		}

		const parent = state.ui.rootElement.parentElement
		if (!parent) {
			debugLog(
				`scrollToEnd: parentElement is null, cannot scroll`,
				state.settings.debug,
			)
			return
		}

		parent.scrollLeft = parent.scrollWidth
		debugLog(
			`scrollToEnd completed: element=${state.ui.rootElement}, parent=${parent}, scrollLeft=${parent.scrollLeft}, scrollWidth=${parent.scrollWidth}`,
			state.settings.debug,
		)
	}

	const validateEssentials = async function (
		settings: Partial<HabitTrackerSettings>,
	) {
		// Only validate critical business logic that TypeScript can't catch
		if (!settings.path) {
			throw new Error('path is required - where should I load habits from?')
		}

		// Check if the path exists in the vault (Obsidian-specific validation)
		const source = app.vault.getAbstractFileByPath(settings.path)
		if (!source) {
			// Try with .md extension as fallback
			const mdSource = app.vault.getAbstractFileByPath(`${settings.path}.md`)
			if (!mdSource) {
				throw new Error(`"${settings.path}" doesn't exist in your vault`)
			}
		}

		debugLog(
			`[${PLUGIN_NAME}] Essential validation passed for path: ${settings.path}`,
			state.settings.debug,
		)
		return true
	}

	const getHabits = function (path: string): HabitData[] {
		debugLog(`Loading habits`, state.settings.debug)
		state.ui.habitSource = app.vault.getAbstractFileByPath(path)

		if (state.ui.habitSource && state.ui.habitSource instanceof TFolder) {
			const count = state.ui.habitSource.children.length
			debugLog(
				`${path} points to a folder with ${count} ${pluralize(count, 'item')} inside`,
				state.settings.debug,
			)
			return state.ui.habitSource.children as HabitData[]
		}

		if (state.ui.habitSource && state.ui.habitSource instanceof TFile) {
			debugLog(`${path} points to a file`, state.settings.debug)
			return [state.ui.habitSource as HabitData]
		}

		state.ui.habitSource = app.vault.getAbstractFileByPath(`${path}.md`)
		if (state.ui.habitSource) {
			debugLog(
				`Adjusted ${path} to ${path}.md and found a file`,
				state.settings.debug,
			)
			return [state.ui.habitSource as HabitData]
		}

		debugLog(`${path} is not found`, state.settings.debug)
		return []
	}

	const renderPrettyDate = function (dateString) {
		// Parse the input date string into a Date object
		const date = parseISO(dateString)

		// Format the date using date-fns
		let prettyDate = format(date, 'MMMM d, yyyy')

		if (isToday(date)) {
			prettyDate = `Today, ${prettyDate}`
		}

		return prettyDate
	}

	$: if (state.ui.rootElement) {
		scrollToEnd()
	}

	init(userSettings)
</script>

<!-- <svelte:window bind:innerWidth /> -->
{#if state.ui.fatalError}
	<div>
		<strong>🛑 {PLUGIN_NAME}</strong>
	</div>
	{state.ui.fatalError}
{:else if !state.computed.habits.length}
	<div>
		<strong>😕 {PLUGIN_NAME}</strong>
	</div>
	No habits to show at "{state.settings.path}"
{:else}
	<div
		class="habit-tracker {state.settings.matchLineLength
			? 'habit-tracker--match-line-length'
			: ''}"
		style="--date-columns: {state.computed.dates.length}"
		bind:this={state.ui.rootElement}
	>
		<div class="habit-tracker__header habit-tracker__row">
			<div class="habit-tracker__cell--name habit-tracker__cell"></div>
			{#each state.computed.dates as date}
				<div
					class="habit-tracker__cell habit-tracker__cell--{getDayOfTheWeek(
						date,
					)}"
					data-date={date}
					data-pretty-date={renderPrettyDate(date)}
				>
					{getDate(date)}
				</div>
			{/each}
		</div>
		{#each state.computed.habits as habit}
			<Habit
				name={habit.basename}
				path={habit.path}
				dates={state.computed.dates}
				debug={state.settings.debug}
				{app}
			></Habit>
		{/each}
	</div>
{/if}
