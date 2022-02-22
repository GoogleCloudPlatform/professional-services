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

import com.google.cloud.MonitoredResource;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.Payload.StringPayload;
import com.google.cloud.logging.Severity;
import java.util.Collections;

/** Class that describes shared utils functions that will be used throughout the application */
public final class LogUtils {

  public static final String CLOUD_LOGGING_DEVICE_SIMULATOR = "DeviceSimulator";

  /** Log a debug message. */
  public static void logDebug(
      Logging logger, String monitoredResourceName, String projectId, String message)
      throws ClientException {
    LogUtils.writeLog(logger, message, Severity.DEBUG, monitoredResourceName, projectId);
  }

  /** Log an error message. */
  public static void logError(
      Logging logger, String monitoredResourceName, String projectId, String message)
      throws ClientException {
    LogUtils.writeLog(logger, message, Severity.ERROR, monitoredResourceName, projectId);
  }

  /**
   * Write logs into Cloud Logging
   *
   * @param logger the object used to write logs into Cloud Logging
   * @param severity the severity of the log INFO, DEBUG, WARNING, ERROR
   * @param text the message that you want to log
   * @param gcpProjectId the name of the project where you want to write logs
   */
  static void writeLog(
      Logging logger,
      String text,
      Severity severity,
      String monitoredResourceName,
      String gcpProjectId) {
    // Prepare entry
    LogEntry entry =
        LogEntry.newBuilder(StringPayload.of(text))
            .setSeverity(severity)
            .setLogName(CLOUD_LOGGING_DEVICE_SIMULATOR)
            .setResource(
                MonitoredResource.newBuilder("global")
                    .addLabel("project_id", gcpProjectId)
                    .addLabel("name", monitoredResourceName)
                    .build())
            .build();

    // Write the log entry asynchronously
    logger.write(Collections.singleton(entry));
  }
}
