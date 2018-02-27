/*
 * Copyright 2017 Google Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package msg.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.gax.rpc.NotFoundException;
import com.google.cloud.ServiceOptions;
import com.google.cloud.pubsub.v1.*;
import com.google.cloud.pubsub.v1.stub.GrpcSubscriberStub;
import com.google.cloud.pubsub.v1.stub.SubscriberStub;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import msg.domain.Message;
import org.springframework.stereotype.Service;

@Service
public class PubSubService {

  private static String PROJECT_ID = ServiceOptions.getDefaultProjectId();

  public static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  public void createTopic(String topicId) throws Exception {

    TopicName topicName = TopicName.create(PROJECT_ID, topicId);
    try (TopicAdminClient topicAdminClient = TopicAdminClient.create()) {
      try {
        topicAdminClient.getTopic(topicName);
      } catch (NotFoundException e) {
        topicAdminClient.createTopic(topicName);
      }
    }
  }

  public void createSubscription(String topicId, String subscriptionId) throws Exception {

    try (SubscriptionAdminClient subscriptionAdminClient = SubscriptionAdminClient.create()) {

      TopicName topicName = TopicName.create(PROJECT_ID, topicId);

      SubscriptionName subscriptionName = SubscriptionName.create(PROJECT_ID, subscriptionId);
      // create a pull subscription with default acknowledgement deadline
      try {
        subscriptionAdminClient.getSubscription(subscriptionName);
      } catch (NotFoundException e) {

        subscriptionAdminClient.createSubscription(
            subscriptionName, topicName, PushConfig.getDefaultInstance(), 0);
      }
    }
  }

  public void publishMessage(String message, String topicId) throws IOException {
    TopicName topicName = TopicName.create(PROJECT_ID, topicId);
    Publisher publisher = Publisher.defaultBuilder(topicName).build();

    ByteString data = ByteString.copyFromUtf8(message);
    PubsubMessage pubsubMessage = PubsubMessage.newBuilder().setData(data).build();

    publisher.publish(pubsubMessage);
  }

  public Subscriber getMessages(String subscriptionId, MessageReceiver messageReceiver)
      throws Exception {
    SubscriptionName subscriptionName = SubscriptionName.create(PROJECT_ID, subscriptionId);
    Subscriber subscriber = null;

    // create a subscriber bound to the asynchronous message receiver
    subscriber = Subscriber.defaultBuilder(subscriptionName, messageReceiver).build();
    subscriber.startAsync().awaitRunning();

    return subscriber;
  }

  public List<Message> getMessagesSync(String subscriptionId, int maxNumOfMessages)
      throws Exception {
    List<Message> ret = new ArrayList<>();
    SubscriptionName subscriptionName = SubscriptionName.create(PROJECT_ID, subscriptionId);

    SubscriptionAdminSettings subscriptionAdminSettings =
        SubscriptionAdminSettings.newBuilder().build();
    try (SubscriberStub subscriber = GrpcSubscriberStub.create(subscriptionAdminSettings)) {

      PullRequest pullRequest =
          PullRequest.newBuilder()
              .setMaxMessages(maxNumOfMessages)
              .setReturnImmediately(true)
              .setSubscription(subscriptionName.toString())
              .build();

      PullResponse pullResponse = subscriber.pullCallable().call(pullRequest);
      List<String> ackIds = new ArrayList<>();
      pullResponse
          .getReceivedMessagesList()
          .stream()
          .forEach(
              m -> {
                ackIds.add(m.getAckId());

                String text = m.getMessage().getData().toStringUtf8();
                try {
                  ret.add(OBJECT_MAPPER.readValue(text, Message.class));
                } catch (IOException e) {
                  e.printStackTrace();
                }
              });

      if (!ackIds.isEmpty()) {

        // acknowledge received messages
        AcknowledgeRequest acknowledgeRequest =
            AcknowledgeRequest.newBuilder()
                .setSubscription(subscriptionName.toString())
                .addAllAckIds(ackIds)
                .build();
        // use acknowledgeCallable().futureCall to asynchronously perform this operation
        subscriber.acknowledgeCallable().call(acknowledgeRequest);
      }
    }
    return ret;
  }
}
