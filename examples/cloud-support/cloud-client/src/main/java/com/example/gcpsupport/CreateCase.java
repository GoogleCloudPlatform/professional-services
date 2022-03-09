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

// [START gcpsupport_create_case]

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.JsonObjectParser;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.cloudsupport.v2beta.CloudSupport;
import com.google.api.services.cloudsupport.v2beta.model.CloudSupportCase;
import com.google.api.services.cloudsupport.v2beta.model.SearchCaseClassificationsResponse;
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
import java.util.Map;

// sample code to create a support case using support API
public class CreateCase {

  // Shared constants
  static final String CLOUD_SUPPORT_SCOPE = "https://www.googleapis.com/auth/cloudsupport";

  public static void main(String[] args) {

    // Before creating a new case, list all valid classifications of a case with
    // listValidClassifications() first to get a valid classification.
    // A valid classification is required for creating a new case.
    listValidClassifcations();

    // TODO(developer): Create a json object with your new case and put path here
    // see an example under support/cloud-client/data/case.json
    String createCasePath = "/<---path--->/*.json";

    // TODO(developer): Replace this variable with your project id
    String projectId = "00000";

    String PARENT_RESOURCE = String.format("projects/%s", projectId);

    try {
      CloudSupportCase csc = createCase(PARENT_RESOURCE, createCasePath);
      System.out.println("Name of new case is: " + csc.getName());
    } catch (IOException e) {
      System.out.println("IOException caught! \n" + e);
    }
  }

  // helper method will return a CloudSupport object which is required for the
  // main API service to be used.
  private static CloudSupport getCloudSupportService() throws IOException {

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

    } catch (GeneralSecurityException e) {
      throw new IOException(
          "HttpTransport object threw a GeneralSecurityException with message:" + e.getMessage());
    }
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

  // this helper method is used for createCase()
  private static void listValidClassifcations() {

    try {
      CloudSupport supportService = getCloudSupportService();

      SearchCaseClassificationsResponse request =
          supportService.caseClassifications().search().execute();

      for (Map.Entry<String, Object> entry : request.entrySet()) {
        System.out.println("Key = " + entry.getKey() + ", Value = " + entry.getValue());
      }

    } catch (IOException e) {
      System.out.println("IOException caught in listValidClassifications()! \n" + e);
    }
  }

  // create a new case
  public static CloudSupportCase createCase(String parentResource, String newCasePath)
      throws IOException {

    CloudSupport supportService = getCloudSupportService();
    CloudSupportCase newContent = getCloudSupportCaseJsonObject(newCasePath);
    CloudSupportCase newCaseResponse =
        supportService.cases().create(parentResource, newContent).execute();

    return newCaseResponse;
  }
}

// [END gcpsupport_create_case]
