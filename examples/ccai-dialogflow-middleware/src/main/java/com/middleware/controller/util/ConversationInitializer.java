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

package com.middleware.controller.util;

import com.twilio.Twilio;
import com.twilio.rest.conversations.v1.Conversation;
import com.twilio.rest.conversations.v1.conversation.Participant;
import com.twilio.rest.conversations.v1.conversation.Webhook;
import java.util.Arrays;

/**
 * Initializes Twilio Conversations.
 *
 * <p> This initializer is a simple application, that create a conversation and add a
 * participant</p>
 */
public class ConversationInitializer {

  public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
  public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

  public static void main(String[] args) throws Exception {
    // Program args:
    // To delete a conversation: delete <conversation sid>
    // To add a conversation: add
    ConversationInitializer conversationInitializer = new ConversationInitializer();
    if (args.length > 0) {
      for (String arg : args) {
        if (arg.equalsIgnoreCase("delete")) {
          conversationInitializer.deleteConversation(args[1]);
        } else if (arg.equalsIgnoreCase("add")) {
          conversationInitializer.run();
        }
        break;
      }
    }
  }
  public void run() throws Exception {
    Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
    Conversation conversation = createConversation();
    createParticipant(conversation);
  }
  private Conversation createConversation() {
    Conversation conversation = Conversation.creator()
        .setFriendlyName("lch Friendly Conversation")
        .create();
    System.out.println("Conversation SID: " + conversation.getSid());
    return conversation;
  }

  private Participant createParticipant(Conversation conversation) {
    Participant participant =
        Participant.creator(conversation.getSid())
            .setIdentity("MyChatUserIdentity")
            .create();
    System.out.println("Participant SID: " + participant.getSid());
    return participant;
  }

  private void deleteConversation(String conversationSid) {
    Conversation.deleter(conversationSid).delete();
    System.out.println("Conversation deleted: " + conversationSid );
  }

  private Webhook attachWebhook(Conversation conversation) {
    Webhook webhook = Webhook.creator(
            conversation.getSid(),
            Webhook.Target.WEBHOOK)
        .setConfigurationMethod(Webhook.Method.GET)
        .setConfigurationFilters(
            Arrays.asList("onMessageAdded",
                "onConversationRemoved"))
        .setConfigurationUrl("https://example.com")
        .create();
    System.out.println(webhook.getSid());
    return webhook;
  }
}
