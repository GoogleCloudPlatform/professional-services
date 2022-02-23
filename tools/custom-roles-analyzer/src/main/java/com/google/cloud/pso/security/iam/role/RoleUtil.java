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

package com.google.cloud.pso.security.iam.role;

import com.google.api.services.iam.v1.model.Role;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import com.google.common.flogger.GoogleLogger;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

/** Used to map roles to permissions, find maching roles etc. */
public class RoleUtil {
  private static final GoogleLogger logger = GoogleLogger.forEnclosingClass();

  /**
   * Maps Role to permissions.
   *
   * @param roleSet Set of Roles
   * @return Map of Role name and associated Set of permissions
   */
  public Map<String, Set<String>> mapRolesToPermissions(Set<Role> roleSet) {

    logger.atInfo().log("Mapping roles to permissions");
    logger.atInfo().log("Total number of roles to map: " + roleSet.size());

    Iterator<Role> rolesIterator = roleSet.iterator();

    Map<String, Set<String>> serviceRoleMap = new HashMap<String, Set<String>>();
    String roleNameString = "";
    while (rolesIterator.hasNext()) {

      Role role = rolesIterator.next();

      Set<String> permissions = new HashSet<String>();
      if (role != null && role.getIncludedPermissions() != null) {
        roleNameString = role.getName();

        permissions.addAll(role.getIncludedPermissions());
        serviceRoleMap.put(roleNameString, permissions);

      } else {
        logger.atInfo().log("Role which does not have permissions: " + roleNameString);
      }
    }

    return serviceRoleMap;
  }

  /**
   * Remove TESTING or UNSUPPORTED permissions from the predefined roles. This is required as
   * predefined roles always has TESTING stage permissions and those are not recommended for custom
   * roles. Assuming custom roles does not have TESTING stage permissions.
   *
   * @param predefinedRolesPermissions Map of roles and permissions.
   * @param testingPermissions Set of TESTING stage permissions.
   * @return Map of role and associated permissions without TESTING stage permissions.
   */
  public Map<String, Set<String>> removeTestingPermission(
      Map<String, Set<String>> predefinedRolesPermissions, Set<String> testingPermissions) {

    logger.atInfo().log("Removing testing permissions from predefined roles");

    Map<String, Set<String>> tempRp = Maps.newHashMap(predefinedRolesPermissions);

    for (Iterator<Map.Entry<String, Set<String>>> it = tempRp.entrySet().iterator();
        it.hasNext(); ) {
      Map.Entry<String, Set<String>> entry = it.next();

      String role = entry.getKey();

      Set<String> roleSet = tempRp.get(role);

      Set<String> intersection = Sets.intersection(roleSet, testingPermissions);

      Set<String> actualRoleSet = new HashSet<String>(predefinedRolesPermissions.get(role));
      if (intersection.size() > 0) {
        logger.atFine().log(
            "Number of TESTING permissions removed from " + role + ":" + intersection.size());
        actualRoleSet.removeAll(intersection);
        predefinedRolesPermissions.put(role, actualRoleSet);
      }
    }

    return predefinedRolesPermissions;
  }

  /**
   * Find the possible match for the custom role initially.
   *
   * @param customRolePermissions
   * @param predefinedRolesPermissions
   * @return Map of predefinded role and its permissions.
   */
  public Map<String, Set<String>> findPosibleMatchingRoles(
      Set<String> customRolePermissions, Map<String, Set<String>> predefinedRolesPermissions) {

    logger.atInfo().log("Finding possible matching roles");
    Map<String, Set<String>> resultSet = new HashMap<String, Set<String>>();

    Map<String, Set<String>> tempRp = predefinedRolesPermissions;

    for (Iterator<Map.Entry<String, Set<String>>> it = tempRp.entrySet().iterator();
        it.hasNext(); ) {
      Map.Entry<String, Set<String>> entry = it.next();

      String role = entry.getKey();

      if (customRolePermissions.containsAll(tempRp.get(role))) {

        resultSet.put(role, tempRp.get(role));
      }
    }

    logger.atInfo().log("Total number of matching roles found: " + resultSet.size());

    return resultSet;
  }

  /**
   * Find the exact maching predefined roles with custom roles.
   *
   * @param customRole
   * @param predefinedRolesMap
   * @return Map of predefinded role and its permissions.
   */
  public Map<String, Set<String>> findMachingPredefindedRoles(
      Role customRole, Map<String, Set<String>> predefinedRolesMap) {

    logger.atInfo().log(
        "Finding exact maching predefined roles for custom role: " + customRole.getName());
    Map<String, Set<String>> processedPredefinedRolesMap =
        new HashMap<String, Set<String>>(predefinedRolesMap);

    Set<String> processedIndex = new HashSet<>();
    String index = "";

    int entryRemoved = 0;

    int size = processedPredefinedRolesMap.size();
    int originalSize = size;
    int counter;
    do {
      int countMax = 0;
      for (Iterator<Map.Entry<String, Set<String>>> it =
              processedPredefinedRolesMap.entrySet().iterator();
          it.hasNext(); ) {
        Map.Entry<String, Set<String>> entry = it.next();

        if (countMax <= entry.getValue().size() && !processedIndex.contains(entry.getKey())) {
          countMax = entry.getValue().size();
          index = entry.getKey();
        }
      }

      processedIndex.add(index);
      entryRemoved =
          entryRemoved
              + checkDuplicatesRoles(
                  processedPredefinedRolesMap, processedPredefinedRolesMap.get(index), index);

      counter = entryRemoved + processedIndex.size();
    } while (counter != originalSize);

    return processedPredefinedRolesMap;
  }

  /**
   * Check if there are any duplicate predefined roles in possible maching roles and remove those
   * from the map.
   *
   * @param predefinedRolesMap
   * @param maxPermissions
   * @param index
   * @return Index of removed entry
   */
  private int checkDuplicatesRoles(
      Map<String, Set<String>> predefinedRolesMap, Set<String> maxPermissions, String index) {

    logger.atFine().log("Checking for duplicate roles");
    int entryRemoved = 0;

    for (Iterator<Map.Entry<String, Set<String>>> it = predefinedRolesMap.entrySet().iterator();
        it.hasNext(); ) {
      Map.Entry<String, Set<String>> entry = it.next();

      if (maxPermissions.containsAll(entry.getValue()) && entry.getKey() != index) {

        it.remove();
        entryRemoved++;
      }
    }
    return entryRemoved;
  }
}
