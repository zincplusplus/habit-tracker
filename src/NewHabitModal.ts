// based on https://docs.obsidian.md/Plugins/User+interface/Modals#Accept+user+input

import {App, Modal, Setting} from 'obsidian'

export class NewHabitModal extends Modal {
	result = ''
	onSubmit: (result: string) => void

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app)
		this.onSubmit = onSubmit
	}

	onOpen() {
		const {contentEl} = this

		contentEl.createEl('h1', {text: 'Create new Habit'})

		new Setting(contentEl).setName('Name').addText((text) =>
			text.onChange((value) => {
				this.result = value
				button.setDisabled(!this.result.trim())
			}),
		)

		const button = new Setting(contentEl).addButton((btn) =>
			btn
				.setDisabled(true)
				.setButtonText('Submit')
				.setCta()
				.onClick(() => {
					this.close()
					this.onSubmit(this.result)
				}),
		)
	}

	onClose() {
		let {contentEl} = this
		contentEl.empty()
	}
}
