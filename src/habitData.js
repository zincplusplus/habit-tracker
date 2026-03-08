import {parseYaml, TFile} from 'obsidian'
import {debugLog, isValidCSSColor} from './utils'

export async function loadFrontmatter(app, path, habitName, debug, pluginName) {
	const file = app.vault.getAbstractFileByPath(path)
	if (!file || !(file instanceof TFile)) {
		debugLog(`No file found for path: ${path}`, debug, undefined, pluginName)
		return {}
	}
	try {
		const result = await app.vault.read(file)
		const fmRaw = result.split('---')[1]
		if (!fmRaw) {
			return {entries: []}
		}
		const fmParsed = parseYaml(fmRaw)
		if (fmParsed['entries'] == undefined) {
			fmParsed['entries'] = []
		}
		return fmParsed
	} catch (error) {
		debugLog(
			`Error in habit ${habitName}: ${error.message}`,
			debug,
			undefined,
			pluginName,
		)
		return {}
	}
}

export function toggleHabitEntry(app, path, entries, date) {
	const file = app.vault.getAbstractFileByPath(path)
	if (!file || !(file instanceof TFile)) {
		return null
	}
	let newEntries = [...entries]
	if (entries.includes(date)) {
		newEntries = newEntries.filter((e) => e !== date)
	} else {
		newEntries.push(date)
	}
	newEntries = newEntries.sort()
	app.fileManager.processFrontMatter(file, (fm) => {
		fm['entries'] = newEntries
	})
	return newEntries
}

export function resolveColor(frontmatter, userSettings, globalSettings) {
	const color =
		frontmatter.color || userSettings.color || globalSettings.defaultColor
	if (color && isValidCSSColor(color)) {
		return color
	}
	return ''
}
