/*
 * Copyright 2019 Google LLC
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
package com.demo.dataflow.model;


import org.apache.beam.sdk.coders.AvroCoder;
import org.apache.beam.sdk.coders.DefaultCoder;

@DefaultCoder(AvroCoder.class)
public class FailedMessage {

    private long timestamp;
    private String errorMessage;
    private String dataString;
    private String corelationId;

    public FailedMessage(){}
    public FailedMessage(long timestamp, String error, String dataString, String corelationId) {
        this.timestamp = timestamp;
        this.errorMessage = error;
        this.dataString = dataString;
        this.corelationId = corelationId;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public String getDataString() {
        return dataString;
    }

    public String getCorelationId() {
        return corelationId;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public void setDataString(String dataString) {
        this.dataString = dataString;
    }

    public void setCorelationId(String corelationId) {
        this.corelationId = corelationId;
    }
}
