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
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.compute.Compute;
import com.google.cloud.pso.gceusage.Main;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;

public class ComputeService {

  private static Compute instance;
  private static String[] SCOPES = {"https://www.googleapis.com/auth/compute"};
  private static int HTTP_CONNECTION_TIMEOUT_MS = 5 * 60000; // 5 minute wait
  private static int HTTP_READ_TIMEOUT_MS = 5 * 60000; // 5 minute wait

  /**
   * Singleton that returns an instace of Compute.
   *
   * @see Compute
   */
  public static Compute getInstance() throws GeneralSecurityException, IOException {
    if (instance == null) {

      HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
      JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
      GoogleCredential credential =
          GoogleCredential.getApplicationDefault().createScoped(Arrays.asList(SCOPES));

      instance =
          new Compute.Builder(httpTransport, JSON_FACTORY, setHttpTimeout(credential))
              .setApplicationName(Main.APPLICATION_NAME)
              .build();
    }
    return instance;
  }

  private static HttpRequestInitializer setHttpTimeout(
      final HttpRequestInitializer requestInitializer) {
    return new HttpRequestInitializer() {
      @Override
      public void initialize(HttpRequest httpRequest) throws IOException {
        requestInitializer.initialize(httpRequest);
        httpRequest.setConnectTimeout(HTTP_CONNECTION_TIMEOUT_MS);
        httpRequest.setReadTimeout(HTTP_READ_TIMEOUT_MS);
      }
    };
  }
}
