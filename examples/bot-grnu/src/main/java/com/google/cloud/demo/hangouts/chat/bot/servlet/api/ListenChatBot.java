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
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.chat.v1.model.Message;
import com.google.appengine.api.taskqueue.TaskOptions;
import com.google.cloud.demo.hangouts.chat.bot.datastore.DatastoreService;
import com.google.cloud.demo.hangouts.chat.bot.datastore.ReleaseNotesChatRoomEntity;
import com.google.cloud.demo.hangouts.chat.bot.datastore.ReleaseNotesChatRoomThreadEntity;
import com.google.cloud.demo.hangouts.chat.bot.datastore.ReleaseNotesFeedEntity;
import com.google.cloud.demo.hangouts.chat.bot.shared.Utils;
import com.google.common.collect.ImmutableMap;
import com.google.gson.Gson;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Class that represents a servlet used to get application configuration
 */
public class ListenChatBot extends HttpServlet implements ApiInterface {

    private static final long serialVersionUID = 6919710226120460385L;
    private static final Logger LOG = Logger.getLogger(ListenChatBot.class.getName());
    private static final Gson GSON = new Gson();
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
    private static final DatastoreService<ReleaseNotesFeedEntity> DS_RN_FEED = new DatastoreService<ReleaseNotesFeedEntity>(ReleaseNotesFeedEntity.class);
    private static final DatastoreService<ReleaseNotesChatRoomEntity> DS_RN_CR=new DatastoreService<ReleaseNotesChatRoomEntity>(ReleaseNotesChatRoomEntity.class);
    private static final DatastoreService<ReleaseNotesChatRoomThreadEntity> DS_RN_CR_T=new DatastoreService<ReleaseNotesChatRoomThreadEntity>(ReleaseNotesChatRoomThreadEntity.class);
    private static final String GAE_TASK_FORCE_NOTIFICATION_URL="/task/chat/bot/force-notification";
    private static final String GAE_TASK_FORCE_NOTIFICATION_BASE_NAME="force-notification-";

    private static final SimpleDateFormat sdf=new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS Z");


    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        //read input message
        ChatBotEvent chatBotEvent=JSON_FACTORY.fromReader(req.getReader(),ChatBotEvent.class);

        //switch based on input event
        switch(chatBotEvent.getType()){
            case "ADDED_TO_SPACE":{
                LOG.log(Level.INFO,"Added to space: " + chatBotEvent.getSpace().getDisplayName() + " with ID " + chatBotEvent.getSpace().getName());
                //save new room in DataStore
                ReleaseNotesChatRoomEntity rnCr=new ReleaseNotesChatRoomEntity();
                rnCr.setId(chatBotEvent.getSpace().getName());
                DS_RN_CR.save(rnCr);
                //push last updates
                for(ReleaseNotesFeedEntity rnFe:DS_RN_FEED.list()){
                    Utils.enqueueTask(
                            GAE_QUEUE_NAME,
                            GAE_TASK_FORCE_NOTIFICATION_URL,
                            String.format(
                                    "%s%s",
                                    GAE_TASK_FORCE_NOTIFICATION_BASE_NAME,
                                    UUID.randomUUID().toString()),
                            TaskOptions.Method.POST,
                            ImmutableMap.<String, String>builder()
                                    .put("id", rnFe.getId())
                                    .put("room", chatBotEvent.getSpace().getName())
                                    .build(),
                            TASK_ENQUEUE_DELAY);
                }
                break;}

            case "REMOVED_FROM_SPACE":{
                LOG.log(Level.INFO,"Removed from space: " + chatBotEvent.getSpace().getDisplayName() + " with ID " + chatBotEvent.getSpace().getName());
                //delete all eventual registered threads
                for(ReleaseNotesFeedEntity rhFe:DS_RN_FEED.list()){
                    DS_RN_CR_T.remove(DS_RN_CR_T.getById(chatBotEvent.getSpace().getName()+"/"+rhFe.getId()));
                }
                //delete room from DataStore
                DS_RN_CR.remove(DS_RN_CR.getById(chatBotEvent.getSpace().getName()));
                break;}

            case "MESSAGE":{
                LOG.log(Level.INFO,"Message received from user: " + chatBotEvent.getUser().getDisplayName() + "\nMessage: " + chatBotEvent.getMessage().getArgumentText());
                Message retMsg=new Message(); //message to bre returned back
                if(chatBotEvent.getMessage().getArgumentText().trim().split(" ").length>1){
                    retMsg.setText(getHelp());
                }
                else{
                    ReleaseNotesFeedEntity rhFe=DS_RN_FEED.getById(chatBotEvent.getMessage().getArgumentText().trim().toLowerCase());
                    if(rhFe==null){
                        retMsg.setText("Release notes for selected solution are not available. Check help.\n\n" + getHelp());
                    }
                    else {
                        String botMsg=rhFe.getName() + " - Release notes updated on " + sdf.format(new Date(rhFe.getLastUpdate())) + "\n\n" + Utils.html2text(rhFe.getContent());
                        retMsg.setText(Utils.getCompatibleBotMessage(botMsg));
                    }
                }
                // Return the  response
                resp.getWriter().println(GSON.toJson(retMsg));
                break;}
            default: {
                LOG.log(Level.SEVERE,"ChatBotEvent not recognize.\n" + GSON.toJson(chatBotEvent));
                break;
            }
        }
    }


    /**
     * Generate help commands for the GRNU BOT
     * @return the content of the help
     * @throws IOException
     */
    private String getHelp() throws IOException{
        //get feed data
        List<ReleaseNotesFeedEntity> listRhFeed = DS_RN_FEED.list();

        //prepare message
        StringBuilder msgHelp=new StringBuilder("GRNU BOT - HELP");
            msgHelp.append("\n");
            msgHelp.append("If you want to check latest release notes about a specific solution just type its id.");
            msgHelp.append("\n");
            msgHelp.append("Example: if you want to see latest news about Google BigQuery just type \"bigquery\"");
            msgHelp.append("\n");
            msgHelp.append("\n");
            msgHelp.append("Here you are the list of all available products:");
            msgHelp.append("\n");

            for(ReleaseNotesFeedEntity rhFe:listRhFeed){
                msgHelp.append("\"");
                msgHelp.append(rhFe.getId());
                msgHelp.append("\"");
                msgHelp.append(" --- ");
                msgHelp.append(rhFe.getName());
                msgHelp.append("\n");
            }


        return msgHelp.toString();
    }
}
