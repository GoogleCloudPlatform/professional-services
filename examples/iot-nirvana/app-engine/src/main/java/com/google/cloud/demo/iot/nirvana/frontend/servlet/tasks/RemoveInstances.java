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
import com.google.api.services.compute.Compute;
import com.google.api.services.compute.ComputeScopes;
import com.google.api.services.compute.model.Instance;
import com.google.api.services.compute.model.InstanceList;
import java.util.Map;
import java.util.logging.Logger;

/** Class that represents a task to remove instances on Google Compute Engine */
public class RemoveInstances extends AbstractTask {

  private static final long serialVersionUID = -1981951826229863468L;
  private static final Logger LOG = Logger.getLogger(RemoveInstances.class.getName());

  @Override
  protected void process(Map<String, String[]> parameterMap) throws Throwable {

    // create default Google AppEngine credential
    GoogleCredential credential =
        GoogleCredential.getApplicationDefault().createScoped(ComputeScopes.all());

    // access to Compute Engine
    // Create compute engine object for listing instances
    Compute compute =
        new Compute.Builder(HTTP_TRANSPORT, JSON_FACTORY, null)
            .setApplicationName(APPLICATION_NAME)
            .setHttpRequestInitializer(credential)
            .build();

    // list instances
    String nextPageToken = null;
    InstanceList instanceList =
        compute
            .instances()
            .list(GAE_APP_ID, GCE_MACHINE_DEFAULT_ZONE)
            .execute();
    for (Instance instance : instanceList.getItems()) {
      compute
          .instances()
          .delete(GAE_APP_ID, GCE_MACHINE_DEFAULT_ZONE, instance.getName())
          .execute();
    }
    nextPageToken = instanceList.getNextPageToken();
    // if there are more token to elaborate
    while (nextPageToken != null) {
      // get instances
      instanceList =
          compute
              .instances()
              .list(GAE_APP_ID, GCE_MACHINE_DEFAULT_ZONE)
              .setPageToken(nextPageToken)
              .execute();
      // save instance information
      for (Instance instance : instanceList.getItems()) {
        compute
            .instances()
            .delete(GAE_APP_ID, GCE_MACHINE_DEFAULT_ZONE, instance.getName())
            .execute();
      }
      // update nextPageToken
      nextPageToken = instanceList.getNextPageToken();
    }

    return;
  }
}
