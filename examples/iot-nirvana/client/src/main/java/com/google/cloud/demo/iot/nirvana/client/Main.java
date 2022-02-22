/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.cloud.demo.iot.nirvana.client;

import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.common.base.Throwables;

/** Main class of the device simulator */
public class Main {

  static final Logging LOGGER = LoggingOptions.getDefaultInstance().getService();

  private static final String NO_ID = "no_id";

  private static final int STATUS_ERR = 1;

  public static void main(String args[]) {
    ClientOptions options = ClientOptions.newBuilder().build();
    try {
      // Read input parameters
      options.parse(args);

      // Create the device manager
      IotDeviceMgr deviceMgr =
          IotDeviceMgr.newBuilder()
              .setGcpProjectId(options.getGcpProjectId())
              .setGcpRegion(options.getGcpRegion())
              .setRegistryName(options.getRegistryName())
              .build();

      // Create the device and register it in the device registry
      IotDevice device =
          deviceMgr.newRegisteredDevice(
              options.getRsaCertificateFilePath(), options.getPrivateKey(), options.getCityIndex());

      // Start publishing message
      device.publish();

      // Start publishing messages to Cloud IoT Core
      device.publish();
    } catch (Exception e) {
      try {
        LogUtils.logError(
            LOGGER,
            NO_ID,
            options.getGcpProjectId(),
            String.format("Exiting main program. Cause %s", Throwables.getStackTraceAsString(e)));
      } catch (Exception ex) {
        // Nothing to do here
      }
      System.exit(STATUS_ERR);
    }
  }
}
