/*
 * Copyright (C) 2019 Google Inc.
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

package com.google.cloud.pso.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.avro.reflect.Nullable;
import org.apache.beam.sdk.coders.AvroCoder;
import org.apache.beam.sdk.coders.DefaultCoder;

/**
 * The class carrying a New York Times article metadata and sentiments.
 */
@DefaultCoder(AvroCoder.class)
public class Doc {

  // Article attributes.
  private String docId;
  private String pubDate;
  private Long epoch;
  private String headline;
  private @Nullable Double score;
  private @Nullable Double magnitude;

  // A static mapper object.
  public static final ObjectMapper MAPPER = new ObjectMapper();

  // Private empty constructor used for reflection required by AvroIO.
  @SuppressWarnings("unused")
  private Doc() {}

  public Doc(
      String docId,
      String pubDate,
      Long epoch,
      String headline,
      Double score,
      Double magnitude) {
    this.docId = docId;
    this.pubDate = pubDate;
    this.epoch = epoch;
    this.headline = headline;
    this.score = score;
    this.magnitude = magnitude;
  }

  public String getDocId() {
    return this.docId;
  }

  public void setDocId(String docId) {
    this.docId = docId;
  }

  public String getPubDate() {
    return this.pubDate;
  }

  public void setPubDate(String pubDate) {
    this.pubDate = pubDate;
  }

  public Long getEpoch() {
    return this.epoch;
  }

  public void setEpoch(Long epoch) {
    this.epoch = epoch;
  }

  public String getHeadline() {
    return this.headline;
  }

  public void setHeadline(String headline) {
    this.headline = headline;
  }

  public Double getScore() {
    return this.score;
  }

  public void setScore(Double score) {
    this.score = score;
  }

  public Double getMagnitude() {
    return this.magnitude;
  }

  public void setMagnitude(Double magnitude) {
    this.magnitude = magnitude;
  }

  /** Overrides equals() to compare two Doc objects. */
  @Override
  public boolean equals(Object o) {
    // If the object is compared with itself then return true
    if (o == this) {
      return true;
    }

    // Check if o is an instance of Doc or not.
    if (!(o instanceof Doc)) {
      return false;
    }

    // typecast o to Doc so that we can compare data members.
    Doc that = (Doc) o;

    // Compare the data members.
    return this.getDocId().equals(that.getDocId())
        && this.getPubDate().equals(that.getPubDate())
        && this.getEpoch().equals(that.getEpoch())
        && this.getHeadline().equals(that.getHeadline());
  }

  @Override
  public String toString() {
    try {
      String json = MAPPER.writeValueAsString(this);
      return json;
    } catch (JsonProcessingException e) {
      return String.format("{error: %s}", e);
    }
  }
}
