import {moment, Plugin} from 'obsidian'
import HabitTracker from './HabitTracker'

const PLUGIN_NAME = 'Habit Tracker 21'

export default class HabitTracker21 extends Plugin {

	trackers: HabitTracker[] = []

	async onload() {
		console.log(`${PLUGIN_NAME}: loading...`)
		this.registerMarkdownCodeBlockProcessor(
			'habittracker',
			async (src, el, ctx) => {
				this.trackers.push(new HabitTracker(src, el, ctx, this.app))
			},
		)
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(this.app.vault.on('create', this.reloadCorrespondingTracker))
			this.registerEvent(this.app.vault.on('delete', this.reloadCorrespondingTracker))
			this.registerEvent(this.app.vault.on('rename', this.reloadCorrespondingTracker))
		})
		this.setDailyTimer()
	}

	reloadCorrespondingTracker = (file, oldPath?: string) => {
		this.trackers.forEach(tracker => {
			if (tracker.isTrackingPath(file.path) || (oldPath && tracker.isTrackingPath(oldPath))) {
				tracker.reload()
			}
		})
	}

	setDailyTimer() {
		let nextDay = moment().add(1, 'day').startOf('day')

		this.registerInterval(window.setInterval(() => {
			if (moment().diff(nextDay) < 0) {
				return  // still the same day
			}
			this.trackers.forEach(tracker => tracker.reload())

			// reset nextDay
			nextDay = moment().add(1, 'day').startOf('day')
		}, 1000))
	}
}
