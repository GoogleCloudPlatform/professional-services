/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.gceusage;

import com.google.cloud.pso.gceusage.initialvminventory.InitialVMInventory;
import com.google.common.flogger.FluentLogger;
import java.io.IOException;
import java.security.GeneralSecurityException;

public class Main {

  public static final String APPLICATION_NAME = "gcpcapacitylog/1.0";
  private static final FluentLogger logger = FluentLogger.forEnclosingClass();

  public static void main(String[] args)
      throws InterruptedException, GeneralSecurityException, IOException {

    System.setProperty(
        "java.util.logging.SimpleFormatter.format", "%1$tF %1$tT %4$s %2$s %5$s%6$s%n");
    if (args.length != 4) {
      logger.atInfo().log(
          "Example: java -jar gcpcapacitylog.jar initial-vm-inventory <project_id> <org_id> <dataset>");
      System.exit(-1);
    }

    String operation = args[0];
    String projectId = args[1];
    String orgNumber = args[2];
    String dataset = args[3];

    logger.atInfo().log("projectId: " + projectId);
    logger.atInfo().log("orgNumber: " + orgNumber);
    logger.atInfo().log("dataset: " + dataset);
    logger.atInfo().log("Operation: " + operation);

    if (operation.equals("initial-vm-inventory")) {
      // This method scans a org for VMs and uploads an inventory of the current VMs for the table
      // specificed in the input arguments.
      InitialVMInventory.writeVMInventorytoBQ(
          projectId, orgNumber, dataset, "_initial_vm_inventory");
    } else {
      throw new UnsupportedOperationException("Supported operations are: \"initial-vm-inventory\"");
    }
  }
}
