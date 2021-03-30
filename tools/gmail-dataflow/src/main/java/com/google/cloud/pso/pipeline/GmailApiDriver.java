/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.pipeline;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.GmailScopes;
import com.google.api.services.gmail.model.History;
import com.google.api.services.gmail.model.ListHistoryResponse;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.MessagePart;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.gson.Gson;
import java.io.IOException;
import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Gmail API driver class.
 */
public class GmailApiDriver {

  private static final String APPLICATION_NAME = "Gmail testing";
  private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
  private static final List<String> SCOPES = Collections.singletonList(GmailScopes.GMAIL_READONLY);
  private static final String SERVICE_ACCOUNT_JSON_FILE_PATH = "/anand-1-sa.json";
  private static final Logger LOG = LoggerFactory.getLogger(GmailApiDriver.class);
  private int truncateSize;

  public GmailApiDriver(int truncateSize) {
    this.truncateSize = truncateSize;
  }

  private static HttpRequestInitializer getCredentialsSA(String user) throws IOException, GeneralSecurityException {
    GoogleCredentials credentials = GoogleCredentials
        .fromStream(GmailApiDriver.class.getResourceAsStream(SERVICE_ACCOUNT_JSON_FILE_PATH)).createScoped(SCOPES)
        .createDelegated(user);
    HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(credentials);
    return requestInitializer;
  }

  public Map<String, String> printMessage(String user, String historyId) {
    HashMap<String, String> dedupedMessages = new HashMap<String, String>();
    try {
      final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
      Gmail service = new Gmail.Builder(httpTransport, JSON_FACTORY, getCredentialsSA(user))
          .setApplicationName(APPLICATION_NAME).build();
      BigInteger startHistoryId = new BigInteger(historyId);
      LOG.debug("Started processing {history_id: " + startHistoryId + "}");
      int retry = 0;
      List<History> hi = null;
      boolean found = false;
      while (retry < 3) {
        ListHistoryResponse response = service.users().history().list("me").setStartHistoryId(startHistoryId).execute();
        hi = response.getHistory();

        if (response.isEmpty()) {
          break;
        }
        if (hi == null || hi.isEmpty()) {
          retry++;
          try {
            int sleeptime = (2 ^ retry) * 500; // Exponential backoff
            java.lang.Thread.sleep(sleeptime);
          } catch (Exception e2) {
          }
        } else {
          found = true;
          break;
        }
      }

      if (found) {
        LOG.debug("Number of history_records: " + hi.size());

        for (com.google.api.services.gmail.model.History h : hi) {
          List<Message> messages = h.getMessages();
          LOG.debug("Number of threads in history: " + messages.size());
          for (Message m : messages) {
            String messageId = m.get("id").toString();
            if (dedupedMessages.containsKey(messageId)) {
              continue;
            }
            LOG.debug("Processing message {thread_id: " + messageId + "}");
            retry = 0;
            while (true) {
              try {
                if (retry >= 3) {
                  LOG.warn("Retry failed 3 times exiting. {thread_id : " + messageId + "}");
                  break;
                }
                // Get the message from Gmail mailbox
                Message messageFull = service.users().messages().get(user, messageId).execute();

                // Truncate the body to specified length and then encoding it
                // Back to base64 encoding for output to pubsub
                List<MessagePart> parts = messageFull.getPayload().getParts();
                for (MessagePart part : parts) {
                  // Process main part
                  byte[] data = part.getBody().decodeData();

                  if (data != null && data.length > truncateSize) {
                    LOG.debug("Truncating main part with {from_length: " + data.length + ", to_length : " + truncateSize
                        + ", mimeType: " + part.getMimeType() + "}");
                    data = Arrays.copyOf(data, truncateSize);
                    part.setBody(part.getBody().encodeData(data));
                  }
                  // Process multi-part message parts
                  List<MessagePart> innerParts = part.getParts();
                  if (innerParts != null && innerParts.size() > 0) {
                    LOG.debug("Truncating inner parts of {size: " + innerParts.size() + "}");
                    for (MessagePart innerPart : innerParts) {
                      data = innerPart.getBody().decodeData();
                      if (data != null && data.length > truncateSize) {
                        LOG.debug("Truncating inner part {from_length : " + data.length + ", to_size : " + truncateSize
                            + ", mimeType: " + innerPart.getMimeType() + "}");
                        data = Arrays.copyOf(data, truncateSize);
                        innerPart.setBody(innerPart.getBody().encodeData(data));
                      }
                    }
                  }
                }

                String jsonMessage = new Gson().toJson(messageFull);
                dedupedMessages.put(messageId, jsonMessage);
                break;
              } catch (GoogleJsonResponseException e) {
                break;
              } catch (Exception e1) {
                e1.printStackTrace();
                retry++;
                try {
                  int sleeptime = (2 ^ retry) * 500;
                  java.lang.Thread.sleep(sleeptime);
                } catch (Exception e2) {
                }
              }
            }
          }
        }
      } else {
        LOG.warn("Error in retrieving History id : " + startHistoryId);
      }
    } catch (IOException | GeneralSecurityException e) {
      e.printStackTrace();
    }
    return dedupedMessages;
  }
}
