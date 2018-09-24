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

package com.google.cloud.demo.iot.nirvana.frontend.servlet.api;

import com.google.appengine.api.taskqueue.TaskOptions.Method;
import com.google.cloud.demo.iot.nirvana.frontend.shared.Utils;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Class that represents a servlet used to interact with Compute Engine (i.e. instance removal) */
public class StopSimulation extends HttpServlet implements ApiInterface {

  private static final long serialVersionUID = 6919710226120460383L;
  private static final Logger LOG = Logger.getLogger(StopSimulation.class.getName());

  private static final String GAE_TASK_GCE_INSTANCE_REMOVAL = "/task/gce/instance/removal";
  private static final String GAE_TASK_CLOUD_IOT_CORE_DEVICE_REMOVAL =
          "/task/cloudiotcore/device/removal";
  private static final String GAE_TASK_GCE_INSTANCE_REMOVAL_BASE_NAME = "gce-removal-";
  private static final String GAE_TASK_CLOUD_IOT_CORE_DEVICE_REMOVAL_BASE_NAME =
          "cloud-iot-core-device-removal-";

  public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    // include cookies
    resp.addHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");

    // get input parameters
    Map<String, String> params = Utils.getRequestParameters(req);

    // enqueue tasks to delete GCE instances
    Utils.enqueueTask(
        GAE_QUEUE_NAME_GCE,
        GAE_TASK_GCE_INSTANCE_REMOVAL,
        String.format(
                "%s%s",
                GAE_TASK_GCE_INSTANCE_REMOVAL_BASE_NAME,
                UUID.randomUUID().toString()),
        Method.POST,
        params,
        TASK_ENQUEUE_DELAY);

    // enqueue tasks to delete Cloud IoT Core devices
    Utils.enqueueTask(
        GAE_QUEUE_NAME_GCE,
        GAE_TASK_CLOUD_IOT_CORE_DEVICE_REMOVAL,
        String.format(
                "%s%s",
                GAE_TASK_CLOUD_IOT_CORE_DEVICE_REMOVAL_BASE_NAME,
                UUID.randomUUID().toString()),
        Method.POST,
        params,
        TASK_ENQUEUE_DELAY);

    // return data
    RestResponse restResponse = new RestResponse();
    Gson gson = new Gson();

    resp.setContentType(com.google.common.net.MediaType.JSON_UTF_8.toString());
    restResponse.setCode(javax.servlet.http.HttpServletResponse.SC_OK);
    restResponse.setMessage("Task enqueued");
    resp.setStatus(javax.servlet.http.HttpServletResponse.SC_OK);
    resp.getWriter().println(gson.toJson(restResponse));

    return;
  }
}
