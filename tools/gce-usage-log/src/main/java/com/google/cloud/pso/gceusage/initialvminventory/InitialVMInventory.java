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

package com.google.cloud.pso.gceusage.initialvminventory;

import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.services.cloudresourcemanager.model.Project;
import com.google.api.services.compute.model.AttachedDisk;
import com.google.api.services.compute.model.Disk;
import com.google.api.services.compute.model.Instance;
import com.google.cloud.bigquery.JobStatistics;
import com.google.cloud.pso.gceusage.services.BQHelper;
import com.google.cloud.pso.gceusage.services.EmptyRowCollection;
import com.google.cloud.pso.gceusage.services.GCEHelper;
import com.google.common.flogger.FluentLogger;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Queue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;

public class InitialVMInventory {

  private static final FluentLogger logger = FluentLogger.forEnclosingClass();

  private static final int NUMTHREADS = 40;
  private static final int BATCHSIZE = 500;

  /**
   * This method scans a org for VMs and uploads an inventory of the current VMs for the table
   * specificed in the input arguments.
   *
   * @param orgNumber the org number. Example: 143823328417
   * @param dataset the name of the dataset where the inventory should be written. Example:
   *     gce_capacity_log
   * @param tableName the table name where the inventory should be written. Example:
   *     initial_vm_inventory
   * @see InitialInstanceInventoryRow is the BigQuery datamodel
   */
  public static void writeVMInventorytoBQ(
      String projectId, String orgNumber, String dataset, String tableName)
      throws IOException, GeneralSecurityException, InterruptedException {

    BQHelper.deleteTable(projectId, dataset, tableName);

    Queue<Project> projects = GCEHelper.getProjectsForOrg(orgNumber);
    BlockingQueue<Object> rows = new LinkedBlockingQueue<Object>();

    Runnable projectProcessor =
        () -> {
          while (!projects.isEmpty()) {
            Project project = projects.poll();
            try {
              logger.atInfo().log(
                  "Processing project "
                      + project.getProjectId()
                      + ", "
                      + projects.size()
                      + " remaining");

              for (Instance instance : GCEHelper.getInstancesForProject(project)) {
                rows.add(convertToBQRow(instance));
              }
            } catch (GoogleJsonResponseException e) {
              if (e.getStatusCode() == 403) {
                logger.atFiner().log(
                    "GCE API not activated for project: "
                        + project.getProjectId()
                        + ". Ignoring project.");
              } else {
                logger.atWarning().log("Failed to fetch instances for project", e);
                projects.add(project);
              }
            } catch (Exception e) {
              logger.atWarning().log("Failed to fetch instances for project", e);
              projects.add(project);
            }
          }
        };

    ThreadPoolExecutor executor = (ThreadPoolExecutor) Executors.newFixedThreadPool(NUMTHREADS);
    for (int i = 0; i < NUMTHREADS; i++) {
      executor.submit(projectProcessor);
    }

    while (executor.getActiveCount() > 0 || !rows.isEmpty()) {
      if (rows.isEmpty()) {
        Thread.sleep(1000);
      } else {
        ArrayList<Object> results = new ArrayList<Object>();
        rows.drainTo(results, BATCHSIZE);

        logger.atWarning().log("Processing results of size " + results.size());

        try {
          JobStatistics statistics = null;
          statistics =
              BQHelper.insertIntoTable(
                  projectId,
                  dataset,
                  tableName,
                  InitialInstanceInventoryRow.getBQSchema(),
                  results);
          logger.atInfo().log(statistics.toString());
        } catch (EmptyRowCollection e) {
          logger.atWarning().log("Empty row collection, retrying", e);
        }
      }
    }

    executor.shutdown();
  }

  protected static InitialInstanceInventoryRow convertToBQRow(Instance instance) {
    float pdStandard = 0;
    float pdSSD = 0;
    float localSSD = 0;
    if (instance.getDisks() != null) {
      for (AttachedDisk attachedDisk : instance.getDisks()) {
        if (attachedDisk.getType().equals("PERSISTENT")) {
          Disk disk = GCEHelper.getDisk(attachedDisk.getSource());
          if (disk != null) {
            String diskType = disk.getType();
            if (diskType.endsWith("pd-standard")) {
              pdStandard += disk.getSizeGb();
            } else if (diskType.endsWith("pd-ssd")) {
              pdSSD += disk.getSizeGb();
            }
          }
        } else if (attachedDisk.getType().equals("SCRATCH")) {
          localSSD += 375;
        }
      }
    }
    return new InitialInstanceInventoryRow(
        instance.getCreationTimestamp(),
        instance.getId().toString(),
        instance.getZone(),
        instance.getMachineType(),
        new Float(pdStandard),
        new Float(pdSSD),
        new Float(localSSD),
        instance.getScheduling().getPreemptible(),
        instance.getTags(),
        instance.getLabels());
  }
}
