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

package com.google.cloud.pso.security.iam.permission;

import com.google.api.services.iam.v1.Iam;
import com.google.api.services.iam.v1.model.Permission;
import com.google.api.services.iam.v1.model.QueryTestablePermissionsRequest;
import com.google.api.services.iam.v1.model.QueryTestablePermissionsResponse;
import com.google.cloud.pso.security.iam.IamClient;
import com.google.common.flogger.GoogleLogger;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/** Class to fetch and manupulate permissions. */
public class PermissionUtil {

  private static final GoogleLogger logger = GoogleLogger.forEnclosingClass();

  /**
   * Fetch all the permissions for the resource like organization or project.
   *
   * @param resouceName Resource path like
   *     //cloudresourcemanager.googleapis.com/organizations/<org_id>
   * @return Set of permissions
   * @throws IOException
   * @throws GeneralSecurityException
   */
  public Set<Permission> fetchAllPermissions(String resouceName)
      throws IOException, GeneralSecurityException {

    logger.atInfo().log("Fetching all permissions from " + resouceName);
    QueryTestablePermissionsRequest requestBody = new QueryTestablePermissionsRequest();

    requestBody.setFullResourceName(resouceName);
    Iam iamService = IamClient.getIamClient();
    Iam.Permissions.QueryTestablePermissions request =
        iamService.permissions().queryTestablePermissions(requestBody);

    QueryTestablePermissionsResponse response;

    Set<Permission> permissionSet = new HashSet<Permission>();

    do {
      response = request.execute();
      if (response.getPermissions() == null) {
        continue;
      }
      for (Permission permission : response.getPermissions()) {
        permissionSet.add(permission);
      }
      requestBody.setPageToken(response.getNextPageToken());
    } while (response.getNextPageToken() != null);

    logger.atInfo().log(
        "Total number of permissions at " + resouceName + ":" + permissionSet.size());
    return permissionSet;
  }

  /**
   * Convert permissions to String set so as to find differences and intersections.
   *
   * @param permissionSet
   * @return Set of permission name
   */
  public Set<String> convertPermissionsToStringSet(Set<Permission> permissionSet) {

    logger.atInfo().log("Converting permissions to String set: " + permissionSet.size());

    Set<String> permissionStringSet = new HashSet<String>();

    Iterator<Permission> iterator = permissionSet.iterator();

    while (iterator.hasNext()) {
      permissionStringSet.add(iterator.next().getName());
    }

    return permissionStringSet;
  }

  /**
   * Filter the pemissions which are in testing mode but also suppoted on custom role.
   * permission.getCustomRolesSupportLevel() is only set on TESTING or NOT_SUPPORTED permissions
   * otherwise it is null.
   *
   * @param allPermissions
   * @return Set of permission name
   */
  public Set<String> findTestingModePermissions(Set<Permission> allPermissions) {

    logger.atInfo().log("Finding permissions that are at TESTING or NOT_SUPPORTED stage");

    Iterator<Permission> iterator = allPermissions.iterator();

    Set<String> filteredPermissions = new HashSet<String>();

    while (iterator.hasNext()) {
      Permission permission = iterator.next();
      if (permission.getCustomRolesSupportLevel()
          != null) { // "customRolesSupportLevel":"TESTING" or
        // "customRolesSupportLevel":"NOT_SUPPORTED"

        filteredPermissions.add(permission.getName());
      }
    }

    logger.atInfo().log(
        "Total number of TESTING or NOT_SUPPORTED permissions: " + filteredPermissions.size());

    return filteredPermissions;
  }
}
