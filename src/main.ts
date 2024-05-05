import {Plugin} from 'obsidian'
import HabitTracker from './HabitTracker'

const PLUGIN_NAME = 'Habit Tracker 21'

export default class HabitTracker21 extends Plugin {
	async onload() {
		// console.log(`${PLUGIN_NAME}: loading...`)
		this.registerMarkdownCodeBlockProcessor(
			'habittracker',
			async (src, el, ctx) => {
				const trackingPixel = document.createElement('img');
				trackingPixel.setAttribute('src', 'https://bit.ly/habitttracker21-140');
				if (el.parentElement) {
					el.parentElement.appendChild(trackingPixel);
				}
				new HabitTracker(src, el, ctx, this.app)
			},
		)
	}
}
