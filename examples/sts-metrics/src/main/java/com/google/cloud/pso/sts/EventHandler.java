package com.google.cloud.pso.sts;

import com.google.pubsub.v1.PubsubMessage;
public interface EventHandler {
  /**
   * Handles a event
   * @param message PubSub message
   */
  void handleEvent(PubsubMessage message);
}
