/*
Copyright 2022 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package com.google.cloud.pso.security.iam;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.iam.v1.Iam;
import com.google.api.services.iam.v1.Iam.Projects.Roles.List;
import com.google.api.services.iam.v1.model.ListRolesResponse;
import com.google.api.services.iam.v1.model.Role;
import com.google.common.flogger.GoogleLogger;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * IamClient class create the Iam service client and used to fetch predefined roles, custom roles at
 * org and project level.
 */
public class IamClient {

  private static final GoogleLogger logger = GoogleLogger.forEnclosingClass();

  static Iam iamService = null;

  /*
   * Create IAM Client
   */
  private static Iam createIamService() throws IOException, GeneralSecurityException {

    logger.atInfo().log("Creating IAM Client");

    HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
    GsonFactory gsonFactory = GsonFactory.getDefaultInstance();

    GoogleCredential credential = GoogleCredential.getApplicationDefault();
    if (credential.createScopedRequired()) {
      credential =
          credential.createScoped(Arrays.asList("https://www.googleapis.com/auth/cloud-platform"));
    }

    if (iamService == null) {
      iamService =
          new Iam.Builder(httpTransport, gsonFactory, credential)
              .setApplicationName("Google-iamSample/0.1")
              .build();
    }

    return iamService;
  }

  /**
   * Single Iam object is created for this tool.ß
   *
   * @return Iam object
   * @throws IOException
   * @throws GeneralSecurityException
   */
  public static Iam getIamClient() throws IOException, GeneralSecurityException {

    logger.atInfo().log("Get IAM Client");

    if (iamService == null) {
      createIamService();
    }

    return iamService;
  }

  /*
   * This method will fetch all the predefined roles in the organization along
   * with permissions assoicated with it.
   *
   */
  public Set<Role> fetchPredefinedRoles() throws IOException, GeneralSecurityException {
    iamService = getIamClient();
    Iam.Roles.List request = iamService.roles().list(); // All predefined roles
    request.setView(
        "1"); // Fetch all the details including pemissions. If not set permissions will not
    // be fetched.

    Set<Role> completeRoleSet = new HashSet<Role>();
    ListRolesResponse response;
    do {
      response = request.execute();
      if (response.getRoles() == null) {
        continue;
      }
      Set<Role> roleSet = writeResponse(response);
      completeRoleSet.addAll(roleSet);
      request.setPageToken(response.getNextPageToken());
    } while (response.getNextPageToken() != null);

    return completeRoleSet;
  }

  /**
   * This method will fetch all the Custom roles in the organization/Project along with permissions
   * assoicated with it.
   *
   * @param parent "organizations/<ORG_ID>"
   * @return Set of Roles
   * @throws IOException
   * @throws GeneralSecurityException
   */
  public Set<Role> fetchCustomRolesOrgLevel(String parent)
      throws IOException, GeneralSecurityException {
    iamService = getIamClient();
    Iam.Organizations.Roles.List request = iamService.organizations().roles().list(parent);
    request.setView(
        "1"); // Fetch all the details including pemissions. If not set permissions will not
    // be fetched.

    Set<Role> completeRoleSet = new HashSet<Role>();

    ListRolesResponse response;
    do {
      response = request.execute();
      if (response.getRoles() == null) {
        continue;
      }
      Set<Role> roleSet = writeResponse(response);
      completeRoleSet.addAll(roleSet);
      request.setPageToken(response.getNextPageToken());
    } while (response.getNextPageToken() != null);
    return completeRoleSet;
  }

  /**
   * This method will fetch all the Custom roles in the project along with permissions assoicated
   * with it.
   *
   * @param parent "projects/<PROJECT_ID>"
   * @return Set of Roles
   * @throws IOException
   * @throws GeneralSecurityException
   */
  public Set<Role> fetchCustomRolesProjectLevel(String parent)
      throws IOException, GeneralSecurityException {
    iamService = getIamClient();
    List request = iamService.projects().roles().list(parent);
    request.setView(
        "1"); // Fetch all the details including pemissions. If not set permissions will not
    // be fetched.

    Set<Role> completeRoleSet = new HashSet<Role>();

    ListRolesResponse response;
    do {
      response = request.execute();
      if (response.getRoles() == null) {
        continue;
      }
      Set<Role> roleSet = writeResponse(response);
      completeRoleSet.addAll(roleSet);
      request.setPageToken(response.getNextPageToken());
    } while (response.getNextPageToken() != null);
    return completeRoleSet;
  }

  /**
   * Write Roles to the Set
   *
   * @param ListRolesResponse
   * @return Set of Roles
   */
  private Set<Role> writeResponse(ListRolesResponse response) {

    Set<Role> roleSet = new HashSet<Role>();

    for (Role role : response.getRoles()) {
      roleSet.add(role);
    }
    return roleSet;
  }
}
