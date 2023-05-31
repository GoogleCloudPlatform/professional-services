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

package com.middleware.controller.cache;

import static com.middleware.controller.cache.RedisUtil.JEDIS_POOL;

import com.google.protobuf.InvalidProtocolBufferException;
import com.middleware.controller.dialogflow.DialogflowDetailsProto.DialogflowDetails;
import org.apache.commons.codec.binary.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.Jedis;

public class MapperCache {

  private static final Logger logger = LoggerFactory.getLogger(MapperCache.class);

  /**
   * Retrieves the Dialogflow details for a given Twilio conversation from the redis cache.
   *
   * @param twilioConversationSid Twilio conversation sid.
   * @return DialogflowDetails Dialogflow details for the given Twilio conversation.
   */
  public static DialogflowDetails getDialogflowDetails(String twilioConversationSid)
      throws InvalidProtocolBufferException {

    DialogflowDetails dialogflowDetails = null;
    logger.info("Getting Dialogflow details for: " + twilioConversationSid);

    try (Jedis resource = JEDIS_POOL.getResource()) {
      if (resource.exists(twilioConversationSid)) {
        byte[] dataAsBytes = Base64.decodeBase64(resource.get(twilioConversationSid));
        dialogflowDetails = DialogflowDetails.parseFrom(dataAsBytes);
      }
    }

    // Check if the Dialogflow conversation expired by comparing conversation start time.
    // Dialogflow conversation gets into readonly mode after 24 hours(8,64,00,000 milliseconds).
    // If so, delete them from the cache and return null.
    if (dialogflowDetails != null
        && dialogflowDetails.getConversationStartTime() + 8_64_00_000
            < System.currentTimeMillis()) {
      logger.info("Dialogflow conversation expired for: " + twilioConversationSid);
      deleteDialogflowDetails(twilioConversationSid);
      dialogflowDetails = null;
    }

    return dialogflowDetails;
  }

  /**
   * Puts the Dialogflow details for a given Twilio conversation in the redis cache.
   *
   * @param twilioConversationSid The Twilio conversation sid.
   * @param dialogflowDetails The Dialogflow details for the given Twilio conversation.
   */
  public static void putDialogflowDetails(
      String twilioConversationSid, DialogflowDetails dialogflowDetails) {
    logger.info("Putting Dialogflow details for: " + twilioConversationSid);
    try (Jedis resource = JEDIS_POOL.getResource()) {
      resource.set(
          twilioConversationSid, Base64.encodeBase64String(dialogflowDetails.toByteArray()));
    }
  }

  /**
   * Deletes the Dialogflow details for a given Twilio conversation from the redis cache.
   *
   * @param twilioConversationSid The Twilio conversation sid.
   */
  public static void deleteDialogflowDetails(String twilioConversationSid) {
    logger.info("Deleting Dialogflow details for: " + twilioConversationSid);
    try (Jedis resource = JEDIS_POOL.getResource()) {
      resource.del(twilioConversationSid);
    }
  }
}
