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

package com.google.cloud.demo.hangouts.chat.bot.servlet.cron;

import com.google.api.client.http.HttpMethods;
import com.google.appengine.api.taskqueue.TaskOptions;
import com.google.cloud.demo.hangouts.chat.bot.datastore.ReleaseNotesFeedEntity;
import com.google.cloud.demo.hangouts.chat.bot.servlet.api.ApiInterface;
import com.google.cloud.demo.hangouts.chat.bot.servlet.api.RestResponse;
import com.google.cloud.demo.hangouts.chat.bot.shared.Utils;
import com.google.common.collect.ImmutableMap;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Class that represents a servlet used to get application configuration
 */
public class UpdateFeeds extends HttpServlet implements ApiInterface {


    /* Global variables */
    private static final long serialVersionUID = 6919710226120460314L;
    private static final Logger LOG = Logger.getLogger(UpdateFeeds.class.getName());
    private static final Gson GSON = new Gson();
    private static final String API_LIST_FEED_URL="/rest/feed/list";
    private static final String GAE_TASK_FEED_UPDATE_URL="/task/feed/update";
    private static final String GAE_TASK_FEED_UPDATE_BASE_NAME="task-feed-update-";

    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        LOG.log(Level.INFO,"CRON started: start updating feeds");
        // Return data
        RestResponse restResponse = new RestResponse();
        resp.setContentType(com.google.common.net.MediaType.JSON_UTF_8.toString());

        //get list of feeds to be potentially updated
        RestResponse apiCallResp= GSON.fromJson(Utils.apiCall(Utils.getGaeBaseUrl(this.getServletContext())+API_LIST_FEED_URL, HttpMethods.GET,null),RestResponse.class);
        List<ReleaseNotesFeedEntity> listRnFeed= GSON.fromJson(apiCallResp.getMessage(), new TypeToken<List<ReleaseNotesFeedEntity>>(){}.getType());


        for(ReleaseNotesFeedEntity rnFeed:listRnFeed){
            LOG.log(Level.INFO,"Start updating feed id: " + rnFeed.getId());
            //enqueue task to update feed
            Utils.enqueueTask(
                    GAE_QUEUE_NAME,
                    GAE_TASK_FEED_UPDATE_URL,
                    String.format(
                            "%s%s",
                            GAE_TASK_FEED_UPDATE_BASE_NAME,
                            UUID.randomUUID().toString()),
                    TaskOptions.Method.POST,
                    ImmutableMap.of("id",rnFeed.getId()),
                    TASK_ENQUEUE_DELAY);
        }

        restResponse.setCode(HttpServletResponse.SC_OK);
        restResponse.setMessage(listRnFeed.size() + " tasks enqueued");
        resp.setStatus(HttpServletResponse.SC_OK);

        // Return the HTTP response
        resp.getWriter().println(GSON.toJson(restResponse));
        return;
    }
}
