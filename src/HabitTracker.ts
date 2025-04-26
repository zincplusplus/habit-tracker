// Working with files and folders in your plugin: https://www.youtube.com/watch?v=_QFUOyIB1nY
// Display data in views and status bar: https://www.youtube.com/watch?v=zR86pftlOsg&ab_channel=Obsidian
// Easy and fast UI development with Svelte: https://www.youtube.com/watch?v=mCF80HBfUWA&ab_channel=Obsidian
// https://github.com/OliverBalfour/obsidian-pandoc/blob/master/renderer.ts
// example of replacing codeblocks https://github.com/joleaf/obsidian-email-block-plugin
// https://ourgreenstory.com/nl/sticky-whiteboard/habit-tracker/
// listen to file change https://github.com/obsidianmd/obsidian-api/blob/c01fc3074deeb3dfc6ee02546d113b448735b294/obsidian.d.ts#L3724

import { App, parseYaml, Notice, TAbstractFile, TFile, Vault } from 'obsidian'

const PLUGIN_NAME = 'Habit Tracker 21'
/* i want to show that a streak is already ongoing even if the previous dates are not rendered
	so I load an extra date in the range, but never display it in the UI */
const DAYS_TO_SHOW = 21
const DAYS_TO_LOAD = DAYS_TO_SHOW + 1
const TODAY = new Date()

interface HabitTrackerSettings {
	path: string
	lastDisplayedDate: string
	daysToShow: number
	daysToLoad: number
	rootElement: HTMLElement | undefined
	habitsContainer: HTMLDivElement | undefined
	debug: number
}

const DEFAULT_SETTINGS = (): HabitTrackerSettings => ({
	path: 'Habits',
	lastDisplayedDate: getTodayDate(),
	daysToShow: DAYS_TO_SHOW,
	daysToLoad: DAYS_TO_LOAD,
	rootElement: undefined,
	habitsContainer: undefined,
	debug: 0,
})

const ALLOWED_USER_SETTINGS = [
	'path',
	'lastDisplayedDate',
	'daysToShow',
	'debug'
]

function getTodayDate() {
	const year = TODAY.getFullYear()
	const month = String(TODAY.getMonth() + 1).padStart(2, '0')
	const day = String(TODAY.getDate()).padStart(2, '0')

	return `${year}-${month}-${day}`
}

export default class HabitTracker {
	settings: HabitTrackerSettings
	app: App
	id: string

	constructor(source: string, element: HTMLElement, context, app) {
		this.app = app
		this.id = this.generateUniqueId()
		this.settings = this.loadSettings(source)
		this.settings.rootElement = element
		// console.log(`${PLUGIN_NAME} got with these settings:`, this.settings)

		const files = this.getHabitsFiles(this.app.vault, this.settings.path)

		const noHabitsFiles = files.length === 0

		if (noHabitsFiles) {
			this.renderNoHabitsFoundMessage()
			return
		}

		console.log(
			`${PLUGIN_NAME} loaded successfully ${files.length} file(s) from ${this.settings.path}`,
		)

		this.settings.habitsContainer = this.renderRoot(element)

		// 2.2 render the header
		this.renderHeader(this.settings.habitsContainer)

		// 2.3 render each habit
		this.renderHabits(files)
	}

	private async renderHabits(files: TFile[]) {
		for (const file of files) {
			const entries = await this.getHabitEntries(file.path);
			this.renderHabit(file.path, entries);
		}

		if (this.settings.debug) {
			this.renderDebugData();
		}
	}

	getHabitsFiles(vault: Vault, path: string) {
		return vault
			.getMarkdownFiles()
			.filter(file => file.path.includes(path))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	loadSettings(rawSettings) {
		try {
			let settings = Object.assign(
				{},
				DEFAULT_SETTINGS(),
				this.removePrivateSettings(JSON.parse(rawSettings)),
			)
			/* i want to show that a streak is already ongoing even if the previous dates are not rendered
			so I load an extra date in the range, but never display it in the UI */
			settings.daysToLoad = settings.daysToShow + 1
			return settings
		} catch (error) {
			console.log(error);
			new Notice(
				`${PLUGIN_NAME}: received invalid settings. continuing with default settings`,
			)
			return DEFAULT_SETTINGS()
		}
	}

	removePrivateSettings(userSettings) {
		const result = {}
		for (const key of ALLOWED_USER_SETTINGS) {
			if (userSettings[key]) {
				result[key] = userSettings[key]
			}
		}

		return result
	}

	renderDebugData() {
		this.settings.rootElement?.createEl('pre', {
			// get the json printed with indentation
			text: JSON.stringify(this.settings, undefined, 2),
		})
	}

	renderNoHabitsFoundMessage() {
		this.settings.rootElement?.createEl('div', {
			text: `No habits found under ${this.settings.path}`,
		})
	}

	renderRoot(parent) {
		const rootElement: HTMLDivElement = parent.createEl('div', {
			cls: 'habit-tracker',
		})

		rootElement.setAttribute('id', this.id)
		// Todo: where is the unsubscribe from this event listener?

		rootElement.addEventListener('click', (event) => {
			const target = event.target
			if (!(target instanceof HTMLElement)) return;

			if (target.classList.contains('habit-tick')) {
				this.toggleHabit(target)
			}
		})

		return rootElement
	}

	renderHeader(parent) {
		const header = parent.createEl('div', {
			cls: 'habit-tracker__header habit-tracker__row',
		})

		header.createEl('div', {
			text: '',
			cls: 'habit-tracker__cell--name habit-tracker__cell',
		})

		const currentDate = this.createDateFromFormat(
			this.settings.lastDisplayedDate,
		)
		currentDate.setDate(currentDate.getDate() - this.settings.daysToLoad + 1)

		for (let index = 0; index < this.settings.daysToLoad; index++) {
			const day = currentDate.getDate().toString()
			header.createEl('div', {
				cls: `habit-tracker__cell habit-tracker__cell--${this.getDayOfWeek(
					currentDate,
				)}`,
				text: day,
				attr: {
					'data-date': this.getDateId(currentDate),
				},
			})
			currentDate.setDate(currentDate.getDate() + 1)
		}
	}

	async getFrontmatter(path: string) {
		const file: TAbstractFile | null = this.app.vault.getAbstractFileByPath(path)

		if (!file || !(file instanceof TFile)) {
			new Notice(`${PLUGIN_NAME}: No file found for path: ${path}`)
			return {}
		}

		try {
			return await this.app.vault.read(file).then((result) => {
				const frontmatter = result.split('---')[1]

				if (!frontmatter) return {}

				return parseYaml(frontmatter)
			})
		} catch {
			return {}
		}
	}

	async getHabitEntries(path: string) {
		const frontMatter = await this.getFrontmatter(path)
		return frontMatter.entries ?? []
	}

	renderHabit(path: string, entries: string[]) {
		// console.log('rendering a habit')
		if (!this.settings.habitsContainer) {
			new Notice(`${PLUGIN_NAME}: missing div that holds all habits`)
			return
		}

		const parent = this.settings.habitsContainer

		const name = path.split('/').pop()?.replace('.md', '')

		// no. this needs to be queried inside this.settings.rootElement;
		let row = parent.querySelector(`*[data-id="${this.pathToId(path)}"]`) as HTMLElement

		if (row) {
			this.removeAllChildNodes(row)
		} else {
			row = this.settings.habitsContainer.createEl('div', {
				cls: 'habit-tracker__row',
			})
			row.dataset.id = this.pathToId(path)
		}

		const habitTitle = row.createEl('div', {
			cls: 'habit-tracker__cell--name habit-tracker__cell',
		})

		habitTitle.createEl('a', {
			text: name,
			cls: 'internal-link',
			href: path,
			attr: {
				'aria-label': path
			}
		})

		const currentDate = this.createDateFromFormat(
			this.settings.lastDisplayedDate,
		)
		currentDate.setDate(currentDate.getDate() - this.settings.daysToLoad + 1) // TODO: why +1? Because you show all previous days + today

		const entriesSet = new Set(entries)

		for (const date of this.dateRange(currentDate, this.settings.daysToLoad)) {
			this.createHabitCell(row, date, path, entriesSet, entries);
		}
	}

	private *dateRange(startDate: Date, days: number) {
		const currentDate = new Date(startDate);
		for (let index = 0; index < days; index++) {
			yield currentDate;
			currentDate.setDate(currentDate.getDate() + 1);
		}
	}

	private createHabitCell(row: Element, currentDate: Date, path: string, entriesSet: Set<string>, entries: string[]) {
		const dateString = this.getDateId(currentDate);
		const isTicked = entriesSet.has(dateString);
		const dayOfWeek = this.getDayOfWeek(currentDate);

		const habitCell = row.createEl('div', {
			cls: [
				'habit-tracker__cell',
				'habit-tick',
				`habit-tick--${isTicked}`,
				`habit-tracker__cell--${dayOfWeek}`
			].join(' '),
			attr: {
				ticked: isTicked.toString(),
				date: dateString,
				habit: path,
				streak: this.getStreak(entries, currentDate)
			}
		});

		return habitCell;
	}

	/**
		* Calculates the consecutive streak of habits up to a given date
		* @param entries - Array of date strings in YYYY-MM-DD format representing completed habits
		* @param date - The date up to which to calculate the streak
		* @returns The number of consecutive days the habit was completed as a string
		* @example
		* // Returns "3" if habit was completed on 2024-04-24, 2024-04-23, and 2024-04-22
		* getStreak(["2024-04-24", "2024-04-23", "2024-04-22"], new Date("2024-04-24"))
		*/
	getStreak(entries: string[], date: Date): string {
		let streak = 0;
		const currentDate = new Date(date);

		while (entries.includes(this.getDateId(currentDate))) {
			streak++;
			currentDate.setDate(currentDate.getDate() - 1);
		}

		return streak.toString();
	}

	async toggleHabit(element) {
		const habit = element.getAttribute('habit')
		const date = element.getAttribute('date')
		const file: TAbstractFile | null = this.app.vault.getAbstractFileByPath(habit)
		const isTicked = element.getAttribute('ticked') === 'true'

		if (!file || !(file instanceof TFile)) {
			new Notice(`${PLUGIN_NAME}: file missing while trying to toggle habit`)
			return
		}

		this.updateHabitEntry(file, isTicked, date)

		const entries = await this.getHabitEntries(file.path)
		this.renderHabit(file.path, entries)
	}

	private updateHabitEntry(file: TFile, isTicked: any, date: any) {
		this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			let entries = frontmatter['entries'] || []
			if (!isTicked) {
				entries.push(date)
				entries.sort()
				frontmatter['entries'] = entries
				return true
			}

			if (isTicked) {
				entries = entries.filter((entry) => entry !== date)
				frontmatter['entries'] = entries
				return true
			}

			return false
		})
	}

	removeAllChildNodes(parent) {
		while (parent.firstChild) {
			parent.firstChild.remove()
		}
	}

	pathToId(path) {
		return path
			.replaceAll('/', '_')
			.replaceAll('.', '__')
			.replaceAll(' ', '___')
	}

	createDateFromFormat(dateString) {
		const [year, month, day] = dateString.split('-').map(Number)
		const date = new Date()

		date.setFullYear(year)
		date.setMonth(month - 1)
		date.setDate(day)

		return date
	}

	getDateId(date) {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')

		let dateId = `${year}-${month}-${day}`

		return dateId
	}

	getDayOfWeek(date) {
		const daysOfWeek = [
			'sunday',
			'monday',
			'tuesday',
			'wednesday',
			'thursday',
			'friday',
			'saturday',
		]
		const dayIndex = date.getDay()
		const dayName = daysOfWeek[dayIndex]
		return dayName.toLowerCase()
	}

	generateUniqueId() {
		const timestamp = Date.now()
		const randomNumber = Math.floor(Math.random() * 10_000) // Adjust the range as needed
		return `habittracker-${timestamp}-${randomNumber}`
	}
}
