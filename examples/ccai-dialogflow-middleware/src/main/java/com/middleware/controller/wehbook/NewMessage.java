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

package com.middleware.controller.wehbook;

import com.middleware.controller.twilio.TwilioConversation;
import com.twilio.rest.flexapi.v1.Interaction;
import java.util.HashMap;
import java.util.Map;

/** Processes new messages sent to a Twilio conversation. */
public class NewMessage extends TwilioConversation {
  private final String message;
  private final String source;

  public NewMessage(Map<String, String> requestBody) {
    super(requestBody.get("ConversationSid"));
    this.message = requestBody.get("Body");
    this.source = requestBody.get("Source");
  }

  /**
   * Retrieves the message sent by the participant
   *
   * @return the message sent by the participant
   */
  public String getMessage() {
    return message;
  }

  /**
   * Retrieves the source of the message in which twilio received the message.
   *
   * <p>Eg: sms, whatsapp, etc
   *
   * @return the source of the message
   */
  public String getSource() {
    return source;
  }

  /** Creates an interaction in TaskRouter to hand over the conversation to a real agent */
  public void handOverToAgent() {
    HashMap<String, Object> channel = new HashMap<>();
    channel.put("type", getSource().toLowerCase());
    channel.put("initiated_by", "customer");
    HashMap<String, String> channelProperties = new HashMap<>();
    channelProperties.put("media_channel_sid", getTwilioConversationSid());
    channel.put("properties", channelProperties);

    HashMap<String, Object> routing = new HashMap<>();
    HashMap<String, String> routingProperties = new HashMap<>();

    String workspaceSid = System.getenv("TWILIO_WORKSPACE_SID");

    routingProperties.put("workspace_sid", workspaceSid);
    routing.put("properties", routingProperties);

    Interaction.creator(channel, routing).create();
  }
}
