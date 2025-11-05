// TODO Add integration tests with jest
import {Plugin, Notice, setIcon} from 'obsidian'
import HabitTracker from './HabitTracker.svelte'
import HabitTrackerError from './HabitTrackerError.svelte'

export const PLUGIN_NAME = 'Habit Tracker 21'

export default class HabitTracker21 extends Plugin {

	onload() {
		this.registerMarkdownCodeBlockProcessor('habittracker', async (src, el) => {
			// const trackingPixel = document.createElement('img')
			// trackingPixel.setAttribute('src', 'https://bit.ly/habitttracker21-140')
			// if (el.parentElement) el.parentElement.appendChild(trackingPixel)
			// TODO make this dynamic and add it to HabitTracker.svelte

			let userSettings = {}
			try {
				userSettings = JSON.parse(src);
				// TODO figure out what to do about this error
				new HabitTracker({
						target: el,
						props: {
							app: this.app,
							userSettings,
						},
					})
			} catch(error) {
				new HabitTrackerError({
					target: el,
					props: {
						error,
						src
					}
				})
				console.error(`[${PLUGIN_NAME}] Received invalid settings. ${error}`)
			}
		})

		// Add hover action bars to habit tracker code blocks
		this.addHoverActionBars()

		// Check for updates in background (after a short delay)
		setTimeout(() => this.checkForUpdatesBackground(), 5000)
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

	createActionBar(codeBlock) {
		const actionBar = document.createElement('div')
		actionBar.className = 'ht21-action-bar'

		// Check for version mismatch between manifest and localStorage
		const storedVersion = localStorage.getItem('habit-tracker-update-available')
		const currentVersion = this.manifest.version

		console.log('Debug - storedVersion from localStorage:', storedVersion)
		console.log('Debug - currentVersion from manifest:', currentVersion)

		// Show dot if there's a stored version that's different from current
		const hasUpdate = storedVersion && storedVersion !== currentVersion
		console.log('Debug - hasUpdate (mismatch):', hasUpdate)

		const updateDot = hasUpdate ? '<span class="ht21-update-dot"></span>' : ''
		const tooltipText = hasUpdate ? 'New version available' : 'Check for updates'

		actionBar.innerHTML = `
			<span class="ht21-action-bar__title">Habit Tracker 21</span>
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
		if (settingsBtn) setIcon(settingsBtn, 'settings')
		if (updateBtn) setIcon(updateBtn, 'download')
		if (editBtn) setIcon(editBtn, 'lucide-code-2')

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
		// Open settings and navigate to the open-vscode plugin settings
		(this.app as any).setting.open();
		(this.app as any).setting.openTabById('open-vscode');
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
