import { Plugin } from 'obsidian'
import HabitTracker from './HabitTracker'
import styles from "./styles.css"

const PLUGIN_NAME = 'Habit Tracker 21'

export default class HabitTracker21 extends Plugin {
	async onload() {
		console.log(`${PLUGIN_NAME}: loading...`)

		this.addStyles()

		this.registerMarkdownCodeBlockProcessor(
			'habits',
			(source, element, context) => {
				new HabitTracker(source, element, context, this.app)
			},
		)
	}

	async onunload() {
		this.removeStyles()
	}

	addStyles() {
		const styleElement = document.createElement('style');
		styleElement.setText(styles);
		document.head.append(styleElement);
	}

	removeStyles() {
		// eslint-disable-next-line unicorn/prefer-spread
		const stylesToRemove = Array.from(
			document.head.querySelectorAll<HTMLStyleElement>('style')
		).filter(element => element.textContent?.includes('habit-tracker'));

		for (const element of stylesToRemove) {
			if (element.textContent?.includes('habit-tracker')) {
				element.remove();
			}
		}
	}
}
