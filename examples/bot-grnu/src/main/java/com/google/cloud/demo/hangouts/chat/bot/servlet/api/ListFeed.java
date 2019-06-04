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

package com.google.cloud.demo.hangouts.chat.bot.servlet.api;

import com.google.cloud.demo.hangouts.chat.bot.datastore.DatastoreService;
import com.google.cloud.demo.hangouts.chat.bot.datastore.ReleaseNotesFeedEntity;
import com.google.gson.Gson;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;

/**
 * Class that represents a servlet used to get application configuration
 */
public class ListFeed extends HttpServlet implements ApiInterface {

    private static final long serialVersionUID = 6919710226120460386L;
    private static final Logger LOG = Logger.getLogger(ListFeed.class.getName());
    private static final Gson GSON = new Gson();

    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        // Return data
        RestResponse restResponse = new RestResponse();
        resp.setContentType(com.google.common.net.MediaType.JSON_UTF_8.toString());

        //Load RSS feeds stored in the Datastore
        DatastoreService<ReleaseNotesFeedEntity> dsRnFeed = new DatastoreService<ReleaseNotesFeedEntity>(ReleaseNotesFeedEntity.class);
        List<ReleaseNotesFeedEntity> releaseNotesFeedEntityList = dsRnFeed.list();

        restResponse.setCode(HttpServletResponse.SC_OK);
        restResponse.setMessage(GSON.toJson(releaseNotesFeedEntityList));
        resp.setStatus(HttpServletResponse.SC_OK);

        // Return the HTTP response
        resp.getWriter().println(GSON.toJson(restResponse));
        return;
    }
}
