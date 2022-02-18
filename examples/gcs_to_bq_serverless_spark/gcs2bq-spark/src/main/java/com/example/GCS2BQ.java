/*
 * Copyright (C) 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.example;

import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutureCallback;
import com.google.api.core.ApiFutures;
import com.google.api.gax.rpc.ApiException;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.cloud.spark.bigquery.repackaged.org.json.JSONObject;
import com.google.common.util.concurrent.MoreExecutors;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.TopicName;
import java.io.IOException;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SaveMode;
import org.apache.spark.sql.SparkSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Spec;

@Command(name = "defaults", mixinStandardHelpOptions = true, version = "defaults 0.1")
public class GCS2BQ implements Runnable {

  public static final Logger LOGGER = LoggerFactory.getLogger(GCS2BQ.class);

  @Option(
      names = {"--projectId"},
      required = true,
      description = "Project Id to run serverless spark")
  String projectId;

  @Option(
      names = {"--inputFileLocation"},
      required = true,
      description = "GCS location of the file")
  String inputFileLocation;

  @Option(
      names = {"--bqDataset"},
      required = true,
      description = "BigQuery Dataset")
  String bqDataset;

  @Option(
      names = {"--bqTable"},
      required = true,
      description = "BigQuery Table")
  String bqTable;

  @Option(
      names = {"--bqTempBucket"},
      required = true,
      description = "BigQuery Temp Bucket")
  String bqTempBucket;

  @Option(
      names = {"--deadLetterQueue"},
      required = true,
      description = "Dead letter Topic")
  String dlq;

  @Spec CommandLine.Model.CommandSpec spec;

  @Override
  public void run() {
    SparkSession spark = null;
    final String inputFileFormat = "CSV";
    try {
      spark = SparkSession.builder().appName("GCS to Bigquery load").getOrCreate();
      Dataset<Row> inputData =
          spark
              .read()
              .format(inputFileFormat)
              .option("header", true)
              .option("inferSchema", true)
              .load(inputFileLocation);
      inputData
          .write()
          .format("com.google.cloud.spark.bigquery")
          .option("table", bqDataset + "." + bqTable)
          .option("temporaryGcsBucket", bqTempBucket)
          .mode(SaveMode.Append)
          .save();
    } catch (Exception th) {
      LOGGER.error("Exception in GCStoBigquery", th);
      JSONObject obj = new JSONObject();
      obj.put("projectId", projectId);
      obj.put("inputFileLocation", inputFileLocation);
      obj.put("bqDataset", bqDataset);
      obj.put("bqTable", bqTable);
      obj.put("deadLetterQueue", dlq);
      publishMessage(obj.toString());
      if (Objects.nonNull(spark)) {
        spark.stop();
      }
    }
  }

  public void publishMessage(String jsonString) {
    String[] dlqElements = dlq.split("/");
    TopicName topicName = TopicName.of(dlqElements[1], dlqElements[3]);
    Publisher publisher = null;

    try {
      publisher = Publisher.newBuilder(topicName).build();
      ByteString data = ByteString.copyFromUtf8(jsonString);
      PubsubMessage pubsubMessage = PubsubMessage.newBuilder().setData(data).build();
      ApiFuture<String> future = publisher.publish(pubsubMessage);
      ApiFutures.addCallback(
          future,
          new ApiFutureCallback<String>() {
            @Override
            public void onFailure(Throwable throwable) {
              if (throwable instanceof ApiException) {
                ApiException apiException = ((ApiException) throwable);
                LOGGER.error(apiException.getMessage());
              }
              LOGGER.error("Error publishing message : {}", jsonString);
            }

            @Override
            public void onSuccess(String messageId) {
              // Once published, returns server-assigned message ids (unique within the topic)
              LOGGER.info("Published message ID: {}", messageId);
            }
          },
          MoreExecutors.directExecutor());
    } catch (IOException e) {

    } finally {
      if (publisher != null) {
        // When finished with the publisher, shutdown to free up resources.
        publisher.shutdown();
        try {
          publisher.awaitTermination(1, TimeUnit.MINUTES);
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
      }
    }
  }

  public static void main(String[] args) {
    new CommandLine(new GCS2BQ()).execute(args);
  }
}
