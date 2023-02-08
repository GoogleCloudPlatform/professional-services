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

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.annotations.VisibleForTesting;
import com.google.pubsub.v1.PubsubMessage;
import io.opencensus.tags.TagKey;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Event handler that process the STS notifications */
public class StsJobNotificationHandler implements EventHandler {
  private static final Logger logger = LoggerFactory.getLogger(StsJobNotificationHandler.class);
  private static final double LATENCY_MIN = 1.0 * Metrics.MIN_IN_MS;
  private static final double LATENCY_MAX = 800 * Metrics.MIN_IN_MS;
  private static final long NUM_OBJ_COPIED_MIN = 10L;
  private static final long NUM_OBJ_COPIED_MAX = 1000L;
  private static final long NUM_BYTES_MIN = 1000 * 1000L;
  private static final long NUM_BYTES_MAX = 1000 * 1000 * 1000L;

  /**
   * Handle the STS notification message.
   *
   * @param message PubSub message. Sample payload below
   *     <p>{ "name": "transferOperations/transferJobs-aaa-eshen-job-1-1623886007265295",
   *     "projectId": "twttr-dp-org-ie-tst", "transferSpec": { "gcsDataSource": { "bucketName":
   *     "eshen-test-bucket-ie-tst-1" }, "gcsDataSink": { "bucketName": "scratch-eshen-stsjobpool-1"
   *     } }, "startTime": "2021-06-16T23:26:47.316989389Z", "endTime":
   *     "2021-06-16T23:27:07.936387030Z", "status": "SUCCESS", "counters": {
   *     "objectsFoundFromSource": "4", "bytesFoundFromSource": "487", "objectsCopiedToSink": "4",
   *     "bytesCopiedToSink": "487" }, "transferJobName": "transferJobs/aaa-eshen-job-1",
   *     "notificationConfig": { "pubsubTopic":
   *     "projects/twttr-dp-org-ie-tst/topics/eshen-test-sdrs-topic", "payloadFormat": "JSON" } }
   */
  @Override
  public void handleEvent(PubsubMessage message) {
    String messageId = message.getMessageId();
    logger.info(String.format("<MessageId=%s>: %s ", messageId, message.getData().toStringUtf8()));
    ObjectMapper mapper = new ObjectMapper();
    mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    String operationName = null;
    String jobName = null;
    try {
      JsonNode root = mapper.readTree(message.getData().toStringUtf8());
      String status = root.get("status").asText();
      String projectId = root.get("projectId").asText();
      jobName = root.get("transferJobName").asText();
      operationName = root.get("name").asText();
      String startTime = root.get("startTime").asText();
      String endTime = root.get("endTime").asText();
      double latency =
          Duration.between(Instant.parse(startTime), Instant.parse(endTime)).toMillis();

      JsonNode counters = root.get("counters");

      long objectsCopied = 0L;
      if (counters.has("objectsCopiedToSink")) {
        objectsCopied = counters.get("objectsCopiedToSink").asLong();
      }

      long bytesCopied = 0L;
      if (counters.has("bytesCopiedToSink")) {
        bytesCopied = counters.get("bytesCopiedToSink").asLong();
      }

      String sourceBucket =
          root.get("transferSpec").get("gcsDataSource").get("bucketName").asText();

      String destBucket = root.get("transferSpec").get("gcsDataSink").get("bucketName").asText();

      // overwriting with the random values for demo purpose
      latency = getRandomDouble(LATENCY_MIN, LATENCY_MAX);
      objectsCopied = getRandomLong(NUM_OBJ_COPIED_MIN, NUM_OBJ_COPIED_MAX);
      bytesCopied = getRandomLong(NUM_BYTES_MIN, NUM_BYTES_MAX);

      generateMetrics(
          sourceBucket, destBucket, projectId, status, latency, objectsCopied, bytesCopied);
      logger.info(
          String.format(
              "<MessageId=%s>: operation=%s sourceBucket=%s destBucket=%s, status=%s latency=%,.2f "
                  + "objectsCopied=%d bytesCopied=%d",
              messageId,
              operationName,
              sourceBucket,
              destBucket,
              status,
              latency,
              objectsCopied,
              bytesCopied));

    } catch (IOException e) {
      logger.error(
          String.format(
              "Failed to handle STS notification from job=%s operation=%s", jobName, operationName),
          e);
    }
  }

  @VisibleForTesting
  void generateMetrics(
      String sourceBucket,
      String destBucket,
      String projectId,
      String status,
      double latency,
      long objectsCopied,
      long bytesCopied) {
    Map<TagKey, String> tagMap = new HashMap<>();
    tagMap.put(Metrics.TAG_KEY_SRC_BUCKET_ID, sourceBucket);
    tagMap.put(Metrics.TAG_KEY_DEST_BUCKET_ID, destBucket);
    tagMap.put(Metrics.TAG_KEY_PROJECT_ID, projectId);
    tagMap.put(Metrics.TAG_KEY_STATUS, status);
    Metrics.recordTaggedStat(tagMap, Metrics.M_STS_OPERATION_NUM, 1L);
    Metrics.recordTaggedStat(tagMap, Metrics.M_STS_OPERATION_LATENCY_MS, latency);
    Metrics.recordTaggedStat(tagMap, Metrics.M_OBJECT_DELETED_NUM, objectsCopied);
    Metrics.recordTaggedStat(tagMap, Metrics.M_OBJECT_DELETED_BYTES, bytesCopied);
  }

  private long getRandomLong(long min, long max) {
    return ThreadLocalRandom.current().nextLong(min, max);
  }

  private double getRandomDouble(double min, double max) {
    return ThreadLocalRandom.current().nextDouble(min, max);
  }
}
