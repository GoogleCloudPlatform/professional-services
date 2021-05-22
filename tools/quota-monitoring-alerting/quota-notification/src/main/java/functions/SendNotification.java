/*
Copyright 2021 Google LLC

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
import com.sendgrid.Content;
import com.sendgrid.Email;
import com.sendgrid.Mail;
import com.sendgrid.Method;
import com.sendgrid.Personalization;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import functions.eventpojos.PubSubMessage;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

/*
 * Cloud Function triggered by Pub/Sub topic to send notification
 * */
public class SendNotification implements BackgroundFunction<PubSubMessage> {
  private static final String FROM_EMAIL_ID = System.getenv("FROM_EMAIL_ID");
  private static final String TO_EMAIL_IDS = System.getenv("TO_EMAIL_IDS");
  private static final String HOME_PROJECT = System.getenv("HOME_PROJECT");
  private static final String DATASET = System.getenv("ALERT_DATASET");
  private static final String TABLE = System.getenv("ALERT_TABLE");
  private static final String SENDGRID_API_KEY = System.getenv("SENDGRID_API_KEY");

  private static final Logger logger = Logger.getLogger(SendNotification.class.getName());

  /*
   * API to accept notification information and process it
   * */
  @Override
  public void accept(PubSubMessage message, Context context) {
    // logger.info(String.format(message.getEmailIds()));
    List<String> alerts = browseAlertTable();
    sendEmail(alerts);
    return;
  }

  private static List<String> browseAlertTable() {
    List<String> alerts = new ArrayList();
    try {
      // Initialize client that will be used to send requests
      BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
      QueryJobConfiguration queryConfig =
          QueryJobConfiguration.newBuilder(
                  "SELECT metric, usage, value "
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
        Float consumption = row.get("value").getNumericValue().floatValue();
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
   * API to send Email using SendGrid API
   * */
  private static void sendEmail(List<String> alerts) {
    Email from = new Email(FROM_EMAIL_ID);
    String subject = "ALERT Usage of " + alerts.size() + " metrics is above threshold";
    String[] toEmailIds = TO_EMAIL_IDS.split(",");
    Email to = new Email(toEmailIds[0]);
    Personalization p1 = new Personalization();
    for (String email : toEmailIds) {
      p1.addTo(new Email(email));
    }
    String alertsStr = String.join("\n", alerts);
    Content content = new Content("text/plain", alertsStr);
    Mail mail = new Mail(from, subject, to, content);
    mail.addPersonalization(p1);

    // SendGrid sg = new SendGrid(System.getenv("SENDGRID_API_KEY"));
    SendGrid sg = new SendGrid(SENDGRID_API_KEY);
    Request request = new Request();
    try {
      request.setMethod(Method.POST);
      request.setEndpoint("mail/send");
      request.setBody(mail.build());
      Response response = sg.api(request);
      logger.info(String.valueOf(response.getStatusCode()));
      logger.info(String.valueOf(response.getBody()));
      logger.info(String.valueOf(response.getHeaders()));
    } catch (IOException ex) {
      logger.severe(ex.getMessage());
    }
  }
}
