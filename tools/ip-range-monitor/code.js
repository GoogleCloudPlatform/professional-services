/**
 * Copyright 2020 Google LLC. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Any software provided by Google hereunder is distributed “AS IS”, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, and is not intended for production use.
 */



/*
  Google IP Range Monitor

  Polls gstatic.com/ipranges/goog.json for information on various
  Google IP ranges. Reports back changes.

  A comparison of current blocks is done against previously known IP ranges
  stored in Apps Script properties. If/when IP ranges are found to be added or
  removed, an email is generated with the specific details.
*/


/**
 * Script Configuration
 *
 * Modify the below variables to match requirements.
 * [REQ] DISTRIBUTION: whether updates to go email, Chat, or both.
 * [REQ] DISTRIBUTION_LIST: include emails that will receive notifications.
 * [OPT] DAILY_TRIGGER_HOUR is the hour when the script should run each day.
 * [OPT] DAILY_TRIGGER_TZ is the timezone that maps to the hour.
 */
/** @enum {boolean} */
var DISTRIBUTION = {CHAT: false, EMAIL: true};
/** @const {!Array<string>} */
var DISTRIBUTION_LIST =
    ['email@domain.com', 'email2@domain.com', 'email3@domain.com'];
/** @const {number} */
var DAILY_TRIGGER_HOUR = 8;
/** @const {string} */
var DAILY_TRIGGER_TZ = 'America/New_York';

/**
 * Google IP Range Configuration
 */
/** @const {string} */
var GOOGLE_IP_RANGES = 'http://www.gstatic.com/ipranges/goog.json';

/**
 * Email Configuration
 */
/** @const {string} */
var EMAIL_SUBJECT = 'Google IP Range Changes Detected';
/** @const {string} */
var EMAIL_HTML_BODY = '<table><tr><th>Action</th><th>Type</th>' +
    '<th>Range</th></tr>%CHANGE_RECORDS%</table>';
/** @enum {string} */
var ChangeRecordFormat = {
  HTML: '<tr><td>%ACTION%</td><td>%IPTYPE%</td><td>%IP%</td></tr>',
  PLAIN: 'Action: %ACTION% IP Type: %IPTYPE% ' +
      'IP Range: %IP%\n'
};

/**
 * Google Chat Configuration
 *
 * Modify the below variables to match requirements.
 * [REQ] CHAT_WEBHOOK_URL: the URL provied by Chat for the webhook, with inputs
 * required for {space}, {key}, and {token}.
 */
/** @const {string} */
var CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/{space}' +
    '/messages?key={key}' +
    '&token={token}';

/**
 * Script Objects
 */
/** @enum {string} */
var ChangeAction = {ADD: 'add', REMOVE: 'remove'};
/** @enum {string} */
var ScriptProperty = {PREFIX: 'prefixes', SYNC: 'syncToken'};

/**
 * ChangeRecord object that details relevant info when a range is changed.
 * @typedef {{action:!ChangeAction, ipType:string, ip:string}}
 */
var ChangeRecord;



/**
 * Public Functions
 */

/**
 * Initializes the Apps Script project by ensuring that the prompt for
 * permissions occurs before the trigger is set, script assets (triggers,
 * properties) start in a clean state, data is populated, and an email is sent
 * containing the current state of Google's IP ranges.
 */
function initializeMonitor() {
  // Ensures the script is in a default state.
  clearProperties_();
  // Clears and initiates a single daily trigger.
  resetTriggers_();
  // Kicks off first fetch of IPs for storage. This will generate an email.
  executeUpdateWorkflow();
  // Logs the storage for manual validation.
  logScriptProperties();
}

/**
 * Kicks off the workflow to fetch the ranges, analyzes/stores the results,
 * and emails any changes.
 */
function executeUpdateWorkflow() {
  try {
    var ipRanges = getGoogleIpRanges_();
    var isDataUpdated = determineIfDataIsUpdated_(ipRanges.syncToken);
    if (!isDataUpdated) {
      Logger.log('Data has not been updated since last check.');
      return;
    }
    var prefixMap = mapIpPrefixes_(ipRanges.prefixes);
    var ipRangeChanges = getIPRangeChanges_(prefixMap);
    setNewDataUpdatedTime_(ipRanges.syncToken);
    if (ipRangeChanges.length) {
      if (DISTRIBUTION.EMAIL) {
        emailChanges_(ipRangeChanges);
      }
      if (DISTRIBUTION.CHAT) {
        postToWebhook_(ipRangeChanges);
      }
      Logger.log('Changes found: %s', ipRangeChanges.length);
    } else {
      Logger.log('No changes found.');
    }
  } catch (err) {
    Logger.log(err);
  }
}

/**
 * Writes the contents of the script's properties to logs for manual inspection.
 */
function logScriptProperties() {
  Logger.log(
      'Last Updated: ' +
      PropertiesService.getScriptProperties().getProperty(ScriptProperty.SYNC));
  var knownPrefixes = PropertiesService.getScriptProperties().getProperty(
      ScriptProperty.PREFIX);
  if (knownPrefixes != null) {
    knownPrefixes = JSON.parse(knownPrefixes);
    Object.keys(knownPrefixes).forEach(function(ip) {
      Logger.log('IP: %s   Type: %s', ip, knownPrefixes[ip]);
    });
  }
}


/**
 * Workflow (Private) Functions
 */
/**
 * Queries for Google's IP ranges from the canonical source and returns them.
 * @private
 * @return {!Object} IP range object.
 */
function getGoogleIpRanges_() {
  var result = UrlFetchApp.fetch(GOOGLE_IP_RANGES, {muteHttpExceptions: true});
  return JSON.parse(result.getContentText());
}

/**
 * Simply checks to see whether the data in the latest fetch is different than
 * the last data stored in storage by comparing the syncToken (timestamp).
 * It's possible that there can be a mismatch but no prefixes have changed.
 * @param {string} syncToken A timestamp of when the list was last updated.
 * @return {bool} Whether or not the dates are different.
 */
function determineIfDataIsUpdated_(syncToken) {
  var previousSyncToken =
      PropertiesService.getScriptProperties().getProperty(ScriptProperty.SYNC);

  if (previousSyncToken == null) {
    return true;
  }

  return (syncToken !== previousSyncToken);
}

/**
 * Converts an array of prefix key/value pairs into a map of ip/ip type.
 * @param {!Array<string, string>} prefixes The list of IP prefixes and type.
 * @return {Object<string, string>} ipPrefixMap Key value map of an IP address
 * to ip address type.
 */
function mapIpPrefixes_(prefixes) {
  var ipPrefixMap = {};

  prefixes.forEach(function(prefix) {
    var type = Object.keys(prefix)[0];
    var ipPrefix = prefix[type];
    ipPrefixMap[ipPrefix] = type.replace('Prefix', '');
  });

  return ipPrefixMap;
}

/**
 * Compares the new IP prefixes to the known items in storage.
 * @private
 * @param {!Object<string, string>} prefixMap A key value map of an IP
 *    address to ip address type (ipv4 or ipv6).
 *    e.g. {'64.233.160.0/19': 'ipv4'}
 * @return {!Array<?ChangeRecord>} List of ChangeRecord(s) representing
 *    detected changes and whether the action should be to add or remove them.
 */
function getIPRangeChanges_(prefixMap) {
  if (!prefixMap) {
    return [];
  }

  var changes = [];
  var newPrefixes = {};
  var oldPrefixes = PropertiesService.getScriptProperties().getProperty(
      ScriptProperty.PREFIX);
  oldPrefixes = (oldPrefixes == null) ? {} : JSON.parse(oldPrefixes);

  // First check to see which previous IPs still exist. Keep those that are,
  // and remove those that no longer exist.
  Object.keys(oldPrefixes).forEach(function(previousIP) {
    if (prefixMap.hasOwnProperty(previousIP)) {
      newPrefixes[previousIP] = oldPrefixes[previousIP];
    } else {
      changes.push(getChangeRecord_(
          ChangeAction.REMOVE, oldPrefixes[previousIP], previousIP));
    }
  });

  // Then check to see which current IPs didn't exist previously and add them.
  Object.keys(prefixMap).forEach(function(currentIP) {
    if (!oldPrefixes[currentIP]) {
      changes.push(
          getChangeRecord_(ChangeAction.ADD, prefixMap[currentIP], currentIP));
      newPrefixes[currentIP] = prefixMap[currentIP];
    }
  });

  // Replace the existing list of IPs and types (within script storage)
  // with the current state.
  PropertiesService.getScriptProperties().setProperty(
      ScriptProperty.PREFIX, JSON.stringify(newPrefixes));

  return changes;
}

/**
 * Updates the script's stored syncToken with the one from the latest data.
 * @param {string} syncToken A timestamp of when the data was last updated.
 */
function setNewDataUpdatedTime_(syncToken) {
  PropertiesService.getScriptProperties().setProperty(
      ScriptProperty.SYNC, syncToken);
}


/**
 * Generates an email that includes a formatted display of all changes.
 * @private
 * @param {!Array<!ChangeRecord>} changeRecords List of detected changes.
 */
function emailChanges_(changeRecords) {
  var changePlain = '';
  var changeHTML = '';

  changeRecords.forEach(function(changeRecord) {
    changePlain +=
        formatChangeForEmail_(changeRecord, ChangeRecordFormat.PLAIN);
    changeHTML += formatChangeForEmail_(changeRecord, ChangeRecordFormat.HTML);
  });

  GmailApp.sendEmail(
      DISTRIBUTION_LIST.join(', '), EMAIL_SUBJECT, changePlain,
      // The HTML formatted records, represented as table rows (<tr>), need to
      // be inserted into the table (<table>), along with the table headers
      // (<th>).
      {'htmlBody': EMAIL_HTML_BODY.replace('%CHANGE_RECORDS%', changeHTML)});
}

/**
 * Generates an Chat post that includes a formatted display of all changes.
 * @private
 * @param {!Array<!ChangeRecord>} changeRecords List of detected changes.
 */
function postToWebhook_(changeRecords) {
  var recordView = formatChangeForChat_(changeRecords);
  try {
    var options = {
      'contentType': 'application/json; charset=UTF-8',
      'method': 'post',
      'payload': JSON.stringify(recordView),
      'followRedirects': true,
      'muteHttpExceptions': true
    };
    UrlFetchApp.fetch(CHAT_WEBHOOK_URL, options);
  } catch (err) {
    Logger.log(err);
  }
}


/**
 * Helper Functions
 */

/**
 * Creates and returns a record object that reflects changes in ranges.
 * @private
 * @param {!ChangeAction} action The type change that occurred.
 * @param {!IpType} ipType The type of IP address.
 * @param {string} ip The IP range.
 * @return {!ChangeRecord} Change record object.
 */
function getChangeRecord_(action, ipType, ip) {
  return {action: action, ipType: ipType, ip: ip};
}

/**
 * Creates a formatted record of an change based on a template.
 * @private
 * @param {!ChangeRecord} changeRecord Record representing a prefix change.
 * @param {!ChangeRecordFormat} emailChangeFormat HTML or PLAIN.
 * @return {string} - Formatted change that includes the values.
 */
function formatChangeForEmail_(changeRecord, emailChangeFormat) {
  return emailChangeFormat.replace('%ACTION%', changeRecord.action)
      .replace('%IPTYPE%', changeRecord.ipType)
      .replace('%IP%', changeRecord.ip);
}

/**
 * Creates a formatted record of an change formatted for Hangouts Chat.
 * @private
 * @param {!Array<!ChangeRecord>} changeRecords List of detected changes.
 * @return {!Object} - Structured Hangouts Chat card object.
 */
function formatChangeForChat_(changeRecords) {
  var sections = [];

  changeRecords.forEach(function(changeRecord) {
    sections.push({
      'widgets': [
        {'textParagraph': {'text': '<b>Action: </b>' + changeRecord.action}},
        {'textParagraph': {'text': '<b>Type: </b>' + changeRecord.ipType}},
        {'textParagraph': {'text': '<b>Range: </b>' + changeRecord.ip}},
      ]
    });
  });

  //
  return {
    'cards': [{
      'header': {
        'title': 'Google IP Range Monitor',
        'subtitle': sections.length + ' changes were detected',
        'imageUrl':
            'http://www.stickpng.com/assets/images/5847f9cbcef1014c0b5e48c8.png',
      },
      'sections': sections
    }]
  };
}



/**
 * Clears all Apps Script internal storage.
 * @private
 */
function clearProperties_() {
  PropertiesService.getScriptProperties().deleteAllProperties();
}

/**
 * Resets script tiggers by clearing them and adding a single daily trigger.
 * @private
 */
function resetTriggers_() {
  // First clear all the triggers.
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  // Then initialize a single daily trigger.
  ScriptApp.newTrigger('executeUpdateWorkflow')
      .timeBased()
      .atHour(DAILY_TRIGGER_HOUR)
      .everyDays(1)
      .inTimezone(DAILY_TRIGGER_TZ)
      .create();
}
