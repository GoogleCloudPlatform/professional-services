/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.api.services.bigquery.model;

public final class Range extends com.google.api.client.json.GenericJson {

    public Range(Long start, Long end, Long interval) {
        this.start = start;
        this.end = end;
        this.interval = interval;
    }

    @com.google.api.client.util.Key @com.google.api.client.json.JsonString
    private java.lang.Long end;

    @com.google.api.client.util.Key @com.google.api.client.json.JsonString
    private java.lang.Long interval;

    @com.google.api.client.util.Key @com.google.api.client.json.JsonString
    private java.lang.Long start;

    public java.lang.Long getEnd() {
        return end;
    }

    public Range setEnd(java.lang.Long end) {
        this.end = end;
        return this;
    }

    public java.lang.Long getInterval() {
        return interval;
    }

    public Range setInterval(java.lang.Long interval) {
        this.interval = interval;
        return this;
    }

    public java.lang.Long getStart() {
        return start;
    }

    public Range setStart(java.lang.Long start) {
        this.start = start;
        return this;
    }

    @Override
    public Range set(String fieldName, Object value) {
        return (Range) super.set(fieldName, value);
    }

    @Override
    public Range clone() {
        return (Range) super.clone();
    }
}
