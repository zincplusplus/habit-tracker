import {
	format,
	parseISO,
	isToday,
	addDays,
	differenceInCalendarDays,
} from 'date-fns';

const getDateAsString = function(date) {
	const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd')
}

const getDayOfTheWeek = function(date) {
	return format(parseISO(date),'EEEE').toLowerCase();
}

// TODO make it somehow that i don't have to pass the debug level every time?
// TODO add different levels of debugging, store them in a object or something so they have labels maybe?
const debugLog = function(message, currentDebugLevel, requiredLevel, pluginName = 'Habit Tracker 21') {
	if(!currentDebugLevel) return null;

	if(requiredLevel && requiredLevel!==currentDebugLevel) return null;

	console.log(`[${pluginName}]`, message);
}

const pluralize = function(count, singular, plural) {
	if (count === 1) return singular
	return plural || singular + 's'
}

const renderPrettyDate = function (dateString) {
		// Parse the input date string into a Date object
		const date = parseISO(dateString)

		let prettyDate = window.moment(date).format('ll')

		let prefix = isToday(date) ? 'Today' : window.moment(date).format('ddd')

		prettyDate = `${prefix}, ${prettyDate}`;

		return prettyDate
	}

const isValidCSSColor = function (color) {
	if (!color) return false
	const tempEl = document.createElement('div')
	tempEl.style.color = color
	return tempEl.style.color !== ''
}

const parseCssColorToRgb = function (color) {
	if (typeof document === 'undefined') return null
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')
	if (!context) return null

	context.fillStyle = '#000000'
	context.fillStyle = color
	const normalizedColor = context.fillStyle
	const hexMatch = normalizedColor.match(/^#([0-9a-f]{3,8})$/i)
	if (hexMatch) {
		const hex = hexMatch[1]
		if (hex.length === 3) {
			return {
				r: Number.parseInt(hex[0] + hex[0], 16),
				g: Number.parseInt(hex[1] + hex[1], 16),
				b: Number.parseInt(hex[2] + hex[2], 16),
			}
		}
		if (hex.length >= 6) {
			return {
				r: Number.parseInt(hex.slice(0, 2), 16),
				g: Number.parseInt(hex.slice(2, 4), 16),
				b: Number.parseInt(hex.slice(4, 6), 16),
			}
		}
		return null
	}
	const rgbMatch = normalizedColor.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
	if (!rgbMatch) return null
	return {
		r: Number.parseInt(rgbMatch[1], 10),
		g: Number.parseInt(rgbMatch[2], 10),
		b: Number.parseInt(rgbMatch[3], 10),
	}
}

const buildGraphCellStyle = function (customColor) {
	const rgb = parseCssColorToRgb(customColor)
	const textColor = (() => {
		if (!rgb) return 'var(--text-on-accent, var(--text-normal))'
		const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
		return luminance > 0.72 ? 'rgb(34, 38, 43)' : 'rgb(244, 247, 250)'
	})()

	return `--graph-cell-color: ${customColor}; --graph-today-color: ${customColor}; --graph-cell-contrast-color: color-mix(in srgb, ${customColor} 18%, black 82%); --graph-cell-text-color: ${textColor}`
}

const computeHabitRenderedDays = function ({dates = [], entries = [], maxGap = 0}) {
	const entrySet = new Set(entries)

	const days = dates.map((date) => {
		const ticked = entrySet.has(date)
		let gap = false
		if (!ticked && maxGap > 0) {
			const parsed = parseISO(date)
			for (let i = 0; i < entries.length - 1; i++) {
				const prev = parseISO(entries[i])
				const next = parseISO(entries[i + 1])
				if (
					differenceInCalendarDays(parsed, prev) > 0 &&
					differenceInCalendarDays(next, parsed) > 0
				) {
					if (differenceInCalendarDays(next, prev) - 1 <= maxGap) {
						gap = true
					}
					break
				}
			}
		}
		return {
			date,
			ticked,
			gap,
			deadline: false,
			title: '',
			streakStart: false,
			streakEnd: false,
			streakCount: 0,
		}
	})

	let streakStartIdx = -1
	for (let i = 0; i <= days.length; i++) {
		const inStreak = i < days.length && (days[i].ticked || days[i].gap)
		if (inStreak && streakStartIdx === -1) {
			streakStartIdx = i
		} else if (!inStreak && streakStartIdx !== -1) {
			const endIdx = i - 1

			let firstTickDate = null
			let lastTickDate = null
			for (let j = streakStartIdx; j <= endIdx; j++) {
				if (days[j].ticked) {
					if (!firstTickDate) firstTickDate = days[j].date
					lastTickDate = days[j].date
				}
			}

			if (firstTickDate) {
				const firstTickIdx = entries.indexOf(firstTickDate)
				const prevEntry = firstTickIdx > 0 ? entries[firstTickIdx - 1] : null
				const continuesFromBefore =
					prevEntry &&
					differenceInCalendarDays(parseISO(firstTickDate), parseISO(prevEntry)) - 1 <= maxGap
				if (!continuesFromBefore) {
					days[streakStartIdx].streakStart = true
				}
			} else {
				days[streakStartIdx].streakStart = true
			}

			if (lastTickDate) {
				const lastTickIdx = entries.indexOf(lastTickDate)
				const nextEntry = lastTickIdx < entries.length - 1 ? entries[lastTickIdx + 1] : null
				const continuesAfter =
					nextEntry &&
					differenceInCalendarDays(parseISO(nextEntry), parseISO(lastTickDate)) - 1 <= maxGap
				if (!continuesAfter) {
					days[endIdx].streakEnd = true
				}
			} else {
				days[endIdx].streakEnd = true
			}

			let count = 0
			if (lastTickDate) {
				const anchorIdx = entries.indexOf(lastTickDate)
				if (anchorIdx !== -1) {
					count = 1
					for (let j = anchorIdx; j > 0; j--) {
						const gapDays =
							differenceInCalendarDays(parseISO(entries[j]), parseISO(entries[j - 1])) - 1
						if (gapDays > maxGap) break
						count++
					}
				}
			}

			days[endIdx].streakCount = count
			streakStartIdx = -1
		}
	}

	if (maxGap > 0 && entries.length > 0) {
		const today = format(new Date(), 'yyyy-MM-dd')
		const lastEntry = entries[entries.length - 1]
		const deadlineDate = format(addDays(parseISO(lastEntry), maxGap + 1), 'yyyy-MM-dd')
		if (deadlineDate >= today) {
			const ghostDay = days.find((d) => d.date === deadlineDate)
			if (ghostDay && !ghostDay.ticked) {
				ghostDay.deadline = true
			}
		}
	}

	return days
}

export {
	getDateAsString,
	getDayOfTheWeek,
	debugLog,
	renderPrettyDate,
	pluralize,
	isValidCSSColor,
	buildGraphCellStyle,
	computeHabitRenderedDays,
};
