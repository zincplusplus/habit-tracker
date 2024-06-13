import {App, parseYaml, Notice, TAbstractFile, TFile} from 'obsidian'
import {
	format,
} from 'date-fns';

import {PLUGIN_NAME} from './main.ts'

const getDateAsString = function(date) {
	return format(date, 'yyyy-MM-dd')
}

const getDayOfTheWeek = function(date) {
	return format(date,'EEEE').toLowerCase();
}

const debugLog = function(message, currentDebugLevel, requiredLevel ) {
	if(!currentDebugLevel) return null;
	if(!requiredLevel || requiredLevel==currentDebugLevel) {
		console.debug(`[${PLUGIN_NAME}]`, message);
	}
}

export {
	getDateAsString,
	getDayOfTheWeek,
	debugLog,
};
