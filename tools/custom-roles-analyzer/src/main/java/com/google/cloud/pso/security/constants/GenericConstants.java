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
package com.google.cloud.pso.security.constants;

/** Constants around mgmt APIs call sand result */
public class GenericConstants {
  public static final String ORGANIZATIONS = "organizations";
  public static final String PROJECTS = "projects";
  public static final String SEPARATOR = "/";
  public static final String CLOUD_RESOURCE_MANAGER_API = "//cloudresourcemanager.googleapis.com";
  public static final String DEFAULT_FORMAT = "csv";
  public static final String JSON_FORMAT = "json";
  public static final String RESULT_FILENAME = "CustomRoleAnalysisResult";
  public static final String COLUMN_CUSTOM_ROLE = "Custom Role";
  public static final String COLUMN_PARENT = "Parent";
  public static final String COLUMN_PREDEFINED_ROLES = "List of predefined roles";
  public static final String COLUMN_ADDITIONAL_PERMISSIONS = "Additional permissions required";
  public static final String COLUMN_EXACT_MATCH = "Is Exact Match";
  public static final String COLUMN_NO_OF_ADDITIONAL_PERMISSIONS = "No of additional permissions";
  public static final String COLUMN_NO_OF_ORIGINAL_PERMISSIONS = "No of original permissions";

  public static final String OPTIONS_HELP =
      "Please provide the commandline options. \n"
          + "--org - Organization ID required parameters. \n"
          + "--format - Result format (optional parameter; defaults to csv and supports json). \n"
          + "--role-analysis - Run custom role analysis (Optional parameter; default to custom role analysis). \n"
          + "--binding-analysis - Run role binding analysis (Optional parameter; default to custom role analysis). \n";

  private GenericConstants() {}
}
