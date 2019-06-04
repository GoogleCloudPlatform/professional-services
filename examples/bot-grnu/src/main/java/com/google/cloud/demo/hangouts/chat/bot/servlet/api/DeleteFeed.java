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
import com.google.cloud.demo.hangouts.chat.bot.shared.Utils;
import com.google.gson.Gson;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.logging.Logger;

/**
 * Class that represents a servlet used to get application configuration
 */
public class DeleteFeed extends HttpServlet implements ApiInterface {

    /**
     * Inner POJO class describing JSON input parameters
     */
    class ReleaseNotesFeed{

        String name;

        public ReleaseNotesFeed(){

        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    private static final long serialVersionUID = 6919710226120460383L;
    private static final Logger LOG = Logger.getLogger(DeleteFeed.class.getName());
    private static final Gson GSON = new Gson();

    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        // Return data
        RestResponse restResponse = new RestResponse();
        resp.setContentType(com.google.common.net.MediaType.JSON_UTF_8.toString());

        //read JSON feed to save
        ReleaseNotesFeed rnFeed=GSON.fromJson(Utils.getJsonPayload(req), ReleaseNotesFeed.class);
        String rnFeedId=Utils.getReleaseNotesFeedEntityId(rnFeed.getName());
        DatastoreService dsRnFeed=new DatastoreService<ReleaseNotesFeedEntity>(ReleaseNotesFeedEntity.class);
        ReleaseNotesFeedEntity rhFeedEntity= (ReleaseNotesFeedEntity) dsRnFeed.getById(rnFeedId);
        if(dsRnFeed.getById(rnFeedId)!=null) {
            dsRnFeed.remove(rhFeedEntity);
            restResponse.setCode(HttpServletResponse.SC_OK);
            restResponse.setMessage(HTML_CODE_200_OK_MESSAGE);
            resp.setStatus(HttpServletResponse.SC_OK);
        }
        else{
            restResponse.setCode(HttpServletResponse.SC_NO_CONTENT);
            restResponse.setMessage(HTML_CODE_204_NO_CONTENT_MESSAGE);
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        }

        // Return the HTTP response
        resp.getWriter().println(GSON.toJson(restResponse));
        return;
    }
}
