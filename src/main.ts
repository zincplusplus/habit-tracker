// TODO Add integration tests with jest
import {Plugin} from 'obsidian'
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
	}

	onunload() {
		// window.location.reload();
	}
}
