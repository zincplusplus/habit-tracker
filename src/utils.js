import {
	format,
} from 'date-fns';

const getDateAsString = function(date) {
	return format(date, 'yyyy-MM-dd')
}

const getDayOfTheWeek = function(date) {
	return format(date,'EEEE').toLowerCase();
}

// TODO make it somehow that i don't have to pass the debug level every time?
// TODO add different levels of debugging, store them in a object or something so they have labels maybe?
const debugLog = function(message, currentDebugLevel, requiredLevel, pluginName = 'Habit Tracker') {
	if(!currentDebugLevel) return null;

	if(requiredLevel && requiredLevel!==currentDebugLevel) return null;

	console.log(`[${pluginName}]`, message);
}

const pluralize = function(count, singular, plural) {
	if (count === 1) return singular
	return plural || singular + 's'
}

export {
	getDateAsString,
	getDayOfTheWeek,
	debugLog,
	pluralize
};
