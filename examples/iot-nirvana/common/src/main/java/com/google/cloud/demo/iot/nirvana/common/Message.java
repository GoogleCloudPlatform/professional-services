/*
 * Copyright (C) 2018 Google Inc.
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

package com.google.cloud.demo.iot.nirvana.common;

import com.google.auto.value.AutoValue;
import com.google.gson.Gson;
import java.io.Serializable;
import javax.annotation.Nullable;
import org.apache.beam.sdk.coders.DefaultCoder;
import org.apache.beam.sdk.coders.SerializableCoder;

/** Java POJO carrying a temperature measurement. */
@AutoValue
@DefaultCoder(SerializableCoder.class)
public abstract class Message implements Serializable {

  @Nullable
  public abstract String getId();

  public abstract double getTemperature();

  public abstract long getTimestamp();

  @Nullable
  public abstract String getCity();

  @Nullable
  public abstract String getLat();

  @Nullable
  public abstract String getLng();

  /** Builder for FilterMessages. */
  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setId(String id);

    public abstract Builder setTemperature(double temperature);

    public abstract Builder setTimestamp(long timestamp);

    public abstract Builder setCity(String id);

    public abstract Builder setLat(String latitude);

    public abstract Builder setLng(String longitude);

    public abstract Message build();
  }

  public static Builder newBuilder() {
    return new AutoValue_Message.Builder();
  }

  private static final Gson GSON = new Gson();

  private static final String DESERIALIZE_JSON_ERR = "Cannot create message from JSON. Cause: %s";

  /**
   * Create a Message object from its JSON representation
   *
   * @param json JSON representation of a Message object
   * @return Message object
   */
  public static Message fromJson(String json) throws FormatException {
    try {
      Message.Builder messageBuilder = GSON.fromJson(json, AutoValue_Message.Builder.class);
      return messageBuilder.build();
    } catch (Exception e) {
      // JSON parsing or incomplete JSON exception (both runtime)
      String message = String.format(DESERIALIZE_JSON_ERR, e.getMessage());
      throw new FormatException(message, e);
    }
  }
}
