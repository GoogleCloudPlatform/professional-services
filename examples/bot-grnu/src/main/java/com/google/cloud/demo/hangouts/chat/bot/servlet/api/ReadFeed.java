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

import com.google.api.client.http.HttpMethods;
import com.google.cloud.demo.hangouts.chat.bot.datastore.DatastoreService;
import com.google.cloud.demo.hangouts.chat.bot.datastore.ReleaseNotesFeedEntity;
import com.google.cloud.demo.hangouts.chat.bot.shared.Utils;
import com.google.gson.Gson;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URL;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Class that represents a servlet used to get application configuration
 */
public class ReadFeed extends HttpServlet implements ApiInterface {
    private static final long serialVersionUID = 6919710226120460310L;
    private static final Logger LOG = Logger.getLogger(ReadFeed.class.getName());
    private static final Gson GSON = new Gson();
    private static final String API_WRITE_CHAT_BOT="/rest/chat/bot/write";
    private static final String RN_FEED_ID="id";
    private static final String TAG_UPDATED="updated";
    private static final String TAG_CONTENT="content";
    private static final DatastoreService DS_RN_FEED=new DatastoreService<ReleaseNotesFeedEntity>(ReleaseNotesFeedEntity.class);

    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        // Return data
        RestResponse restResponse = new RestResponse();
        resp.setContentType(com.google.common.net.MediaType.JSON_UTF_8.toString());

        //Read input parameter
        String rnFeedId=req.getParameter(RN_FEED_ID);
        if (rnFeedId == null) {
            // error
            LOG.warning(
                    HTML_CODE_400_BAD_REQUEST
                            + " - "
                            + RN_FEED_ID
                            + " parameter missing");
            restResponse.setCode(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST);
            restResponse.setMessage(HTML_CODE_400_BAD_REQUEST);
            resp.setStatus(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().println(GSON.toJson(restResponse));
            return;
        }

        //get feed
        ReleaseNotesFeedEntity rnFeed= (ReleaseNotesFeedEntity) DS_RN_FEED.getById(rnFeedId);

        //check if the entity exist
        if(rnFeed!=null) {

            //get its RSS content
            Document feedContent = Utils.readRSS(new URL(rnFeed.getUrl()));

            //get lat update date
            NodeList nl = feedContent.getElementsByTagName(TAG_UPDATED);
            Date lastUpdate = Utils.parseFeedDate(nl.item(0).getTextContent());
            //check if you have to update the content or not
            if (lastUpdate.getTime() > rnFeed.getLastUpdate()) {
                //update entity
                rnFeed.setLastUpdate(lastUpdate.getTime());
                //update with last content
                nl = feedContent.getElementsByTagName(TAG_CONTENT);
                rnFeed.setContent(nl.item(0).getTextContent());
                //set flag for push notification to true (update to be pushed to chat bot)
                rnFeed.setPushNotificationFlag(true);
                //update data in DataStore
                DS_RN_FEED.save(rnFeed);
                LOG.log(Level.INFO,"Feed " + rnFeed.getName() + " has been updated with new content");
                //push new content to BOT
                RestResponse apiCallResp= GSON.fromJson(
                        Utils.apiCall(Utils.getGaeBaseUrl(this.getServletContext())+API_WRITE_CHAT_BOT+"?id="+rnFeedId,
                                HttpMethods.GET,
                                null),
                        RestResponse.class);
            }
            else{
                LOG.log(Level.INFO,"Feed " + rnFeed.getName() + " is already up to date");
            }

            restResponse.setCode(HttpServletResponse.SC_OK);
            restResponse.setMessage(GSON.toJson(rnFeed));
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
