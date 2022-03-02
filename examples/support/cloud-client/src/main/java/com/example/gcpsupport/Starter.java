/**
 * Copyright (C) 2022 Google Inc.
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example.gcpsupport;

// [START gcpsupport_starter]

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.cloudsupport.v2beta.CloudSupport;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

// starter code for cloud support API to initialize it
public class Starter {

  // Shared constants
  static final String CLOUD_SUPPORT_SCOPE = "https://www.googleapis.com/auth/cloudsupport";

  public static void main(String[] args) {

    try {
      CloudSupport cloudSupport = getCloudSupportService();
      // with the CloudSupport object, you may call other methods of the Support API
      // for example, cloudSupport.cases().get("name of case").execute();

      System.out.println("CloudSupport API is ready to use: " + cloudSupport);
      
    } catch (IOException e) {
      System.out.println("IOException caught! \n" + e);

    } catch (GeneralSecurityException e) {
      System.out.println("GeneralSecurityException caught! \n" + e);
    }
  }

  // helper method will return a CloudSupport object which is required for the
  // main API service to be used.
  public static CloudSupport getCloudSupportService() throws IOException, GeneralSecurityException {

    JsonFactory jsonFactory = GsonFactory.getDefaultInstance();
    HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

    // this will only work if you have already set the environment variable
    // GOOGLE_APPLICATION_CREDENTIALS to point to the path with your service account
    // key
    GoogleCredentials credentials =
        GoogleCredentials.getApplicationDefault()
            .createScoped(Collections.singletonList(CLOUD_SUPPORT_SCOPE));
    HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(credentials);

    return new CloudSupport.Builder(httpTransport, jsonFactory, requestInitializer).build();
  }
}

// [END gcpsupport_starter]
