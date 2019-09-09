/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.gceusage.services;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.cloudresourcemanager.CloudResourceManager;
import com.google.cloud.pso.gceusage.Main;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;

public class CloudResourceManagerService {

  static CloudResourceManager instance = null;

  /**
   * Singleton that returns an instace of CloudResourceManager.
   *
   * @see CloudResourceManager
   */
  public static CloudResourceManager getInstance() throws IOException, GeneralSecurityException {

    if (instance == null) {
      HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
      JsonFactory jsonFactory = JacksonFactory.getDefaultInstance();

      GoogleCredential credential = GoogleCredential.getApplicationDefault();
      if (credential.createScopedRequired()) {
        credential =
            credential.createScoped(
                Arrays.asList("https://www.googleapis.com/auth/cloud-platform"));
      }

      instance =
          new CloudResourceManager.Builder(httpTransport, jsonFactory, credential)
              .setApplicationName(Main.APPLICATION_NAME)
              .build();
    }

    return instance;
  }
}
