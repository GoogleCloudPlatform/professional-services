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

import com.google.api.client.json.GenericJson;
import com.google.api.services.chat.v1.model.Message;
import com.google.api.services.chat.v1.model.Space;
import com.google.api.services.chat.v1.model.User;

/**
 * Stub class for parsing ChatBotEvent JSON payloads.
 */
public class ChatBotEvent extends GenericJson {

    @com.google.api.client.util.Key
    private String type;
    @com.google.api.client.util.Key
    private String eventTime;
    @com.google.api.client.util.Key
    private Space space;
    @com.google.api.client.util.Key
    private User user;
    @com.google.api.client.util.Key
    private Message message;
    @com.google.api.client.util.Key
    private String token;
    @com.google.api.client.util.Key
    private String configCompleteRedirectUrl;

    public ChatBotEvent(){}

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getEventTime() {
        return eventTime;
    }

    public void setEventTime(String eventTime) {
        this.eventTime = eventTime;
    }

    public Space getSpace() {
        return space;
    }

    public void setSpace(Space space) {
        this.space = space;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Message getMessage() {
        return message;
    }

    public void setMessage(Message message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getConfigCompleteRedirectUrl() {
        return configCompleteRedirectUrl;
    }

    public void setConfigCompleteRedirectUrl(String configCompleteRedirectUrl) {
        this.configCompleteRedirectUrl = configCompleteRedirectUrl;
    }
}