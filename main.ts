// Working with files and folders in your plugin: https://www.youtube.com/watch?v=_QFUOyIB1nY
// Display data in views and status bar: https://www.youtube.com/watch?v=zR86pftlOsg&ab_channel=Obsidian
// Easy and fast UI development with Svelte: https://www.youtube.com/watch?v=mCF80HBfUWA&ab_channel=Obsidian
// https://github.com/OliverBalfour/obsidian-pandoc/blob/master/renderer.ts
// example of replacing codeblocks https://github.com/joleaf/obsidian-email-block-plugin
// https://ourgreenstory.com/nl/sticky-whiteboard/habit-tracker/
// listen to file change https://github.com/obsidianmd/obsidian-api/blob/c01fc3074deeb3dfc6ee02546d113b448735b294/obsidian.d.ts#L3724

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile } from 'obsidian';
const yaml = require('js-yaml');

// Remember to rename these classes and interfaces!
interface HabitTrackerSettings {
	path: string;
	range: number;
	wrapper: HTMLDivElement | null,
}

const DEFAULT_SETTINGS: HabitTrackerSettings = {
	path: '',
	range: 21,
	wrapper: null,
}

export default class HabitTracker extends Plugin {
	settings: HabitTrackerSettings;

	renderWrapper(parent) {
		const wrapper = parent.createEl('div', {
			cls: 'habit_tracker'
		});
		wrapper.addEventListener('click', e => {
			let target = e.target as HTMLDivElement;
			if(target?.classList.contains('habit-tick')) {
				this.toggleHabit(target);
			}
		});

		const header = wrapper.createEl('div', {
			cls: 'habit-tracker__header habit-tracker__row'
		});

		header.createEl('div',{
			text: '',
			cls: 'habit-name habit-cell'
		})

		let currentDate = new Date();
		currentDate.setDate(currentDate.getDate() - this.settings.range + 1);
		for(let i = 0; i < this.settings.range; i++) {
			header.createEl('span', {
				cls: 'habit-cell',
				text: currentDate.getDate().toString()
			});
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return wrapper;
	}


	async getFrontmatter(path:string) {
		const file = this.app.vault.getAbstractFileByPath(path);
		return await this.app.vault.read(file).then((result) => {
			let frontmatter = result.split('---')[1];

			if (!frontmatter) return {};

			return yaml.load(frontmatter, {schema: yaml.JSON_SCHEMA});
		})

	}
	async getHabitEntries(path:string) {
		// let entries = await this.getFrontmatter(path)?.entries || [];
		let fm = await this.getFrontmatter(path);
		// console.log(`Found ${fm.entries} for ${path}`);
		return fm.entries || [];
	}



	renderHabit(path:string, entries:string[]) {
		if (!this.settings.wrapper) return null;

		let name = path.split('/').pop()?.replace('.md','');

		// no. this needs to be queried insise this.settings.wrapper;
		let row = document.getElementById(path);

		if(!row) {
			row = this.settings.wrapper.createEl('div',{
				cls: 'habit-tracker__row',
			});
			row.setAttribute("id", path);
		} else {
			row.innerHTML = '';
		}



		row.createEl('div', {
			text: name,
			cls: 'habit-name habit-cell',
		});

		let cell;
		let currentDate = new Date();
		currentDate.setDate(currentDate.getDate() - this.settings.range + 1);

		// console.log('entries', entries);
		for(let i = 0; i < this.settings.range; i++) {
			cell = row.createEl('div', {
				cls: `habit-cell habit-tick ${entries.includes(currentDate.toISOString().substring(0, 10)) ? 'habit-tick--true' : ''}`,
				text: entries.includes(currentDate.toISOString().substring(0, 10)) ? 'x' : '',
			});
			cell.setAttribute('date', currentDate.toISOString().substring(0, 10));
			cell.setAttribute('habit', path);
			currentDate.setDate(currentDate.getDate() + 1);
		}
	}



	async toggleHabit(el) {
		const file = this.app.vault.getAbstractFileByPath(el.getAttribute('habit'));
		const currentValue = el.innerHTML.trim();
		const date = el.getAttribute('date');

		if(!file) {
			return;
		}

		let fm = await this.getFrontmatter(file.path) || {};
		let entries = fm.entries || [];

		if(currentValue === 'x') {
			entries = entries.filter((e) => {
				// console.log(e, date, e !== date);
				return e !== date;
			});
		} else {
			// console.log('entries');
			entries.push(date);
			entries = entries.sort();
		}

		fm.entries = entries;
		let fileContent = await this.app.vault.read(file).then(result => {
			return result.replace('---\n','').split('---\n')[1];
		});
		if(fileContent == undefined)
		fileContent = "";

		this.writeFile(file, this.makeFrontmatter(fm) + '\n' + fileContent);
	}



	makeFrontmatter(fm) {
		// console.log('raw frontmatter', fm)
		let result = "---\n"
		Object.keys(fm).forEach(f => {
			if(Array.isArray(fm[f])) {
				let fmArray = `${f}:\n`;
				fm[f].forEach((el) => {
					fmArray += `  - ${el}\n`
				});
				result +=fmArray;
			} else {
				result += `${f}: ${fm[f]}\n`;
			}
		});
		result+="---"

		// console.log('rendered frontmatter', result)
		return result;
	}



	writeFile(file:TAbstractFile, content:string) {
		if(!content) return null;

		this.app.vault.modify(file, content).then(async () => {
			this.renderHabit(
				file.path,
				await this.getHabitEntries(file.path))
			})
	}



	async onload() {
		this.settings = this.settings = Object.assign({}, DEFAULT_SETTINGS);
		this.registerMarkdownCodeBlockProcessor("habittracker", async (src, el, ctx) => {

			// await this.loadSettings();
			this.settings.path = JSON.parse(src).path;
			// 1. get all the habits
			const files = this.app.vault.getMarkdownFiles()
			.filter(file => {
				// only habbits
				if(file.path.indexOf(this.settings.path) !== 0) {
					// console.log(`${file.path} doesn't match ${this.settings.path}`);
					return false;
				}

				return true;
			})
			.sort((a,b) => {
				if (a.name < b.name) {
					return -1;
				} else if (a.name > b.name) {
					return 1;
				}
				return 0;
			});

			console.log('Habit Tracker: ', `Loaded successfully ${files.length} file(s) from ${this.settings.path}`);

			if(!files.length) {
				el.createEl('div', {
					text: `No habits found under ${this.settings.path}`
				});
				return null;
			}

			// 2. render the wrapper/root element
			this.settings.wrapper = this.renderWrapper(el);

			// 2.2 render each habit
			files.forEach(async f => {
				this.renderHabit(
					f.path,
					await this.getHabitEntries(f.path))
				})
			});

			return null;

		}

		onunload() {}

		async loadSettings() {
			this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		}

		async saveSettings() {
			await this.saveData(this.settings);
		}
	}

	// class SampleSettingTab extends PluginSettingTab {
	// 	plugin: MyPlugin;

	// 	constructor(app: App, plugin: MyPlugin) {
	// 		super(app, plugin);
	// 		this.plugin = plugin;
	// 	}

	// 	display(): void {
	// 		const {containerEl} = this;

	// 		containerEl.empty();

	// 		new Setting(containerEl)
	// 			.setName('Setting #1')
	// 			.setDesc('It\'s a secret')
	// 			.addText(text => text
	// 				.setPlaceholder('Enter your secret')
	// 				.setValue(this.plugin.settings.mySetting)
	// 				.onChange(async (value) => {
	// 					this.plugin.settings.mySetting = value;
	// 					await this.plugin.saveSettings();
	// 				}));
	// 	}
	// }
	/* eslint-enable */
