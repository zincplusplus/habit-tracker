<script lang="ts">
	import {debugLog, pluralize, renderPrettyDate} from './utils'
	import {onMount, onDestroy} from 'svelte'

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

	// TypeScript interfaces for better state management
	interface HabitTrackerSettings {
		path: string
		firstDisplayedDate: string
		lastDisplayedDate: string
		daysToShow: number
		debug: boolean
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
	export let pluginName: string
	export let globalSettings: {
		path: string
		firstDisplayedDate: string
		daysToShow: number
		debug: boolean
		matchLineLength: boolean
		defaultColor: string
		showStreaks: boolean
	}
	export let userSettings: Partial<{
		path: string
		firstDisplayedDate: string
		lastDisplayedDate: Date
		daysToShow: number
		debug: boolean
		matchLineLength: boolean
		color: string
		showStreaks: boolean
	}>

	// Default settings - use global settings as defaults
	const createDefaultSettings = (): HabitTrackerSettings => ({
		path: globalSettings.path,
		firstDisplayedDate: globalSettings.firstDisplayedDate || getDateAsString(subDays(new Date(), globalSettings.daysToShow - 1)),
		lastDisplayedDate: getDateAsString(new Date()),
		daysToShow: globalSettings.daysToShow,
		debug: globalSettings.debug,
		matchLineLength: globalSettings.matchLineLength,
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

		// Smart date/daysToShow logic: explicit user settings take priority
		const hasExplicitFirstDate = userSettings.firstDisplayedDate !== undefined
		const hasExplicitLastDate = userSettings.lastDisplayedDate !== undefined
		const hasExplicitDaysToShow = userSettings.daysToShow !== undefined

		// Start with defaults
		let resolvedSettings = {
			path: userSettings.path || state.settings.path,
			lastDisplayedDate: userSettings.lastDisplayedDate || state.settings.lastDisplayedDate,
			daysToShow: userSettings.daysToShow !== undefined ? userSettings.daysToShow : state.settings.daysToShow,
			matchLineLength:
				userSettings.matchLineLength !== undefined
					? userSettings.matchLineLength
					: state.settings.matchLineLength,
			debug:
				userSettings.debug !== undefined
					? userSettings.debug
					: state.settings.debug,
		}

		// Apply smart firstDisplayedDate logic
		if (hasExplicitFirstDate) {
			// User provided firstDisplayedDate - use it directly
			resolvedSettings.firstDisplayedDate = userSettings.firstDisplayedDate
			// If user also provided lastDisplayedDate, recalculate daysToShow to match the actual range
			if (hasExplicitLastDate) {
				const startDate = parseISO(userSettings.firstDisplayedDate)
				const endDate = parseISO(userSettings.lastDisplayedDate)
				resolvedSettings.daysToShow = eachDayOfInterval({ start: startDate, end: endDate }).length
			}
		} else if (hasExplicitDaysToShow || hasExplicitLastDate) {
			// User provided daysToShow and/or lastDisplayedDate but not firstDisplayedDate - calculate firstDisplayedDate from lastDisplayedDate
			resolvedSettings.firstDisplayedDate = getDateAsString(
				subDays(parseISO(resolvedSettings.lastDisplayedDate), resolvedSettings.daysToShow - 1)
			)
		} else {
			// No explicit user settings - use defaults
			resolvedSettings.firstDisplayedDate = state.settings.firstDisplayedDate
		}

		state.settings = resolvedSettings

		// Only validate essential business logic
		try {
			await validateEssentials(state.settings)
		} catch (error) {
			state.ui.fatalError = `Could not start: ${error.message}`
			console.error(`[${pluginName}] ${state.ui.fatalError}`)
			return
		}
		debugLog(state.settings, state.settings.debug)

		state.computed.dates = eachDayOfInterval({
			start: parseISO(state.settings.firstDisplayedDate),
			end: parseISO(state.settings.lastDisplayedDate),
		}).map((date) => getDateAsString(date))

		debugLog(`Will show habits for the following dates:`, state.settings.debug)
		debugLog(state.computed.dates, state.settings.debug)

		// Load habits
		state.computed.habits = getHabits(state.settings.path)
		if (state.computed.habits && state.computed.habits.length) {
			const count = state.computed.habits.length
			debugLog(
				`Found ${count} ${pluralize(count, 'habit')} at "${state.settings.path}" ↴`,
				state.settings.debug,
				undefined,
				pluginName,
			)
			debugLog(
				state.computed.habits.map((habit) => habit.path),
				state.settings.debug,
				undefined,
				pluginName,
			)
		} else {
			// TODO add a button so they can create a habit
			state.ui.fatalError = `No habits found at "${state.settings.path}"`
			debugLog(
				`No habits found at ${state.settings.path}`,
				state.settings.debug,
				undefined,
				pluginName,
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
				undefined,
				pluginName,
			)
			return
		}

		const parent = state.ui.rootElement.parentElement
		if (!parent) {
			debugLog(
				`scrollToEnd: parentElement is null, cannot scroll`,
				state.settings.debug,
				undefined,
				pluginName,
			)
			return
		}

		parent.scrollLeft = 99999999
		debugLog(`scrollToEnd completed`, state.settings.debug)
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

		debugLog(`Final settings are valid ↴`, state.settings.debug)
		return true
	}

	const getHabits = function (path: string): HabitData[] {
		debugLog(`Loading habits`, state.settings.debug)
		state.ui.habitSource = app.vault.getAbstractFileByPath(path)

		if (state.ui.habitSource && state.ui.habitSource instanceof TFolder) {
			// Filter to only include files, not subfolders
			const allItems = state.ui.habitSource.children
			const filesOnly = allItems.filter((item) => item instanceof TFile)
			const count = filesOnly.length
			debugLog(
				`"${path}" points to a folder with ${count} ${pluralize(count, 'file')} inside (ignoring subfolders)`,
				state.settings.debug,
				undefined,
				pluginName,
			)
			// Sort files alphabetically by name
			const sortedFiles = filesOnly.sort((a, b) => a.basename.localeCompare(b.basename))
			return sortedFiles as HabitData[]
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
				undefined,
				pluginName,
			)
			return [state.ui.habitSource as HabitData]
		}

		debugLog(`${path} is not found`, state.settings.debug)
		return []
	}

	$: if (state.ui.rootElement) {
		setTimeout(() => {
			scrollToEnd()
		}, 50)
	}

	// Listen for settings refresh events
	let refreshEventListener: (event: CustomEvent) => void

	onMount(() => {
		debugLog('Component mounted, setting up refresh listener')
		refreshEventListener = (event: CustomEvent) => {
			console.log(
				'[HabitTracker] Refresh event received:',
				event.detail.settings,
			)
			// Update global settings and reset state to use new defaults
			globalSettings = event.detail.settings

			// Reset state with new global settings as defaults
			state.settings = createDefaultSettings()
			console.log(
				'[HabitTracker] Reset state with new defaults:',
				state.settings,
			)

			console.log('[HabitTracker] Calling init with updated settings')
			init(userSettings)
		}

		// Listen for refresh events at the document level
		document.addEventListener('habit-tracker-refresh', refreshEventListener)
		debugLog('Refresh event listener added to document')
	})

	onDestroy(() => {
		if (refreshEventListener) {
			document.removeEventListener(
				'habit-tracker-refresh',
				refreshEventListener,
			)
		}
	})

	init(userSettings)
</script>

<!-- <svelte:window bind:innerWidth /> -->
{#if state.ui.fatalError}
	<div>
		<strong>🛑 {pluginName}</strong>
	</div>
	{state.ui.fatalError}
{:else if !state.computed.habits.length}
	<div>
		<strong>😕 {pluginName}</strong>
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
					data-ht21-date={date}
					data-ht21-pretty-date={renderPrettyDate(date)}
				>
					{getDate(parseISO(date))}
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
				{pluginName}
				{userSettings}
				{globalSettings}
			></Habit>
		{/each}
	</div>
{/if}
