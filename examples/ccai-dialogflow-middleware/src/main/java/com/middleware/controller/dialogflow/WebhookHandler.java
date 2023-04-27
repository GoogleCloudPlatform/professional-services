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

package com.middleware.controller.dialogflow;

import com.google.common.base.Strings;
import com.middleware.controller.wehbook.NewMessage;
import com.middleware.controller.wehbook.NewParticipant;
import java.util.Map;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;

/** Handles the incoming webhook requests from Dialogflow and calls the appropriate callback. */
@Service
public class WebhookHandler {
  private Consumer<NewParticipant> onNewParticipantCallback;
  private Consumer<NewMessage> onNewMessageCallback;

  /**
   * Handles the incoming webhook request from Dialogflow.
   *
   * @param requestBody The request body from incoming Twilio Conversation webhook.
   */
  public void handleIncomingRequest(Map<String, String> requestBody) {
    String eventType = Strings.nullToEmpty(requestBody.get("EventType"));

    if ("onParticipantAdded".equals(eventType)) {
      this.handleNewParticipant(new NewParticipant(requestBody));
    } else if ("onMessageAdded".equals(eventType)) {
      this.handleNewMessage(new NewMessage(requestBody));
    } else {
      throw new IllegalArgumentException("Invalid event type");
    }
  }

  /**
   * Registers a callback when a new participant joins the conversation.
   *
   * @param callback Callback to be called when a new participant joins the conversation.
   */
  public WebhookHandler onNewParticipant(Consumer<NewParticipant> callback) {
    this.onNewParticipantCallback = callback;
    return this;
  }

  /**
   * Registers a callback when a new message is added to the conversation.
   *
   * @param callback Callback to be called when a new message is added to the conversation.
   */
  public WebhookHandler onNewMessage(Consumer<NewMessage> callback) {
    this.onNewMessageCallback = callback;
    return this;
  }

  /**
   * Adds new participant to the conversation.
   *
   * @param participant The participant that joined the conversation.
   */
  public void handleNewParticipant(NewParticipant participant) {
    if (onNewParticipantCallback != null) {
      onNewParticipantCallback.accept(participant);
    }
  }

  /**
   * Adds new message to the conversation.
   *
   * @param message Message that was added to the conversation.
   */
  public void handleNewMessage(NewMessage message) {
    if (onNewMessageCallback != null) {
      onNewMessageCallback.accept(message);
    }
  }
}
