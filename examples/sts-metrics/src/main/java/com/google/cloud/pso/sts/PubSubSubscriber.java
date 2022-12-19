package com.google.cloud.pso.sts;

import com.google.api.gax.rpc.NotFoundException;
import com.google.cloud.pubsub.v1.MessageReceiver;
import com.google.cloud.pubsub.v1.Subscriber;
import com.google.cloud.pubsub.v1.SubscriptionAdminClient;
import com.google.pubsub.v1.ProjectSubscriptionName;
import com.google.pubsub.v1.ProjectTopicName;
import com.google.pubsub.v1.PushConfig;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * PubSub subscriber class that encapsulates subscriber functionality
 */
public class PubSubSubscriber {

  private String projectId;
  private String subscriptionId;
  private String topicId;
  private Subscriber subscriber;
  private EventHandler eventHandler;
  private static final Logger logger = LoggerFactory.getLogger(PubSubSubscriber.class);

  public PubSubSubscriber(
      String projectId, String topicId, String subscriptionId, EventHandler eventHandler) {
    this.projectId = projectId;
    this.topicId = topicId;
    this.subscriptionId = subscriptionId;
    this.eventHandler = eventHandler;
  }

  /**
   * Run the subscriber
   */
  public void run() throws IOException {
    ProjectTopicName topicName = ProjectTopicName.of(projectId, topicId);
    ProjectSubscriptionName subscriptionName =
        ProjectSubscriptionName.of(projectId, subscriptionId);

    SubscriptionAdminClient subscriptionAdminClient = SubscriptionAdminClient.create();

    try {
      if (subscriptionAdminClient != null) {
        subscriptionAdminClient.getSubscription(subscriptionName);
        logger.info(String.format("subscriptionId %s already exists", subscriptionName));
      }
    } catch (NotFoundException e) {
      subscriptionAdminClient.createSubscription(
          subscriptionName, topicName, PushConfig.getDefaultInstance(), 0);
      logger.info(String.format("Created the subscription %s", subscriptionName));
    }

    MessageReceiver receiver =
        (message, consumer) -> {
          // handle incoming message, then ack/nack the received message
          eventHandler.handleEvent(message);
          consumer.ack();
        };
    subscriber = Subscriber.newBuilder(subscriptionName, receiver).build();

    subscriber.startAsync();
  }

  /**
   * Stop the subscriber
   */
  public void stop() {
    if (subscriber != null) {
      subscriber.stopAsync();
      logger.info(String.format("Subscriber %s shutdown complete.", this.subscriptionId));
    }
  }
}

