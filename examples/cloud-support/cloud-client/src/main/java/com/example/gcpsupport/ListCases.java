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

// [START gcpsupport_list_cases]

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.cloudsupport.v2beta.CloudSupport;
import com.google.api.services.cloudsupport.v2beta.model.CloudSupportCase;
import com.google.api.services.cloudsupport.v2beta.model.ListCasesResponse;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

// sample code to list support cases using support API
public class ListCases {

  // Shared constants
  static final String CLOUD_SUPPORT_SCOPE = "https://www.googleapis.com/auth/cloudsupport";

  public static void main(String[] args) {

    try {
      // TODO(developer): Replace this variable with your project id
      // PARENT_RESOURCE can also be other parent resource like
      // organizations/<---organization id--->
      String projectId = "00000";
      String PARENT_RESOURCE = String.format("projects/%s", projectId);

      List<CloudSupportCase> allCases = listAllCases(PARENT_RESOURCE);

      System.out.println(
          "Printing all " + allCases.size() + " cases of parent resource: " + PARENT_RESOURCE);

      for (CloudSupportCase csc : allCases) {
        System.out.println(csc + "\n\n");
      }
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

  // list all cases
  public static List<CloudSupportCase> listAllCases(String parentResource) throws IOException {

    CloudSupport supportService = getCloudSupportService();
    ListCasesResponse listCasesResponse = supportService.cases().list(parentResource).execute();
    List<CloudSupportCase> listCases = listCasesResponse.getCases();

    return listCases;
  }
}

// [END gcpsupport_list_cases]
