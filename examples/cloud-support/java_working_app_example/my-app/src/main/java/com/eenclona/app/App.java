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

package com.eenclona.app;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.JsonObjectParser;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.cloudsupport.v2beta.CloudSupport;
import com.google.api.services.cloudsupport.v2beta.model.CloseCaseRequest;
import com.google.api.services.cloudsupport.v2beta.model.CloudSupportCase;
import com.google.api.services.cloudsupport.v2beta.model.ListCasesResponse;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

// TODO (developer): to make this code run, type this command to your
// terminal to set the environment variable:
// export GOOGLE_APPLICATION_CREDENTIALS=".../<service account key path>/.json"
public class App {

  // Shared constants
  static final String CLOUD_SUPPORT_SCOPE = "https://www.googleapis.com/auth/cloudsupport";

  //TODO (developer): update PROJECT_NUMBER with your project number
  static final String PROJECT_NUMBER = "projects/1234567";

  public static void main(String[] args) {

    try {
      // 1) List all cases with this method

      listAllCases(PROJECT_NUMBER);

      // 2) Get a case with this method

      //getCase(PROJECT_NUMBER + "/cases/1234567");

      // 3) Update a case with this method
      // TODO (developer): create a json file similar to updateCase.json and put path here
      // String updatedCasePath = ".../<case's path>/updateCase.json";
      // updateCase(PROJECT_NUMBER + "/cases/1234567", updatedCasePath);

      // 4) Create a new case
      // Before creating a new case, list all valid classifications of a case with
      // listValidClassifications() first to get a valid classification.
      // A valid classification is required for creating a new case.

      // listValidClassifcations();
      // TODO (developer): create a json file similar to case.json and put path here
      //String createCasePath = ".../<case's path>/case.json";
      //createCase(PROJECT_NUMBER, createCasePath);

      // 5) Email update POC
      // this method will update the cc field of each case to include the new email
      // address. Please take caution as this will apply the new email to ALL open support case
      // If you want to apply the email to specific support cases, you may use the updateCaseWithNewEmail()

      //updateAllEmailsWith("newemail@gmail.com");

      // 6) Close a case
      // use this method to close the cases that were opened for testing purposes
      // closeCase(PROJECT_NUMBER + "/cases/123456");

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

  // list all cases
  public static List<CloudSupportCase> listAllCases(String parentResource) throws IOException {

    CloudSupport supportService = getCloudSupportService();

    ListCasesResponse listCasesResponse = supportService.cases().list(parentResource).execute();

    //this code has a filter to only list those that are open
    //ListCasesResponse listCasesResponse = supportService.cases().list(parentResource).setFilter("state=OPEN").execute();
    
    List<CloudSupportCase> listCases = listCasesResponse.getCases();

    System.out.println(
        "Printing all " + listCases.size() + " cases of parent resource: " + parentResource);

    for (CloudSupportCase csc : listCases) {
      System.out.println(csc + "\n\n");
    }

    return listCases;
  }

  // get one case
  public static CloudSupportCase getCase(String nameOfCase) throws IOException {

    CloudSupport supportService = getCloudSupportService();

    CloudSupportCase getCaseResponse = supportService.cases().get(nameOfCase).execute();

    System.out.println("Case is " + getCaseResponse);

    return getCaseResponse;
  }

  // update one case
  public static CloudSupportCase updateCase(String nameOfCase, String updatedCasePath)
      throws IOException {

    CloudSupport supportService = getCloudSupportService();

    CloudSupportCase updateCase = getCloudSupportCaseJsonObject(updatedCasePath);

    CloudSupportCase updateCaseResponse =
        supportService.cases().patch(nameOfCase, updateCase).execute();

    System.out.println("Updated case object is: " + updateCaseResponse + "\n\n\n");

    return updateCaseResponse;
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

    System.out.println("Created case's name is: " + newCaseResponse.getName());

    return newCaseResponse;
  }

  // this method is used for the POC to add another email address to all open
  // cases.
  public static void updateAllEmailsWith(String email) throws IOException {

    List<CloudSupportCase> listCases = listAllCases(PROJECT_NUMBER);

    for (CloudSupportCase csc : listCases) {

        updateCaseWithNewEmail(csc, email);

    }
  }

  // this helper method is used in updateAllEmailsWith()
  private static void updateCaseWithNewEmail(CloudSupportCase caseToBeUpdated, String email)
      throws IOException {
    List<String> currentAddresses = caseToBeUpdated.getSubscriberEmailAddresses();
    CloudSupport supportService = getCloudSupportService();

    if (caseToBeUpdated.getState().toLowerCase().equals("closed")) {

      System.out.println("Case is closed, we cannot update its cc field.");

      return;
    }

    if (currentAddresses != null && !currentAddresses.contains(email)) {
      currentAddresses.add(email);

      CloudSupportCase updatedCase = caseToBeUpdated.setSubscriberEmailAddresses(currentAddresses);

      //this is needed in recent update to support API or else code throws an error saying 
      //there cannot be both a severity and a priority at the same time
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

  public static CloudSupportCase closeCase(String nameOfCase) throws IOException {

    CloudSupport supportService = getCloudSupportService();
    CloseCaseRequest request = new CloseCaseRequest();
    CloudSupportCase closeCaseResponse =
        supportService.cases().close(nameOfCase, request).execute();

    System.out.println("Case close response is: " + closeCaseResponse);

    return closeCaseResponse;
  }
}
