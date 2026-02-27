// TODO Add integration tests with jest
import {Plugin, Notice, setIcon, App, PluginSettingTab, Setting} from 'obsidian'
import HabitTracker from './HabitTracker.svelte'
import HabitTrackerError from './HabitTrackerError.svelte'
import { debugLog, isValidCSSColor } from './utils'

	import {
		format,
	} from 'date-fns'

interface HabitTrackerSettings {
	path: string;
	daysToShow: number;
	debug: boolean;
	matchLineLength: boolean;
	defaultColor: string;
	showStreaks: boolean;
	openDailyNoteOnClick: boolean;
	gapStyle: string;
	mode: string;
}

const DEFAULT_SETTINGS: HabitTrackerSettings = {
	path: '',
	daysToShow: 21,
	debug: false,
	matchLineLength: true,
	defaultColor: '',
	showStreaks: true,
	openDailyNoteOnClick: true,
	gapStyle: 'default',
	mode: 'default'
}

export default class HabitTracker21 extends Plugin {
	settings: HabitTrackerSettings;

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor('habittracker', async (src, el) => {
			// const trackingPixel = document.createElement('img')
			// trackingPixel.setAttribute('src', 'https://bit.ly/habitttracker21-140')
			// if (el.parentElement) el.parentElement.appendChild(trackingPixel)
			// TODO make this dynamic and add it to HabitTracker.svelte

			debugLog('Loading', 1)

			let userSettings: Partial<HabitTrackerSettings> = {}
			try {
				userSettings = JSON.parse(src);
				const debugMode = this.settings.debug || userSettings.debug;
				debugLog(`Global settings: ${JSON.stringify(this.settings)}`, debugMode);
				debugLog(`Tracker settings: ${JSON.stringify(userSettings)}`, debugMode);
				debugLog(`Today is ${format(new Date(), 'yyyy-MM-dd')}`, debugMode);
				new HabitTracker({
						target: el,
						props: {
							app: this.app,
							userSettings,
							globalSettings: this.settings,
							pluginName: this.manifest.name,
						},
					})
			} catch(error) {
				new HabitTrackerError({
					target: el,
					props: {
						error,
						src,
						pluginName: this.manifest.name,
						app: this.app,
						globalSettings: this.settings
					}
				})
				console.error(`[${this.manifest.name}] Received invalid settings. ${error}`)
			}
		})

		// Add hover action bars to habit tracker code blocks
		this.addHoverActionBars()

		// Check for updates in background (after a short delay)
		setTimeout(() => this.checkForUpdatesBackground(), 5000)

		// Add the settings tab
		this.addSettingTab(new HabitTrackerSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		console.log('[HabitTracker] Saving settings:', this.settings);
		await this.saveData(this.settings);
		// Refresh all habit tracker instances when settings change
		this.refreshAllHabitTrackers();
	}

	refreshAllHabitTrackers() {
		// Dispatch a single event at the document level that all components can listen to
		console.log('[HabitTracker] Dispatching refresh event with settings:', this.settings);
		const refreshEvent = new CustomEvent('habit-tracker-refresh', {
			detail: { settings: this.settings }
		});
		document.dispatchEvent(refreshEvent);
		console.log('[HabitTracker] Refresh event dispatched');
	}

	addHoverActionBars() {
		// Use event delegation to handle hover on habit tracker code blocks
		document.addEventListener('mouseover', (e) => {
			const target = e.target as HTMLElement
			if (!target || typeof target.closest !== 'function') return

			const codeBlock = target.closest('.cm-lang-habittracker') as HTMLElement

			if (codeBlock && !codeBlock.querySelector('.ht21-action-bar')) {
				// Check for updates when creating new action bars
				this.checkForUpdatesBackground()

				const actionBar = this.createActionBar(codeBlock)
				codeBlock.appendChild(actionBar)
			}
		})

		// Clean up action bars when mouse leaves
		document.addEventListener('mouseleave', (e) => {
			const target = e.target as HTMLElement
			if (!target || typeof target.closest !== 'function') return

			const codeBlock = target.closest('.cm-lang-habittracker') as HTMLElement

			if (codeBlock) {
				// Small delay to prevent flickering when moving between elements
				setTimeout(() => {
					if (!codeBlock.matches(':hover')) {
						const actionBar = codeBlock.querySelector('.ht21-action-bar')
						actionBar?.remove()
					}
				}, 100)
			}
		})
	}

	// TODO could we do this with Svelte?
	createActionBar(codeBlock) {
		const actionBar = document.createElement('div')
		actionBar.className = 'ht21-action-bar'

		// Check for version mismatch between manifest and localStorage
		const storedVersion = localStorage.getItem('habit-tracker-update-available')
		const currentVersion = this.manifest.version
		// TODO add some debugging code here too

		// Show dot if there's a stored version that's different from current
		const hasUpdate = storedVersion && storedVersion !== currentVersion

		const updateDot = hasUpdate ? '<span class="ht21-update-dot"></span>' : ''
		const tooltipText = hasUpdate ? 'New version available' : 'Check for updates'

		actionBar.innerHTML = `
			<span class="ht21-action-bar__title">${this.manifest.name}</span>
			<div class="ht21-action-bar__buttons">
				<button class="clickable-icon ht21-action-bar__btn--update" aria-label="${tooltipText}" style="position: relative;"><span class="ht21-btn-text">Updates</span>${updateDot}</button>
				<button class="clickable-icon ht21-action-bar__btn--edit" aria-label="Edit this block"><span class="ht21-btn-text">Edit this block</span></button>
				<button class="clickable-icon ht21-action-bar__btn--settings" aria-label="Plugin Settings"><span class="ht21-btn-text">Plugin Settings</span></button>
			</div>
		`

		// Add event listeners
		const settingsBtn = actionBar.querySelector('.ht21-action-bar__btn--settings')
		const updateBtn = actionBar.querySelector('.ht21-action-bar__btn--update')
		const editBtn = actionBar.querySelector('.ht21-action-bar__btn--edit')

		// Add Obsidian icons
		if (settingsBtn) setIcon(settingsBtn as HTMLElement, 'settings')
		if (updateBtn) setIcon(updateBtn as HTMLElement, 'download')
		if (editBtn) setIcon(editBtn as HTMLElement, 'lucide-code-2')

		settingsBtn?.addEventListener('click', () => this.openSettings())
		updateBtn?.addEventListener('click', () => {
			// Clear update status when clicked
			localStorage.removeItem('habit-tracker-update-available')
			localStorage.removeItem('habit-tracker-last-update-check')

			if (hasUpdate) {
				this.openCommunityPlugins()
			} else {
				this.checkForUpdates()
			}
		})
		editBtn?.addEventListener('click', () => this.editBlock(codeBlock))

		return actionBar
	}

	openSettings() {
		// Open settings and navigate to this plugin's settings page
		(this.app as any).setting.open();
		(this.app as any).setting.openTabById(this.manifest.id);
	}

	openCommunityPlugins() {
		// Open the specific plugin page in Community Plugins
		window.open('obsidian://show-plugin?id=habit-tracker-21');
	}

	async checkForUpdates() {
		await this.performUpdateCheck()
	}

	async checkForUpdatesBackground() {
		const lastCheck = localStorage.getItem('habit-tracker-last-update-check')
		const now = Date.now()
		const dayInMs = 24 * 60 * 60 * 1000

		// Only check once per day for background checks
		if (lastCheck && (now - parseInt(lastCheck)) < dayInMs) {
			return
		}

		await this.performUpdateCheck()
	}

	async performUpdateCheck() {
		try {
			// Check GitHub releases for updates
			const response = await fetch('https://api.github.com/repos/zincplusplus/habit-tracker/releases/latest')
			if (!response.ok) throw new Error('Failed to fetch')

			const latestRelease = await response.json()
			const latestVersion = latestRelease.tag_name.replace('v', '')
			const currentVersion = this.manifest.version

			// Store check timestamp
			localStorage.setItem('habit-tracker-last-update-check', Date.now().toString())

			console.log('Debug - latestVersion:', latestVersion)
			console.log('Debug - currentVersion:', currentVersion)
			const isNewer = this.isNewerVersion(latestVersion, currentVersion)
			console.log('Debug - isNewerVersion result:', isNewer)

			if (isNewer) {
				localStorage.setItem('habit-tracker-update-available', latestVersion)
				console.log('Debug - Stored update available:', latestVersion)
			} else {
				console.log('Debug - No update needed, removing localStorage entry')
				localStorage.removeItem('habit-tracker-update-available')
			}
		} catch (error) {
			console.log('Update check failed:', error)
		}
	}

	isNewerVersion(latest: string, current: string): boolean {
		const parseVersion = (v: string) => v.split('.').map(Number)
		const latestParts = parseVersion(latest)
		const currentParts = parseVersion(current)

		for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
			const l = latestParts[i] || 0
			const c = currentParts[i] || 0
			if (l > c) return true
			if (l < c) return false
		}
		return false
	}

	editBlock(codeBlock) {
		// Find the edit button at the same DOM level as the action bar
		const editButton = codeBlock.querySelector('.edit-block-button')

		if (editButton) {
			editButton.click()
		} else {
			// throw an error ehre, also visible to the user, maybe notice???
		}
	}

	onunload() {
		// window.location.reload();
	}
}

class HabitTrackerSettingTab extends PluginSettingTab {
	plugin: HabitTracker21;

	constructor(app: App, plugin: HabitTracker21) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h3', {text: `${this.plugin.manifest.name} Settings`});

		// General Settings Section
		let generalHeader = containerEl.createEl('h4', {text: 'General Settings'});
		generalHeader.style.marginBottom = '0';
		const generalDesc = containerEl.createEl('div', {
			cls: 'setting-item-description',
			text: 'These apply to all trackers and can be overridden either in the codeblock or in the habit tracker file.'
		});
		generalDesc.style.marginBottom = '15px';
		generalDesc.style.fontSize = '0.85em';
		generalDesc.style.color = 'var(--text-muted)';

		new Setting(containerEl)
			.setName('Default path')
			.setDesc('Default path for habits (folder or file). Can be overridden with "path" in code blocks.')
			.addDropdown(dropdown => {
				// Get all folders in the vault
				const folders = this.app.vault.getAllLoadedFiles()
					.filter(file => 'children' in file && file.children !== undefined) // Only folders
					.map(folder => folder.path)
					.sort();

				// Add each folder as an option
				folders.forEach(folderPath => {
					dropdown.addOption(folderPath, folderPath);
				});

				// Set current value
				dropdown.setValue(this.plugin.settings.path);

				// Handle changes
				dropdown.onChange(async (value) => {
					this.plugin.settings.path = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Days to show')
			.setDesc('Number of days to display in the habit tracker. Can be overridden with "daysToShow" in code blocks.')
			.addText(text => text
				.setValue(this.plugin.settings.daysToShow.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.daysToShow = numValue;
						await this.plugin.saveSettings();
					}
				}))
			.then(setting => {
				// Add number input attributes
				const inputEl = setting.controlEl.querySelector('input') as HTMLInputElement;
				if (inputEl) {
					inputEl.type = 'number';
					inputEl.min = '1';
					inputEl.step = '1';
				}
			});

		new Setting(containerEl)
			.setName('Default color')
			.setDesc('Default habit color (hex, RGB, or CSS color name). Can be overridden with "color" in code blocks or habit frontmatter.')
			.addText(text => text
				.setValue(this.plugin.settings.defaultColor)
				.setPlaceholder('#4CAF50 or green')
				.onChange(async (value) => {
					// Only save valid colors or empty string
					if (!value || isValidCSSColor(value)) {
						this.plugin.settings.defaultColor = value;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Show streaks')
			.setDesc('Display streak indicators and counts. Can be overridden with "showStreaks" in code blocks.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStreaks)
				.onChange(async (value) => {
					this.plugin.settings.showStreaks = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Gap style')
			.setDesc('How gap days are displayed in streaks. Can be overridden with "gapStyle" in code blocks.')
			.addDropdown(dropdown => dropdown
				.addOption('default', 'Default')
				.addOption('faded', 'Faded')
				.setValue(this.plugin.settings.gapStyle)
				.onChange(async (value) => {
					this.plugin.settings.gapStyle = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Display mode')
			.setDesc('How habits are displayed. "Default" shows a grid, "Contribution Graph" shows a GitHub-style contribution graph. Can be overridden with "mode" in code blocks.')
			.addDropdown(dropdown => dropdown
				.addOption('default', 'Default')
				.addOption('graph', 'Contribution Graph')
				.setValue(this.plugin.settings.mode)
				.onChange(async (value) => {
					this.plugin.settings.mode = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Open daily note on date click')
			.setDesc('Click a date in the header row to open the corresponding daily note. Requires the Daily Notes core plugin or Periodic Notes community plugin.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.openDailyNoteOnClick)
				.onChange(async (value) => {
					this.plugin.settings.openDailyNoteOnClick = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Match line length')
			.setDesc('Make habit tracker match the width of the readable line length. Can be overridden with "matchLineLength" in code blocks.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.matchLineLength)
				.onChange(async (value) => {
					this.plugin.settings.matchLineLength = value;
					await this.plugin.saveSettings();
				}));

		// Troubleshooting Section
		const troubleshootingHeader = containerEl.createEl('h4', {text: 'Troubleshooting'});
		troubleshootingHeader.style.marginTop = '30px';

		new Setting(containerEl)
			.setName('Debug mode')
			.setDesc('Enable debug output to console. Can be overridden with "debug" in code blocks.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debug)
				.onChange(async (value) => {
					this.plugin.settings.debug = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Reset settings')
			.setDesc('Reset all settings to their default values')
			.addButton(button => button
				.setButtonText('Reset to defaults')
				.setWarning()
				.onClick(async () => {
					// Reset to default settings
					this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
					await this.plugin.saveSettings();
					// Refresh the settings display
					this.display();
				}));
	}
}
