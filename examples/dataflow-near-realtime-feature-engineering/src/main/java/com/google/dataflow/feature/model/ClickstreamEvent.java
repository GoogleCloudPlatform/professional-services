/*
 *
 *  Copyright (c) 2024  Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not
 *  use this file except in compliance with the License. You may obtain a copy of
 *  the License at  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations under
 *  the License.
 */

package com.google.dataflow.feature.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.joda.cfg.JacksonJodaDateFormat;
import com.google.auto.value.AutoValue;
import java.io.IOException;
import java.util.List;
import org.apache.beam.sdk.schemas.AutoValueSchema;
import org.apache.beam.sdk.schemas.annotations.DefaultSchema;
import org.apache.beam.sdk.schemas.annotations.SchemaFieldName;
import org.checkerframework.checker.nullness.qual.Nullable;
import org.joda.time.Instant;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;

@AutoValue
@DefaultSchema(AutoValueSchema.class)
@JsonSerialize(as = ClickstreamEvent.class)
@JsonDeserialize(builder = ClickstreamEvent.Builder.class)
public abstract class ClickstreamEvent {

    public static ClickstreamEvent.Builder newBuilder() {
        return new AutoValue_ClickstreamEvent.Builder();
    }

    @AutoValue.Builder
    public abstract static class Builder {

        public abstract ClickstreamEvent build();

        @JsonCreator
        public static ClickstreamEvent.Builder builder() {
            return new AutoValue_ClickstreamEvent.Builder();
        }

        public static class CustomDateSerializer extends JsonDeserializer<Instant> {

            DateTimeFormatter DATE_TIME_FORMATTER =
                    DateTimeFormat.forPattern("yyyy-MM-dd'T'HH:mm:ss");
            JacksonJodaDateFormat JACKSON_JODA_DATE_FORMAT =
                    new JacksonJodaDateFormat(DATE_TIME_FORMATTER);

            @Override
            public Instant deserialize(
                    JsonParser jsonParser, DeserializationContext deserializationContext)
                    throws IOException, JacksonException {
                String s = jsonParser.getValueAsString();
                final long l =
                        JACKSON_JODA_DATE_FORMAT
                                .createParser(deserializationContext)
                                .parseMillis(s);
                return Instant.ofEpochMilli(l);
            }
        }

        @JsonProperty("personId")
        public abstract Builder setPersonId(String personId);

        @JsonProperty("sessionStarted")
        @JsonDeserialize(using = CustomDateSerializer.class)
        public abstract Builder setSessionStarted(Instant sessionStarted);

        @JsonDeserialize(using = CustomDateSerializer.class)
        public abstract Builder setSessionEnded(Instant sessionEnded);

        public abstract Builder setBasket(List<String> basket);

        public abstract Builder setEvents(List<String> events);

        public abstract Builder setProducts(List<String> products);

        @JsonProperty("eventKind")
        public abstract Builder setEventKind(String eventKind);
    }

    @JsonProperty("person_id")
    @SchemaFieldName("personId")
    public abstract String getPersonId();

    // click, view, journey, session start, end, key event
    @JsonProperty("eventKind")
    @SchemaFieldName("eventKind")
    public abstract String getEventKind();

    @JsonProperty("products")
    @SchemaFieldName("products")
    public abstract @Nullable List<String> getProducts();

    @JsonProperty("sessionStarted")
    @SchemaFieldName("sessionStarted")
    public abstract Instant getSessionStarted();

    @JsonProperty("sessionEnded")
    @SchemaFieldName("sessionEnded")
    public abstract @Nullable Instant getSessionEnded();

    @JsonProperty("events")
    @SchemaFieldName("events")
    public abstract @Nullable List<String> getEvents();

    @JsonProperty("basket")
    @SchemaFieldName("basket")
    public abstract @Nullable List<String> getBasket();
}
