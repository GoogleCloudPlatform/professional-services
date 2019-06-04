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

import com.google.api.client.http.HttpMethods;
import com.google.cloud.demo.hangouts.chat.bot.servlet.api.RestResponse;
import com.google.cloud.demo.hangouts.chat.bot.shared.Utils;
import com.google.gson.Gson;

import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/** Class that represents a task to generate instances on Google Compute Engine */
public class UpdateFeed extends AbstractTask {

  private static final long serialVersionUID = -1981951826229863419L;
  private static final Logger LOG = Logger.getLogger(UpdateFeed.class.getName());
  private static final Gson GSON = new Gson();
  private static final String API_READ_FEED_URL="/rest/feed/read";

  @Override
  protected void process(Map<String, String[]> parameterMap) throws Throwable {

    //get id from input parameter
    String rnFeedId=parameterMap.get("id")[0];

    LOG.log(Level.INFO,"Updating feed id " + rnFeedId);

    //read feed
    RestResponse apiCallResp= GSON.fromJson(
            Utils.apiCall(Utils.getGaeBaseUrl(this.getServletContext())+API_READ_FEED_URL+"?id="+rnFeedId,
                    HttpMethods.GET,
                    null),
            RestResponse.class);

    LOG.log(Level.INFO,"Revision history feed id: " + rnFeedId + ". Feed has been updated." );
  }
}
