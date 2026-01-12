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
  Google Netblock Monitor (Forked Version)

  Original behavior:
  - Polls dns.google.com for TXT record information on Google SPF netblocks
  - Stores each IP range as an individual Apps Script property
  - Detects changes and emails notifications

  Fork modifications:
  - Recursive SPF include resolution
  - Single JSON-based storage to avoid IPv6 property corruption
  - Improved robustness and clarity
*/

/**
 * ============================
 * Script Configuration
 * ============================
 */

/** @const {!Array<string>} */
var DISTRIBUTION_LIST = [
  'email@domain.com',
  'email2@domain.com',
  'email3@domain.com'
];

/**
 * Root SPF domain used as the starting point for recursive parsing.
 * Default: _spf.google.com
 */
var START_DOMAIN = '_spf.google.com';

/**
 * Single storage key used to persist all known IP ranges as JSON.
 *
 * MODIFICATION:
 * Apps Script Properties truncate or corrupt keys containing ':' (IPv6).
 * Storing all data in a single JSON value avoids this issue entirely.
 */
var STORAGE_KEY = 'GOOGLE_NETBLOCKS_DATA';

/**
 * Email Configuration
 */
var EMAIL_SUBJECT = 'Google Netblock Changes Detected';

/**
 * ============================
 * Public Functions
 * ============================
 */

/**
 * Initializes the Apps Script project.
 *
 * MODIFICATION:
 * - Clears all existing properties (including corrupted legacy keys)
 * - Recursively resolves SPF includes
 * - Stores all IP ranges in a single JSON object
 * - Resets daily execution trigger
 */
function initializeMonitor() {
  // Clear all stored properties to ensure a clean state
  PropertiesService.getScriptProperties().deleteAllProperties();

  var currentIpMap = {};

  // Recursively resolve SPF records starting from the root domain
  processDomainRecursive_(START_DOMAIN, currentIpMap);

  // Persist the full IP map as a single JSON property
  PropertiesService.getScriptProperties()
    .setProperty(STORAGE_KEY, JSON.stringify(currentIpMap));

  // Reset daily trigger
  resetTriggers_();

  Logger.log(
    'Monitor initialized. Total IP ranges found: %s',
    Object.keys(currentIpMap).length
  );
}

/**
 * Executes the update workflow.
 *
 * MODIFICATION:
 * - Loads previous state from JSON storage
 * - Compares old and new IP maps in memory
 * - Emits ADD / REMOVE change records
 */
function executeUpdateWorkflow() {
  var fullIpMap = {};

  try {
    // Build current IP map
    processDomainRecursive_(START_DOMAIN, fullIpMap);

    var rawOldData =
      PropertiesService.getScriptProperties().getProperty(STORAGE_KEY);
    var oldIpMap = rawOldData ? JSON.parse(rawOldData) : {};

    var changes = [];

    // Detect removed IP ranges
    Object.keys(oldIpMap).forEach(function(oldIP) {
      if (!fullIpMap.hasOwnProperty(oldIP)) {
        changes.push({
          action: 'REMOVE',
          ipType: getIPType_(oldIP),
          ip: oldIP,
          source: oldIpMap[oldIP]
        });
      }
    });

    // Detect newly added IP ranges
    Object.keys(fullIpMap).forEach(function(newIP) {
      if (!oldIpMap.hasOwnProperty(newIP)) {
        changes.push({
          action: 'ADD',
          ipType: getIPType_(newIP),
          ip: newIP,
          source: fullIpMap[newIP]
        });
      }
    });

    // Persist new state only if changes are detected
    if (changes.length > 0) {
      PropertiesService.getScriptProperties()
        .setProperty(STORAGE_KEY, JSON.stringify(fullIpMap));

      emailChanges_(changes);
    } else {
      Logger.log('No netblock changes detected.');
    }

  } catch (err) {
    Logger.log('Execution error: %s', err.toString());
  }
}

/**
 * ============================
 * SPF Processing (Recursive)
 * ============================
 */

/**
 * Recursively resolves SPF records and extracts:
 * - ip4 / ip6 mechanisms
 * - include directives
 *
 * MODIFICATION:
 * The original implementation handled only a single SPF level.
 * This function supports full recursive include resolution.
 *
 * @param {string} domain SPF domain to resolve
 * @param {!Object<string,string>} globalIpMap Map of IP range → source domain
 */
function processDomainRecursive_(domain, globalIpMap) {
  var url =
    'https://dns.google.com/resolve?name=' + domain + '&type=TXT';
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) return;

  var data = JSON.parse(response.getContentText());
  if (!data.Answer) return;

  data.Answer.forEach(function(ans) {
    // Remove quotes added by Google DNS
    var rawData = ans.data.replace(/"/g, '');
    var parts = rawData.split(' ');

    parts.forEach(function(part) {
      // IP mechanisms
      if (part.indexOf('ip4:') === 0 || part.indexOf('ip6:') === 0) {
        var ipRange = part.split(/ip[46]:/)[1];
        globalIpMap[ipRange] = domain;
      }
      // SPF include mechanism
      else if (part.indexOf('include:') === 0) {
        var nextDomain = part.split(':')[1];

        // Prevent infinite recursion
        if (nextDomain && nextDomain !== domain) {
          processDomainRecursive_(nextDomain, globalIpMap);
        }
      }
    });
  });
}

/**
 * ============================
 * Email Reporting
 * ============================
 */

/**
 * Sends an HTML-formatted email describing netblock changes.
 *
 * MODIFICATION:
 * - Color-coded rows for ADD / REMOVE actions
 * - Simplified and readable table layout
 *
 * @param {!Array<!Object>} changeRecords List of detected changes
 */
function emailChanges_(changeRecords) {
  var rows = changeRecords.map(function(r) {
    var color = r.action === 'ADD' ? '#d4edda' : '#f8d7da';
    return (
      '<tr style="background-color:' + color + '">' +
        '<td>' + r.action + '</td>' +
        '<td>' + r.ipType + '</td>' +
        '<td><code>' + r.ip + '</code></td>' +
        '<td>' + r.source + '</td>' +
      '</tr>'
    );
  }).join('');

  var html =
    '<table border="1" cellpadding="6" cellspacing="0">' +
      '<tr>' +
        '<th>Action</th>' +
        '<th>IP Type</th>' +
        '<th>IP Range</th>' +
        '<th>Source</th>' +
      '</tr>' +
      rows +
    '</table>';

  GmailApp.sendEmail(
    DISTRIBUTION_LIST.join(','),
    EMAIL_SUBJECT,
    '',
    { htmlBody: html }
  );
}

/**
 * ============================
 * Helper Functions
 * ============================
 */

/**
 * Determines whether an IP range is IPv4 or IPv6.
 *
 * @param {string} ip IP address or CIDR range
 * @return {string} IP type
 */
function getIPType_(ip) {
  return ip.indexOf(':') > -1 ? 'IPv6' : 'IPv4';
}

/**
 * Resets all project triggers and creates a single daily trigger.
 */
function resetTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  ScriptApp.newTrigger('executeUpdateWorkflow')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .inTimezone('Europe/Rome')
    .create();
}

/**
 * =====================================
 * Fork Notes
 * =====================================
 *
 * This fork extends the original Google Netblock Monitor to:
 * - Fully resolve nested SPF includes
 * - Prevent Apps Script property corruption caused by IPv6 addresses
 * - Store state reliably using a single JSON property
 *
 * Original project by Google LLC.
 * Fork maintained independently.
 */
