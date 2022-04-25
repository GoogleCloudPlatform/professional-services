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

import java.util.Set;

/** Result data. */
public class CustomRoleAnalyzerResult {

  String customRole;
  String parent;
  Set<String> listofPredefinedRoles;
  Set<String> additionPermissionsRequired;
  boolean isExactMatch;
  int noOfOriginalPermissions;
  int noOfadditionalPermissions;

  public int getNoOfOriginalPermissions() {
    return noOfOriginalPermissions;
  }

  public void setNoOfOriginalPermissions(int noOfOriginalPermissions) {
    this.noOfOriginalPermissions = noOfOriginalPermissions;
  }

  public int getNoOfadditionalPermissions() {
    return noOfadditionalPermissions;
  }

  public void setNoOfadditionalPermissions(int noOfadditionalPermissions) {
    this.noOfadditionalPermissions = noOfadditionalPermissions;
  }

  public boolean isExactMatch() {
    return isExactMatch;
  }

  public void setExactMatch(boolean isExactMatch) {
    this.isExactMatch = isExactMatch;
  }

  public String getCustomRole() {
    return customRole;
  }

  public void setCustomRole(String customRole) {
    this.customRole = customRole;
  }

  public String getParent() {
    return parent;
  }

  public void setParent(String parent) {
    this.parent = parent;
  }

  public Set<String> getListofPredefinedRoles() {
    return listofPredefinedRoles;
  }

  public void setListofPredefinedRoles(Set<String> listofPredefinedRoles) {
    this.listofPredefinedRoles = listofPredefinedRoles;
  }

  public Set<String> getAdditionPermissionsRequired() {
    return additionPermissionsRequired;
  }

  public void setAdditionPermissionsRequired(Set<String> additionPermissionsRequired) {
    this.additionPermissionsRequired = additionPermissionsRequired;
  }
}
