/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.tools.sce.aurinko.broker;

import com.fasterxml.jackson.databind.JsonNode;
public class DataBrokerMessage {


    private String payload;
 
    private String uploadLocation;

    private String messageId;

    private Throwable failure;

    private String topicId;

    private String projectId;


    public DataBrokerMessage(JsonNode payload, String topicId, String projectId) {
        this.payload = payload.toString();
        this.projectId = projectId;
        this.topicId = topicId;

    }

    public DataBrokerMessage(String uploadLocation, String topicId, String projectId) {
        this.uploadLocation = uploadLocation;
        this.projectId = projectId;
        this.topicId = topicId;

    }

    
    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getUploadLocation() {
        return this.uploadLocation;
    }

    public String getPayload() {
        return this.payload;
    }

    public Throwable getFailure() {
        return failure;
    }

    public void setFailure(Throwable failure) {
        this.failure = failure;
    }

    public String getTopicId() {
        return this.topicId;
    }

    public String getProjectId() {
        return this.projectId;
    }

}