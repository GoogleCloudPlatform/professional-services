/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.tools.sce.aurinko.server.broker;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.ServiceOptions;
import com.google.cloud.bigquery.BigQueryError;
import com.google.cloud.bigquery.InsertAllRequest;
import com.google.cloud.bigquery.InsertAllResponse;
import com.google.cloud.bigquery.TableId;
import com.google.cloud.pubsub.v1.AckReplyConsumer;
import com.google.cloud.pubsub.v1.MessageReceiver;
import com.google.cloud.pubsub.v1.Subscriber;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import com.google.pubsub.v1.ProjectSubscriptionName;
import com.google.pubsub.v1.PubsubMessage;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingDeque;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.Job;
import com.google.cloud.bigquery.JobId;
import com.google.cloud.bigquery.JobInfo;
import com.google.cloud.bigquery.QueryJobConfiguration;
import com.google.cloud.bigquery.QueryResponse;
import com.google.cloud.bigquery.TableResult;
import java.util.UUID;

public class DataBrokerServer {

  private static final String PROJECT_ID = ServiceOptions.getDefaultProjectId();

  private String datasetName = "aurinko";

  private String tableName = "aurinko";

  private static String subscriptionId = "default-topic-subscription";

  private static final BlockingQueue<PubsubMessage> messages = new LinkedBlockingDeque<>();


  static class BrokerMessageReceiver implements MessageReceiver {

    @Override
    public void receiveMessage(PubsubMessage message, AckReplyConsumer consumer) {
      messages.offer(message);
      consumer.ack();
    }

  }

  public void processMessage(String msg)
  {
    BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
    TableId tableId = TableId.of(datasetName,tableName);
    try {
      //BQ Insert
      ObjectMapper mapper = new ObjectMapper();
      HashMap<String,Object> mappedData = mapper.readValue(msg, new TypeReference<Map<String, Object>>() {
      });
      InsertAllResponse response = bigquery.insertAll(InsertAllRequest.newBuilder(tableId)
          .addRow(UUID.randomUUID().toString(), mappedData)
          .build());
      if (response.hasErrors()) {
        // If any of the insertions failed, this lets you inspect the errors
        for (Entry<Long, List<BigQueryError>> entry : response.getInsertErrors().entrySet()) {
          System.out.println(entry);
        }
      }
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  /** Receive messages over a subscription. */
  public static void main(String... args) throws Exception {

    DataBrokerServer server = new DataBrokerServer();

    ProjectSubscriptionName subscriptionName = ProjectSubscriptionName.of(
        PROJECT_ID, subscriptionId);
    Subscriber subscriber = null;
    try {
      // create a subscriber bound to the asynchronous message receiver

      subscriber =
          Subscriber.newBuilder(subscriptionName, new BrokerMessageReceiver()).build();
      subscriber.startAsync().awaitRunning();
      // Continue to listen to messages
      while (true) {
        PubsubMessage message = messages.take();
        //System.out.println("Message Id: " + message.getMessageId());
        //System.out.println("Data: " + message.getData().toStringUtf8());
        server.processMessage(message.getData().toStringUtf8());
      }
    }
    catch (Exception e)
    {
      System.out.println(e.getMessage());
    }
      finally
    {
      if (subscriber != null) {
        subscriber.stopAsync();
      }
    }
  }
}
