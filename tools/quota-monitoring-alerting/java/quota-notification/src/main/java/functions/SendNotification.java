/*
Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
package functions;

import com.google.cloud.MonitoredResource;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryException;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.Job;
import com.google.cloud.bigquery.JobId;
import com.google.cloud.bigquery.JobInfo;
import com.google.cloud.bigquery.QueryJobConfiguration;
import com.google.cloud.bigquery.TableResult;
import com.google.cloud.functions.BackgroundFunction;
import com.google.cloud.functions.Context;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.cloud.logging.Payload.StringPayload;
import com.google.cloud.logging.Severity;
import com.google.cloud.logging.Synchronicity;
import functions.eventpojos.PubSubMessage;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

/*
 * Cloud Function triggered by Pub/Sub topic to send notification
 * */
public class SendNotification implements BackgroundFunction<PubSubMessage> {
  private static final String HOME_PROJECT = System.getenv("HOME_PROJECT");
  private static final String DATASET = System.getenv("ALERT_DATASET");
  private static final String TABLE = System.getenv("ALERT_TABLE");

  private static final Logger logger = Logger.getLogger(SendNotification.class.getName());

  /*
   * API to accept notification information and process it
   * */
  @Override
  public void accept(PubSubMessage message, Context context) {
    // logger.info(String.format(message.getEmailIds()));
    logger.info("Successfully made it to sendNotification");
    List<String> alerts = browseAlertTable();
    logger.info("Successfully got data from alert table");
    sendAlert(alerts);
    return;
  }

  private static List<String> browseAlertTable() {
    List<String> alerts = new ArrayList();
    try {
      // Initialize client that will be used to send requests
      BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
      QueryJobConfiguration queryConfig =
          QueryJobConfiguration.newBuilder(
                  "SELECT metric, usage, consumption "
                      + "FROM `"
                      + HOME_PROJECT
                      + "."
                      + DATASET
                      + "."
                      + TABLE
                      + "` ")
              .setUseLegacySql(false)
              .build();

      // Create a job ID so that we can safely retry.
      JobId jobId = JobId.of(UUID.randomUUID().toString());
      Job queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());

      // Wait for the query to complete.
      queryJob = queryJob.waitFor();

      // Check for errors
      if (queryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (queryJob.getStatus().getError() != null) {
        throw new RuntimeException(queryJob.getStatus().getError().toString());
      }

      // Identify the table itself
      TableResult result = queryJob.getQueryResults();

      // Get all pages of the results.
      for (FieldValueList row : result.iterateAll()) {
        // Get all values
        String metric = row.get("metric").getStringValue();
        String usage = row.get("usage").getStringValue();
        Float consumption = row.get("consumption").getNumericValue().floatValue();
        alerts.add(
            String.format(
                "Metric name: %s usage: %s consumption: %.2f%s", metric, usage, consumption, "%"));
        logger.info(
            "Alert : Metric " + metric + ": Usage " + usage + ": Consumption " + consumption + "%");
      }

      logger.info("Query ran successfully ");
    } catch (BigQueryException | InterruptedException e) {
      logger.severe("Query failed to run \n" + e.toString());
    }
    return alerts;
  }

  /*
   * Logging API used to construct and send custom log containing quota data
   * The logName triggers the alert policy
   * */
  private static void sendAlert(List<String> alerts) {
    String logName = "quota-alerts";
    String alertsStr = String.join("<br>", alerts);
    String text = alertsStr;
    logger.info(text);
    LoggingOptions logging = LoggingOptions.getDefaultInstance();
    Logging log_client = logging.getService();
    // Configure logger to write entries synchronously
    log_client.setWriteSynchronicity(Synchronicity.SYNC);
    LogEntry entry =
        LogEntry.newBuilder(StringPayload.of(text))
            .setSeverity(Severity.INFO)
            .setLogName(logName)
            .setResource(MonitoredResource.newBuilder("global").build())
            .build();

    log_client.write(Collections.singleton(entry));
  }
}
