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

package com.middleware.controller.rest;

import com.google.gson.Gson;
import com.middleware.controller.dialogflow.DialogflowConversationHandler;
import com.middleware.controller.dialogflow.DialogflowDetailsProto.DialogflowDetails;
import com.middleware.controller.dialogflow.WebhookHandler;
import com.twilio.exception.ApiException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@ComponentScan(basePackages = {"com.middleware.controller"})
public class Controller {

  // Create a logger
  private static final Logger logger = LoggerFactory.getLogger(Controller.class);

  @Autowired private WebhookHandler webhookHandler;

  /**
   * Handles the incoming request from Twilio Conversations
   *
   * @param requestBody The request body from Twilio Conversations.
   * @return The response to be sent back to Twilio Webhook.
   */
  @PostMapping("/handleConversations")
  public ResponseEntity<String> handleNewEndpoint(@RequestParam Map<String, String> requestBody) {

    AtomicReference<ResponseEntity<String>> response = new AtomicReference<>();

    webhookHandler
        .onNewMessage(
            newMessage -> {
              HashMap<String, String> responseMap = new HashMap<>();
              HttpStatus statusCode = HttpStatus.BAD_REQUEST;

              try {
                DialogflowDetails dialogflowDetails =
                    DialogflowConversationHandler.getDialogflowDetails(newMessage);

                String replyText =
                    DialogflowConversationHandler.analyzeMessage(newMessage, dialogflowDetails);

                responseMap.put("replyText", replyText);
                statusCode = HttpStatus.OK;

              } catch (IOException | ApiException e) {
                logger.error("Error handling new message", e);
              } finally {
                final MultiValueMap<String, String> headers = new HttpHeaders();
                headers.add("Content-Type", "application/json");
                String responseJson = new Gson().toJson(responseMap);
                response.set(new ResponseEntity<>(responseJson, headers, statusCode));
              }
            })
        .handleIncomingRequest(requestBody);

    return response.get();
  }
}
