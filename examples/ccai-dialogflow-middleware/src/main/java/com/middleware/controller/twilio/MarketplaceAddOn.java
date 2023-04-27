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

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;
import java.util.Properties;

/**
 * Dummy class to provide twilio marketplace add-on details.
 *
 * <ul>
 *   <li>project id
 *   <li>conversation profile id
 *   <li>language code
 * </ul>
 */
// TODO: This dummy class need to be replace with actual twilio marketplace calls
public class MarketplaceAddOn {

  private static final String DEFAULT_LANGUAGE_CODE = "en-US";
  private final String languageCode;

  public MarketplaceAddOn() {

    Properties properties = new Properties();
    // Read application.properties file and set the language code
    try (InputStream inputStream =
        getClass().getClassLoader().getResourceAsStream("application.properties")) {
      properties.load(inputStream);
    } catch (IOException e) {
      e.printStackTrace();
    }

    this.languageCode =
        properties.getProperty("twilio.marketplace.addon.language", DEFAULT_LANGUAGE_CODE);
  }

  /** Returns the GCP project id of dialogflow */
  public String getProjectId() {
    return Optional.ofNullable(System.getenv("TWILIO_ADD_ON_PROJECT_ID"))
        .orElse(System.getProperty("TWILIO_ADD_ON_PROJECT_ID"));
  }

  /** Returns dialogflow conversation profile id. */
  public String getConversationProfileId() {
    return Optional.ofNullable(System.getenv("TWILIO_ADD_ON_CONVERSATION_PROFILE_ID"))
        .orElse(System.getProperty("TWILIO_ADD_ON_CONVERSATION_PROFILE_ID"));
  }

  /**
   * Returns the language code of the conversation from the application.properties. If language code
   * is not available via application.properties, this will return "en-US" as the default value
   */
  public String getLanguageCode() {
    return languageCode;
  }
}
