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
package com.mycompany.app;

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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// starter code for cloud support API to initialize it
public class App {

  // Shared constants
  static final String CLOUD_SUPPORT_SCOPE = "https://www.googleapis.com/auth/cloudsupport";

  // TODO: update PROJECT with your project number
  static final String PROJECT = "projects/123456789";

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

  public static void updateAllEmailsWith(String email)
      throws IOException, GeneralSecurityException {

    List<CloudSupportCase> listCases = listAllCases(PROJECT);

    for (CloudSupportCase csc : listCases) {
      System.out.println("I'm going to update email address for case: " + csc.getName() + "\n");

      updateCaseWithNewEmail(csc, email);
    }
  }

  // list all open cases
  public static List<CloudSupportCase> listAllCases(String parentResource)
      throws IOException, GeneralSecurityException {

    CloudSupport supportService = getCloudSupportService();

    ListCasesResponse listCasesResponse =
        supportService.cases().list(parentResource).setFilter("state=OPEN").execute();

    List<CloudSupportCase> listCases = listCasesResponse.getCases();

    System.out.println(
        "Printing all " + listCases.size() + " open cases of parent resource: " + parentResource);

    for (CloudSupportCase csc : listCases) {
      System.out.println(csc + "\n\n");
    }

    return listCases;
  }

  // this helper method is used in updateAllEmailsWith()
  private static void updateCaseWithNewEmail(CloudSupportCase caseToBeUpdated, String email)
      throws IOException, GeneralSecurityException {
    List<String> currentAddresses = caseToBeUpdated.getSubscriberEmailAddresses();
    CloudSupport supportService = getCloudSupportService();

    if (caseToBeUpdated.getState().toLowerCase().equals("closed")) {

      System.out.println("Case is closed, we cannot update its cc field.");

      return;
    }

    if (currentAddresses != null && !currentAddresses.contains(email)) {
      currentAddresses.add(email);

      CloudSupportCase updatedCase = caseToBeUpdated.setSubscriberEmailAddresses(currentAddresses);

      // Ensure that severity is not set. Only priority should be used, or else
      // this will throw an error.
      updatedCase.setSeverity(null);

      supportService.cases().patch(caseToBeUpdated.getName(), updatedCase).execute();
      System.out.println("I updated the email for: \n" + updatedCase + "\n");

      // must handle case when they don't have any email addresses
    } else if (currentAddresses == null) {
      currentAddresses = new ArrayList<String>();
      currentAddresses.add(email);

      CloudSupportCase updatedCase = caseToBeUpdated.setSubscriberEmailAddresses(currentAddresses);

      supportService.cases().patch(caseToBeUpdated.getName(), updatedCase).execute();
      System.out.println("I updated the email for: " + updatedCase + "\n");

    } else {
      System.out.println("Email is already there! \n\n");
    }
  }
}
