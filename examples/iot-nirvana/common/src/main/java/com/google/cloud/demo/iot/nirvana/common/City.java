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

/** Java object carrying the city metadata. */
@AutoValue
@DefaultCoder(SerializableCoder.class)
public abstract class City implements Serializable {

  @Nullable
  public abstract String getCity();

  public abstract double getLat();

  public abstract double getLng();

  public abstract double getAvgTemperature();

  /** Builder for FilterMessages. */
  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setCity(String city);

    public abstract Builder setLat(double lat);

    public abstract Builder setLng(double lng);

    public abstract Builder setAvgTemperature(double avgTemperature);

    public abstract City build();
  }

  public static Builder newBuilder() {
    return new AutoValue_City.Builder();
  }

  private static final Gson GSON = new Gson();

  /**
   * Create a City object from its JSON representation
   *
   * @param json JSON representation of a City object
   * @return City object
   */
  public static City fromJson(String json) {
    City.Builder cityBuilder = GSON.fromJson(json, AutoValue_City.Builder.class);
    return cityBuilder.build();
  }

  /**
   * Create a City.Builder objects array from the JSON representation of a City objects array
   *
   * @param json JSON representation of an array of City objects
   * @return Array of city object builders
   */
  public static City.Builder[] fromJsonArray(String json) {
    City.Builder[] cities = GSON.fromJson(json, AutoValue_City.Builder[].class);
    return cities;
  }
}
