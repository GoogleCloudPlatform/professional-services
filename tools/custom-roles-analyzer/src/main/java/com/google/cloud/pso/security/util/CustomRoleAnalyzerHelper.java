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

package com.google.cloud.pso.security.util;

import com.google.api.services.iam.v1.model.Permission;
import com.google.api.services.iam.v1.model.Role;
import com.google.cloud.pso.security.constants.GenericConstants;
import com.google.cloud.pso.security.iam.IamClient;
import com.google.cloud.pso.security.iam.permission.PermissionUtil;
import com.google.cloud.pso.security.iam.role.RoleUtil;
import com.google.cloud.pso.security.resourcemanager.ResourceManagerClient;
import com.google.cloud.resourcemanager.v3.Folder;
import com.google.cloud.resourcemanager.v3.Project;
import com.google.common.collect.Sets;
import com.google.common.flogger.GoogleLogger;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.FileWriter;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

/** Helper class for this tool. */
public class CustomRoleAnalyzerHelper {

  private static final GoogleLogger logger = GoogleLogger.forEnclosingClass();
  IamClient iamClient = null;
  Map<String, Set<String>> predefinedRolesWithSupportedPermissions = null;
  RoleUtil roleUtil = null;
  Set<Permission> allPermissions = null;
  Set<String> allOrgPermissions = null;
  PermissionUtil permissionUtil = null;
  Set<String> allPermissionsProjectLevel = null;
  Set<String> testingPermissions = null;
  Map<String, Set<String>> predefinedRolesToPermissionsMap = null;
  FileWriter resultsFile = null;
  String resultFormat = GenericConstants.DEFAULT_FORMAT;

  /**
   * Initialize the analysis by fetching all the predefined roles, org level permissions, maping
   * permissions to role and removing testing permissions from predefined roles.
   *
   * @param orgId
   * @throws Exception
   */
  public void initilize(String orgId, String resultFormat) throws Exception {
    this.resultFormat = resultFormat.toLowerCase();
    logger.atInfo().log("Initializing analysis.");
    iamClient = new IamClient();

    permissionUtil = new PermissionUtil();

    Set<Role> predefinedRoleSet = null;

    String resourcePath =
        GenericConstants.CLOUD_RESOURCE_MANAGER_API
            + GenericConstants.SEPARATOR
            + GenericConstants.ORGANIZATIONS
            + GenericConstants.SEPARATOR
            + orgId;

    try {
      predefinedRoleSet = iamClient.fetchPredefinedRoles();
      allPermissions = permissionUtil.fetchAllPermissions(resourcePath);

    } catch (IOException | GeneralSecurityException e) {
      logger.atSevere().withCause(e).log("Unable to create IAM Service");
      throw e;
    }

    roleUtil = new RoleUtil();
    predefinedRolesToPermissionsMap = roleUtil.mapRolesToPermissions(predefinedRoleSet);

    testingPermissions = permissionUtil.findTestingModePermissions(allPermissions);

    predefinedRolesWithSupportedPermissions =
        roleUtil.removeTestingPermission(predefinedRolesToPermissionsMap, testingPermissions);
  }

  /**
   * Arrange the final result into CustomRoleAnalyzerResult
   *
   * @param parent - Parent for custom role
   * @param matchingRoles - All maching predefined roles for custom role
   * @param customRole - Custom role
   */
  private void printResult(String parent, Map<String, Set<String>> matchingRoles, Role customRole) {

    CustomRoleAnalyzerResult analyzerResult = new CustomRoleAnalyzerResult();

    Set<String> keySet = matchingRoles.keySet();

    logger.atInfo().log(
        "Total number of maching roles found for " + customRole.getName() + ":" + keySet.size());

    analyzerResult.setListofPredefinedRoles(keySet);
    analyzerResult.setCustomRole(customRole.getName());
    analyzerResult.setParent(parent);
    Iterator<String> iterator2 = keySet.iterator();
    Set<String> tallySet = new HashSet<String>();

    Set<String> customRolePermissions = new HashSet<String>();
    customRolePermissions.addAll(customRole.getIncludedPermissions());

    while (iterator2.hasNext()) {
      String role = iterator2.next();
      tallySet.addAll(matchingRoles.get(role));
    }

    if (tallySet.equals(customRolePermissions)) {
      analyzerResult.setExactMatch(true);
    } else {
      analyzerResult.setExactMatch(false);
    }

    analyzerResult.setNoOfOriginalPermissions(customRolePermissions.size());

    customRolePermissions.removeAll(tallySet);

    analyzerResult.setNoOfadditionalPermissions(customRolePermissions.size());

    analyzerResult.setAdditionPermissionsRequired(customRolePermissions);

    writeResultToFile(analyzerResult);
  }

  /**
   * Write result to the file.
   *
   * @param analyzerResult
   */
  private void writeResultToFile(CustomRoleAnalyzerResult analyzerResult) {

    logger.atInfo().log("Writing results to the file");

    try {
      if (resultFormat.equals(GenericConstants.DEFAULT_FORMAT)) {
        String resultFileName =
            GenericConstants.RESULT_FILENAME + "." + GenericConstants.DEFAULT_FORMAT;
        if (resultsFile == null) {
          resultsFile = new FileWriter(resultFileName);
          StringBuffer headers = new StringBuffer();
          headers.append(GenericConstants.COLUMN_CUSTOM_ROLE + ",");
          headers.append(GenericConstants.COLUMN_PARENT + ",");
          headers.append(GenericConstants.COLUMN_PREDEFINED_ROLES + ",");
          headers.append(GenericConstants.COLUMN_ADDITIONAL_PERMISSIONS + ",");
          headers.append(GenericConstants.COLUMN_NO_OF_ADDITIONAL_PERMISSIONS + ",");
          headers.append(GenericConstants.COLUMN_NO_OF_ORIGINAL_PERMISSIONS + ",");
          headers.append(GenericConstants.COLUMN_EXACT_MATCH + "\n");
          resultsFile.append(headers);
        }

        StringBuffer predefinedRoleLStringBuffer = new StringBuffer();
        Iterator<String> iterator = analyzerResult.getListofPredefinedRoles().iterator();
        while (iterator.hasNext()) {
          predefinedRoleLStringBuffer.append(iterator.next() + " ");
        }

        StringBuffer additionPermissionsStringBuffer = new StringBuffer();
        Iterator<String> iterator2 = analyzerResult.getAdditionPermissionsRequired().iterator();
        while (iterator2.hasNext()) {
          additionPermissionsStringBuffer.append(iterator2.next() + " ");
        }

        resultsFile.append(
            analyzerResult.getCustomRole()
                + ", "
                + analyzerResult.getParent()
                + ", "
                + predefinedRoleLStringBuffer
                + ", "
                + additionPermissionsStringBuffer
                + ","
                + analyzerResult.getNoOfadditionalPermissions()
                + ","
                + analyzerResult.getNoOfOriginalPermissions()
                + ","
                + analyzerResult.isExactMatch
                + "\n");

      } else {
        String resultFileName =
            GenericConstants.RESULT_FILENAME + "." + GenericConstants.JSON_FORMAT;
        Gson gson = new GsonBuilder().setPrettyPrinting().create();

        gson.toJson(analyzerResult);

        String json = gson.toJson(analyzerResult);
        if (resultsFile == null) {
          resultsFile = new FileWriter(resultFileName);
        }

        resultsFile.append(json + "\n");
      }
    } catch (IOException e) {
      logger.atSevere().withCause(e).log("Exception while writing results to the file.");
    }
  }

  /**
   * Process org level custom roles.
   *
   * @param org_id
   * @throws Exception
   */
  public void processOrgLevelCustomRoles(String org_id) throws Exception {

    String parent = GenericConstants.ORGANIZATIONS + GenericConstants.SEPARATOR + org_id;

    logger.atInfo().log("Processing org level custom roles " + parent);

    processCustomRoles(parent, true);
  }

  /**
   * Fetch custom roles and process those to find matching predefined roles.
   *
   * @param parent org id or project id.
   * @param isOrgLevel
   * @throws Exception
   */
  private void processCustomRoles(String parent, boolean isOrgLevel) throws Exception {

    logger.atInfo().log("Processing custom roles: " + parent);
    Set<Role> customRole = null;

    try {
      if (isOrgLevel) {

        customRole = iamClient.fetchCustomRolesOrgLevel(parent);
      } else {
        customRole = iamClient.fetchCustomRolesProjectLevel(parent);
      }

    } catch (IOException | GeneralSecurityException e) {
      logger.atSevere().withCause(e).log("Exception while feching custom roles: " + parent);
      try {
        if (resultsFile != null) {
          resultsFile.close();
        }
      } catch (IOException ie) {
        logger.atSevere().withCause(ie).log("Exception while closing file steam.");
      }
      throw e;
    }

    logger.atInfo().log("Total number of custom roles at " + parent + ":" + customRole.size());

    Iterator<Role> iterator = customRole.iterator();

    while (iterator.hasNext()) {

      Role role = iterator.next();

      Set<String> customRolePermissionsSet = new HashSet<String>(role.getIncludedPermissions());

      logger.atInfo().log("Finding possible matching roles for: " + role.getName());

      Map<String, Set<String>> possibleMatchingRoles =
          roleUtil.findPosibleMatchingRoles(
              customRolePermissionsSet, predefinedRolesWithSupportedPermissions);

      Map<String, Set<String>> matchingRoles =
          roleUtil.findMachingPredefindedRoles(role, possibleMatchingRoles);

      printResult(parent, matchingRoles, role);
    }
  }

  /**
   * Process project level custom roles with additional adjustments to permissions at project level.
   *
   * @param org_id
   * @throws Exception
   */
  public void processProjectLevelCustomRoles(String org_id) throws Exception {

    logger.atInfo().log("Processing project level custom roles.");

    String parentOrg = GenericConstants.ORGANIZATIONS + GenericConstants.SEPARATOR + org_id;
    String parentProject = GenericConstants.PROJECTS + GenericConstants.SEPARATOR;

    String resourcePath =
        GenericConstants.CLOUD_RESOURCE_MANAGER_API + GenericConstants.SEPARATOR + parentProject;

    ResourceManagerClient resourceManagerClient = new ResourceManagerClient();

    Map<Folder, Set<Project>> folderAndProjectsMap = null;

    try {
      folderAndProjectsMap = resourceManagerClient.fetchFoldersAndProjects(parentOrg);
    } catch (Exception e) {

      logger.atSevere().log("Exception while fetching folders and projects.");
      try {
        if (resultsFile != null) {
          resultsFile.close();
        }
      } catch (IOException ie) {
        logger.atSevere().withCause(ie).log("Exception while closing file steam.");
      }
      throw e;
    }
    for (Iterator<Map.Entry<Folder, Set<Project>>> it = folderAndProjectsMap.entrySet().iterator();
        it.hasNext(); ) {
      Map.Entry<Folder, Set<Project>> entry = it.next();

      Set<Project> projects = entry.getValue();

      if (projects.size() > 0) {

        Iterator<Project> iterator = projects.iterator();

        while (iterator.hasNext()) {
          Project project = iterator.next();

          resourcePath = resourcePath + project.getProjectId();
          /*
           * Fetch project level all the permissions as those are differnt than
           * permissions at org level. Some of the permissions like
           * "resourcemanager.projects.list" is not applicable in case of project but
           * predefined roles does contain these kind of permissions.
           * Need to add such a permissions in the list of permissions which we need to
           * remove from predefined role.
           */

          if (allPermissionsProjectLevel == null) {
            Set<String> allOrgPermissionsStringSet = null;
            Set<Permission> permissionsProjectLevel = null;
            try {
              permissionsProjectLevel = permissionUtil.fetchAllPermissions(resourcePath);

            } catch (IOException | GeneralSecurityException e) {
              logger.atSevere().withCause(e).log(
                  "Exception while feching permissions: " + resourcePath);
              try {
                if (resultsFile != null) {
                  resultsFile.close();
                }
              } catch (IOException ie) {
                logger.atSevere().withCause(ie).log("Exception while closing file steam.");
              }
              throw e;
            }
            allPermissionsProjectLevel =
                permissionUtil.convertPermissionsToStringSet(permissionsProjectLevel);
            allOrgPermissionsStringSet =
                permissionUtil.convertPermissionsToStringSet(allPermissions);
            Set<String> differenceSet =
                Sets.difference(allOrgPermissionsStringSet, allPermissionsProjectLevel);
            Iterator<String> iterator2 = differenceSet.iterator();
            while (iterator2.hasNext()) {
              testingPermissions.add(iterator2.next());
            }
            predefinedRolesWithSupportedPermissions =
                roleUtil.removeTestingPermission(
                    predefinedRolesToPermissionsMap, testingPermissions);
          }

          processCustomRoles(parentProject + project.getProjectId(), false);
        }
      }
    }
    try {
      if (resultsFile != null) {
        resultsFile.close();
      }
    } catch (IOException ie) {
      logger.atSevere().withCause(ie).log("Exception while closing file steam.");
    }
  }
}
