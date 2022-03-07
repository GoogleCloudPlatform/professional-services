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

// [START gcpsupport_update_cases]

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.JsonObjectParser;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.cloudsupport.v2beta.CloudSupport;
import com.google.api.services.cloudsupport.v2beta.model.CloudSupportCase;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.security.GeneralSecurityException;
import java.util.Collections;

// sample code to update a support case using support API
public class UpdateCase {

  // Shared constants
  static final String CLOUD_SUPPORT_SCOPE = "https://www.googleapis.com/auth/cloudsupport";

  public static void main(String[] args) {

    try {
      // TODO(developer): Create a json object with your new case and put path here
      // see an example under support/cloud-client/data/updateCase.json
      String updatedCasePath = "/<---path--->/*.json";

      // TODO(developer): Replace this variable with your project id
      String projectId = "00000";
      String PARENT_RESOURCE = String.format("projects/%s", projectId);

      // TODO(developer): Replace this variable with your case id
      String caseId = "00000";
      String CASE = String.format("/cases/%s", caseId);

      CloudSupportCase updatedCase = updateCase(PARENT_RESOURCE + CASE, updatedCasePath);

      System.out.println("Updated case object is: " + updatedCase + "\n\n\n");
    } catch (IOException e) {
      System.out.println("IOException caught! \n" + e);
    }
  }

  // helper method will return a CloudSupport object which is required for the
  // main API service to be used.
  private static CloudSupport getCloudSupportService() {

    try {

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

    } catch (IOException e) {
      System.out.println("IOException caught in getCloudSupportService()! \n" + e);

    } catch (GeneralSecurityException e) {
      System.out.println("GeneralSecurityException caught in getCloudSupportService! \n" + e);
    }

    return null;
  }

  // helper method to get a CloudSupportCase object
  private static CloudSupportCase getCloudSupportCaseJsonObject(String jsonPathName)
      throws IOException {

    JsonFactory jsonFactory = GsonFactory.getDefaultInstance();
    JsonObjectParser parser = new JsonObjectParser(jsonFactory);
    InputStream stream = new FileInputStream(new File(jsonPathName));
    Reader reader = new InputStreamReader(stream, "UTF-8");

    return parser.parseAndClose(reader, CloudSupportCase.class);
  }

  // update one case
  public static CloudSupportCase updateCase(String nameOfCase, String updatedCasePath)
      throws IOException {

    CloudSupport supportService = getCloudSupportService();
    CloudSupportCase updateCase = getCloudSupportCaseJsonObject(updatedCasePath);
    CloudSupportCase updateCaseResponse =
        supportService.cases().patch(nameOfCase, updateCase).execute();

    return updateCaseResponse;
  }
}

// [END gcpsupport_update_cases]
