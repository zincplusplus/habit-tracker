<script lang="ts">
	import { debugLog } from "./utils";

	import Habit from './Habit.svelte'

	import { TFile, TFolder, type Plugin } from 'obsidian'
	import { getDateAsString, getDayOfTheWeek } from './utils.js'
	import {
		eachDayOfInterval,
		format,
		getDate,
		isToday,
		isValid,
		parse,
		parseISO,
		subDays,
	} from 'date-fns';

	import {PLUGIN_NAME} from './main'
	// import {onMount} from 'svelte'

	export let app: Plugin['app']
	export let userSettings: Partial<{
		path: string
		lastDisplayedDate: Date
		daysToShow: number
		debug: number
	}>

	const defaultSettings = {
		lastDisplayedDate: getDateAsString(new Date()),
		daysToShow: 21,
		debug: 0
	}

	// actuall settings
	let path;
	let lastDisplayedDate;
	let daysToShow;
	let debug;
	let habits: Array<{
		[x: string]: any
		file: TFile
		entries: string[]
	}> = []
	let firstDisplayedDate;
	let dates = [];
	let fatalError;

	let habitSource;

	const init = async function(userSettings, defaultSettings) {
		if(userSettings.path) {
			userSettings.path = userSettings.path.replace(/\/$/, ''); // remove trailing slash
		}

		try {
			await validateUserSettings(userSettings);
		} catch(error) {
			fatalError = `Could not start due to this error: ` + error.message;
			console.error(`[${PLUGIN_NAME}] ${fatalError}`);
			return;
		}

		debugLog(`Applying default settings where you didn't provide anything:`, debug);
		debugLog(defaultSettings, debug);
		path = userSettings.path;
		daysToShow = userSettings.daysToShow || defaultSettings.daysToShow;
		lastDisplayedDate = userSettings.lastDisplayedDate || defaultSettings.lastDisplayedDate;
		debug = userSettings.debug || defaultSettings.debug;

		firstDisplayedDate = getDateAsString(subDays(lastDisplayedDate, daysToShow - 1));

		dates = eachDayOfInterval({start: firstDisplayedDate, end:lastDisplayedDate}).map((date)=> getDateAsString(date));
		debugLog(`Will show habits for the following dates:`,debug);
		debugLog(dates,debug);

		debugLog(`User settings:`,debug);
		debugLog(userSettings,debug);
		debugLog(`Final settings:`,debug);
		debugLog({
			path,
			daysToShow,
			lastDisplayedDate,
			debug,
			firstDisplayedDate,
			dates,
		}, debug);

		habits = getHabits(path);
		if(habits && habits.length) {
			debugLog(`Found ${habits.length} habit(s) at ${path}`, debug);
			debugLog(habits.map(habit=>habit.path), debug);
		} else {
			debugLog(`Found no habits at ${path}`, debug);
			return;
		}

	}

	const validateUserSettings = async function(settings) {
		const {
			path,
			lastDisplayedDate,
			daysToShow,
		} = settings;
		if(!path) { // mandatory
			fatalError = `path is a mandatory parameter, but you didn't provide it. Where should I load plugins from?`
			throw new Error(fatalError);
		}

		let pathIsValid = false;
		const folder = app.vault.getAbstractFileByPath(path);

		if (folder && folder instanceof TFolder) {
			pathIsValid = true;
		} else if(folder && folder instanceof TFile) {
			pathIsValid = true;
		}

		if(!pathIsValid) {
			const file = app.vault.getAbstractFileByPath(`${path}.md`);
			if(file) {
				pathIsValid = true;
			}
		}

		if(!pathIsValid) {
			throw new Error(`path "${path}" is pointing to a file/folder that does not exist.`);
		}

		// check if date provided is valid
		if(lastDisplayedDate) {
			const parsed = parse(lastDisplayedDate, "yyyy-MM-dd", new Date());
			if (!isValid(parsed)) {
				throw new Error(`You provided "${settings.lastDisplayedDate}" for lastDisapleydDate, but this doesn't look like a valid date.`);
			}
		}

		// check if daysToShow is an integer bigger than 0
		if(daysToShow) {
			if(!Number.isInteger(daysToShow) || daysToShow < 1) {
				throw new Error(`daysToShow needs to be an integer bigger than 0. Instead I got the ${typeof daysToShow} "${daysToShow}"`);
			}
		}

		debugLog(`[${PLUGIN_NAME}] User settings look good.`, debug);
		return true;
	}

	const getHabits = function(path:String) {
		debugLog(`Loading habits`, debug);
		habitSource = app.vault.getAbstractFileByPath(path);

		if (habitSource && habitSource instanceof TFolder) {
			debugLog(`${path} points to a folder with ${habitSource.children.length} item(s) inside`, debug);
			return habitSource.children;
		}

		if(habitSource && habitSource instanceof TFile) {
			debugLog(`${path} points to a file`, debug);
			return [habitSource];
		}

		habitSource = app.vault.getAbstractFileByPath(`${path}.md`);
		// FIXME this needs to be visible outside of this function
		if(habitSource) {
			debugLog(`Adjusted ${path} to ${path}.md and found a file`, debug);
			return [habitSource]
		};

		debugLog(`${path} is not found`, debug);
		return [];
	}

	const renderPrettyDate = function(dateString) {
		// Parse the input date string into a Date object
    const date = parseISO(dateString);

    // Format the date using date-fns
    let prettyDate = format(date, 'MMMM d, yyyy');

		if(isToday(date)) {
			prettyDate = `Today, ${prettyDate}`;
		}

    return prettyDate;
	}

	init(userSettings, defaultSettings);
</script>

<!-- <svelte:window bind:innerWidth /> -->
{#if fatalError}
<div>
	<strong>🛑 {PLUGIN_NAME}</strong>
</div>
{fatalError}
{:else if !habits.length}
<div>
	<strong>😕 {PLUGIN_NAME}</strong>
</div>
No habits to show at "{path}"
{:else}
<div class="habit-tracker" style="--date-columns: {dates.length}">
	<div class="habit-tracker__header habit-tracker__row">
		<div class="habit-tracker__cell--name habit-tracker__cell"></div>
		{#each dates as date}
		<div class="habit-tracker__cell habit-tracker__cell--{getDayOfTheWeek(date)}" data-date="{date}" data-pretty-date="{renderPrettyDate(date)}">
			{getDate(date)}
		</div>
		{/each}
	</div>
	{#each habits as habit}
	<Habit name={habit.basename} path={habit.path} dates={dates} debug={debug} app={app}></Habit>
	{/each}
</div>
{/if}
