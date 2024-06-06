import {Plugin} from 'obsidian'
import HabitTracker from './HabitTracker'

const PLUGIN_NAME = 'Habit Tracker 21'

export default class HabitTracker21 extends Plugin {
	async onload() {
		console.log(`${PLUGIN_NAME}: loading...`)
		this.registerMarkdownCodeBlockProcessor(
			'habittracker',
			async (src, el, ctx) => {
				// track if people are using this version
				const bitly = document.createElement('img');
				bitly.setAttribute('src', 'https://bit.ly/habitttracker21-142');
				bitly.setAttribute("style", "height: 1px; width: 1px; border: none; opacity: 0; position: absolute; top: 0; left: 0;pointer-events: none;")
				el?.parentElement.appendChild(bitly);
				new HabitTracker(src, el, ctx, this.app)
			},
		)
	}
}
