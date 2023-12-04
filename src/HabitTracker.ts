// Working with files and folders in your plugin: https://www.youtube.com/watch?v=_QFUOyIB1nY
// Display data in views and status bar: https://www.youtube.com/watch?v=zR86pftlOsg&ab_channel=Obsidian
// Easy and fast UI development with Svelte: https://www.youtube.com/watch?v=mCF80HBfUWA&ab_channel=Obsidian
// https://github.com/OliverBalfour/obsidian-pandoc/blob/master/renderer.ts
// example of replacing codeblocks https://github.com/joleaf/obsidian-email-block-plugin
// https://ourgreenstory.com/nl/sticky-whiteboard/habit-tracker/
// listen to file change https://github.com/obsidianmd/obsidian-api/blob/c01fc3074deeb3dfc6ee02546d113b448735b294/obsidian.d.ts#L3724

import { App, parseYaml, Notice, TAbstractFile } from 'obsidian';

const PLUGIN_NAME = "Habit Tracker 21"
const DAYS_TO_SHOW = 21;

interface HabitTrackerSettings {
	path: string;
	range: number;
	rootElement: HTMLDivElement | undefined,
	habitsGoHere: HTMLDivElement | undefined,
}

const DEFAULT_SETTINGS: HabitTrackerSettings = {
	path: '',
	range: DAYS_TO_SHOW,
	rootElement: undefined,
	habitsGoHere: undefined,
}

export default class HabitTracker {
	settings: HabitTrackerSettings;
	app: App;



	constructor(src, el, ctx, app) {
		this.app = app;
		this.settings = this.loadSettings(src);
		this.settings.rootElement = el;
		// console.log(`${PLUGIN_NAME} got with these settings:`, this.settings);

		this.settings.path = JSON.parse(src).path;

		// 1. get all the habits
		const files = this.loadFiles();

		if (files.length === 0) {
			this.renderNoHabitsFoundMessage();
			return;
		}

		console.log(`${PLUGIN_NAME} loaded successfully ${files.length} file(s) from ${this.settings.path}`);

		// 2.1 render the element that holds all habits
		this.settings.habitsGoHere = this.renderRoot(el);

		// 2.2 render the header
		this.renderHeader(this.settings.habitsGoHere);

		// 2.3 render each habit
		files.forEach(async f => {
			this.renderHabit(
				f.path,
				await this.getHabitEntries(f.path))
			})
		}



		loadFiles() {
			return this.app.vault.getMarkdownFiles()
			.filter(file => {
				// only habits
				if(!file.path.includes(this.settings.path)) {
					// console.log(`${file.path} doesn't match ${this.settings.path}`);
					return false;
				}

				return true;
			})
			.sort((a, b) => a.name.localeCompare(b.name));
		}



		loadSettings(rawSettings) {
			try {
				return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(rawSettings))
			} catch(error) {
				new Notice(`${PLUGIN_NAME}: received invalid settings. continuing with default settings`)
				return DEFAULT_SETTINGS;
			}
		}



		renderNoHabitsFoundMessage() {
			this.settings.rootElement.createEl('div', {
				text: `No habits found under ${this.settings.path}`
			});
		}



		renderRoot(parent) {
			const rootElement = parent.createEl('div', {
				cls: 'habit_tracker'
			});
			rootElement.addEventListener('click', e => {
				const target = e.target as HTMLDivElement;
				if(target?.classList.contains('habit-tick')) {
					this.toggleHabit(target);
				}
			});

			return rootElement;
		}



		renderHeader(parent) {
			const header = parent.createEl('div', {
				cls: 'habit-tracker__header habit-tracker__row'
			});

			header.createEl('div',{
				text: '',
				cls: 'habit-cell__name habit-cell'
			})

			const currentDate = new Date();
			currentDate.setDate(currentDate.getDate() - this.settings.range + 1);
			for(let i = 0; i < this.settings.range; i++) {
				const day = currentDate.getDate().toString();
				header.createEl('span', {
					cls: 'habit-cell',
					text: day
				});
				currentDate.setDate(currentDate.getDate() + 1);
			}
		}



		async getFrontmatter(path:string) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (!file) {
				new Notice(`${PLUGIN_NAME}: No file found for path: ${path}`);
				return {};
			}

			try {
				return await this.app.vault.read(file).then((result) => {
					const frontmatter = result.split('---')[1];

					if (!frontmatter) return {};

					return parseYaml(frontmatter);
				});
			} catch(error) {
				return {};
			}


		}



		async getHabitEntries(path:string) {
			// let entries = await this.getFrontmatter(path)?.entries || [];
			const fm = await this.getFrontmatter(path);
			// console.log(`Found ${fm.entries} for ${path}`);
			return fm.entries || [];
		}



		renderHabit(path:string, entries:string[]) {
			if (!this.settings.habitsGoHere) {
				new Notice(`${PLUGIN_NAME}: missing div that holds all habits`);
				return null;
			}

			const name = path.split('/').pop()?.replace('.md','');

			// no. this needs to be queried inside this.settings.rootElement;
			let row = document.getElementById(path);

			if(!row) {
				row = this.settings.habitsGoHere.createEl('div',{
					cls: 'habit-tracker__row',
				});
				row.setAttribute("id", path);
			} else {
				this.removeAllChildNodes(row);
			}


			row.createEl('div', {
				text: name,
				cls: 'habit-cell__name habit-cell',
			});

			const currentDate = new Date();
			currentDate.setDate(currentDate.getDate() - this.settings.range + 1);

			const entriesSet = new Set(entries);

			// console.log('entries', entries);
			for(let i = 0; i < this.settings.range; i++) {
				const dateString = currentDate.toISOString().substring(0, 10);
				const isTicked = entriesSet.has(dateString);

				const habitCell = row.createEl('div', {
					cls: `habit-cell habit-tick ${isTicked ? 'habit-tick--true' : ''}`,
				});

				habitCell.setAttribute('ticked', isTicked.toString() )

				habitCell.setAttribute('date', dateString);
				habitCell.setAttribute('habit', path);
				currentDate.setDate(currentDate.getDate() + 1);
			}
		}



		async toggleHabit(el) {
			const habit = el.getAttribute('habit');
			const date = el.getAttribute('date');
			const file = this.app.vault.getAbstractFileByPath(habit);
			const isTicked = el.getAttribute('ticked');

			if(!file) {
				new Notice(`${PLUGIN_NAME}: file missing while trying to toggle habit`);
				return;
			}

			this.app.fileManager.processFrontMatter(file, (frontmatter) => {
				if(isTicked === 'true') {
					frontmatter['entries'] = frontmatter['entries'].filter((e) => e !== date);
				} else {
					frontmatter['entries'].push(date);
					frontmatter['entries'].sort();
				}
			});

			this.renderHabit(file.path, await this.getHabitEntries(file.path));
		}



		writeFile(file:TAbstractFile, content:string) {
			if(!content) {
				new Notice(`${PLUGIN_NAME}: could not save changes due to missing content`)
				return null;
			}

			try {
				return this.app.vault.modify(file, content);
			} catch(error) {
				new Notice(`${PLUGIN_NAME}: could not save changes`)
				return Promise.reject(error);
			}
		}


		removeAllChildNodes(parent) {
			while (parent.firstChild) {
				parent.removeChild(parent.firstChild);
			}
		}
	}
