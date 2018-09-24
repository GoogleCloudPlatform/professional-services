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

package com.google.cloud.demo.iot.nirvana.frontend.servlet.tasks;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.cloudiot.v1.CloudIot;
import com.google.api.services.cloudiot.v1.CloudIotScopes;
import com.google.api.services.cloudiot.v1.model.Device;
import com.google.cloud.demo.iot.nirvana.frontend.shared.RetryHttpInitializerWrapper;
import com.google.cloud.demo.iot.nirvana.frontend.shared.Utils;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/** Class that represents functions to remove devices on Google Cloud IoT core */
public class UnregisterDevices extends AbstractTask {

  private static final long serialVersionUID = -1981951826229863468L;
  private static final Logger LOG = Logger.getLogger(UnregisterDevices.class.getName());

  @Override
  protected void process(Map<String, String[]> parameterMap) throws Throwable {

    // create connection toward Cloud IoT Core
    GoogleCredential credential =
        GoogleCredential.getApplicationDefault().createScoped(CloudIotScopes.all());
    JsonFactory jsonFactory = JacksonFactory.getDefaultInstance();
    HttpRequestInitializer init = new RetryHttpInitializerWrapper(credential);
    CloudIot service =
        new CloudIot(GoogleNetHttpTransport.newTrustedTransport(), jsonFactory, init);
    String projectPath =
        "projects/"
            + GAE_APP_ID
            + "/locations/"
            + Utils.getAppEngineProperty(this.getServletContext(), "GCP_CLOUD_IOT_CORE_REGION");
    String registryPath =
        projectPath
            + "/registries/"
            + Utils.getAppEngineProperty(
                this.getServletContext(), "GCP_CLOUD_IOT_CORE_REGISTRY_NAME");

    // list all devices
    List<Device> deviceList =
        service
            .projects()
            .locations()
            .registries()
            .devices()
            .list(registryPath)
            .execute()
            .getDevices();

    while (deviceList != null) {
      LOG.info(deviceList.size() + " devices to be deleted");

      // delete all device
      for (Device device : deviceList) {
        String devicePath = registryPath + "/devices/" + device.getId();
        service.projects().locations().registries().devices().delete(devicePath).execute();
        LOG.info(device.getId() + " device deleted");
      }
      deviceList =
          service
              .projects()
              .locations()
              .registries()
              .devices()
              .list(registryPath)
              .execute()
              .getDevices();
    }
    return;
  }
}
