/*
 * Copyright 2023 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 *  except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.middleware.controller.twilio;

import com.twilio.Twilio;
import com.twilio.base.ResourceSet;
import com.twilio.rest.conversations.v1.Conversation;
import com.twilio.rest.conversations.v1.conversation.Message;
import com.twilio.rest.conversations.v1.conversation.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Conversation details and post messages back to the twilio conversation */
public class TwilioConversation {

  private static final Logger logger = LoggerFactory.getLogger(TwilioConversation.class);

  private final String twilioConversationSid;

  public TwilioConversation(String twilioConversationSid) {
    this.twilioConversationSid = twilioConversationSid;
    String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");
    Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
  }

  /** Returns the twilio conversation sid */
  public String getTwilioConversationSid() {
    return twilioConversationSid;
  }

  /**
   * Posts a message to the twilio conversation.
   *
   * @param message The message to be posted back to the conversation
   * @return Message reference that was posted back to the conversation
   */
  public Message replyToMessage(String message) {
    logger.info("Response: " + message);
    return Message.creator(twilioConversationSid).setAuthor("Dialogflow").setBody(message).create();
  }

  /**
   * Removes all the scoped webhooks associated with the conversation.
   *
   * <p>This is executed after the conversation being handed off to a live agent.
   *
   * <p>New messages will be handled by the Flex UI, and it should not trigger middleware for the
   * same conversation.
   */
  public void removeScopedWebhooks() {
    ResourceSet<Webhook> webhookResourceSet = Webhook.reader(getTwilioConversationSid()).read();
    webhookResourceSet
        .iterator()
        .forEachRemaining(
            (webhook) -> {
              Webhook.deleter(getTwilioConversationSid(), webhook.getSid()).delete();
            });
  }

  /** Closes the twilio conversation */
  public void closeTwilioConversation() {
    Conversation.updater(getTwilioConversationSid()).setState(Conversation.State.CLOSED).update();
  }
}
