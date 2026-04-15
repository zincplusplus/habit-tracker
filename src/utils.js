import {
	format,
	parseISO,
	isToday,
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

// Pure group-filter logic — extracted for testability.
// habitGroup: the raw frontmatter `group` value (string, string[], or undefined)
// groupFilter: the tracker's `group` setting
// excludeFilter: the tracker's `excludeGroup` setting
const matchesGroupFilter = function(habitGroup, groupFilter, excludeFilter) {
	const habitArr = habitGroup == null ? [] : (Array.isArray(habitGroup) ? habitGroup : [habitGroup])
	if (excludeFilter) {
		const excludeArr = Array.isArray(excludeFilter) ? excludeFilter : [excludeFilter]
		if (excludeArr.some((g) => habitArr.includes(g))) return false
	}
	if (groupFilter) {
		const filterArr = Array.isArray(groupFilter) ? groupFilter : [groupFilter]
		return filterArr.some((g) => habitArr.includes(g))
	}
	return true
}

// Sort comparator for habits — extracted for testability.
// a, b: objects with { file: { basename: string }, order: any }
const compareHabits = function(a, b) {
	const aOrd = a.order !== undefined ? Number(a.order) : Infinity
	const bOrd = b.order !== undefined ? Number(b.order) : Infinity
	if (aOrd !== bOrd) return aOrd - bOrd
	return a.file.basename.localeCompare(b.file.basename)
}

// Numeric threshold check — extracted for testability.
// Returns true if value is non-null and meets or exceeds threshold.
const meetsThreshold = function(value, threshold) {
	return value !== null && value !== undefined && value >= threshold
}

export {
	getDateAsString,
	getDayOfTheWeek,
	debugLog,
	renderPrettyDate,
	pluralize,
	isValidCSSColor,
	matchesGroupFilter,
	compareHabits,
	meetsThreshold,
};
