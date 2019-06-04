/*
 * Copyright (C) 2019 Google Inc.
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

package com.google.cloud.demo.hangouts.chat.bot.servlet.tasks;

import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.appengine.api.utils.SystemProperty;
import com.google.cloud.demo.hangouts.chat.bot.shared.Utils;
import com.google.common.base.Throwables;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.logging.Logger;

/** Abstract class that provides functions to enqueue and manage tasks on Cloud Tasks */
public abstract class AbstractTask extends HttpServlet {

  private static final long serialVersionUID = -5841604863236240715L;
  private static final Logger LOG = Logger.getLogger(AbstractTask.class.getName());

  static final String APPLICATION_NAME = "GCP Release Notes Updater";
  static final HttpTransport HTTP_TRANSPORT = new NetHttpTransport();
  static final JsonFactory JSON_FACTORY = new JacksonFactory();
  static final String GAE_APP_ID = SystemProperty.applicationId.get();

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    doPost(req, resp);
  }

  @SuppressWarnings("unchecked")
  @Override
  protected void doPost(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    // get task name
    String taskName = Utils.getExecutionName(req);
    // check execution count
    int executionCount = Utils.getExecutionCount(req);
    try {
      Map<String, String[]> parameterMap = (Map<String, String[]>) req.getParameterMap();

      // print input parameters if DEV
      if (!Utils.isGaeProduction()) {
        StringBuilder parametersOut = new StringBuilder("{");
        int i = 0;
        for (String key : parameterMap.keySet()) {
          if ((i++) > 0) {
            parametersOut.append(",");
          }
          parametersOut.append("\"");
          parametersOut.append(key);
          parametersOut.append("\"");
          parametersOut.append(":");
          parametersOut.append("\"");
          parametersOut.append(parameterMap.get(key)[0]);
          parametersOut.append("\"");
        }
        parametersOut.append("}");
      }

      // process the task
      process(parameterMap);
    } catch (Throwable t) {
      LOG.warning(
          "Execution #"
              + executionCount
              + " failed.\nIt will be retried.\nStackTrace: "
              + Throwables.getStackTraceAsString(t));
      if (executionCount == 0) { // write error logs only in case of FIRST error
        LOG.severe("StackTrace: " + Throwables.getStackTraceAsString(t));
      }
      throw new RuntimeException(
          "Error during execution of task: " + taskName + ". It will be retried.");
    }
  }

  /**
   * Abstract method that every subclass has to implement. It is the execution
   *
   * @param parameterMap
   * @throws Throwable
   */
  protected abstract void process(Map<String, String[]> parameterMap) throws Throwable;
}
