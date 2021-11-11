/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.gceusage.services;

import com.google.api.services.cloudresourcemanager.CloudResourceManager;
import com.google.api.services.cloudresourcemanager.model.ListProjectsResponse;
import com.google.api.services.cloudresourcemanager.model.Project;
import com.google.api.services.compute.Compute;
import com.google.api.services.compute.Compute.Instances;
import com.google.api.services.compute.model.Disk;
import com.google.api.services.compute.model.Instance;
import com.google.api.services.compute.model.InstanceList;
import com.google.api.services.compute.model.Zone;
import com.google.common.flogger.FluentLogger;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

public class GCEHelper {

  private static final FluentLogger logger = FluentLogger.forEnclosingClass();
  private static final int MAXPROJECTS = 100;
  private static final long MAXINSTANCES = 100;

  public static Queue<Project> getProjectsForOrg(String orgNumber)
      throws IOException, GeneralSecurityException {

    CloudResourceManager cloudResourceManagerService = CloudResourceManagerService.getInstance();
    CloudResourceManager.Projects.List request =
        cloudResourceManagerService
            .projects()
            .list()
            .setFilter("lifecycleState:ACTIVE")
            .setPageSize(MAXPROJECTS);
    ListProjectsResponse response;
    Queue returnValue = new ConcurrentLinkedQueue<Project>();
    do {
      response = request.execute();
      if (response.getProjects() == null) {
        continue;
      }
      for (Project project : response.getProjects()) {
        returnValue.add(project);
      }
      request.setPageToken(response.getNextPageToken());
    } while (response.getNextPageToken() != null);

    return returnValue;
  }

  private static List<Zone> getZones(Project project) throws GeneralSecurityException, IOException {
    Compute compute = ComputeService.getInstance();
    return compute.zones().list(project.getProjectId()).execute().getItems();
  }

  public static List<Instance> getInstancesForProject(Project project)
      throws IOException, GeneralSecurityException {

    List<Instance> returnValue = new ArrayList();
    List<Zone> zones = getZones(project);
    Compute compute = ComputeService.getInstance();

    for (Zone zone : zones) {
      Instances.List request =
          compute
              .instances()
              .list(project.getProjectId(), zone.getName())
              .setMaxResults(MAXINSTANCES);
      InstanceList response;
      do {
        response = request.execute();
        if (response.getItems() != null) {
          returnValue.addAll(response.getItems());
        }
        request.setPageToken(response.getNextPageToken());
      } while (response.getNextPageToken() != null);
    }
    return returnValue;
  }

  public static Disk getDisk(String source) {
    // example source:
    // "https://www.googleapis.com/compute/beta/projects/sandbox-231713/zones/europe-west1-c/disks/gke-cluster-europe-west1-default-pool-71f42fed-d3dp"

    String[] parts = source.split("/");

    Disk disk = null;
    try {
      Compute compute = ComputeService.getInstance();
      Compute.Disks.Get request = compute.disks().get(parts[6], parts[8], parts[10]);
      Disk response = null;
      response = request.execute();
      if (response != null) {
        disk = response;
      }
    } catch (Exception e) {
      logger.atInfo().log(
          "Error fetching disk: " + parts[6] + ". Ignoring disk " + parts[10] + ".");
    }
    return disk;
  }
}
