import {
	format,
	parseISO,
	isToday,
} from 'date-fns';

const getDateAsString = function(date) {
	return format(date, 'yyyy-MM-dd')
}

const getDayOfTheWeek = function(date) {
	return format(date,'EEEE').toLowerCase();
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

		// Format the date using date-fns
		let prettyDate = format(date, 'MMMM d, yyyy')

		if (isToday(date)) {
			prettyDate = `Today, ${prettyDate}`
		}

		return prettyDate
	}

const isValidCSSColor = function (color) {
	if (!color) return false
	const tempEl = document.createElement('div')
	tempEl.style.color = color
	return tempEl.style.color !== ''
}

export {
	getDateAsString,
	getDayOfTheWeek,
	debugLog,
	renderPrettyDate,
	pluralize,
	isValidCSSColor
};
