// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Pub/Sub Single Message Transform (SMT) JavaScript UDF for Cloud Logging to BigQuery.
 *
 * Intercepts Cloud Logging LogEntry JSON payloads in flight and stringifies dynamic/polymorphic
 * object fields (jsonPayload, protoPayload, labels, resource.labels) into JSON strings so they
 * ingest cleanly into BigQuery native JSON columns without schema drift errors.
 *
 * Top-level scalar fields and structured RECORD fields (httpRequest, operation, sourceLocation,
 * resource.type) are preserved intact. On any parsing or validation error, captures diagnostic
 * details into message.attributes["udf_error"] and leaves message.data unmodified for Dead-Letter
 * Queue (DLQ) routing.
 *
 * @param {Object} message - The Pub/Sub message object ({ data: string, attributes?: Object }).
 * @param {Object} metadata - Optional Pub/Sub delivery metadata.
 * @return {Object} The transformed Pub/Sub message.
 */
function processCloudLogs(message, metadata) {
  if (!message || typeof message !== 'object') {
    return {
      data: '',
      attributes: {
        udf_error: 'Invalid message envelope: message must be a non-null object'
      }
    };
  }

  try {
    if (typeof message.data !== 'string') {
      throw new Error('Message data must be a UTF-8 JSON string');
    }

    let data = JSON.parse(message.data);

    // Reject null, primitive, or Array root payloads
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(
        'Root log payload must be a non-null JSON object (Log payload must be a non-null JSON object)'
      );
    }

    // If a wrapped Pub/Sub envelope was serialized into message.data, unwrap inner LogEntry JSON
    if (typeof data.data === 'string') {
      try {
        const inner = JSON.parse(data.data);
        if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
          data = inner;
        }
      } catch (_) {
        // Keep outer object if data.data is not a valid JSON object string
      }
    }

    /**
     * Safely stringifies a property on parentObj if its value is a non-null JavaScript object.
     * Already-stringified strings, numbers, booleans, and null/undefined values are left untouched.
     *
     * @param {Object} parentObj - Object containing the field.
     * @param {string} fieldName - Property key to inspect and stringify.
     */
    function stringifyIfObject(parentObj, fieldName) {
      if (
        parentObj &&
        Object.prototype.hasOwnProperty.call(parentObj, fieldName) &&
        parentObj[fieldName] !== null &&
        parentObj[fieldName] !== undefined &&
        typeof parentObj[fieldName] === 'object'
      ) {
        parentObj[fieldName] = JSON.stringify(parentObj[fieldName]);
      }
    }

    stringifyIfObject(data, 'jsonPayload');
    stringifyIfObject(data, 'protoPayload');
    stringifyIfObject(data, 'labels');

    if (
      data.resource &&
      typeof data.resource === 'object' &&
      !Array.isArray(data.resource)
    ) {
      stringifyIfObject(data.resource, 'labels');
    }

    message.data = JSON.stringify(data);
    if (message.attributes && message.attributes['udf_error']) {
      delete message.attributes['udf_error'];
    }
    return message;
  } catch (error) {
    message.attributes = message.attributes || {};
    const errMsg =
      error && error.message
        ? `${error.name ? error.name + ': ' : ''}${error.message}`
        : String(error);
    message.attributes['udf_error'] = errMsg;
    return message;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { processCloudLogs };
}
