/*
 * Localization script for Safari Timecamp Trello Extension
 * ©2015 Răzvan Ioan Anastasescu
 * Licence: None
 * Resources: Chrome Timecamp Extension
 */

function fallback(lang) {
	switch(lang) {
    case "en-gb": return "en-us";
    case "en-ca":
    case "en-au": return "en-gb";
    case "fr-ca":
    case "fr-ch": return "fr-fr";
    case "es-xl": return "es-es";
    case "de-at":
    case "de-ch": return "de-de";
    case "it-ch": return "it-it";
    default: return "en-us";
	}
}

const STRINGS = {
	"BADGE_TIMER_RUNNING": {
      "en-us": "TimeCamp timer is running for this card"
   },
   "BUTTON_CONNECTION_ERROR": {
      "en-us": "Error"
   },
   "BUTTON_LOG_IN": {
      "en-us": "Log in"
   },
   "BUTTON_LOG_Out": {
      "en-us": "Log out"
   },
   "BUTTON_TIMER_STARTED": {
      "en-us": "Stop timer"
   },
   "BUTTON_TIMER_STARTED_SHORT": {
      "en-us": "Stop"
   },
   "BUTTON_TIMER_STARTING": {
      "en-us": "Starting..."
   },
   "BUTTON_TIMER_STOPPED": {
      "en-us": "Start timer"
   },
   "BUTTON_TIMER_STOPPED_SHORT": {
      "en-us": "Start"
   },
   "BUTTON_TIMER_STOPPING": {
      "en-us": "Stopping..."
   },
   "BUTTON_TIMER_STOPPING_SHORT": {
      "en-us": "..."
   },
   "BUTTON_TIMER_STOP_TRACKING_ANOTHER_TASK": {
      "en-us": "Start new timer"
   },
   "DESCRIPTION": {
      "en-us": "TimeCamp timer tracker for popular webpages"
   },
   "EMPTY_MESSAGE": {
      "en-us": ""
   },
   "NAME": {
      "en-us": "TimeCamp Timer"
   },
   "STATUS_LOGGING_IN": {
      "en-us": "Logging in..."
   },
   "STATUS_SUCCESS": {
      "en-us": "Success!"
   },
   "SYNCHRONIZING": {
      "en-us": "Synchronizing..."
   },
   "SYNCING": {
      "en-us": "Syncing"
   },
   "TITLE": {
      "en-us": "TimeCamp Tracker"
   },
	 "MISSING_SESSION_NOTIFICATION_TITLE":{
			"en-us": "Timecamp session missing"
	 },
	 "MISSING_SESSION_NOTIFICATION_BODY":{
			"en-us": "Please login to your Timecamp account (in a separate tab) in order to automatically obtain your API token."
	 }
}

for(var string in STRINGS) {
	var lang = navigator.language;
	do {
		this[string] = STRINGS[string][lang];
		lang = fallback(lang);
	} while(this[string] === undefined);
}