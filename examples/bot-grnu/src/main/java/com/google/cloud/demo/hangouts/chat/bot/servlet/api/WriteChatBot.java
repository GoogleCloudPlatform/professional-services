/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the A9ache License, Version 2.0 (the "License"); you may not
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

import com.google.api.services.chat.v1.model.Message;
import com.google.api.services.chat.v1.model.Thread;
import com.google.cloud.demo.hangouts.chat.bot.datastore.DatastoreService;
import com.google.cloud.demo.hangouts.chat.bot.datastore.ReleaseNotesChatRoomEntity;
import com.google.cloud.demo.hangouts.chat.bot.datastore.ReleaseNotesChatRoomThreadEntity;
import com.google.cloud.demo.hangouts.chat.bot.datastore.ReleaseNotesFeedEntity;
import com.google.cloud.demo.hangouts.chat.bot.shared.Utils;
import com.google.gson.Gson;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Class that represents a servlet used to get application configuration
 */
public class WriteChatBot extends HttpServlet implements ApiInterface {

    private static final long serialVersionUID = 6919710226120460312L;
    private static final Logger LOG = Logger.getLogger(WriteChatBot.class.getName());
    private static final Gson GSON = new Gson();
    private static final String API_PARAM_RN_FEED_ID="id";
    private static final String API_PARAM_ROOM="room";
    private static final SimpleDateFormat sdf=new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS Z");
    private static final DatastoreService DS_RN_FEED=new DatastoreService<ReleaseNotesFeedEntity>(ReleaseNotesFeedEntity.class);
    private static final DatastoreService DS_RN_CR=new DatastoreService<ReleaseNotesChatRoomEntity>(ReleaseNotesChatRoomEntity.class);
    private static final DatastoreService DS_RN_CR_T=new DatastoreService<ReleaseNotesChatRoomThreadEntity>(ReleaseNotesChatRoomThreadEntity.class);



    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        // Return data
        RestResponse restResponse = new RestResponse();
        resp.setContentType(com.google.common.net.MediaType.JSON_UTF_8.toString());

        //Read input parameter
        String rnFeedId=req.getParameter(API_PARAM_RN_FEED_ID);
        if (rnFeedId == null) {
            // error
            LOG.warning(
                    HTML_CODE_400_BAD_REQUEST
                            + " - "
                            + API_PARAM_RN_FEED_ID
                            + " parameter missing");
            restResponse.setCode(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST);
            restResponse.setMessage(HTML_CODE_400_BAD_REQUEST);
            resp.setStatus(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().println(GSON.toJson(restResponse));
            return;
        }

        String room=null;
        if(req.getParameter(API_PARAM_ROOM)!=null){
            room=req.getParameter(API_PARAM_ROOM);
            LOG.log(Level.INFO,"Notification has to be forced to this room: " + room);
        }



        //get feed
        ReleaseNotesFeedEntity rnFeed= (ReleaseNotesFeedEntity) DS_RN_FEED.getById(rnFeedId);

        //check if the entity exist
        if(rnFeed!=null) {
            if(rnFeed.isPushNotificationFlag() || room!=null){ //send message only if needed
                //list all chat room where notification has to be sent
                List<ReleaseNotesChatRoomEntity> listRhCr=DS_RN_CR.list();
                if(listRhCr.size()==0){
                    LOG.log(Level.INFO,"No room registered");
                    restResponse.setMessage("No room registered");
                }
                else{
                    for(ReleaseNotesChatRoomEntity rhCr:listRhCr){ //post message on each room
                        if(room!=null && !room.equals(rhCr.getId())){ //if you have room ID, you need to send notification only to that ID
                            LOG.log(Level.INFO,"Notification will not be sent to this room: " + rhCr.getId());
                            continue;
                        }
                        //check if you already have a thread where you have to post the message
                        ReleaseNotesChatRoomThreadEntity rhCrT=(ReleaseNotesChatRoomThreadEntity)DS_RN_CR_T.getById(rhCr.getId()+"/"+rnFeedId);
                        Thread crThread=new Thread();
                        if(rhCrT!=null && rhCrT.getThread()!=null){
                            crThread=rhCrT.getThread();
                            LOG.log(Level.INFO,"Thread: " + rnFeedId);
                        }
                        //write message
                        StringBuilder msg=new StringBuilder("");
                        Message botMsg=new Message();
                            botMsg.setThread(crThread);
                        if(crThread.getName()==null) { //if it is the first time you publish the message
                            msg.append("*** ");
                            msg.append(rnFeed.getName());
                            msg.append("*** - Release notes");
                            msg.append("\n");
                        }
                        msg.append("Updated on ");
                        msg.append(sdf.format(new Date(rnFeed.getLastUpdate())));
                        msg.append("\n\n");
                        msg.append(Utils.html2text(rnFeed.getContent()));
                        botMsg.setText(Utils.getCompatibleBotMessage(msg.toString()));
                        //send message
                        Message sentMsg=Utils.getHangoutsChatService(this.getServletContext()).spaces().messages().create(rhCr.getId(),botMsg).execute();
                        if(crThread.getName()==null){
                            //update thread
                            crThread=sentMsg.getThread();
                            if(rhCrT==null){
                                rhCrT=new ReleaseNotesChatRoomThreadEntity();
                                rhCrT.setId(rhCr.getId()+"/"+rnFeedId);
                                rhCrT.setThread(crThread);
                            }
                            DS_RN_CR_T.save(rhCrT); //update data in DataStore
                        }
                    }
                    rnFeed.setPushNotificationFlag(false); //update notification flag
                    DS_RN_FEED.save(rnFeed); //update object in DataStore
                    restResponse.setMessage("New release notes sent to BOT");
                }

            }
            else{
                restResponse.setMessage("No new release notes to be sent to BOT");
            }
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
