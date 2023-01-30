/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.sts;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.util.Utils;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.util.Preconditions;
import com.google.api.services.storage.StorageScopes;
import com.google.api.services.storagetransfer.v1.Storagetransfer;
import com.google.api.services.storagetransfer.v1.StoragetransferScopes;
import com.google.api.services.storagetransfer.v1.model.Date;
import com.google.api.services.storagetransfer.v1.model.GcsData;
import com.google.api.services.storagetransfer.v1.model.NotificationConfig;
import com.google.api.services.storagetransfer.v1.model.ObjectConditions;
import com.google.api.services.storagetransfer.v1.model.Schedule;
import com.google.api.services.storagetransfer.v1.model.TransferJob;
import com.google.api.services.storagetransfer.v1.model.TransferOptions;
import com.google.api.services.storagetransfer.v1.model.TransferSpec;
import java.io.IOException;
import java.time.Clock;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Helper class to manage STS jobs. */
public class StsJobHelper {
  public static final String STS_ENABLED_STRING = "ENABLED";
  public static final String STS_JOB_NAME_PREFIX = "transferJobs/";
  private static final Logger logger = LoggerFactory.getLogger(StsJobHelper.class);
  private static final Storagetransfer client = createStsClient();

  /**
   * Create immediately run STS job
   *
   * @param jobName Job name for STS job
   * @param projectId project where STS job is configured and run
   * @param sourceBucket Source GCS bucket
   * @param destinationBucket Destination GCS bucket where objects are copied to
   * @param prefixes includePrex list
   * @param description
   * @param notificationTopic Pubsub topic where STS sends notificaiton when job is complete
   * @return
   * @throws IOException
   */
  public static TransferJob createStsJob(
      String jobName,
      String projectId,
      String sourceBucket,
      String destinationBucket,
      List<String> prefixes,
      String description,
      String notificationTopic)
      throws IOException {

    // create STS immediately run job.
    TransferJob transferJob =
        buildTransferJob(
            jobName, projectId, sourceBucket, destinationBucket, prefixes, description);

    if (notificationTopic != null) {
      NotificationConfig notificationConfig =
          new NotificationConfig().setPubsubTopic(notificationTopic).setPayloadFormat("JSON");
      transferJob.setNotificationConfig(notificationConfig);
    }

    logger.info(
        String.format("Creating one time transfer job in STS: %s", transferJob.toPrettyString()));

    return client.transferJobs().create(transferJob).execute();
  }

  private static TransferJob buildTransferJob(
      String jobName,
      String projectId,
      String sourceBucket,
      String destinationBucket,
      List<String> prefixes,
      String description) {
    return new TransferJob()
        .setName(STS_JOB_NAME_PREFIX + jobName)
        .setProjectId(projectId)
        .setDescription(description)
        .setTransferSpec(buildTransferSpec(sourceBucket, destinationBucket, prefixes))
        .setSchedule(buildSchedule())
        .setStatus(STS_ENABLED_STRING);
  }

  private static TransferSpec buildTransferSpec(
      String sourceBucket, String destinationBucket, List<String> prefixes) {
    return new TransferSpec()
        .setGcsDataSource(new GcsData().setBucketName(sourceBucket))
        .setGcsDataSink(new GcsData().setBucketName(destinationBucket))
        .setObjectConditions(buildObjectConditions(prefixes))
        .setTransferOptions(
            new TransferOptions()
                // flip the delete flag to false if you want to test without actual deleting  your
                // data
                .setDeleteObjectsFromSourceAfterTransfer(true)
                .setOverwriteObjectsAlreadyExistingInSink(true));
  }

  private static Schedule buildSchedule() {

    // Set startDate to 2 days ago to force STS to trigger the job immediately
    ZonedDateTime previousDateTime = ZonedDateTime.now(Clock.systemUTC()).minusDays(2);
    Date startDate = new Date();
    startDate.setYear(previousDateTime.getYear());
    startDate.setMonth(previousDateTime.getMonthValue());
    startDate.setDay(previousDateTime.getDayOfMonth());
    Schedule schedule = new Schedule().setScheduleStartDate(startDate);
    // set startDate and endDate same to force the job to run immediately
    schedule.setScheduleEndDate(startDate);

    return schedule;
  }

  private static ObjectConditions buildObjectConditions(List<String> prefixes) {
    ObjectConditions objectConditions = new ObjectConditions();
    objectConditions.setIncludePrefixes(prefixes);
    return objectConditions;
  }

  private static Storagetransfer createStsClient() {
    try {
      HttpTransport httpTransport = Utils.getDefaultTransport();
      JsonFactory jsonFactory = Utils.getDefaultJsonFactory();
      GoogleCredential credential =
          GoogleCredential.getApplicationDefault(httpTransport, jsonFactory);
      return createStorageTransferClient(httpTransport, jsonFactory, credential);
    } catch (IOException e) {
      logger.error("Failed to create STS client.", e);
    }
    return null;
  }

  private static Storagetransfer createStorageTransferClient(
      HttpTransport httpTransport, JsonFactory jsonFactory, GoogleCredential credential) {

    Preconditions.checkNotNull(httpTransport);
    Preconditions.checkNotNull(jsonFactory);
    Preconditions.checkNotNull(credential);

    // In some cases, you need to add the scope explicitly.
    if (credential.createScopedRequired()) {
      Set<String> scopes = new HashSet<>();
      scopes.addAll(StorageScopes.all());
      scopes.addAll(StoragetransferScopes.all());
      credential = credential.createScoped(scopes);
    }

    HttpRequestInitializer initializer = new RetryHttpInitializerWrapper(credential, true);
    return new Storagetransfer.Builder(httpTransport, jsonFactory, initializer)
        .setApplicationName("sts-metrics")
        .build();
  }
}
