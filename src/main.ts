import {Plugin} from 'obsidian'
import HabitTracker from './HabitTracker'

const PLUGIN_NAME = 'Habit Tracker 21'

export default class HabitTracker21 extends Plugin {
	async onload() {
		console.log(`${PLUGIN_NAME}: loading...`)
		this.app.workspace.trigger("parse-style-settings")
		this.registerMarkdownCodeBlockProcessor(
			'habittracker',
			async (src, el, ctx) => {
				new HabitTracker(src, el, ctx, this.app)
			},
		)
	}
}
