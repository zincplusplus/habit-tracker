// Working with files and folders in your plugin: https://www.youtube.com/watch?v=_QFUOyIB1nY
// Display data in views and status bar: https://www.youtube.com/watch?v=zR86pftlOsg&ab_channel=Obsidian
// Easy and fast UI development with Svelte: https://www.youtube.com/watch?v=mCF80HBfUWA&ab_channel=Obsidian
// https://github.com/OliverBalfour/obsidian-pandoc/blob/master/renderer.ts
// example of replacing codeblocks https://github.com/joleaf/obsidian-email-block-plugin
// https://ourgreenstory.com/nl/sticky-whiteboard/habit-tracker/

/* eslint-disable */
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!
interface HabitTrackerSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: HabitTrackerSettings = {
	mySetting: 'default'
}

export default class HabitTracker extends Plugin {
	settings: HabitTrackerSettings;

	async onload() {
		let settings = {
			path: 'Habits/Good',
			range: 21
		}

		window.oApp = this.app;

		this.registerMarkdownCodeBlockProcessor("habittracker", async (src, el, ctx) => {

			// 1. get all the habits
			const files = this.app.vault.getMarkdownFiles()
				.filter(file => {
					// only habbits
					if(file.path.indexOf(settings.path) !== 0) return false;

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

			console.log('Habit Tracker: ', `Loaded successfully ${files.length} file(s)`);

			// 2. figure out the date range
			// get today
			// get starting date
			// show all dates

			const root = el.createEl('div', {
				cls: 'habit_tracker'
			});
			root.addEventListener('click', e => {
				if(e.target?.classList.contains('habit-tick')) {
					toggleHabit(
						e.target,
						e.target.getAttribute('habit'),
						e.target.getAttribute('date'),
						e.target.innerHTML.trim(),
					)
				}
			})


			// 2.1 header
			const header = root.createEl('div', {
				cls: 'habit-tracker__header habit-tracker__row'
			});

			header.createEl('div',{
				text: '',
				cls: 'habit-name habit-cell'
			})

			let currentDate = new Date();
			currentDate.setDate(currentDate.getDate() - settings.range + 1);
			for(let i = 0; i < settings.range; i++) {
				header.createEl('span', {
					cls: 'habit-cell',
					text: currentDate.getDate()
				});
				currentDate.setDate(currentDate.getDate() + 1);
			}

			// 2.2 rows
			let row;
			files.forEach(f => {
				row = root.createEl('div',{
					cls: 'habit-tracker__row'
				})

				row.createEl('a', {
					text: `${f['name']}`.replace('.md',''),
					cls: 'habit-name habit-cell',
					href: f.path,
				})

				let cell;
				let entries = oApp.metadataCache.getFileCache(f)?.frontmatter?.entries || [];
				currentDate = new Date();
				currentDate.setDate(currentDate.getDate() - settings.range + 1);

				for(let i = 0; i < settings.range; i++) {
					cell = row.createEl('div', {
						cls: `habit-cell habit-tick ${entries.includes(currentDate.toISOString().substring(0, 10)) ? 'habit-tick--true' : ''}`,
						text: entries.includes(currentDate.toISOString().substring(0, 10)) ? 'x' : '',
					});
					cell.setAttribute('date', currentDate.toISOString().substring(0, 10));
					cell.setAttribute('habit', f.path);
					currentDate.setDate(currentDate.getDate() + 1);
				}
			})



			// 99. remove the code below once everything is working
			// el.createEl('pre', {
			// 		text: "hello world - habit tracker"
			// 	});

			return null;
		});

		function toggleHabit(el, path, date, currentValue) {
			const file = oApp.vault.getAbstractFileByPath(path);
			let fm = oApp.metadataCache.getFileCache(file)?.frontmatter || { entries: []};
			let entries =  fm.entries || [];

			if(currentValue === 'x') {
				entries = entries.filter((e) => {
					console.log(e, date, e !== date);
					return e !== date;
				})
				el.innerHTML = '';
				el.removeClass('habit-tick--true')
			} else {
				entries.push(date);
				entries = entries.sort();
				el.innerHTML = 'x';
				el.addClass('habit-tick--true')
			}

			fm.entries = entries;

			oApp.vault.read(file).then((r:string) => {
				let fileContent = r.replace('---\n','').split('---\n')[1];
				if(fileContent == undefined)
					fileContent = "";

				oApp.vault.modify(
					file,
					makeFrontmatter(fm) + '\n' + fileContent
					)

			});
		}


		function makeFrontmatter(fm) {
			console.log('raw frontmatter', fm)
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

			console.log('rendered frontmatter', result)
			return result;
		}


		return null;

	}

	onunload() {

	}

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
