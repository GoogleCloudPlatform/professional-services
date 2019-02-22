/**
 * Copyright 2018 Google LLC. All rights reserved.
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
  Google Netblock Monitor

  Polls dns.google.com for TXT record information on various Google Netblocks,
  as defined in https://support.google.com/a/answer/60764. Reports back changes.

  A comparison of current blocks is done against previously known IP blocks
  stored in Apps Script properties. If/when IP blocks are found to be added or
  removed, an email is generated with the specific details.
*/


/**
 * Script Configuration
 *
 * Modify the below variables to match requirements.
 * [REQ] DISTRIBUTION_LIST: include emails that will receive notifications.
 * [OPT] DAILY_TRIGGER_HOUR is the hour when the script should run each day.
 * [OPT] DAILY_TRIGGER_TZ is the timezone that maps to the hour.
 */
/** @const {!Array<string>} */
var DISTRIBUTION_LIST = [
  'email@domain.com',
  'email2@domain.com',
  'email3@domain.com'
];
/** @const {number} */
var DAILY_TRIGGER_HOUR = 8;
/** @const {string} */
var DAILY_TRIGGER_TZ = 'America/New_York';

/**
 * Google Netblock Configuration
 */
/** @const {string} */
var DNS_RECORD_TYPE = 'TXT';
/** @const {string} */
var GOOGLE_DNS_URL = 'https://dns.google.com/resolve?name=%DOMAIN%&type=%RECORD%';
/** @const {string} */
var GOOGLE_SPF_RECORD = '_spf.google.com';

/**
 * Email Configuration
 */
/** @const {string} */
var EMAIL_SUBJECT = 'Google Netblock Changes Detected';
/** @const {string} */
var EMAIL_HTML_BODY = '<table><tr><th>Action</th><th>IP Type</th>' +
    '<th>IP Range</th><th>Source</th></tr>%CHANGE_RECORDS%</table>';
/** @enum {string} */
var ChangeRecordFormat = {
  HTML: '<tr><td>%ACTION%</td><td>%IPTYPE%</td><td>%IP%</td>' +
      '<td>%SOURCE%</td></tr>',
  PLAIN: 'Action: %ACTION% IP Type: %IPTYPE% ' +
      'IP Range: %IP% Source: %SOURCE%\n'
};

/**
 * Script Objects
 */
/** @enum {string} */
var ChangeAction = {
  ADD: 'add',
  REMOVE: 'remove'
};
/** @enum {string} */
var IpType = {
  V4: 'ip4',
  V6: 'ip6'
};

/**
 * ChangeRecord object that details relevant info when a netblock is changed.
 * @typedef {{action:!ChangeAction, ipType:!IpType, ip:string, source:string}}
 */
var ChangeRecord;

/**
 * Public Functions
 */

/**
 * Initializes the Apps Script project by ensuring that the prompt for
 * permissions occurs before the trigger is set, script assets (triggers,
 * properties) start in a clean state, data is populated, and an email is sent
 * containing the current state of the netblocks.
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
 * Kicks off the workflow to fetch the netblocks, analyze/store the results,
 * and email any changes.
 */
function executeUpdateWorkflow() {
  var fullIpToNetblockMap = {};
  try {
    var netblocks = getNetblocksFromSpf_();
    netblocks.forEach(function(netblock) {
      var ipToNetblockMap = getIpsFromNetblock_(netblock);
      consolidateObjects_(fullIpToNetblockMap, ipToNetblockMap);
    });

    var netblockChanges = getNetblockChanges_(fullIpToNetblockMap);
    if (netblockChanges.length) {
      emailChanges_(netblockChanges);
      Logger.log('Changes found: %s', netblockChanges.length);
    } else {
      Logger.log('No changes found.');
    }
  } catch(err) {
    Logger.log(err);
  }
}

/**
 * Writes the contents of the script's properties to logs for manual inspection.
 */
function logScriptProperties() {
  var knownNetblocks = PropertiesService.getScriptProperties().getProperties();
  Object.keys(knownNetblocks).forEach(function(ip) {
    Logger.log('IP: %s   Source: %s', ip, knownNetblocks[ip]);
  });
}


/**
 * Workflow (Private) Functions
 */

/**
 * Queries for Google's netblocks from the known SPF record and returns them.
 * @private
 * @return {!Array<string>} List of netblocks.
 */
function getNetblocksFromSpf_() {
  var spfResponse = getNsLookupResponse_(GOOGLE_SPF_RECORD, DNS_RECORD_TYPE);
  return Object.keys(parseDNSResponse_(spfResponse));
}

/**
 * Queries for Google's IPs from a given netblock and returns them.
 * @private
 * @param {string} netblock The netblock to lookup.
 * @return {!Object<string, string>} Key value map of an IP address to source
 *    netblock. e.g. {'64.233.160.0/19': '_netblocks.google.com'}
 */
function getIpsFromNetblock_(netblock) {
  var response = getNsLookupResponse_(netblock, DNS_RECORD_TYPE);
  return parseDNSResponse_(response);
}

/**
 * Performs the equivalent of nslookup leveraging Google DNS.
 * @private
 * @param {string} domain Domain to lookup (e.g. _spf.google.com).
 * @param {string} recordType DNS record type (e.g. MX, TXT, etc.)
 * @return {!Object<string, string|number>} Google DNS response content.
 */
function getNsLookupResponse_(domain, recordType) {
  var url = GOOGLE_DNS_URL.replace('%DOMAIN%', domain)
      .replace('%RECORD%', recordType);
  var result = UrlFetchApp.fetch(url,{muteHttpExceptions:true});
  if (result.getResponseCode() !== 200) {
    throw new Error(result.message);
  }

  return /** @type {!Object<string, string|number>} */ (
      JSON.parse(result.getContentText()));
}

/**
 * Finds and parses IP address information from a Google DNS record.
 * @private
 * @param {!Object} response Google DNS response content.
 * @return {!Object<string, string>} Key value map of an IP address to source
 *    netblock. e.g. {'64.233.160.0/19': '_netblocks.google.com'}
 */
function parseDNSResponse_(response) {
  var netblockMap = {};

  // Google Netblocks only have one TXT record.
  var answer = response['Answer'][0];
  var dns = answer['name'];
  var components = answer['data'].split(' ');

  // An example response will follow the following format, only with more
  // IP addresses: 'v=spf1 ip4:64.233.160.0/19 ip4:66.102.0.0/20 ~all'
  // Since we're only interested in the IP addresses, we can remove the first
  // and last index from the split(' ') array.
  components.shift();
  components.pop();

  components.forEach(function(component, index) {
    // For the queries we're making, examples of the two components would be:
    // include:_netblocks.google.com or ip4:64.233.160.0/19. In both cases,
    // we're only interested in the contents after the colon.
    var ip = component.substring(component.indexOf(':') + 1);
    netblockMap[ip] = dns;
  });

  return netblockMap;
}

/**
 * Compares the new netblock IP blocks to the known items in storage.
 * @private
 * @param {!Object<string, string>} ipToNetblockMap A key value map of an IP
 *    address to source netblock.
 *    e.g. {'64.233.160.0/19': '_netblocks.google.com'}
 * @return {!Array<?ChangeRecord>} List of ChangeRecord(s) representing
 *    detected changes and whether the action should be to add or remove them.
 */
function getNetblockChanges_(ipToNetblockMap) {
  if (!ipToNetblockMap) {
    return [];
  }

  var changes = [];
  var newProperties = {};
  var oldProperties = PropertiesService.getScriptProperties().getProperties();

  // First check to see which previous IPs still exist. Keep those that are,
  // and remove those that no longer exist.
  Object.keys(oldProperties).forEach(function(previousIP) {
    if(ipToNetblockMap.hasOwnProperty(previousIP)) {
      newProperties[previousIP] = oldProperties[previousIP];
    }
    else {
      changes.push(
          getChangeRecord_(ChangeAction.REMOVE, getIPType_(previousIP),
                           previousIP, oldProperties[previousIP]));
    }
  });

  // Then check to see which current IPs didn't exist previously and add them.
  Object.keys(ipToNetblockMap).forEach(function(currentIP) {
    if(!oldProperties[currentIP]) {
      changes.push(
          getChangeRecord_(ChangeAction.ADD, getIPType_(currentIP),
                           currentIP, ipToNetblockMap[currentIP]));
      newProperties[currentIP] = ipToNetblockMap[currentIP];
    }
  });

  // Replace the existing list of IPs and netblocks (within script storage)
  // with the current state.
  PropertiesService.getScriptProperties().setProperties(newProperties, true);

  return changes;
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
    changePlain += formatChangeForDisplay_(
        changeRecord, ChangeRecordFormat.PLAIN);
    changeHTML += formatChangeForDisplay_(
        changeRecord, ChangeRecordFormat.HTML);
  });

  GmailApp.sendEmail(
    DISTRIBUTION_LIST.join(', '),
    EMAIL_SUBJECT,
    changePlain,
    // The HTML formatted records, represented as table rows (<tr>), need to be
    // inserted into the table (<table>), along with the table headers (<th>).
    {'htmlBody': EMAIL_HTML_BODY.replace('%CHANGE_RECORDS%', changeHTML)}
  );
}


/**
 * Helper Functions
 */

/**
 * Creates and returns a record object that reflects changes in netblocks.
 * @private
 * @param {!ChangeAction} action The type change that occurred.
 * @param {!IpType} ipType The type of IP address.
 * @param {string} ip The IP range.
 * @param {string} source The netblock source the IP came from.
 * @return {!ChangeRecord} Change record object.
 */
function getChangeRecord_(action, ipType, ip, source) {
  return {
    action: action,
    ipType: ipType,
    ip: ip,
    source: source
  };
}

/**
 * Decides whether or not an IP block is IP4 or IP6 based on formatting.
 * @private
 * @param {string} ip IP address.
 * @return {!IpType} IP address type classification.
 */
function getIPType_(ip) {
  return (ip.indexOf(':') > -1) ? IpType.V6 : IpType.V4;
}

/**
 * Creates a formatted record of an change based on a template.
 * @private
 * @param {!ChangeRecord} changeRecord Record representing a netblock change.
 * @param {!ChangeRecordFormat} emailChangeFormat HTML or PLAIN.
 * @return {string} - Formatted change that includes the values.
 */
function formatChangeForDisplay_(changeRecord, emailChangeFormat) {
  return emailChangeFormat.replace('%ACTION%', changeRecord.action)
      .replace('%IPTYPE%', changeRecord.ipType)
      .replace('%IP%', changeRecord.ip)
      .replace('%SOURCE%', changeRecord.source);
}

/**
 * Merges one key/value object into a another key/value object. Duplicate keys
 * take the value from the merger (newer) object.
 * @private
 * @param {?Object} absorbingObject Object to absorb values.
 * @param {?Object} objectToBeAbsorbed Object that will be absorbed.
 * @return {?Object} Resultant superset object that includes master and merger.
 */
function consolidateObjects_(absorbingObject, objectToBeAbsorbed) {
  if (!absorbingObject) { absorbingObject = {}; }
  if (objectToBeAbsorbed) {
    Object.keys(objectToBeAbsorbed).forEach(function(key) {
      absorbingObject[key] = objectToBeAbsorbed[key];
    });
  }
  return absorbingObject;
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
  ScriptApp.newTrigger('executeUpdateWorkflow').timeBased()
      .atHour(DAILY_TRIGGER_HOUR).everyDays(1)
      .inTimezone(DAILY_TRIGGER_TZ).create();
}
