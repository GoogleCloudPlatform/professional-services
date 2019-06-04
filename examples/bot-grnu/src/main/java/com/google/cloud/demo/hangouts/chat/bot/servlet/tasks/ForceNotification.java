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

import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/** Class that represents a task to generate instances on Google Compute Engine */
public class ForceNotification extends AbstractTask {

  private static final long serialVersionUID = -1981951826229863418L;
  private static final Logger LOG = Logger.getLogger(ForceNotification.class.getName());
  private static final Gson GSON = new Gson();
  private static final String API_WRITE_CHAT_BOT="/rest/chat/bot/write";
  private static final String API_PARAM_RN_FEED_ID="id";
  private static final String API_PARAM_ROOM="room";


  @Override
  protected void process(Map<String, String[]> parameterMap) throws Throwable {

    //get id from input parameter
    String rnFeedId=parameterMap.get(API_PARAM_RN_FEED_ID)[0];
    String room=parameterMap.get(API_PARAM_ROOM)[0];

    //read feed
    RestResponse apiCallResp= GSON.fromJson(
            Utils.apiCall(Utils.getGaeBaseUrl(this.getServletContext())+API_WRITE_CHAT_BOT+"?id="+rnFeedId+"&room="+room,
                    HttpMethods.GET,
                    null),
            RestResponse.class);

    LOG.log(Level.INFO,"Notification sent" );
  }
}
