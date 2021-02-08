/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.pso.common;

import com.google.cloud.ServiceOptions;
import io.cdap.cdap.api.annotation.Description;
import io.cdap.cdap.api.annotation.Macro;
import io.cdap.cdap.api.plugin.PluginConfig;
import javax.annotation.Nullable;

/**
 * Contains config properties common to all GCP plugins, like project id and service account key.
 */
public class GCPConfig extends PluginConfig {
  public static final String AUTO_DETECT = "auto-detect";

  @Description(
      "Google Cloud Project ID, which uniquely identifies a project. "
          + "It can be found on the Dashboard in the Google Cloud Platform Console.")
  @Macro
  @Nullable
  private String project;

  @Description(
      "Path on the local file system of the service account key used for authorization. Can be set"
          + " to 'auto-detect' when running on a Dataproc cluster. When running on other clusters,"
          + " the file must be present on every node in the cluster.")
  @Macro
  @Nullable
  private String serviceFilePath;

  public String getProject() {
    String projectId = project;
    if (project == null || project.isEmpty() || AUTO_DETECT.equals(project)) {
      projectId = ServiceOptions.getDefaultProjectId();
    }
    if (projectId == null) {
      throw new IllegalArgumentException(
          "Could not detect Google Cloud project id from the environment. Please specify a project"
              + " id.");
    }
    return projectId;
  }

  @Nullable
  public String getServiceAccountFilePath() {
    if (containsMacro("serviceFilePath")
        || serviceFilePath == null
        || serviceFilePath.isEmpty()
        || AUTO_DETECT.equals(serviceFilePath)) {
      return null;
    }
    return serviceFilePath;
  }
}
