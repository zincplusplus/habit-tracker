// Working with files and folders in your plugin: https://www.youtube.com/watch?v=_QFUOyIB1nY
// Display data in views and status bar: https://www.youtube.com/watch?v=zR86pftlOsg&ab_channel=Obsidian
// Easy and fast UI development with Svelte: https://www.youtube.com/watch?v=mCF80HBfUWA&ab_channel=Obsidian
// https://github.com/OliverBalfour/obsidian-pandoc/blob/master/renderer.ts
// example of replacing codeblocks https://github.com/joleaf/obsidian-email-block-plugin
// https://ourgreenstory.com/nl/sticky-whiteboard/habit-tracker/

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
			path: 'Habits/',
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

			console.log('Habit Tracker: ', `Loaded successfully ${files.length} file(s)`);

			// 2. figure out the date range
			// get today
			// get starting date
			// show all dates

			const root = el.createEl('div', {
				cls: 'habit_tracker'
			});
			root.addEventListener('click', e => {
				if(e.target.classList.contains('habit-tick')) {
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

				row.createEl('div', {
					text: f['name'].replace('.md',''),
					cls: 'habit-name habit-cell',
				})

				let cell;
				let entries = oApp.metadataCache.getFileCache(f)?.frontmatter?.entries || [];
				currentDate = new Date();
				currentDate.setDate(currentDate.getDate() - settings.range + 1);

				for(let i = 0; i < settings.range; i++) {
					cell = row.createEl('div', {
						cls: `habit-cell habit-tick habit-tick--${entries.includes(currentDate.toISOString().substring(0, 10))}`,
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
			let entries =  fm.entries;

			if(currentValue === 'x') {
				entries = entries.filter((e) => {
					console.log(e, date, e !== date);
					return e !== date;
				})
				el.innerHTML = '';
			} else {
				entries.push(date);
				entries = entries.sort();
				el.innerHTML = 'x';
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
					fm[f].forEach(el => {
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

		// async function toggleHabit(path,date,value) {
		// 	const file = await oApp.vault.read(file);
		// 	console.log(file);
		// }






		// const data = this.app.metadataCache.getFileCache(files[0])?.frontmatter.habitTracker;

		// // console.log('data for', files[0].name, data);


		// //codeblock
		// this.registerMarkdownCodeBlockProcessor("habittracker", async (src, el, ctx) => {
		// 	// console.log('this is the config', src);
		// 	// console.log('this is the root el', el.innerHTML);
		// 	// console.log('context', ctx);
		// 	const button = el.createEl('button', {
		// 		text: "write something"
		// 	});

		// 	button.addEventListener('click',() => {
		// 		habbitTrackerToggle(files[0],'2023-11-15', 'valueee');
		// 	})
		// 	return null;
		// });
		// window.oApp = this.app;

		// //write something
		// window.habbitTrackerToggle = function(file ,date, value) {
		// 	console.log('habbitTrackerToggle', file, date);
		// 	oApp.vault.read(file).then((r:string) => {
		// 		const fileContent = r.replace('---\n','').split('---\n')[1]
		// 		const frontmatter = makeFrontmatter(oApp.metadataCache.getFileCache(file)?.frontmatter);

		// 		oApp.vault.modify(
		// 			file,
		// 			makeFrontmatter(frontmatter + '\n' + fileContent
		// 			)
		// 	});
		// }

		// function makeFrontmatter(fm) {
		// 	console.log('raw frontmatter', fm)
		// 	let result = "---\n"
		// 	Object.keys(fm).forEach(f => {
		// 		if(Array.isArray(fm[f])) {
		// 			let fmArray = `${f}:\n`;
		// 			fm[f].forEach(el => {
		// 				fmArray += `  - ${el}\n`
		// 			});
		// 			result +=fmArray;
		// 		} else {
		// 			result += `${f}: ${fm[f]}\n`;
		// 		}
		// 	});
		// 	result+="---"

		// 	console.log('rendered frontmatter', result)
		// 	return result;
		// }

		// function makeFile(file,frontmatter,content) {

		// }

		return null;

		// window.habitTracker = (container, calendarData) => {
		// 	console.log('hello world', container, calendarData);
		// }
		// await this.loadSettings();

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }

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
