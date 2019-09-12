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

public final class RangePartitioning extends com.google.api.client.json.GenericJson {

    public RangePartitioning(String field){
        this.field = field;
    }

    @com.google.api.client.util.Key
    private java.lang.String field;

    @com.google.api.client.util.Key
    private Range range;

    public java.lang.String getField() {
        return field;
    }

    public RangePartitioning setField(java.lang.String field) {
        this.field = field;
        return this;
    }

    public Range getRange() {
        return range;
    }

    public RangePartitioning setRange(Range range) {
        this.range = range;
        return this;
    }

    @Override
    public RangePartitioning set(String fieldName, Object value) {
        return (RangePartitioning) super.set(fieldName, value);
    }

    @Override
    public RangePartitioning clone() {
        return (RangePartitioning) super.clone();
    }
}
