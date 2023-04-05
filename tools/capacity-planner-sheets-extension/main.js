/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * 
 * Apps Script equivalent of https://github.com/GoogleCloudPlatform/professional-services/blob/main/tools/capacity-planner-cli
 * 
 * Sends the queries listed in queries.gs to the project specified in the Google Sheet
 * to caclulate peak resource usage.
*/

const MONITORING_API_BASE_URL = "https://monitoring.googleapis.com/v3/";
const TOKEN = ScriptApp.getOAuthToken();

/**
 * Cleans the MQL query in preparation for sending it in the API payload.
 * @param {string} MQL query
 * @returns {string} MQL query
 */
function cleanQuery_(query) {
    // Just removes newlines for now
    // If the Monitoring API also cares about extra spaces, remove them here.
    return query.replace("\n", " ");
}

/**
 * Builds a datetime filter to add to the end of the MQL query.
 * Filter example: | within 60m, d'2022/12/21 10:15+07:00'
 * See https://cloud.google.com/monitoring/mql/reference#within-tabop
 * 
 * Timezone must follow the format expected by Utilities.formatDate,
 * otherwise it is ignored and time is assumed to be UTC.
 * See https://developers.google.com/apps-script/reference/utilities/utilities#formatDate(Date,String,String)
 * and "General time zone" in https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html
 * 
 * @param {Date} End time.
 * @param {Number} Duration in minutes
 * @param {string} Timezone in format GMT+HH:mm (example: GMT+09:00)
 * @returns {string} A MQL filter string with the specified end time and duration.
 */
function buildWithinFilter_(endTime, durationMinutes, timezone) {
    const timeStamp = Utilities.formatDate(endTime, timezone, "yyyy/MM/dd HH:mm:ssZZZZ")
    return `| within ${durationMinutes}m, d'${timeStamp}'`;
}

/**
 * Converts timestamps from the Monitoring API with format '2022-12-22T02:20:00Z'
 * to the specified timezone and returns a string like '2022-12-22 22:20:00 +09:00'
 * https://cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.snoozes#TimeInterval
 */
function formatTimestamp_(timeStr, timezone) {
    // All Monitoring API responses use UTC "Zulu" time
    // NOTE: This will error for timestamps with nanosecond precision.
    const datetime = Utilities.parseDate(timeStr, "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
    return Utilities.formatDate(datetime, timezone, "yyyy-MM-dd HH:mm:ss") + timezone.replace("GMT", "");
}

/**
 * Sends the MQL query to the Cloud Monitoring API and yields the response.
 * This function is a generator and yields multiple responses if the API response
 * is paginated.
 * https://cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.timeSeries/query
 * @param {string} project ID
 * @param {string} query in MQL
 * @yields {Object} yields the full response object from the API.
 */
function* sendQuery_(projectId, query) {
    const url = `${MONITORING_API_BASE_URL}projects/${projectId}/timeSeries:query`;
    const headers = {
        Authorization: "Bearer " + TOKEN,
        Accept: "application/json"
    };
    let payload = { "query": query };
    Logger.log(query)

    let response;
    do {
        // TODO: Add automatic retry for retriable errors.
        // https://google.aip.dev/194
        const rawResponse = UrlFetchApp.fetch(url, {
            "headers": headers,
            "payload": payload,
            "muteHttpExceptions": true
        });

        response = JSON.parse(rawResponse.getContentText());

        // Check for common error response codes and wrap the errpo
        // with more user-friendly messages.
        if (rawResponse.getResponseCode() != 200) {
            const genericMessage = `\n\nThe payload and error response are shared for debugging purposes.
                            \n\nPAYLOAD: ${JSON.stringify(payload)}\n\nERROR: ${rawResponse.getContentText()}`;

            if (response.error.status == "PERMISSION_DENIED") {
                throw Error(`Project "${projectId}" could not be found. 
                    Check that the project exists and that you have permissions to view metrics in it.` + genericMessage);
            }
            else if (response.error.status == "INVALID_ARGUMENT") {
                throw Error("The query has an invalid argument." + genericMessage);
            }
            // Some other error was raised
            throw Error(genericMessage);
        }

        if ("timeSeriesData" in response) {
            yield response;
        }

        if ("nextPageToken" in response) {
            payload["pageToken"] = response.nextPageToken;
        }
    }
    while ('nextPageToken' in response)
}

/**
 * Loads the default queries.
 * @yields {array} 3-item array with the product name, metric name and query.
 */
function* loadQueries_() {
    for (product in QUERIES) {
        const productName = QUERIES[product]['product_name'];
        for (metric in QUERIES[product]['metrics']) {
            const metricName = QUERIES[product]['metrics'][metric]['metric_name'];
            const query = QUERIES[product]['metrics'][metric]['query'];

            yield [productName, metricName, query];
        }
    }
}

/**
 * Returns the label descriptors keys from the timeSeriesDescriptor.
 * https://cloud.google.com/monitoring/api/ref_v3/rest/v3/LabelDescriptor
 * @param {Object} query response
 * @returns {Array} an array of the label descriptors
 */
function extractLabelDescriptors_(response) {
    if ("labelDescriptors" in response.timeSeriesDescriptor) {
        return response.timeSeriesDescriptor.labelDescriptors.map(l => l.key);
    }
    else {
        return [];
    }
}

/**
 * Extracts the unit of the points in the timeSeriesDescriptor.
 * https://cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.timeSeries/query#timeseriesdescriptor
 * https://cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.timeSeries/query#ValueDescriptor
 * @param {Object} query response
 * @returns {string} The unit
 */
function extractUnit_(response) {
    return response.timeSeriesDescriptor.pointDescriptors[0].unit;
}

/**
 * Extract the label value, which can be a bool, int or string.
 * https://cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.timeSeries/query#labelvalue
 * @param {Object} LabelValue
 * @returns boolean, integer, or string
 */
function extractLabelValue_(labelValue) {
    if ("boolValue" in labelValue) {
        return labelValue.boolValue;
    }
    else if ("int64Value" in labelValue) {
        return labelValue.int64Value;
    }
    else if ("stringValue" in labelValue) {
        return labelValue.stringValue;
    }
    throw Error("Expected field boolValue, int64Value, or stringValue. Actual field is:" + JSON.stringify(typedValue))
}

/**
 * Unpack TypedValue to the equivalent javascript value.
 * https://cloud.google.com/monitoring/api/ref_v3/rest/v3/TypedValue
 * Throws an error for bool, string, and distribution types as those do
 * not logically make sense for the queries this tool can send.
 * @param {Object} TypedValue
 * @returns integer or double
 */
function extractValue_(typedValue) {
    // NOTE: TypedValue is a union field so the API will never send a response
    // with multiple fields set.
    if ("int64Value" in typedValue) {
        return typedValue.int64Value;
    }
    else if ("doubleValue" in typedValue) {
        return typedValue.doubleValue;
    }
    // There is some other type or no type set.
    throw Error("Expected type int64Value or doubleValue. Actual type is:" + JSON.stringify(typedValue))
}

/**
 * Finds the PointData with the highest value in the time series.
 * If multiple points have the max value, the first point is returned.
 * https://cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.timeSeries/query#pointdata
 * @param {Object} timeSeriesData field in query response
 * @returns {Object} PointData with the max value
 */
function findPeak_(timeSeriesData) {
    const max = timeSeriesData.pointData.reduce(
        (a, b) => extractValue_(a.values[0]) > extractValue_(b.values[0]) ? a : b
    );
    return max;
}


/**
 * Loads metrics data for a single project from a {project_id}_raw sheet.
 * @param {Sheet} A sheet with peak values for a particular project.
 * @returns {Map} A map with the metrics data.
 */
function loadProjectMetricsData_(sheet) {
    const data = sheet.getDataRange().getValues();
    let metricsData = new Map();

    for (let i = 1; i < data.length; i++) {
        // i starts from 1 to skip the header row
        const productName = data[i][0];
        const metricName = data[i][1];
        const unit = data[i][2];
        const labels = JSON.parse(data[i][3]);
        const peakValue = data[i][4];
        const peakTime = data[i][5];

        let timeSeries = new Map();
        timeSeries.set("labels", labels);
        timeSeries.set("peakValue", peakValue);
        timeSeries.set("peakTime", peakTime);

        if (!(Array.from(metricsData.keys()).includes(productName))) {
            metricsData.set(productName, new Map());
        }
        if (!(Array.from(metricsData.get(productName).keys()).includes(metricName))) {
            let metricsEntry = new Map();
            metricsEntry.set("unit", unit);
            metricsEntry.set("timeSeries", []);
            metricsData.get(productName).set(metricName, metricsEntry);
        }
        metricsData.get(productName).get(metricName).get("timeSeries").push(timeSeries);
    }

    return metricsData
}

/**
 * Takes the simple CSV output in {project_id}_raw sheets and puts it in a 
 * easier to use combined view for capacity planning.
 */
function createCapacityPlannerSheet() {
    // TODO: Let user choose the name.
    const sheetName = "Combined Planning Sheet"
    const ss = SpreadsheetApp.getActive();
    let allMetricsData = new Map();
    for (s of ss.getSheets()) {
        // Search for sheets with name {project_id}_raw and use as input
        if (s.getName().includes("_raw")) {
            const metricsData = loadProjectMetricsData_(s);
            const projectId = s.getName().replace("_raw", "");
            allMetricsData.set(projectId, metricsData);
        }
    }

    // Now output the data into a combined view with all projects
    let newSheet = createSheet_(sheetName);

    // 3 main sections are:
    // 1. Metrics description (4 columns)
    // 2. Estimate/CCU (5 columns)
    // 3. Actual data and gap calculations (6 columns)
    newSheet.appendRow([
        "Project", "Product", "Metrics", "Labels",
        "Estimate / CCU", "", "", "", "",
        `${sheetName} YYYY-MM-DD`, "", "", "", "", ""
    ]);
    newSheet.appendRow([
        "", "", "", "",
        "Per CCU", "-", "-", "-", "-",
        "Estimate for:", "Actual", "Peak timestamp", "Gap", "Gap %", "Notes"
    ]);
    newSheet.appendRow([
        "", "", "", "",
        "", "100,000", "200,000", "500,000", "1,000,000",
        "1,000,000", "", "", "", "", ""
    ]);

    let rowCounter = newSheet.getLastRow() + 1;

    // Save ranges to merge to this array
    let rangesToMerge = [];

    for (let [projectId, metricsData] of allMetricsData) {
        const projectStartRowIndex = rowCounter;

        for (product of metricsData.keys()) {
            const productStartRowIndex = rowCounter;

            for (metricName of metricsData.get(product).keys()) {
                const metricStartRowIndex = rowCounter;

                for (timeSeries of metricsData.get(product).get(metricName).get("timeSeries")) {
                    newSheet.appendRow([
                      projectId, product, metricName, timeSeries.get("labels"),
                      "", "", "", "", "",
                      "", timeSeries.get("peakValue"), timeSeries.get("peakTime"), "", "", ""
                    ]);
                    rowCounter += 1;
                }
                const metricRange = newSheet.getRange(metricStartRowIndex, 3, rowCounter - metricStartRowIndex);
                rangesToMerge.push(metricRange);
            }
            const productRange = newSheet.getRange(productStartRowIndex, 2, rowCounter - productStartRowIndex);
            rangesToMerge.push(productRange);
        }
        const projectRange = newSheet.getRange(projectStartRowIndex, 1, rowCounter - projectStartRowIndex);
        rangesToMerge.push(projectRange)
    }

    rangesToMerge.forEach(range => range.mergeVertically());

    addFormulasToSheet_(newSheet);
    formatSheet_(newSheet);
    addBorder_(newSheet, firstRow=4, firstColumn=2);
    addBorder_(newSheet, firstRow=4, firstColumn=1);
}

function getProjectMetrics() {
    let ss = SpreadsheetApp.getActive();

    const inputsSheet = ss.getSheetByName("README and Inputs");
    const data = inputsSheet.getDataRange().getValues();

    const projectId = data[2][1];  // cell B3
    // Apps Script date utility functions only recognize "GMT", not "UTC".
    // Javascript itself understands both, so use GMT to appease Utilities.parseDate/Utilities.formatDate
    const timezone = data[5][1].replace("UTC", "GMT")
    const endTime = new Date(data[3][1] + timezone)
    // TODO: Consider capping the duration at 2-3 days so the script completes in a reasonable amount of time.
    const duration = data[4][1];

    let csvOutput = [["Product Name", "Metric Name", "Unit", "Labels", "Peak Value", `Peak Time (${timezone})`]];

    for ([productName, metricName, query] of loadQueries_()) {
        query = cleanQuery_(query) + buildWithinFilter_(endTime, duration, timezone);

        for (response of sendQuery_(projectId, query)) {
            const labelDescriptors = extractLabelDescriptors_(response);
            const unit = extractUnit_(response);

            for (timeSeriesData of response.timeSeriesData) {
                const peak = findPeak_(timeSeriesData);
                const peakValue = extractValue_(peak.values[0]);
                const peakTime = formatTimestamp_(peak.timeInterval.endTime, timezone);

                // Creates map from labelName to the value
                // For example: {"resource.region": "global"}
                // Labels are in the same order in labelDescriptors and timesSeriesData.labelValues
                let labels = {};
                for (let i = 0; i < labelDescriptors.length; i++) {
                    labels[labelDescriptors[i]] = extractLabelValue_(timeSeriesData.labelValues[i]);
                }

                // NOTE: This currently skips products with no associated timeSeries.
                csvOutput.push([productName, metricName, unit, JSON.stringify(labels), peakValue, peakTime]);
            }
        }
    }

    // Create a new sheet and write the data to it
    const sheetName = `${projectId}_raw`;
    writeToSheet_(sheetName, csvOutput);
}

/**
 * A function that runs when the spreadsheet is open, used to add a
 * custom menu to the spreadsheet.
 */
function onOpen() {
    let spreadsheet = SpreadsheetApp.getActive();
    const menuItems = [
        { name: "Get Project Metrics", functionName: "getProjectMetrics" },
        { name: "Create Planning Sheet", functionName: "createCapacityPlannerSheet" }
    ];
    spreadsheet.addMenu("Capacity Planner", menuItems);
}


