/*
 * Copyright 2020 Google LLC
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

/**
 * Failed message contains the timestamp when a message failed, errorMessage,data that was processed and the correlation id.
 */
@DefaultCoder(AvroCoder.class)
public class FailedMessage{

    private long timestamp;
    private String errorMessage;
    private String dataString;
    private String correlationId;

    public static FailedMessage create(long timestamp,String errorMessage,String dataString,String corelationId) {
        return new FailedMessage(timestamp, errorMessage, dataString, corelationId);
    }

    public FailedMessage(long timestamp, String errorMessage, String dataString, String corelationId) {
        this.timestamp = timestamp;
        this.errorMessage = errorMessage;
        this.dataString = dataString;
        this.correlationId = corelationId;
    }

    public FailedMessage() {
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getDataString() {
        return dataString;
    }

    public void setDataString(String dataString) {
        this.dataString = dataString;
    }

    public String getCorelationId() {
        return correlationId;
    }

    public void setCorelationId(String corelationId) {
        this.correlationId = corelationId;
    }
}
